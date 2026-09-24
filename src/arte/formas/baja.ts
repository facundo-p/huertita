/** Mata baja de hojas redondas: la frutilla. */
import { florcita } from '../pincel';
import type { DibujoDeForma } from './tipos';

const FRUTOS: [number, number][] = [
  [-7, -2],
  [5, -1],
  [-1, -1],
  [9, -3],
];

export const baja: DibujoDeForma = (B, a, e, pal, st) => {
  const R = Math.round(3 + a * 9);
  for (let i = -2; i <= 2; i++) {
    const x = Math.round(i * R * 0.45),
      y = -Math.round(2 + a * 5) + Math.abs(i),
      rad = Math.max(1, Math.round(1 + a * 1.5));
    B.linea(0, -1, x, y, pal.o);
    B.disco(x - 1, y, rad, pal.v);
    B.disco(x + 1, y, rad, pal.o);
    B.disco(x, y - 1, rad, pal.c);
  }
  if (a > 0.6 && !st.madura) florcita(B, 3, -Math.round(3 + a * 6), 1, '#fff6e0', '#ffd23f', true);
  if (st.madura)
    for (const [x, y] of FRUTOS) {
      B.r(x - 1, y - 2, 3, 2, e.tinta);
      B.r(x, y, 1, 1, e.tinta);
      B.r(x - 1, y - 3, 3, 1, pal.o);
      B.r(x, y - 2, 1, 1, '#ffd0a0');
    }
};
