/** Flores para los polinizadores: tallos con hojas y, al madurar, la flor (margarita, pompón, estrella) o la capuchina. */
import type { Estilo } from '../estilos';
import { PERFIL, hojaV } from '../hojas';
import { mezcla, rampaDe, rampaDeHoja, type Paleta } from '../paleta';
import { florcita, hojaOval, type Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

const rad = (g: number): number => (g * Math.PI) / 180;

function capuchina(B: Pincel, a: number, e: Estilo, pal: Paleta, st: Postura): void {
  const rampa = rampaDeHoja(pal);
  for (let i = -2; i <= 2; i++) {
    const lx = Math.round(i * (2 + a * 3)),
      ly = -Math.round(2 + a * 7 * (1 - Math.abs(i) * 0.25)),
      r = Math.max(1.2, 1 + a * 2.4);
    // la hoja es un escudo redondo con las venas saliendo del centro
    B.linea(0, -1, lx, ly, rampa[2], 0.25);
    B.volumen(B.mascara().elipse(lx, ly, r, r * 0.9), rampa);
    for (let k = 0; k < 6; k++)
      B.linea(
        lx,
        ly,
        lx + Math.cos(rad(k * 60 + 15)) * r * 0.8,
        ly + Math.sin(rad(k * 60 + 15)) * r * 0.7,
        rampa[2],
        0.25,
      );
  }
  if (st.madura)
    for (const [x, y] of [
      [-6, -9],
      [3, -11],
      [8, -5],
    ]) {
      B.linea(x + st.dx(y) - 1, y + 4, x + st.dx(y), y, rampa[2], 0.25);
      florcita(B, x + st.dx(y), y, 2.2, e.tinta, e.centro, true);
    }
}

function florAbierta(B: Pincel, tx: number, ty: number, e: Estilo): void {
  const t = e.tinta!,
    r = rampaDe(t);
  if (e.pompon) {
    // un pompón: una bola con relieve de florcitas apretadas
    B.volumen(B.mascara().elipse(tx, ty - 1.5, 3.4, 3.2), r);
    for (const [dx, dy] of [
      [-1.4, -2.6],
      [0.8, -3.2],
      [1.6, -1],
      [-0.6, -0.4],
      [-2, -0.6],
    ])
      B.disco(tx + dx, ty + dy, 0.55, r[5]);
    B.disco(tx, ty - 1.6, 0.7, e.centro);
  } else if (e.estrella) florcita(B, tx, ty + 0.5, 2.4, t, e.centro, true);
  else {
    // margarita: pétalos largos alrededor de un centro
    for (let q = 0; q < 12; q++) {
      const an = q * 30;
      hojaV(
        B,
        tx + Math.cos(rad(an)) * 1.5,
        ty - 1 + Math.sin(rad(an)) * 1.5,
        3.3,
        1.6,
        an,
        q % 2 ? r : rampaDe(mezcla(t, '#ffffff', 0.25)),
        PERFIL.lanza,
      );
    }
    B.volumen(B.mascara().elipse(tx, ty - 1, 1.6, 1.6), rampaDe(e.centro || '#ffd23f'));
  }
}

/** las hojitas a lo largo de un tallo de flor */
function hojasDeTallo(B: Pincel, e: Estilo, pal: Paleta, sp: number, tx: number, ty: number, lado: number): void {
  const rampa = rampaDeHoja(pal),
    dir = (Math.atan2(ty + 1, tx - sp) * 180) / Math.PI;
  for (let k = 0.3; k < 0.85; k += 0.27) {
    const mx = sp + (tx - sp) * k,
      my = -1 + (ty + 1) * k;
    if (e.pluma) for (const l of [1, -1]) hojaV(B, mx, my, 3.2, 1.3, dir + l * 60, rampa, PERFIL.lanza);
    else hojaOval(B, mx + lado * 2, my, 2.2, 1.2, pal, false);
  }
}

export const flor: DibujoDeForma = (B, a, e, palDeLaPlanta, st) => {
  const pal = e.pal || palDeLaPlanta,
    rampa = rampaDeHoja(pal),
    H = Math.round((4 + a * 15) * (e.alto || 1)),
    n = e.n || 3;
  if (e.escudo) return capuchina(B, a, e, pal, st);
  for (let i = 0; i < n; i++) {
    const sp = i - (n - 1) / 2,
      tx = Math.round(sp * (3 + a * 3)) + st.dx(-H),
      ty = -H + Math.abs(Math.round(sp * 2));
    B.linea(sp, -1, tx, ty, rampa[2], 0.5);
    B.linea(sp - 0.25, -1, tx - 0.25, ty, rampa[4], 0.25);
    hojasDeTallo(B, e, pal, sp, tx, ty, i % 2 ? 1 : -1);
    if (st.madura) florAbierta(B, tx, ty, e);
    else if (a > 0.6) B.volumen(B.mascara().elipse(tx, ty, 1.2, 1.2), rampa);
  }
};
