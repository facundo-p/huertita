/** Hortalizas de raíz: hojas arriba y, crecida, el hombro de la raíz asomando (zanahoria, rabanito, remolacha, nabo). */
import { PERFIL, hojaV, nervadura } from '../hojas';
import { rampaDe, rampaDeHoja } from '../paleta';
import type { Pincel } from '../pincel';
import type { DibujoDeForma } from './tipos';

type Rampa = ReturnType<typeof rampaDeHoja>;

/** zanahoria: tallito fino con foliolos a los lados */
function hojaPluma(B: Pincel, x: number, y: number, dir: number, rampa: Rampa): void {
  const apagada = rampa.map((_, j) => rampa[Math.max(0, j - 1)]);
  B.linea(0, -1, x, y, rampa[2], 0.25);
  for (let k = 0.4; k <= 1.01; k += 0.2)
    for (const lado of [1, -1])
      hojaV(B, x * k, -1 + (y + 1) * k, 2.6, 1.4, dir + lado * 58, k > 0.7 ? rampa : apagada, PERFIL.lanza);
  hojaV(B, x, y, 2.6, 1.4, dir, rampa, PERFIL.lanza);
}

/** remolacha, rabanito, nabo: pecíolo (rojo en la remolacha) y hoja con sus venas */
function hojaDeRaiz(B: Pincel, a: number, x: number, y: number, dir: number, rampa: Rampa, rnervio: Rampa): void {
  const largo = Math.hypot(x, y + 1),
    bx = x * 0.4,
    by = -1 + (y + 1) * 0.4,
    bl = largo * 0.62 + 1.5;
  hojaV(B, 0, -1, largo * 0.45, 1.1, dir, rnervio, PERFIL.fina);
  hojaV(B, bx, by, bl, 2.6 + a * 2.8, dir, rampa, PERFIL.lanza);
  nervadura(B, bx, by, bl * 0.9, dir, rnervio[3], 3);
}

export const raiz: DibujoDeForma = (B, a, e, pal, st) => {
  const rampa = rampaDeHoja(pal),
    rnervio = e.nervio ? rampaDe(e.nervio) : rampa,
    H = Math.round(4 + a * 15),
    n = 3 + Math.round(a * 3);
  // el hombro de la raíz, detrás de las hojas
  if (a > 0.55 && e.tinta) {
    const rx = 2 + (a - 0.5) * 6;
    B.volumen(B.mascara().elipse(0, -rx * 0.14, rx, rx * 0.72), rampaDe(e.tinta));
  }
  for (let i = 0; i < n; i++) {
    const rad = ((i - (n - 1) / 2) * 22.9 * Math.PI) / 180,
      x = Math.sin(rad) * H * 0.8 + st.dx(-H),
      y = -Math.cos(rad) * H,
      dir = (Math.atan2(y + 1, x) * 180) / Math.PI;
    if (e.tipo === 'pluma') hojaPluma(B, x, y, dir, rampa);
    else hojaDeRaiz(B, a, x, y, dir, rampa, rnervio);
  }
};
