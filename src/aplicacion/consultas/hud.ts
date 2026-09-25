/** Lo que se ve siempre arriba: la fecha, los ratos de la década y el pronóstico. */
import * as M from '../../dominio';
import type { Estado, Pronostico } from '../../dominio';
import { TEXTOS } from '../../dominio/textos/sorpresas';
import { cap } from '../../dominio/util';
import { pedidos } from './pedidos';

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
  /** la amenaza anunciada para esta década (un evento sorpresa): qué es y qué la frena */
  amenaza: { titulo: string; queHacer: string } | null;
  /** el pedido abierto de fecha más cercana, y cuántos hay */
  pedido: { especie: string; porciones: number; llevas: number; fecha: string; abiertos: number } | null;
}

/** De qué es el rato i: primero los libres, después los que ya usaste, al final los que se come el riego. */
function queRato(i: number, libres: number, usados: number): Rato {
  if (i < libres) return 'libre';
  return i < libres + usados ? 'usado' : 'riego';
}
function amenaza(E: Estado): Hud['amenaza'] {
  const s = M.anunciada(E),
    T = s && TEXTOS[s.id];
  return T?.clase === 'amenaza' ? { titulo: T.titulo, queHacer: T.queHacer() } : null;
}
function pedidoMasCerca(E: Estado): Hud['pedido'] {
  const { abiertos } = pedidos(E),
    p = abiertos[0];
  return p
    ? { especie: p.especie, porciones: p.porciones, llevas: p.llevas, fecha: p.fecha, abiertos: abiertos.length }
    : null;
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
    estacion: M.estacionDe(M.regionDe(E), E.tiempo.dec),
    anio: E.tiempo.anio,
    libres,
    ratos,
    pronostico: p,
    alertaDeHelada: alertaDeHelada(p.pHelada),
    amenaza: amenaza(E),
    pedido: pedidoMasCerca(E),
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
