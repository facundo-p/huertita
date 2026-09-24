import type { Patio } from '../patio';
import { balcon } from './balcon';
import { fondo } from './fondo';

/**
 * Las plantillas de patio: de dónde sale el patio de una partida nueva. La partida guarda una copia
 * (`mundo.patio`), así que corregir una plantilla no cambia las partidas empezadas. Sumar una: crear
 * el archivo y anotarlo acá.
 */
export const PLANTILLAS: Record<string, Patio> = { fondo, balcon };
export const PLANTILLA_INICIAL = 'fondo';
