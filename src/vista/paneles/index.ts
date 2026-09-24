/** Qué panel va con cada modo. */
import type { JSX } from 'preact';
import type { NombreDeModo } from '../modos';

const pendiente = (): JSX.Element | null => null;

export const PANELES: Record<Exclude<NombreDeModo, 'moviendo'>, () => JSX.Element | null> = {
  inicio: pendiente,
  semillas: pendiente,
  celda: pendiente,
  ficha: pendiente,
  almanaque: pendiente,
  riego: pendiente,
  proteger: pendiente,
  cuaderno: pendiente,
  logros: pendiente,
  partidas: pendiente,
  patios: pendiente,
  resumen: pendiente,
  fin: pendiente,
};
