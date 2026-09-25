/** Las cámaras del renderer pixel, en el orden en que las recorre el botón. La primera es la de arranque. */
import { cenital } from './cenital';
import { cerca } from './cerca';
import { oblicua } from './oblicua';
import type { Camara } from './tipos';

export type { Camara };

export const CAMARAS = [cenital, oblicua, cerca] as Camara[];
export const camaraDe = (id: string | undefined): Camara => CAMARAS.find((c) => c.id === id) ?? CAMARAS[0];
