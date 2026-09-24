/**
 * El paso del tiempo. Hoy avanza de a una década (10 días): `pasarDecada` corre un turno de la
 * tubería de sistemas (`sistemas/`). El paso 4 de los cimientos (#28) lo lleva a un tic diario con
 * `avanzar(estado, días)`, que es cambiar el tamaño del turno y no desenredar reglas.
 */
import { correrTurno } from './sistemas';
import type { Estado, Evento } from './tipos';

export function pasarDecada(E: Estado): Evento[] {
  if (E.terminado) return [];
  return correrTurno(E);
}
