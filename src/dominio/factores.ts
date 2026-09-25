/** Los cinco factores de crecimiento (luz, agua, temperatura, suelo, vecinos) y el "fantasma de siembra". */
import type { CategoriaSuelo, RegimenRiego, TempCrecimiento } from '../../datos/contrato';
import { REGLAS } from '../../datos/juego/reglas';
import { ESPECIES, META, ventana } from './catalogo';
import { DECADAS_DEL_ANIO, diaCentral, interp } from './calendario';
import { regionDe } from './region';
import { plantaEn } from './estado';
import { bloqueDe, ocupadaEn } from './espacio';
import { horasSol, macetaDe, sueloBase, vecinas, xy, zonaDe } from './patio';
import type { CeldaId, Especie, Estado, Planta, Tiempo } from './tipos';
import { clamp, r1 } from './util';
import { especieDe } from './planta';
import * as TF from './textos/fantasma';

const { agua: AGUA, luz: LUZ, maceta: MACETA, suelo: SUELO, temperatura: TEMP, vecinos: VECINOS } = REGLAS;
const F = REGLAS.fantasma;

/** Lo que pide de agua cada régimen de riego, en la escala de humedad del juego. */
export const DESEO_AGUA: Record<RegimenRiego, number> = AGUA.deseo;

/** El suelo de una celda: un franco fértil con mucha materia orgánica pasa a ser húmedo y rico. */
export function sueloDeCelda(E: Estado, celda: CeldaId): CategoriaSuelo {
  const base = sueloBase(E, celda);
  return E.mundo.celdas[celda].mo >= SUELO.moRica && base === 'FRANCO_FERTIL' ? 'HUMEDO_RICO' : base;
}

/** Cuánto crece con estas horas de sol: 1 desde las ideales, 0.7 en las mínimas, y cae rápido por debajo. */
export function fLuz(sp: Especie, h: number, tmax: number): number {
  let f: number;
  if (h >= sp.hideal) f = 1;
  else if (h >= sp.hmin)
    f = LUZ.enElMinimo + (LUZ.subeHastaIdeal * (h - sp.hmin)) / Math.max(LUZ.rangoMinimo, sp.hideal - sp.hmin);
  else f = LUZ.enElMinimo * Math.pow(h / Math.max(1, sp.hmin), LUZ.curvaDebajoDelMinimo);
  if (sp.luz === 'MEDIA_SOMBRA' && h > LUZ.mediaSombraHoras && tmax > LUZ.mediaSombraCalor)
    f = Math.min(f, LUZ.mediaSombraTope);
  return clamp(f, LUZ.piso, 1);
}
export function fSuelo(E: Estado, sp: Especie, celda: CeldaId): number {
  const compatible = SUELO.compatibilidad[sp.suelo][sueloDeCelda(E, celda)] || SUELO.compatibilidadSinDato;
  return compatible * (SUELO.factorBase + (SUELO.factorPorMo * E.mundo.celdas[celda].mo) / 100);
}
/** Lo que pide de maceta una especie; si huertapp no lo dice, 8 L y 30 cm. */
export function macetaQuePide(sp: Especie): { litros: number; prof: number } {
  return {
    litros: sp.maceta?.litros_min || MACETA.litrosSinDato,
    prof: sp.maceta?.profundidad_min_cm || MACETA.profundidadSinDato,
  };
}
/** Qué tan bien le queda la maceta de la celda: 1 si alcanza, 0.6 si es mediana, 0.35 si es chica. */
export function fMaceta(E: Pick<Estado, 'mundo'>, sp: Especie, celda: CeldaId): number {
  const m = macetaDe(E, celda);
  if (!m) return 1;
  const pide = macetaQuePide(sp);
  if (m.litros >= pide.litros && m.prof >= pide.prof) return 1;
  if (m.litros >= pide.litros * MACETA.medianaLitros && m.prof >= pide.prof * MACETA.medianaHondo)
    return MACETA.factorMediana;
  return MACETA.factorChica;
}
export const bajoTunel = (E: Pick<Estado, 'mundo' | 'recursos'>, celda: CeldaId): boolean =>
  !!E.recursos.tunel[E.mundo.celdas[celda].zona];
