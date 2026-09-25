/** Desde la galería, mirando al norte: las filas se achatan y el paredón se levanta. */
import { fondoDelPatio } from '../fondo';
import { frente } from '../frente';
import { geometriaPlana, type GeometriaPlana } from './plano';
import type { Camara } from './tipos';

export const oblicua: Camara<GeometriaPlana> = {
  id: 'oblicua',
  etiqueta: 'Desde la galería',
  geometria: (es) => geometriaPlana(es, true),
  fondo: fondoDelPatio,
  delante: frente,
};
