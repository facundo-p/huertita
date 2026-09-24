/** Hortalizas de raíz: hojas arriba y, crecida, el hombro de la raíz asomando (zanahoria, rabanito, remolacha, nabo). */
import { mezcla } from '../paleta';
import { hojaOval } from '../pincel';
import type { DibujoDeForma } from './tipos';

export const raiz: DibujoDeForma = (B, a, e, pal, st) => {
  const H = Math.round(4 + a * 15),
    n = 3 + Math.round(a * 3);
  for (let i = 0; i < n; i++) {
    const an = (i - (n - 1) / 2) * 0.4,
      x = Math.round(Math.sin(an) * H * 0.8) + st.dx(-H),
      y = -Math.round(Math.cos(an) * H);
    B.linea(0, -1, x, y, e.nervio || pal.o);
    if (e.tipo === 'pluma')
      for (let k = 0.4; k <= 1; k += 0.2) {
        B.r(Math.round(x * k) - 1, Math.round(y * k), 3, 1, pal.v);
        B.r(Math.round(x * k), Math.round(y * k) - 1, 1, 1, pal.c);
      }
    else hojaOval(B, x, y + 1, Math.max(1, Math.round(1 + a * 2)), Math.max(2, Math.round(2 + a * 3)), pal);
  }
  if (a > 0.55 && e.tinta) {
    const w = Math.round(2 + (a - 0.5) * 6);
    B.elipse(0, 0, w, 2, mezcla(e.tinta, '#000000', 0.2));
    B.elipse(0, -1, w - 1, 1, e.tinta);
    B.r(-w + 1, -2, 2, 1, mezcla(e.tinta, '#ffffff', 0.45));
  }
};
