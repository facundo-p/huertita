/** Plantas altas de una caña: el choclo, con sus hojas largas y sus mazorcas, y el girasol, con su cabeza. */
import type { Estilo } from '../estilos';
import { PERFIL, hojaV, nervadura } from '../hojas';
import { PAJA, rampaDe, rampaDeHoja, type Paleta } from '../paleta';
import type { Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

const RAMPA_PAJA = rampaDe(PAJA);

/** el tallo, que se mece con el viento: tramos de dos unidades, más grueso abajo */
function tallo(B: Pincel, H: number, pal: Paleta, st: Postura): void {
  const r = rampaDeHoja(pal);
  for (let y = 0; y > -H; y -= 2) {
    const y1 = Math.max(-H, y - 2),
      g = y > -H * 0.5 ? 2 : 1.5;
    B.linea(st.dx(y), y, st.dx(y1), y1, r[2], g);
    B.linea(st.dx(y) - 0.5, y, st.dx(y1) - 0.5, y1, r[4], 0.5);
  }
}

function cabezaDeGirasol(B: Pincel, H: number, pal: Paleta, st: Postura): void {
  const cx = st.dx(-H),
    cy = -H - 2.5,
    rampa = rampaDeHoja(pal);
  if (!st.madura) {
    B.volumen(B.mascara().elipse(cx, cy, 3, 3), rampa);
    // sépalos verdes alrededor del capullo
    for (let k = 0; k < 8; k++) {
      const an = k * 45 + 10;
      hojaV(
        B,
        cx + Math.cos((an * Math.PI) / 180) * 2,
        cy + Math.sin((an * Math.PI) / 180) * 2,
        2.8,
        1.3,
        an,
        rampa,
        PERFIL.lanza,
      );
    }
    return;
  }
  const petalos = rampaDe('#ffc233'),
    petalos2 = rampaDe('#ff9f1f');
  // dos anillos de pétalos, el de atrás más oscuro
  for (let k = 0; k < 14; k++)
    hojaV(
      B,
      cx + Math.cos(((k * 25.7 + 12) * Math.PI) / 180) * 4,
      cy + Math.sin(((k * 25.7 + 12) * Math.PI) / 180) * 4,
      4.4,
      2,
      k * 25.7 + 12,
      petalos2,
      PERFIL.lanza,
    );
  for (let k = 0; k < 14; k++)
    hojaV(
      B,
      cx + Math.cos((k * 25.7 * Math.PI) / 180) * 3.6,
      cy + Math.sin((k * 25.7 * Math.PI) / 180) * 3.6,
      4.6,
      2.1,
      k * 25.7,
      petalos,
      PERFIL.lanza,
    );
  B.volumen(B.mascara().elipse(cx, cy, 4.2, 4.2), rampaDe('#6b3a12'));
  // las pepitas, en espiral
  for (let k = 0; k < 9; k++) {
    const an = k * 2.4,
      rr = 0.5 + k * 0.35;
    B.r(cx + Math.cos(an) * rr - 0.25, cy + Math.sin(an) * rr - 0.25, 0.5, 0.5, k % 2 ? '#c98a3a' : '#2a160c');
  }
}

function penachoYMazorcas(B: Pincel, a: number, H: number, e: Estilo, pal: Paleta, st: Postura): void {
  const x0 = st.dx(-H);
  // el penacho: espigas finas que se abren desde la punta
  if (a > 0.7)
    for (let i = -2; i <= 2; i++) {
      B.linea(x0, -H, x0 + i * 1.6, -H - 5 + Math.abs(i) * 0.8, RAMPA_PAJA[3], 0.25);
      B.linea(x0 + i * 1.6, -H - 5 + Math.abs(i) * 0.8, x0 + i * 2, -H - 4 + Math.abs(i), RAMPA_PAJA[5], 0.25);
    }
  if (st.madura)
    for (const [x, h] of [
      [3, 0.45],
      [-4, 0.6],
    ]) {
      const ex = x + st.dx(-H * h),
        ey = -Math.round(H * h);
      // la mazorca amarilla con granos, entre dos chalas verdes, y los pelos arriba
      B.volumen(B.mascara().elipse(ex, ey, 2.1, 4.1), rampaDe(e.tinta || '#f0c93a'));
      for (let g = 0; g < 4; g++) B.r(ex - 1.25, ey - 2.5 + g * 1.4, 0.5, 0.5, '#fff3b0');
      for (let g = 0; g < 4; g++) B.r(ex + 0.5, ey - 1.8 + g * 1.4, 0.5, 0.5, '#fff3b0');
      hojaV(B, ex - 0.4, ey + 3.6, 6.5, 2.1, -105, rampaDeHoja(pal), PERFIL.lanza);
      hojaV(B, ex + 0.4, ey + 3.6, 6.5, 2.1, -75, rampaDeHoja(pal), PERFIL.lanza);
      for (let g = -1; g <= 1; g++) B.linea(ex, ey - 4, ex + g * 0.9, ey - 6.2, '#c9603a', 0.25);
    }
}

export const alta: DibujoDeForma = (B, a, e, pal, st) => {
  const H = Math.round(6 + a * 27),
    rampa = rampaDeHoja(pal);
  tallo(B, H, pal, st);
  for (let y = -5, i = 0; y > -H + 3; y -= 5, i++) {
    const lado = i % 2 ? 1 : -1,
      x0 = st.dx(y),
      L = 4 + a * 6;
    if (e.sol) {
      // girasol: hojas anchas en forma de corazón
      hojaV(B, x0, y, 3 + a * 3.5, 2.8 + a * 3, lado > 0 ? -20 : -160, rampa, PERFIL.oval);
      nervadura(B, x0, y, 2.6 + a * 3, lado > 0 ? -20 : -160, rampa[2], 2);
    } else {
      // choclo: hoja larga que sube y se arquea hacia afuera
      const ang = lado > 0 ? -38 : -142,
        rad = (ang * Math.PI) / 180,
        mx = x0 + Math.cos(rad) * L * 0.8,
        my = y + Math.sin(rad) * L * 0.8;
      hojaV(B, x0, y, L * 0.85, 2.2, ang, rampa, PERFIL.fina);
      hojaV(B, mx, my, L * 0.8, 1.8, lado > 0 ? 18 : 162, rampa, PERFIL.lanza);
      nervadura(B, x0, y, L * 0.7, ang, rampa[5], 0);
    }
  }
  if (e.sol) {
    if (a > 0.7) cabezaDeGirasol(B, H, pal, st);
  } else penachoYMazorcas(B, a, H, e, pal, st);
};
