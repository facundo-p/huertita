/** Mata baja de hojas redondas: la frutilla. */
import { PERFIL, hojaV, nervadura } from '../hojas';
import { rampaDe, rampaDeHoja } from '../paleta';
import { florcita } from '../pincel';
import type { DibujoDeForma } from './tipos';

const FRUTOS: [number, number][] = [
  [-7, -2],
  [5, -1],
  [-1, -1],
  [9, -3],
];

export const baja: DibujoDeForma = (B, a, e, pal, st) => {
  const R = Math.round(3 + a * 9),
    rampa = rampaDeHoja(pal);
  for (let i = -2; i <= 2; i++) {
    const x = Math.round(i * R * 0.45),
      y = -Math.round(2 + a * 5) + Math.abs(i),
      L = 3.4 + a * 2.8;
    // el pecíolo y tres foliolos con el borde aserrado
    B.linea(0, -1, x, y, rampa[2], 0.25);
    for (const dir of [-90 - 42, -90, -90 + 42]) {
      hojaV(B, x, y, L, L * 0.85, dir, rampa, { ...PERFIL.redonda, festones: 3 });
      nervadura(B, x, y, L * 0.75, dir, rampa[2], 0);
    }
  }
  if (a > 0.6 && !st.madura) florcita(B, 3, -Math.round(3 + a * 6), 1.5, '#fff6e0', '#ffd23f', true);
  if (st.madura)
    for (const [x, y] of FRUTOS) {
      // la frutilla: un corazón rojo con las semillitas, y el capuchón verde
      const r = rampaDe(e.tinta!);
      B.volumen(
        B.mascara()
          .elipse(x, y - 1, 1.9, 1.6)
          .poligono([
            [x - 1.8, y - 0.8],
            [x + 1.8, y - 0.8],
            [x, y + 1.9],
          ]),
        r,
      );
      for (const [dx, dy] of [
        [-0.8, -1.2],
        [0.6, -0.4],
        [-0.2, 0.4],
      ])
        B.r(x + dx, y + dy, 0.25, 0.25, '#ffe9a0');
      for (const dir of [-150, -90, -30]) hojaV(B, x, y - 2.2, 1.9, 0.9, dir, rampaDeHoja(pal), PERFIL.lanza);
    }
};
