/** Desde arriba: el patio como un plano, cada celda cuadrada. */
import { fondoDelPatio } from '../fondo';
import { frente } from '../frente';
import { geometriaPlana, type GeometriaPlana } from './plano';
import type { Camara } from './tipos';

export const cenital: Camara<GeometriaPlana> = {
  id: 'cenital',
  etiqueta: 'Desde arriba',
  geometria: (es) => geometriaPlana(es, false),
  fondo: fondoDelPatio,
  delante: frente,
};
