/** Los cinco factores de crecimiento (luz, agua, temperatura, suelo, vecinos) y el "fantasma de siembra". */
import type { CategoriaSuelo, RegimenRiego, TempCrecimiento } from '../../datos/contrato';
import { ESPECIES, META, ventana } from './catalogo';
import { CLIMA, diaCentral, interp } from './clima';
import { plantaEn } from './estado';
import { MACETAS, ZONAS, horasSol, vecinas, xy } from './patio';
import type { CeldaId, Especie, Estado, Planta, Tiempo } from './tipos';
import { clamp, r1 } from './util';

/** [REPO] la escala de riego; [SUPUESTO] los números */
export const DESEO_AGUA: Record<RegimenRiego, number> = { escaso: 0.6, espaciado: 1.4, parejo: 2.2, constante: 3.0 };
/** [SUPUESTO] cuánto pesa cada desajuste de suelo; filas = lo que pide la planta */
const SUELO_COMPAT: Record<CategoriaSuelo, Partial<Record<CategoriaSuelo, number>>> = {
  FRANCO_FERTIL: { FRANCO_FERTIL: 1, PROFUNDO_SUELTO: 0.95, ARENOSO_DRENANTE: 0.8, HUMEDO_RICO: 0.92 },
  PROFUNDO_SUELTO: { FRANCO_FERTIL: 0.72, PROFUNDO_SUELTO: 1, ARENOSO_DRENANTE: 0.9, HUMEDO_RICO: 0.75 },
  ARENOSO_DRENANTE: { FRANCO_FERTIL: 0.8, PROFUNDO_SUELTO: 0.95, ARENOSO_DRENANTE: 1, HUMEDO_RICO: 0.6 },
  HUMEDO_RICO: { FRANCO_FERTIL: 0.82, PROFUNDO_SUELTO: 0.8, ARENOSO_DRENANTE: 0.6, HUMEDO_RICO: 1 },
  RUSTICO_TOLERANTE: { FRANCO_FERTIL: 1, PROFUNDO_SUELTO: 1, ARENOSO_DRENANTE: 1, HUMEDO_RICO: 0.9 },
};
export function sueloDeCelda(E: Estado, celda: CeldaId): CategoriaSuelo { const c = E.celdas[celda]; return c.mo >= 80 && ZONAS[c.zona].suelo === 'FRANCO_FERTIL' ? 'HUMEDO_RICO' : ZONAS[c.zona].suelo; }

