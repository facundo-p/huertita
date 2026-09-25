import type { Region } from '../region';
import { gba } from './gba';

/** Todas las regiones. Sumar una: crear el archivo y anotarlo acá (ver #57). */
export const REGIONES: Record<string, Region> = { gba };
