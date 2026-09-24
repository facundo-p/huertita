/** Un dibujo por forma. Sumar una forma: su archivo acá, su nombre en `FORMAS_DE_PLANTA` (estilos.ts). */
import type { Forma } from '../estilos';
import { alta } from './alta';
import { aromatica } from './aromatica';
import { baja } from './baja';
import { flor } from './flor';
import { mata } from './mata';
import { raiz } from './raiz';
import { rastrera } from './rastrera';
import { repollo } from './repollo';
import { roseta } from './roseta';
import type { DibujoDeForma } from './tipos';
import { trepadora } from './trepadora';
import { varas } from './varas';

export type { DibujoDeForma, Postura } from './tipos';

export const FORMAS: Record<Forma, DibujoDeForma> = {
  roseta,
  repollo,
  raiz,
  varas,
  mata,
  baja,
  rastrera,
  trepadora,
  aromatica,
  alta,
  flor,
};
