/** Qué panel va con cada modo. */
import type { JSX } from 'preact';
import type { NombreDeModo } from '../modos';
import { Celda } from './Celda';
import { Inicio } from './Inicio';
import { Proteger } from './Proteger';
import { Riego } from './Riego';
import { Sembrar } from './Sembrar';

const pendiente = (): JSX.Element | null => null;

export const PANELES: Record<Exclude<NombreDeModo, 'moviendo'>, () => JSX.Element | null> = {
  inicio: Inicio,
  semillas: Sembrar,
  celda: Celda,
  ficha: pendiente,
  almanaque: pendiente,
  riego: Riego,
  proteger: Proteger,
  cuaderno: pendiente,
  logros: pendiente,
  partidas: pendiente,
  patios: pendiente,
  resumen: pendiente,
  fin: pendiente,
};
