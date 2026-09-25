/** Hortalizas de fruto: un tallo con hojas alternas, flores y, al madurar, los frutos (tomate, pimiento, ají, berenjena). */
import type { Estilo } from '../estilos';
import { mezcla, CANA, MADERA, PAJA, type Paleta } from '../paleta';
import { florcita, hojaOval, type Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

/** dónde cuelgan los frutos: [x, altura relativa] */
const FRUTOS: [number, number][] = [
  [-5, 0.35],
  [4, 0.5],
  [-2, 0.68],
  [6, 0.78],
];

function fruto(B: Pincel, e: Estilo, pal: Paleta, fx: number, fy: number, j: number): void {
  const t = e.tinta!,
    os = mezcla(t, '#000000', 0.25);
  if (e.fr === 'bola') {
    B.disco(fx, fy, 3, os);
    B.disco(fx, fy - 1, 2, t);
    B.r(fx - 1, fy - 2, 1, 1, '#ffffff');
    B.r(fx, fy - 3, 1, 1, pal.o);
  } else if (e.fr === 'largo') {
    B.r(fx - 2, fy - 2, 4, 6, os);
    B.r(fx - 2, fy - 2, 3, 5, j % 2 ? t : '#d9482b');
    B.r(fx - 1, fy - 3, 2, 1, pal.o);
  } else if (e.fr === 'fino') {
    B.linea(fx, fy - 2, fx + (j % 2 ? 1 : -1), fy + 4, t, 1);
    B.r(fx, fy - 3, 1, 1, pal.o);
  } else {
    B.elipse(fx, fy + 1, 2, 4, os);
    B.elipse(fx, fy, 2, 3, t);
    B.r(fx - 1, fy - 1, 1, 2, '#9a6ad0');
    B.r(fx - 1, fy - 4, 3, 1, pal.o);
  }
}

function hojas(B: Pincel, a: number, H: number, W: number, pal: Paleta, st: Postura): void {
  for (let i = 0, y = -4; y > -H; y -= 4, i++) {
    const lado = i % 2 ? 1 : -1,
      w = Math.round(W * (0.55 + 0.45 * Math.sin((-y / H) * 3.1))),
      x = lado * Math.round(w * 0.6) + st.dx(y);
    B.linea(st.dx(y), y, x, y - 1, pal.o);
    hojaOval(B, x, y - 2, Math.max(2, Math.round(w * 0.55)), Math.max(1, Math.round(1 + a * 2)), pal);
    if (st.tutor && i % 3 === 1) B.r(st.dx(y), y, 8, 1, PAJA);
  }
}

export const mata: DibujoDeForma = (B, a, e, pal, st) => {
  const H = Math.round(5 + a * 22),
    W = Math.round(3 + a * 8);
  if (st.tutor) {
    B.r(7, -30, 2, 30, MADERA);
    B.r(7, -30, 1, 30, CANA);
  }
  B.linea(0, 0, st.dx(-H), -H, pal.oo, a > 0.5 ? 2 : 1);
  hojas(B, a, H, W, pal, st);
  hojaOval(B, st.dx(-H), -H - 1, Math.max(2, Math.round(W * 0.5)), 2, pal);
  if (a > 0.62 && !st.madura)
    for (let i = 0; i < 3; i++)
      florcita(
        B,
        (i - 1) * 4 + st.dx(-H * 0.7),
        -Math.round(H * (0.55 + i * 0.13)),
        1,
        e.florc || '#ffe34a',
        '#ffffff',
        true,
      );
  if (st.madura && !e.sinfruto)
    FRUTOS.forEach(([x, h], j) => fruto(B, e, pal, x + st.dx(-H * h), -Math.round(H * h), j));
};
