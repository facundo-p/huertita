import { azar } from './azar';
import { CARACTERES, fechaDe, generarTiempo } from './clima';
import { ESPECIES } from './catalogo';
import { PATIOS, PATIO_INICIAL, celdasDe, zona, zonaDe, zonasDe } from './patio';
import type { CaracterId, CeldaId, Estado, Evento, Planta, TipoEvento } from './tipos';
import { clamp } from './util';

export const RATOS = 14;
export const RIEGOS = ['nada', 'espaciado', 'parejo', 'constante'] as const;
const SOBRES_INICIO: Record<string, number> = { rabanito: 6, lechuga: 6, acelga: 4, arveja: 6, haba: 4, perejil: 3, calendula: 4, tomate: 4, albahaca: 4, zanahoria: 6, 'cebolla-de-verdeo': 4, rucula: 4 };

export function anotar(E: Estado, tipo: TipoEvento, texto: string, celda?: CeldaId | null): Evento {
  const ev: Evento = { turno: E.turno, dec: E.dec, tipo, texto, celda: celda || null };
  E.cuaderno.push(ev); if (E.cuaderno.length > 400) E.cuaderno.shift();
  return ev;
}
export function moMedia(E: Estado): number { let t = 0, n = 0; for (const c in E.celdas) if (!zonaDe(E, c).cria) { t += E.celdas[c].mo; n++; } return t / n; }
export function plantaEn(E: Estado, celda: CeldaId): Planta | null { const c = E.celdas[celda]; return c && c.planta ? E.plantas[c.planta] : null; }

/** En qué punto está un plantín respecto del trasplante. `faltan` son días de buen crecimiento, no de calendario. */
export function puntoDeTrasplante(pl: Planta): { punto: 'chico' | 'listo' | 'pasado'; faltan: number; min: number; max: number } | null {
  const dt = ESPECIES[pl.slug].dt; if (pl.etapa !== 'plantin' || !dt) return null;
  return { punto: pl.prog < dt.min ? 'chico' : pl.prog < dt.max ? 'listo' : 'pasado', faltan: Math.max(0, Math.ceil(dt.min - pl.prog)), min: dt.min, max: dt.max };
}

export function costoRiego(E: Estado): number {
  let t = 0;
  for (const z of zonasDe(E)) { const costo = z.riegoCosto[E.riego[z.id]]; t += Math.max(0, costo - (E.goteo && costo > 0 ? 1 : 0)); }
  return t;
}
export const ratosLibres = (E: Estado): number => RATOS - costoRiego(E) - E.ratosGastados;
export function gastar(E: Estado, n: number): boolean { if (ratosLibres(E) < n) return false; E.ratosGastados += n; return true; }

export function quitarPlanta(E: Estado, pl: Planta, alCompost: boolean): void {
  const c = E.celdas[pl.celda], sp = ESPECIES[pl.slug];
  if (!zona(E, c.zona).cria && pl.etapa !== 'semilla') { c.fam = sp.familia; c.mo = clamp(c.mo - (sp.fruto ? 6 : 4) + (sp.familia === 'leguminosa' ? 8 : 0), 5, 100); }
  c.planta = null; delete E.plantas[pl.id];
  if (alCompost) E.compost.carga += 1;
}

export function crearPartida(semilla: number, opciones: { decInicio?: number; caracter?: CaracterId; patio?: string } = {}): Estado {
  const patio = opciones.patio || PATIO_INICIAL;
  if (!PATIOS[patio]) throw new Error('Patio desconocido: ' + patio);
  const E = {
    v: 2, patio, semilla: semilla | 0, rng: (semilla | 0) ^ 0x9E3779B9,
    dec: opciones.decInicio || 22, turno: 0, anio: 1, caracter: 'normal',
    ratosGastados: 0, riego: {},
    tunel: {}, manta: {}, goteo: false,
    celdas: {}, plantas: {}, nextId: 1,
    sobres: {}, gen: {}, compost: { dosis: 2, carga: 0, tandas: [] },
    cosechado: {}, porciones: 0, semillasGuardadas: 0, visitas: 0, moInicial: 0,
    misiones: {}, cuaderno: [], prox: null as unknown as Estado['prox'], terminado: false,
  } as Estado;
  const ks = Object.keys(CARACTERES) as CaracterId[];
  E.caracter = opciones.caracter || ks[Math.floor(azar(E) * ks.length)];
  for (const s in SOBRES_INICIO) E.sobres[s] = SOBRES_INICIO[s];
  for (const z of zonasDe(E)) { E.riego[z.id] = 2; for (const c of celdasDe(E, z.id)) E.celdas[c] = { zona: z.id, mo: z.mo, mulch: false, fam: null, planta: null }; }
  E.moInicial = moMedia(E);
  E.prox = generarTiempo(E, E.dec);
  anotar(E, 'info', 'Arranca la huerta a ' + fechaDe(E.dec) + '. ' + CARACTERES[E.caracter].nombre + ': ' + CARACTERES[E.caracter].texto);
  anotar(E, 'info', PATIOS[patio].bienvenida);
  return E;
}
