/** Lo que se ve siempre arriba: la fecha, los ratos de la década y el pronóstico. */
import * as M from '../../dominio';
import type { Estado, Pronostico } from '../../dominio';
import { cap } from '../../dominio/util';

export type Rato = 'libre' | 'usado' | 'riego';
export interface Hud {
  fecha: string;
  estacion: string;
  anio: number;
  libres: number;
  /** uno por rato de la década, en el orden en que se dibujan: libres, usados, los que se come el riego */
  ratos: Rato[];
  pronostico: Pronostico;
  /** qué tan en serio tomar la helada del pronóstico */
  alertaDeHelada: 'alta' | 'media' | null;
}

/** De qué es el rato i: primero los libres, después los que ya usaste, al final los que se come el riego. */
function queRato(i: number, libres: number, usados: number): Rato {
  if (i < libres) return 'libre';
  return i < libres + usados ? 'usado' : 'riego';
}
function alertaDeHelada(pHelada: number): Hud['alertaDeHelada'] {
  if (pHelada >= 50) return 'alta';
  return pHelada >= 20 ? 'media' : null;
}

export function hud(E: Estado): Hud {
  const libres = M.ratosLibres(E),
    ratos: Rato[] = [];
  for (let i = 0; i < M.RATOS; i++) ratos.push(queRato(i, libres, E.recursos.ratosGastados));
  const p = E.tiempo.pronostico;
  return {
    fecha: cap(M.fechaDe(E.tiempo.dec)),
    estacion: M.estacionDe(E.tiempo.dec),
    anio: E.tiempo.anio,
    libres,
    ratos,
    pronostico: p,
    alertaDeHelada: alertaDeHelada(p.pHelada),
  };
}

/** Una línea que identifica una partida guardada: patio, fecha, año, porciones y plantas. */
export function resumenDePartida(E: Estado): string {
  const P = E.meta.plantilla !== M.PLANTILLA_INICIAL ? M.patioDe(E) : null;
  return (
    (P ? P.nombre + ' · ' : '') +
    cap(M.fechaDe(E.tiempo.dec)) +
    ' · año ' +
    E.tiempo.anio +
    ' · ' +
    E.progreso.porciones +
    ' porciones · ' +
    Object.keys(E.mundo.plantas).length +
    ' plantas'
  );
}
