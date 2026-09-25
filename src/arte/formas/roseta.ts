/** Hojas desde el suelo: lechuga (rizada), espinaca (lanza), acelga y apio (penca), rúcula y perejil (pluma). */
import { hojaOval, type Pincel } from '../pincel';
import type { Estilo } from '../estilos';
import type { Paleta } from '../paleta';
import type { DibujoDeForma, Postura } from './tipos';

interface Medidas {
  a: number;
  R: number;
  H: number;
}
type Variante = (B: Pincel, m: Medidas, e: Estilo, pal: Paleta, st: Postura) => void;

const rizada: Variante = (B, { R, H }, _e, pal, st) => {
  B.elipse(0, -2, R, Math.max(2, Math.round(R * 0.45)), pal.oo);
  for (let i = -2; i <= 2; i++)
    hojaOval(
      B,
      Math.round(i * R * 0.42) + st.dx(-H * 0.5),
      -Math.round(H * 0.45) + Math.abs(i),
      Math.max(2, Math.round(R * 0.5)),
      Math.max(2, Math.round(H * 0.5)),
      pal,
    );
  B.elipse(st.dx(-H), -Math.round(H * 0.75), Math.max(1, Math.round(R * 0.4)), Math.max(1, Math.round(H * 0.3)), pal.c);
  for (let i = -R + 1; i < R; i += 3) B.r(i + st.dx(-H), -Math.round(H * 0.6) - ((i + 40) % 2), 1, 1, pal.c);
};

const penca: Variante = (B, { a, H }, e, pal, st) => {
  const n = 2 + Math.round(a * 3);
  for (let i = 0; i < n; i++) {
    const ang = (i - (n - 1) / 2) * 0.42,
      tx = Math.round(Math.sin(ang) * H * 0.9) + st.dx(-H),
      ty = -Math.round(Math.cos(ang) * H);
    B.linea(0, -1, Math.round(tx * 0.5), Math.round(ty * 0.55), e.tinta || pal.c, a > 0.5 ? 2 : 1);
    hojaOval(B, tx, ty + 2, Math.max(1, Math.round(2 + a * 2)), Math.max(2, Math.round(2 + a * 4)), pal);
  }
};

const lanza: Variante = (B, { a, R, H }, _e, pal, st) => {
  const n = 3 + Math.round(a * 4);
  for (let i = 0; i < n; i++) {
    const an = (i - (n - 1) / 2) * 0.5,
      x2 = Math.round(Math.sin(an) * R) + st.dx(-H),
      y2 = -Math.round(Math.cos(an) * H * 0.9) - 1;
    B.linea(0, -1, x2, y2, pal.o);
    hojaOval(B, x2, y2, Math.max(1, Math.round(1 + a * 2)), Math.max(1, Math.round(1 + a * 3)), pal);
  }
};

/** tallitos finos con foliolos */
const pluma: Variante = (B, { a, R, H }, _e, pal, st) => {
  const n = 4 + Math.round(a * 5);
  for (let i = 0; i < n; i++) {
    const an = (i - (n - 1) / 2) * 0.36,
      x3 = Math.round(Math.sin(an) * R * 0.9) + st.dx(-H),
      y3 = -Math.round(Math.cos(an) * H);
    B.linea(0, -1, x3, y3, pal.o);
    for (let k = 0.45; k <= 1; k += 0.27) {
      const lx = Math.round(x3 * k),
        ly = Math.round(y3 * k);
      B.r(lx - 1, ly, 3, 2, i % 2 ? pal.v : pal.c);
      B.r(lx, ly - 1, 1, 1, pal.c);
    }
  }
};

const VARIANTES: Record<string, Variante> = { rizada, penca, lanza };
/** cuánto sube cada variante con el crecimiento */
const SUBE: Record<string, number> = { penca: 17, pluma: 13 };

export const roseta: DibujoDeForma = (B, a, e, pal, st) => {
  const R = Math.round((3 + a * 10) * (e.alto ? 0.8 : 1)),
    H = Math.round((3 + a * (SUBE[e.tipo ?? ''] ?? 9)) * (e.alto || 1));
  (VARIANTES[e.tipo ?? ''] ?? pluma)(B, { a, R, H }, e, pal, st);
};
