/** Plantas altas de una caña: el choclo, con sus hojas largas y sus mazorcas, y el girasol, con su cabeza. */
import type { Estilo } from '../estilos';
import { PAJA, type Paleta } from '../paleta';
import { hojaOval, type Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

function cabezaDeGirasol(B: Pincel, H: number, pal: Paleta, st: Postura): void {
  const cx = st.dx(-H),
    cy = -H - 2,
    rr = st.madura ? 6 : 3;
  if (st.madura)
    for (let i = 0; i < 12; i++)
      B.r(
        cx + Math.round(Math.cos(i * 0.524) * 8) - 1,
        cy + Math.round(Math.sin(i * 0.524) * 8) - 1,
        3,
        3,
        i % 2 ? '#ffd23f' : '#ffb01f',
      );
  B.disco(cx, cy, rr, st.madura ? '#6b3a12' : pal.v);
  if (st.madura) {
    B.disco(cx, cy, 3, '#8a5526');
    B.r(cx - 1, cy - 2, 2, 1, '#c98a3a');
  }
}

function penachoYMazorcas(B: Pincel, a: number, H: number, e: Estilo, pal: Paleta, st: Postura): void {
  if (a > 0.7) for (let i = -2; i <= 2; i++) B.linea(st.dx(-H), -H, st.dx(-H) + i * 2, -H - 5 + Math.abs(i), PAJA);
  if (st.madura)
    for (const [x, h] of [
      [3, 0.45],
      [-4, 0.6],
    ]) {
      const ex = x + st.dx(-H * h),
        ey = -Math.round(H * h);
      B.elipse(ex, ey, 2, 4, pal.c);
      B.elipse(ex, ey, 1, 3, e.tinta);
      B.r(ex, ey - 6, 1, 2, '#c9603a');
    }
}

export const alta: DibujoDeForma = (B, a, e, pal, st) => {
  const H = Math.round(6 + a * 27);
  B.linea(0, 0, st.dx(-H), -H, pal.o, 2);
  B.linea(1, 0, st.dx(-H) + 1, -H, pal.c, 1);
  for (let y = -5, i = 0; y > -H + 3; y -= 5, i++) {
    const lado = i % 2 ? 1 : -1,
      x0 = st.dx(y),
      L = Math.round(4 + a * 6);
    if (e.sol) hojaOval(B, x0 + lado * 5, y, 3, 3, pal);
    else {
      B.linea(x0, y, x0 + lado * L, y - 3, pal.v, 1);
      B.linea(x0 + lado * L, y - 3, x0 + lado * (L + 3), y + 2, pal.c, 1);
      B.linea(x0, y + 1, x0 + lado * (L - 1), y - 1, pal.o, 1);
    }
  }
  if (e.sol) {
    if (a > 0.7) cabezaDeGirasol(B, H, pal, st);
  } else penachoYMazorcas(B, a, H, e, pal, st);
};
