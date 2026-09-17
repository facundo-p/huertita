import type { Patio } from '../patio';
import { balcon } from './balcon';
import { fondo } from './fondo';

/** Todos los patios jugables. Sumar uno: crear el archivo y anotarlo acá. El primero es el de arranque. */
export const PATIOS: Record<string, Patio> = { fondo, balcon };
export const PATIO_INICIAL = 'fondo';
