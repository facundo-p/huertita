/** Hortalizas de fruto: un tallo con hojas alternas, flores y, al madurar, los frutos (tomate, pimiento, ají, berenjena). */
import type { Estilo } from '../estilos';
import { PERFIL, hojaV, nervadura } from '../hojas';
import { rampaDe, rampaDeHoja, type Paleta, type Rampa } from '../paleta';
import { florcita, type Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

/** dónde cuelgan los frutos: [x, altura relativa] */
const FRUTOS: [number, number][] = [
  [-5, 0.35],
  [4, 0.5],
  [-2, 0.68],
  [6, 0.78],
];

const RAMPA_MADERA = rampaDe('#8a5526');

/** cáliz: cinco puntitas verdes que abrazan el fruto */
function caliz(B: Pincel, x: number, y: number, r: number, rampa: Rampa): void {
  for (let k = 0; k < 5; k++) {
    const an = ((-90 + (k - 2) * 38) * Math.PI) / 180;
    B.linea(x, y, x + Math.cos(an) * r, y + Math.sin(an) * r + 0.25, rampa[4], 0.25);
  }
}

function fruto(B: Pincel, e: Estilo, pal: Paleta, fx: number, fy: number, j: number): void {
  const t = e.tinta!,
    r = rampaDe(t),
    verde = rampaDeHoja(pal);
  if (e.fr === 'bola') {
    B.volumen(B.mascara().elipse(fx, fy, 3.2, 3.1), r);
    B.r(fx - 1.5, fy - 1.75, 0.5, 0.5, '#fff8ec');
    caliz(B, fx, fy - 3, 1.7, verde);
  } else if (e.fr === 'largo') {
    // pimiento: cuerpo alargado, más ancho arriba
    const rp = rampaDe(j % 2 ? t : '#d9482b');
    B.volumen(
      B.mascara()
        .poligono([
          [fx - 2.1, fy - 2],
          [fx + 2.1, fy - 2],
          [fx + 2.3, fy + 0.4],
          [fx + 1.1, fy + 3.8],
          [fx - 1.1, fy + 3.8],
          [fx - 2.3, fy + 0.4],
        ])
        .elipse(fx, fy - 1.6, 2.1, 0.9),
      rp,
    );
    B.r(fx - 0.5, fy - 3, 1, 1, verde[2]);
  } else if (e.fr === 'fino') {
    // ají: un cuernito finito que cuelga
    hojaV(B, fx, fy - 2, 6.5, 1.5, 90 + (j % 2 ? 8 : -8), r, PERFIL.lanza);
    B.r(fx - 0.25, fy - 3, 0.75, 1, verde[2]);
  } else {
    // berenjena: gota morada con tapita verde
    B.volumen(B.mascara().elipse(fx, fy + 0.8, 2.3, 3.9), r);
    B.volumen(B.mascara().elipse(fx, fy - 3.1, 2.1, 0.9), verde);
    B.r(fx - 1.25, fy - 1, 0.5, 2, '#d7b6f2');
  }
}

/** el tallo, que se mece con el viento: tramos de dos unidades */
function tallo(B: Pincel, H: number, a: number, pal: Paleta, st: Postura): void {
  const r = rampaDeHoja(pal),
    g = a > 0.5 ? 1.25 : 0.75;
  for (let y = 0; y > -H; y -= 2) {
    const x0 = st.dx(y),
      x1 = st.dx(Math.max(-H, y - 2));
    B.linea(x0, y, x1, Math.max(-H, y - 2), r[2], g);
    B.linea(x0 - 0.25, y, x1 - 0.25, Math.max(-H, y - 2), r[4], 0.25);
  }
}

/** una hoja compuesta: raquis y foliolos de a pares, con el foliolo de la punta */
function hojaCompuesta(B: Pincel, x: number, y: number, ang: number, largo: number, a: number, rampa: Rampa): void {
  const rad = (ang * Math.PI) / 180,
    ex = x + Math.cos(rad) * largo,
    ey = y + Math.sin(rad) * largo,
    pares = largo > 9 ? 3 : 2,
    fl = 3.8 + a * 2.6,
    fa = 2.4 + a * 1.8;
  B.linea(x, y, ex, ey, rampa[2], 0.25);
  for (let k = 1; k <= pares; k++) {
    const u = k / (pares + 1),
      cx = x + (ex - x) * u,
      cy = y + (ey - y) * u;
    for (const lado of [1, -1]) {
      hojaV(B, cx, cy, fl, fa, ang + lado * 62, rampa, PERFIL.oval);
      nervadura(B, cx, cy, fl * 0.8, ang + lado * 62, rampa[2], 0);
    }
  }
  hojaV(B, ex, ey, fl * 1.1, fa * 1.2, ang, rampa, PERFIL.oval);
  nervadura(B, ex, ey, fl * 0.9, ang, rampa[2], 0);
}

function hojas(B: Pincel, a: number, H: number, W: number, pal: Paleta, st: Postura): void {
  const rampa = rampaDeHoja(pal);
  for (let i = 0, y = -4; y > -H; y -= 5, i++) {
    const lado = i % 2 ? 1 : -1,
      w = Math.round(W * (0.55 + 0.45 * Math.sin((-y / H) * 3.1))),
      x = st.dx(y);
    hojaCompuesta(B, x, y, lado > 0 ? -22 : -158, Math.max(4, w * 1.35), a, rampa);
    if (st.tutor && i % 3 === 1) B.r(st.dx(y), y, 8, 0.5, '#f0d071');
  }
}

export const mata: DibujoDeForma = (B, a, e, pal, st) => {
  const H = Math.round(5 + a * 22),
    W = Math.round(3 + a * 8);
  if (st.tutor) {
    B.volumen(
      B.mascara().poligono([
        [7, -31],
        [8.3, -31],
        [8.3, 0],
        [7, 0],
      ]),
      RAMPA_MADERA,
    );
    for (const y of [-9, -19, -27]) B.r(7, y, 6, 0.5, '#f0d071');
  }
  tallo(B, H, a, pal, st);
  hojas(B, a, H, W, pal, st);
  hojaCompuesta(B, st.dx(-H), -H, -90, Math.max(3, W * 0.8), a, rampaDeHoja(pal));
  if (a > 0.62 && !st.madura)
    for (let i = 0; i < 3; i++)
      florcita(
        B,
        (i - 1) * 4 + st.dx(-H * 0.7),
        -Math.round(H * (0.55 + i * 0.13)),
        1.6,
        e.florc || '#ffe34a',
        '#c8741a',
        true,
      );
  if (st.madura && !e.sinfruto)
    FRUTOS.forEach(([x, h], j) => fruto(B, e, pal, x + st.dx(-H * h), -Math.round(H * h), j));
};