export function fLuz(sp: Especie, h: number, tmax: number): number {
  let f = h >= sp.hideal ? 1 : h >= sp.hmin ? 0.7 + 0.3 * (h - sp.hmin) / Math.max(0.5, sp.hideal - sp.hmin) : 0.7 * Math.pow(h / Math.max(1, sp.hmin), 1.5);
  if (sp.luz === 'MEDIA_SOMBRA' && h > 8 && tmax > 28) f = Math.min(f, 0.85);
  return clamp(f, 0.08, 1);
}
export function fSuelo(E: Estado, sp: Especie, celda: CeldaId): number { return (SUELO_COMPAT[sp.suelo][sueloDeCelda(E, celda)] || 0.85) * (0.65 + 0.35 * E.celdas[celda].mo / 100); }
export function fMaceta(sp: Especie, celda: CeldaId): number {
  const m = MACETAS[celda]; if (!m) return 1;
  const l = sp.maceta?.litros_min || 8, p = sp.maceta?.profundidad_min_cm || 30; // [SUPUESTO] 8 L / 30 cm si huertapp no dice
  return m.litros >= l && m.prof >= p ? 1 : m.litros >= l * 0.5 && m.prof >= p * 0.6 ? 0.6 : 0.35;
}
/** Índice de humedad del suelo, de 0 (seco) a ~4,5 (encharcado). [SUPUESTO] balance hídrico simplificado. */
export function humedad(E: Estado, celda: CeldaId, w: Pick<Tiempo, 'lluvia' | 'tmax'>): number {
  const c = E.celdas[celda], z = ZONAS[c.zona];
  const cubierta = c.zona === 'almacigo' || (c.zona === 'elevado' && E.tunel);
  const ll = cubierta ? 0 : w.lluvia < 8 ? 0 : w.lluvia < 25 ? 0.7 : w.lluvia < 50 ? 1.4 : 2.2;
  const calor = w.tmax > 24 ? (w.tmax - 24) * 0.09 : 0;
  const dren = z.drenaje + (MACETAS[celda] && MACETAS[celda].litros <= 4 ? 0.2 : 0);
  return E.riego[c.zona] + ll - calor - dren + (c.mulch ? 0.5 : 0);
}
export type EstadoAgua = 'bien' | 'seco' | 'exceso';
export function fAgua(sp: Especie, H: number): { f: number; estado: EstadoAgua; diff: number } {
  const diff = H - DESEO_AGUA[sp.riego];
  if (diff < -0.6) return { f: clamp(1 - (-0.6 - diff) * 0.5, 0.15, 1), estado: 'seco', diff };
  if (diff > 0.8) return { f: clamp(1 - (diff - 0.8) * 0.35, 0.4, 1), estado: 'exceso', diff };
  return { f: 1, estado: 'bien', diff };
}
export function tempEfectiva(E: Estado, celda: CeldaId, w: Pick<Tiempo, 'tmed'>): number { const z = E.celdas[celda].zona; return w.tmed + (z === 'almacigo' ? 2 : 0) + (z === 'elevado' && E.tunel ? 3 : 0); }
export function fTemp(sp: Especie, t: number): number {
  const c = sp.tc;
  if (t >= c.ideal_min && t <= c.ideal_max) return 1;
  if (t < c.ideal_min) return clamp(0.2 + 0.8 * (t - c.tolera_min) / Math.max(1, c.ideal_min - c.tolera_min), 0.1, 1);
  return clamp(1 - 0.6 * (t - c.ideal_max) / Math.max(1, c.tolera_max - c.ideal_max), 0.3, 1);
}
/** lo malo pesa más que lo bueno */
function relacion(a: string, b: string): 'mala' | 'buena' | null {
  const A = ESPECIES[a], B = ESPECIES[b];
  if (A.malas.includes(b) || B.malas.includes(a)) return 'mala';
  if (A.buenas.includes(b) || B.buenas.includes(a)) return 'buena';
  return null;
}
/** [REPO] asociaciones; [SUPUESTO] +8 % / −12 % por vecino, atenuado por la confianza del dato. */
export function fVecinos(E: Estado, slug: string, celda: CeldaId, ignorarId?: string): { f: number; buenas: string[]; malas: string[] } {
  let f = 1; const buenas: string[] = [], malas: string[] = [], sp = ESPECIES[slug];
  for (const v of vecinas(celda)) {
    const pl = plantaEn(E, v); if (!pl || pl.id === ignorarId || pl.etapa === 'semilla') continue;
    const r = relacion(slug, pl.slug);
    if (r === 'buena') { f += 0.08 * clamp(sp.confB / 8, 0.4, 1); buenas.push(ESPECIES[pl.slug].nombre); }
    if (r === 'mala') { f -= 0.12 * clamp(sp.confM / 8, 0.4, 1); malas.push(ESPECIES[pl.slug].nombre); }
  }
  return { f: clamp(f, 0.65, 1.25), buenas, malas };
}
/** flores y aromáticas a 2 celdas: refugio de enemigos naturales */
export function aliadosCerca(E: Estado, celda: CeldaId): number {
  const p = xy(celda); let n = 0;
  for (const id in E.plantas) {
    const pl = E.plantas[id], q = xy(pl.celda), sp = ESPECIES[pl.slug];
    if (pl.celda === celda || pl.etapa === 'semilla' || pl.etapa === 'plantin') continue;
    if ((sp.flor || sp.grupo === 'Aromática') && Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) <= 2) n++;
  }
  return n;
}
export function floresAbiertas(E: Estado): number {
  let n = 0;
  for (const id in E.plantas) { const pl = E.plantas[id], sp = ESPECIES[pl.slug]; if (pl.etapa === 'cosechable' && (sp.flor || sp.familia === 'lamiacea')) n += sp.flor ? 1 : 0.5; }
  return n;
}

