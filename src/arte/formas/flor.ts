/** Flores para los polinizadores: tallos con hojas y, al madurar, la flor (margarita, pompón, estrella) o la capuchina. */
import type { Estilo } from '../estilos';
import { mezcla, type Paleta } from '../paleta';
import { florcita, hojaOval, type Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

function capuchina(B: Pincel, a: number, e: Estilo, pal: Paleta, st: Postura): void {
  for (let i = -2; i <= 2; i++) {
    const lx = Math.round(i * (2 + a * 3)),
      ly = -Math.round(2 + a * 7 * (1 - Math.abs(i) * 0.25));
    B.linea(0, -1, lx, ly, pal.c);
    B.disco(lx, ly, Math.max(1, Math.round(1 + a * 2)), pal.v);
    B.r(lx, ly, 1, 1, pal.c);
  }
  if (st.madura)
    for (const [x, y] of [
      [-6, -9],
      [3, -11],
      [8, -5],
    ])
      florcita(B, x + st.dx(y), y, 2, e.tinta, e.centro);
}

function florAbierta(B: Pincel, tx: number, ty: number, e: Estilo): void {
  const t = e.tinta!;
  if (e.pompon) {
    B.disco(tx, ty - 1, 3, mezcla(t, '#000000', 0.2));
    B.disco(tx, ty - 2, 2, t);
    B.r(tx - 1, ty - 3, 2, 1, e.centro);
  } else if (e.estrella) florcita(B, tx, ty + 1, 2, t, e.centro, true);
  else {
    for (let q = 0; q < 8; q++)
      B.r(
        tx + Math.round(Math.cos(q * 0.785) * 3),
        ty - 1 + Math.round(Math.sin(q * 0.785) * 3),
        2,
        2,
        q % 2 ? t : mezcla(t, '#ffffff', 0.25),
      );
    B.disco(tx, ty - 1, 1, e.centro);
  }
}

export const flor: DibujoDeForma = (B, a, e, palDeLaPlanta, st) => {
  const pal = e.pal || palDeLaPlanta,
    H = Math.round((4 + a * 15) * (e.alto || 1)),
    n = e.n || 3;
  if (e.escudo) return capuchina(B, a, e, pal, st);
  for (let i = 0; i < n; i++) {
    const sp = i - (n - 1) / 2,
      tx = Math.round(sp * (3 + a * 3)) + st.dx(-H),
      ty = -H + Math.abs(Math.round(sp * 2));
    B.linea(Math.round(sp), -1, tx, ty, pal.o);
    for (let k = 0.3; k < 0.85; k += 0.27) {
      const mx = Math.round(sp + (tx - sp) * k),
        my = Math.round(ty * k);
      if (e.pluma) {
        B.r(mx - 2, my, 5, 1, pal.v);
        B.r(mx - 1, my - 1, 3, 1, pal.c);
      } else hojaOval(B, mx + (i % 2 ? 2 : -2), my, 2, 1, pal, false);
    }
    if (st.madura) florAbierta(B, tx, ty, e);
    else if (a > 0.6) B.disco(tx, ty, 1, pal.c);
  }
};