/** Índice de humedad del suelo, de 0 (seco) a ~4,5 (encharcado). [SUPUESTO] balance hídrico simplificado. */
export function humedad(E: Estado, celda: CeldaId, w: Pick<Tiempo, 'lluvia' | 'tmax'>): number {
  const c = E.mundo.celdas[celda],
    z = zonaDe(E, celda),
    m = macetaDe(E, celda);
  const cubierta = !!z.techo || bajoTunel(E, celda);
  const ll = cubierta ? 0 : aguaDeLluvia(w.lluvia);
  const calor = w.tmax > AGUA.calorDesde ? (w.tmax - AGUA.calorDesde) * AGUA.secadoPorGrado : 0;
  const dren = z.drenaje + (m && m.litros <= MACETA.chicaLitros ? MACETA.secadoExtra : 0);
  return E.recursos.riego[c.zona] + ll - calor - dren + (c.mulch ? AGUA.mulch : 0);
}
/** Cuánta humedad suma la lluvia de la década, en mm. */
function aguaDeLluvia(mm: number): number {
  for (const tramo of AGUA.lluvia) if (mm < tramo.hasta) return tramo.suma;
  return AGUA.lluviaMucha;
}
export type EstadoAgua = 'bien' | 'seco' | 'exceso';
export function fAgua(sp: Especie, H: number): { f: number; estado: EstadoAgua; diff: number } {
  const diff = H - DESEO_AGUA[sp.riego];
  if (diff < -AGUA.falta)
    return { f: clamp(1 - (-AGUA.falta - diff) * AGUA.pendienteSeco, AGUA.pisoSeco, 1), estado: 'seco', diff };
  if (diff > AGUA.sobra)
    return { f: clamp(1 - (diff - AGUA.sobra) * AGUA.pendienteExceso, AGUA.pisoExceso, 1), estado: 'exceso', diff };
  return { f: 1, estado: 'bien', diff };
}
/** [SUPUESTO] el microtúnel suma 3 °C de día; el calor propio de cada zona está en los datos del patio */
export function tempEfectiva(E: Estado, celda: CeldaId, w: Pick<Tiempo, 'tmed'>): number {
  return w.tmed + (zonaDe(E, celda).calor || 0) + (bajoTunel(E, celda) ? TEMP.bajoTunel : 0);
}
export function fTemp(sp: Especie, t: number): number {
  const c = sp.tc;
  if (t >= c.ideal_min && t <= c.ideal_max) return 1;
  if (t < c.ideal_min) {
    const frio = (TEMP.frioRango * (t - c.tolera_min)) / Math.max(1, c.ideal_min - c.tolera_min);
    return clamp(TEMP.frioBase + frio, TEMP.frioPiso, 1);
  }
  return clamp(1 - (TEMP.calorRango * (t - c.ideal_max)) / Math.max(1, c.tolera_max - c.ideal_max), TEMP.calorPiso, 1);
}
/** lo malo pesa más que lo bueno */
function relacion(a: string, b: string): 'mala' | 'buena' | null {
  const A = ESPECIES[a],
    B = ESPECIES[b];
  if (A.malas.includes(b) || B.malas.includes(a)) return 'mala';
  if (A.buenas.includes(b) || B.buenas.includes(a)) return 'buena';
  return null;
}
/** [REPO] asociaciones; [SUPUESTO] +8 % / −12 % por vecino, atenuado por la confianza del dato. */
export function fVecinos(
  E: Estado,
  slug: string,
  celda: CeldaId,
  ignorarId?: string,
): { f: number; buenas: string[]; malas: string[] } {
  let f = 1;
  const buenas: string[] = [],
    malas: string[] = [],
    sp = ESPECIES[slug];
  for (const v of vecinas(celda)) {
    const pl = plantaEn(E, v);
    if (!pl || pl.id === ignorarId || pl.etapa === 'semilla') continue;
    const r = relacion(slug, pl.slug);
    if (r === 'buena') {
      f += VECINOS.buena * clamp(sp.confB / VECINOS.confianzaPlena, VECINOS.confianzaMin, 1);
      buenas.push(especieDe(pl).nombre);
    }
    if (r === 'mala') {
      f -= VECINOS.mala * clamp(sp.confM / VECINOS.confianzaPlena, VECINOS.confianzaMin, 1);
      malas.push(especieDe(pl).nombre);
    }
  }
  return { f: clamp(f, VECINOS.piso, VECINOS.techo), buenas, malas };
}
/** flores y aromáticas a 2 celdas: refugio de enemigos naturales */
export function aliadosCerca(E: Estado, celda: CeldaId): number {
  const p = xy(celda);
  let n = 0;
  for (const id in E.mundo.plantas) {
    const pl = E.mundo.plantas[id],
      q = xy(pl.celda),
      sp = especieDe(pl);
    if (pl.celda === celda || pl.etapa === 'semilla' || pl.etapa === 'plantin') continue;
    if (
      (sp.flor || sp.grupo === 'Aromática') &&
      Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) <= REGLAS.plagas.radioDeAliados
    )
      n++;
  }
  return n;
}
export function floresAbiertas(E: Estado): number {
  let n = 0;
  for (const id in E.mundo.plantas) {
    const pl = E.mundo.plantas[id],
      sp = especieDe(pl);
    if (pl.etapa === 'cosechable' && (sp.flor || sp.familia === 'lamiacea'))
      n += sp.flor ? 1 : REGLAS.polinizadores.aromatica;
  }
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
export function factoresPlanta(E: Estado, pl: Planta, w: Tiempo = E.tiempo.clima): Factores {
  const sp = especieDe(pl),
    h = horasSol(E, pl.celda, w.dec),
    H = humedad(E, pl.celda, w),
    ag = fAgua(sp, H),
    ve = fVecinos(E, pl.slug, pl.celda, pl.id);
  const t = tempEfectiva(E, pl.celda, w);
  return {
    luz: {
      f: fLuz(sp, h, w.tmax),
      horas: h,
      pide: sp.hmin === sp.hideal ? sp.hmin + ' h o más' : sp.hmin + '–' + sp.hideal + ' h',
      min: sp.hmin,
      ideal: sp.hideal,
    },
    agua: {
      f: ag.f,
      estado: ag.estado,
      diff: ag.diff,
      pide: sp.riego,
      H: r1(clamp(H, 0, AGUA.maxima)),
      lo: DESEO_AGUA[sp.riego] - AGUA.falta,
      hi: DESEO_AGUA[sp.riego] + AGUA.sobra,
    },
    temp: {
      f: fTemp(sp, t),
      t: r1(t),
      pide: sp.tc.ideal_min + '–' + sp.tc.ideal_max + ' °C',
      tc: sp.tc,
      tmin: w.tmin,
      tmax: w.tmax,
    },
    suelo: {
      f: clamp(fSuelo(E, sp, pl.celda) * fMaceta(E, sp, pl.celda), 0, 1),
      mo: Math.round(E.mundo.celdas[pl.celda].mo),
      maceta: fMaceta(E, sp, pl.celda),
    },
    vecinos: ve,
  };
}

export interface Evaluacion {
  puntaje: number;
  nivel: 'bien' | 'regular' | 'mal';
  razones: string[];
  horas: number;
}
/** El "fantasma de siembra": qué tan bien le iría HOY a esta especie en esta celda. */
export function evaluarCelda(E: Estado, slug: string, celda: CeldaId): Evaluacion | null {
  const sp = ESPECIES[slug],
    c = E.mundo.celdas[celda];
  if (!c) return null;
  const razones: string[] = [],
    R = regionDe(E),
    h = horasSol(E, celda, E.tiempo.dec);
  const h2 = horasSol(E, celda, ((E.tiempo.dec + F.decadasAdelante) % DECADAS_DEL_ANIO) + 1); // la planta va a vivir ahí
  const l = (fLuz(sp, h, F.temperaturaDeReferencia) + fLuz(sp, h2, F.temperaturaDeReferencia)) / 2,
    s = fSuelo(E, sp, celda),
    m = fMaceta(E, sp, celda),
    ve = fVecinos(E, slug, celda);
  const enAlm = !!zonaDe(E, celda).cria,
    vent = ventana(R, slug, E.tiempo.dec),
    vig = REGLAS.siembra.vigorPorVentana[vent];
  const bloque = bloqueDe(E, sp, celda, enAlm),
    entra =
      !!bloque &&
      !ocupadaEn(
        E,
        bloque.filter((k) => k !== celda),
      );
  if (!entra) razones.push(TF.noEntra(sp));
  if (l < F.avisoPocaLuz) razones.push(TF.pocaLuz(sp, h));
  if (s < F.avisoMalSuelo)
    razones.push(TF.malSuelo(sp, META.suelos[sueloDeCelda(E, celda)].nombre, META.suelos[sp.suelo].nombre));
  if (m < 1) razones.push(TF.macetaChica(macetaQuePide(sp).litros, macetaQuePide(sp).prof));
  if (ve.malas.length) razones.push(TF.malVecino(ve.malas));
  if (ve.buenas.length) razones.push(TF.buenVecino(ve.buenas));
  if (c.fam && c.fam === sp.familia) razones.push(TF.rotar(sp.familia));
  if (vent === 'fuera') razones.push(TF.fueraDeEpoca(R.textos.enElLugar));
  else if (vent === 'posible') razones.push(TF.epocaPosible());
  const tg = sp.tg,
    ts = tempEfectiva(E, celda, { tmed: interp(R.clima.media, diaCentral(E.tiempo.dec)) });
  if (ts < tg.min) razones.push(TF.sueloFrio(ts, tg.min, enAlm));
  if (ts > tg.max) razones.push(TF.sueloCaliente());
  if (enAlm && !sp.dt) razones.push(TF.noToleraTrasplante(sp));
  const germ = ts < tg.min || ts > tg.max ? F.sueloFrio : 1;
  const rota = c.fam === sp.familia ? REGLAS.siembra.vigorRepitiendoFamilia : 1,
    sinTrasplante = enAlm && !sp.dt ? F.enAlmacigoSinTrasplante : 1;
  const p = (entra ? 1 : 0) * l * s * m * ve.f * vig * germ * rota * sinTrasplante;
  return { puntaje: clamp(p, 0, F.techo), nivel: nivelDe(p), razones, horas: h };
}
function nivelDe(puntaje: number): Evaluacion['nivel'] {
  if (puntaje >= F.bien) return 'bien';
  return puntaje >= F.regular ? 'regular' : 'mal';
}