export interface Factores {
  luz: { f: number; horas: number; pide: string; min: number; ideal: number };
  agua: { f: number; estado: EstadoAgua; diff: number; pide: RegimenRiego; H: number; lo: number; hi: number };
  temp: { f: number; t: number; pide: string; tc: TempCrecimiento<number>; tmin: number; tmax: number };
  suelo: { f: number; mo: number; maceta: number };
  vecinos: { f: number; buenas: string[]; malas: string[] };
}
/** Lo que la interfaz muestra como indicadores: por qué esta planta crece como crece. */
export function factoresPlanta(E: Estado, pl: Planta, w: Tiempo = E.prox.real): Factores {
  const sp = ESPECIES[pl.slug], h = horasSol(E, pl.celda, w.dec), H = humedad(E, pl.celda, w), ag = fAgua(sp, H), ve = fVecinos(E, pl.slug, pl.celda, pl.id);
  const t = tempEfectiva(E, pl.celda, w);
  return {
    luz: { f: fLuz(sp, h, w.tmax), horas: h, pide: sp.hmin === sp.hideal ? sp.hmin + ' h o más' : sp.hmin + '–' + sp.hideal + ' h', min: sp.hmin, ideal: sp.hideal },
    agua: { f: ag.f, estado: ag.estado, diff: ag.diff, pide: sp.riego, H: r1(clamp(H, 0, 4.5)), lo: DESEO_AGUA[sp.riego] - 0.6, hi: DESEO_AGUA[sp.riego] + 0.8 },
    temp: { f: fTemp(sp, t), t: r1(t), pide: sp.tc.ideal_min + '–' + sp.tc.ideal_max + ' °C', tc: sp.tc, tmin: w.tmin, tmax: w.tmax },
    suelo: { f: clamp(fSuelo(E, sp, pl.celda) * fMaceta(sp, pl.celda), 0, 1), mo: Math.round(E.celdas[pl.celda].mo), maceta: fMaceta(sp, pl.celda) },
    vecinos: ve,
  };
}

export interface Evaluacion { puntaje: number; nivel: 'bien' | 'regular' | 'mal'; razones: string[]; horas: number }
/** El "fantasma de siembra": qué tan bien le iría HOY a esta especie en esta celda. */
export function evaluarCelda(E: Estado, slug: string, celda: CeldaId): Evaluacion | null {
  const sp = ESPECIES[slug], c = E.celdas[celda]; if (!c) return null;
  const razones: string[] = [], h = horasSol(E, celda, E.dec);
  const h2 = horasSol(E, celda, ((E.dec + 5) % 36) + 1); // la luz se mira también a 6 décadas: la planta va a vivir ahí
  const l = (fLuz(sp, h, 20) + fLuz(sp, h2, 20)) / 2, s = fSuelo(E, sp, celda), m = fMaceta(sp, celda), ve = fVecinos(E, slug, celda);
  const enAlm = c.zona === 'almacigo', vent = ventana(slug, E.dec), vig = vent === 'ideal' ? 1 : vent === 'posible' ? 0.85 : 0.6;
  if (l < 0.75) razones.push('Poca luz: ' + h + ' h ahora, pide ' + sp.hmin + '–' + sp.hideal + ' h. ' + sp.luzNo);
  if (s < 0.7) razones.push('El suelo no le gusta (' + META.suelos[sueloDeCelda(E, celda)].nombre + ', pide ' + META.suelos[sp.suelo].nombre + '). ' + sp.sueloNo);
  if (m < 1) razones.push('La maceta le queda chica: pide ' + (sp.maceta?.litros_min || 8) + ' L y ' + (sp.maceta?.profundidad_min_cm || 30) + ' cm de hondo.');
  if (ve.malas.length) razones.push('Mal vecino: ' + ve.malas.join(', ') + '.');
  if (ve.buenas.length) razones.push('Buen vecino: ' + ve.buenas.join(', ') + '.');
  if (c.fam && c.fam === sp.familia) razones.push('Acá recién hubo otra ' + sp.familia + ': conviene rotar.');
  if (vent === 'fuera') razones.push('Fuera de época de siembra en el GBA.');
  else if (vent === 'posible') razones.push('Época posible, no ideal.');
  const tg = sp.tg, ts = tempEfectiva(E, celda, { tmed: interp(CLIMA.media, diaCentral(E.dec)) });
  if (ts < tg.min) razones.push('Suelo frío para germinar (~' + Math.round(ts) + ' °C, necesita ' + tg.min + ' °C)' + (enAlm ? '.' : ': probá en la almaciguera.'));
  if (ts > tg.max) razones.push('Suelo demasiado caliente para germinar.');
  if (enAlm && !sp.dt) razones.push(sp.nombre + ' no tolera el trasplante: va de siembra directa.');
  const germ = ts < tg.min || ts > tg.max ? 0.3 : 1;
  const p = l * s * m * ve.f * vig * germ * (c.fam === sp.familia ? 0.85 : 1) * (enAlm && !sp.dt ? 0.4 : 1);
  return { puntaje: clamp(p, 0, 1.2), nivel: p >= 0.72 ? 'bien' : p >= 0.45 ? 'regular' : 'mal', razones, horas: h };
}
