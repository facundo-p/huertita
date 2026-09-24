import { REGLAS } from '../../datos/juego/reglas';
import { azar } from './azar';
import { CARACTERES, fechaDe, generarTiempo } from './clima';
import { celdasDePlanta } from './espacio';
import { PATIOS, PATIO_INICIAL, celdasDe, zona, zonaDe, zonasDe } from './patio';
import type { CaracterId, CeldaId, Estado, Evento, Planta, TipoEvento } from './tipos';
import { clamp } from './util';
import { especieDe } from './planta';
import type { Frase } from './textos/frase';
import * as T from './textos/temporada';

export const RATOS = REGLAS.ratos.porDecada;
export const RIEGOS = ['nada', 'espaciado', 'parejo', 'constante'] as const;
const { arranque: ARRANQUE, suelo: SUELO } = REGLAS;

/** Anota una frase en el cuaderno de la partida y la devuelve como evento. */
export function anotar(E: Estado, tipo: TipoEvento, f: Frase, celda?: CeldaId | null): Evento {
  const ev: Evento = { turno: E.turno, dec: E.dec, tipo, texto: f.texto, celda: celda || null, codigo: f.codigo };
  E.cuaderno.push(ev);
  if (E.cuaderno.length > ARRANQUE.cuaderno) E.cuaderno.shift();
  return ev;
}
export function moMedia(E: Estado): number {
  let t = 0,
    n = 0;
  for (const c in E.celdas)
    if (!zonaDe(E, c).cria) {
      t += E.celdas[c].mo;
      n++;
    }
  return t / n;
}
export function plantaEn(E: Estado, celda: CeldaId): Planta | null {
  const c = E.celdas[celda];
  return c && c.planta ? E.plantas[c.planta] : null;
}

/** En qué punto está un plantín respecto del trasplante. `faltan` son días de buen crecimiento, no de calendario. */
export function puntoDeTrasplante(
  pl: Planta,
): { punto: 'chico' | 'listo' | 'pasado'; faltan: number; min: number; max: number } | null {
  const dt = especieDe(pl).dt;
  if (pl.etapa !== 'plantin' || !dt) return null;
  return {
    punto: pl.prog < dt.min ? 'chico' : pl.prog < dt.max ? 'listo' : 'pasado',
    faltan: Math.max(0, Math.ceil(dt.min - pl.prog)),
    min: dt.min,
    max: dt.max,
  };
}

export function costoRiego(E: Estado): number {
  let t = 0;
  for (const z of zonasDe(E)) {
    const costo = z.riegoCosto[E.riego[z.id]];
    t += Math.max(0, costo - (E.goteo && costo > 0 ? REGLAS.ratos.ahorroGoteo : 0));
  }
  return t;
}
export const ratosLibres = (E: Estado): number => RATOS - costoRiego(E) - E.ratosGastados;

export function quitarPlanta(E: Estado, pl: Planta, alCompost: boolean): void {
  const sp = especieDe(pl);
  for (const k of celdasDePlanta(pl)) {
    const c = E.celdas[k];
    if (!zona(E, c.zona).cria && pl.etapa !== 'semilla') {
      c.fam = sp.familia;
      const seLleva = sp.fruto ? SUELO.moQueSeLleva.fruto : SUELO.moQueSeLleva.resto,
        devuelve = sp.familia === 'leguminosa' ? SUELO.moQueDejaLeguminosa : 0;
      c.mo = clamp(c.mo - seLleva + devuelve, SUELO.moMin, SUELO.moMax);
    }
    c.planta = null;
  }
  delete E.plantas[pl.id];
  if (alCompost) E.compost.carga += REGLAS.compost.porPlanta;
}

export function crearPartida(
  semilla: number,
  opciones: { decInicio?: number; caracter?: CaracterId; patio?: string } = {},
): Estado {
  const patio = opciones.patio || PATIO_INICIAL;
  if (!PATIOS[patio]) throw new Error('Patio desconocido: ' + patio);
  const E = {
    v: 3,
    patio,
    semilla: semilla | 0,
    rng: (semilla | 0) ^ 0x9e3779b9,
    dec: opciones.decInicio || ARRANQUE.decada,
    turno: 0,
    anio: 1,
    caracter: 'normal',
    ratosGastados: 0,
    riego: {},
    tunel: {},
    manta: {},
    goteo: false,
    celdas: {},
    plantas: {},
    nextId: 1,
    sobres: {},
    gen: {},
    compost: { dosis: ARRANQUE.dosisDeCompost, carga: 0, tandas: [] },
    cosechado: {},
    porciones: 0,
    semillasGuardadas: 0,
    visitas: 0,
    moInicial: 0,
    misiones: {},
    cuaderno: [],
    prox: null as unknown as Estado['prox'],
    terminado: false,
  } as Estado;
  const ks = Object.keys(CARACTERES) as CaracterId[];
  E.caracter = opciones.caracter || ks[Math.floor(azar(E) * ks.length)];
  for (const s in ARRANQUE.sobres) E.sobres[s] = ARRANQUE.sobres[s];
  for (const z of zonasDe(E)) {
    E.riego[z.id] = ARRANQUE.riego;
    for (const c of celdasDe(E, z.id)) E.celdas[c] = { zona: z.id, mo: z.mo, mulch: false, fam: null, planta: null };
  }
  E.moInicial = moMedia(E);
  E.prox = generarTiempo(E, E.dec);
  anotar(E, 'info', T.arranca(fechaDe(E.dec), CARACTERES[E.caracter]));
  anotar(E, 'info', T.bienvenida(PATIOS[patio].bienvenida));
  return E;
}
