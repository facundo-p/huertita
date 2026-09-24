import type { Escena } from '../../contrato';
import type { Geometria } from '../geometria';

/**
 * Una cámara: cómo se reparte el patio en la pantalla y qué se dibuja además de las plantas. Una
 * cámara nueva es un archivo que cumple esto y se anota en `camaras/index.ts`.
 */
export interface Camara<G extends Geometria = Geometria> {
  id: string;
  /** cómo se la nombra en el botón */
  etiqueta: string;
  geometria(es: Escena): G;
  /** lo quieto: se pinta una vez por foto */
  fondo(g: CanvasRenderingContext2D, es: Escena, G: G): void;
  /** en cada cuadro, antes de las plantas */
  debajo?(g: CanvasRenderingContext2D, es: Escena, G: G, t: number): void;
  /** en cada cuadro, después de las plantas */
  delante?(g: CanvasRenderingContext2D, es: Escena, G: G, t: number): void;
}
