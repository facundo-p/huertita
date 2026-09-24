import type { Estilo } from '../estilos';
import type { Paleta } from '../paleta';
import type { Pincel } from '../pincel';

/** Cómo está la planta en este cuadro: si ya dio fruto, si tiene tutor, y cuánto la corre el viento a cada altura. */
export interface Postura {
  madura: boolean;
  tutor: boolean;
  dx(y: number): number;
}

/** Dibuja una planta de una forma, crecida `a` (0.1..1), con su estilo y su paleta ya amarillenta si está mal. */
export type DibujoDeForma = (B: Pincel, a: number, e: Estilo, pal: Paleta, st: Postura) => void;
