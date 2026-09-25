import { REGLAS } from '../../../datos/juego/reglas';
import { compostera, dosisDeCompost } from '../estructuras';
import { anotar } from '../estado';
import { zona } from '../patio';
import { especieDe } from '../planta';
import type { CeldaId, Estado } from '../tipos';
import { clamp } from '../util';
import * as T from '../textos/acciones';
import { tratada } from '../textos/plagas';
import type { De, Regla } from './regla';

const RATO = (): number => REGLAS.ratos.accion;

export const tutorar: Regla<De<'tutorar'>> = {
  puede(E, a) {
    const pl = E.mundo.plantas[a.planta];
    if (!pl || pl.tutor) return T.noHaceFalta();
    const sp = especieDe(pl);
    if (!sp.cuidados.includes('tutorado')) return T.noPideTutor(sp);
    if (pl.etapa === 'semilla') return T.tutorDespuesDeGerminar();
    if (zona(E, E.mundo.celdas[pl.celda].zona).cria) return T.tutorEnAlmacigo();
    return null;
  },
  costo: RATO,
  aplicar(E, a, evs) {
    const pl = E.mundo.plantas[a.planta];
    pl.tutor = true;
    evs.push(anotar(E, 'info', T.tutor(especieDe(pl)), pl.celda));
  },
};

export const tratar: Regla<De<'tratar'>> = {
  puede: (E, a) => (E.mundo.plantas[a.planta]?.plaga ? null : T.sinPlaga()),
  costo: RATO,
  aplicar(E, a, evs) {
    const pl = E.mundo.plantas[a.planta],
      f = tratada(pl.plaga!);
    pl.plaga = null;
    evs.push(anotar(E, 'bien', f, pl.celda));
  },
};

export const mulch: Regla<De<'mulch'>> = {
  puede(E, a) {
    const c = E.mundo.celdas[a.celda];
    if (!c || zona(E, c.zona).cria) return T.mulchNoVa();
    if (c.mulch) return T.yaTieneMulch();
    return null;
  },
  costo: RATO,
  aplicar(E, a, evs) {
    E.mundo.celdas[a.celda].mulch = true;
    evs.push(anotar(E, 'info', T.mulch(), a.celda));
  },
};

/** Si esa celda recibe compost (haya o no dosis): la almaciguera no, que lleva sustrato. */
export function recibeCompost(E: Estado, celda: CeldaId): boolean {
  const c = E.mundo.celdas[celda];
  return !!c && !zona(E, c.zona).cria;
}

export const compost: Regla<De<'compost'>> = {
  puede(E, a) {
    const c = E.mundo.celdas[a.celda];
    if (!c) return T.compostNoVa();
    if (!recibeCompost(E, a.celda)) return T.compostEnAlmacigo();
    if (dosisDeCompost(E) < 1) return T.sinCompost();
    return null;
  },
  costo: RATO,
  aplicar(E, a, evs) {
    const c = E.mundo.celdas[a.celda];
    compostera(E)!.dosis--;
    c.mo = clamp(c.mo + REGLAS.suelo.moPorCompost, 0, 100);
    evs.push(anotar(E, 'bien', T.compost(c.mo), a.celda));
  },
};
