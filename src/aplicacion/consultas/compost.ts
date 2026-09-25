/**
 * El panel del compost: la bolsa de secos, la tanda abierta con su receta, las tandas que maduran,
 * lo que el patio tiene para juntar y qué se puede hacer. Si se puede y cuánto cuesta lo dice el
 * dominio (`puede`, `costoDe`); la vista solo pinta.
 */
import { REGLAS } from '../../../datos/juego/reglas';
import * as M from '../../dominio';
import type { Accion, Estado, Mezcla } from '../../dominio';

export interface AccionDelCompost {
  accion: Accion;
  texto: string;
  /** si se puede ahora, sin contar los ratos */
  se: boolean;
  /** por qué no, si no se puede */
  porque: string | null;
  costo: number;
}

export interface Compost {
  hay: boolean;
  /** secos guardados en la bolsa */
  bolsa: number;
  abierta: { verdes: number; secos: number; secosPorVerde: number | null; mezcla: Mezcla; cierraCon: number };
  tandas: { avance: number; mezcla: Mezcla }[];
  dosis: number;
  receta: { min: number; ideal: number; max: number };
  jardin: { pasto: number | null; hojas: number; poda: number; fase: M.FaseDeCaducos };
  acciones: AccionDelCompost[];
}

const r1 = (x: number): number => Math.round(x * 10) / 10;

function accion(E: Estado, a: Accion, texto: string): AccionDelCompost {
  const porque = M.puede(E, a, { sinMirarRatos: true });
  return { accion: a, texto, se: porque === null, porque, costo: M.costoDe(E, a) };
}

export function compost(E: Estado): Compost {
  const k = M.compostera(E),
    C = REGLAS.compost,
    verdes = k?.verdes ?? 0,
    secos = k?.secos ?? 0;
  const P = E.mundo.patio,
    J = E.mundo.jardin,
    acciones: AccionDelCompost[] = [accion(E, { tipo: 'juntarHojas' }, 'Juntar hojas')];
  if (P.pastoM2) {
    acciones.push(accion(E, { tipo: 'cortarPasto', destino: 'compost' }, 'Cortar pasto al compost'));
    acciones.push(accion(E, { tipo: 'cortarPasto', destino: 'secar' }, 'Cortar pasto y secarlo'));
  }
  if (M.hayCaducos(P)) acciones.push(accion(E, { tipo: 'podar' }, 'Podar'));
  acciones.push(accion(E, { tipo: 'revolver' }, 'Revolver la tanda húmeda'));
  return {
    hay: !!k,
    bolsa: E.recursos.secos,
    abierta: {
      verdes,
      secos,
      secosPorVerde: verdes > 0 ? r1(M.secosPorVerde(verdes, secos)) : null,
      mezcla: M.mezclaDe(verdes, secos),
      cierraCon: C.tanda,
    },
    tandas: (k?.tandas ?? []).map((t) => ({ avance: Math.min(1, t.avance / C.madura), mezcla: t.mezcla })),
    dosis: k?.dosis ?? 0,
    receta: C.receta,
    jardin: {
      pasto: P.pastoM2 ? J.pasto : null,
      hojas: J.hojas,
      poda: J.poda,
      fase: M.faseDeCaducos(M.regionDe(E), E.tiempo.dec),
    },
    acciones,
  };
}
