/**
 * Dónde cae cada cosa en la pantalla. Cada cámara arma su geometría a partir de la escena; lo demás
 * del renderer pregunta por acá y no sabe qué cámara está mirando.
 */
import type { CeldaDeEscena, CeldaId } from '../contrato';

/** Una celda en la pantalla: su recuadro, dónde apoya la planta (bx, by) y a qué escala se dibuja. */
export interface CeldaEnPantalla {
  x: number;
  y: number;
  w: number;
  h: number;
  bx: number;
  by: number;
  s: number;
  /** en el corte de cerca: si es la hilera del frente */
  frente?: boolean;
}

/** Lo que cambia de las plantas según desde dónde se las mire. */
export interface ComoSeVenLasPlantas {
  /** sombrita en el piso bajo cada planta */
  sombra: boolean;
  /** el cartelito rojo de plaga */
  avisoDePlaga: boolean;
  /** cuánto más arriba va la flecha de trasplante */
  alturaDeFlecha: number;
  /** en la almaciguera: separación y escala de los plantines de una bandeja */
  bandeja: { paso: number; escala: number };
  /** el número de plantines va abajo de la planta, y no arriba de la celda */
  numeroAbajo: boolean;
  /** dónde apoya la planta: las macetas la levantan un poco */
  apoyo(c: CeldaDeEscena, q: CeldaEnPantalla): number;
  /** la almaciguera vista de lejos: plantas más chicas */
  chica(c: CeldaDeEscena): boolean;
  /** un velo de aire delante de la hilera de atrás, antes de la primera planta del frente */
  bruma: boolean;
}

export interface Geometria {
  /** id de la cámara */
  cam: string;
  W: number;
  H: number;
  celda(k: CeldaId): CeldaEnPantalla | null;
  /** la celda bajo un punto de la pantalla */
  hit(px: number, py: number): CeldaId | null;
  /** el recuadro donde van las capas de información (sol, tinte, selección) */
  marco(q: CeldaEnPantalla): { x: number; y: number; w: number; h: number };
  plantas: ComoSeVenLasPlantas;
  /** si se ve el humito de la compostera */
  humo: boolean;
}

/** "x,y" → [x, y] */
export const xyDe = (k: string): [number, number] => {
  const [x, y] = k.split(',');
  return [+x, +y];
};
