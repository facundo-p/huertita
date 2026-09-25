/** Qué panel va con cada modo. */
import type { JSX } from 'preact';
import type { NombreDeModo } from '../modos';
import { Almanaque } from './Almanaque';
import { Celda } from './Celda';
import { Compost } from './Compost';
import { Cuaderno, Resumen } from './Cuaderno';
import { Ficha } from './Ficha';
import { Fin, Logros } from './Logros';
import { Partidas } from './Partidas';
import { Patios } from './Patios';
import { Inicio } from './Inicio';
import { Proteger } from './Proteger';
import { Riego } from './Riego';
import { Sembrar } from './Sembrar';
import '../piezas/piezas.css';
import './paneles.css';

export const PANELES: Record<Exclude<NombreDeModo, 'moviendo'>, () => JSX.Element | null> = {
  inicio: Inicio,
  semillas: Sembrar,
  celda: Celda,
  ficha: Ficha,
  almanaque: Almanaque,
  riego: Riego,
  proteger: Proteger,
  compost: Compost,
  cuaderno: Cuaderno,
  logros: Logros,
  partidas: Partidas,
  patios: Patios,
  resumen: Resumen,
  fin: Fin,
};
