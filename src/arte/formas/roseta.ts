/** Hojas desde el suelo: lechuga (rizada), espinaca (lanza), acelga y apio (penca), rúcula y perejil (pluma). */
import { PERFIL, hojaV, nervadura } from '../hojas';
import type { Estilo } from '../estilos';
import { mezcla, rampaDe, rampaDeHoja, type Paleta, type Rampa } from '../paleta';
import type { Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

interface Medidas {
  a: number;
  R: number;
  H: number;
}
type Variante = (B: Pincel, m: Medidas, e: Estilo, pal: Paleta, st: Postura) => void;

/** una rampa más clara que la de la hoja: el corazón de la lechuga, los brotes nuevos */
const rampaClara = (pal: Paleta): Rampa =>
  rampaDeHoja({ v: pal.c, c: mezcla(pal.c, '#fff6b8', 0.45), o: pal.v, oo: pal.o });

const rizada: Variante = (B, { R, H }, _e, pal, st) => {
  const oscura = rampaDeHoja({ v: pal.o, c: pal.v, o: pal.oo, oo: mezcla(pal.oo, '#0c1a3a', 0.4) }),
    media = rampaDeHoja(pal),
    clara = rampaClara(pal),
    capas = [oscura, media, clara],
    y0 = -R * 0.2,
    x0 = st.dx(-H * 0.5);
  // de atrás hacia adelante: las que apuntan arriba (más oscuras), las de los costados y, al frente, las que caen (más claras)
  const hojas: [number, number, number][] = [
    [-90, 1, 0],
    [-128, 0.95, 0],
    [-52, 0.95, 0],
    [-152, 1, 1],
    [-28, 1, 1],
    [-172, 0.9, 2],
    [-8, 0.9, 2],
  ];
  hojas.forEach(([ang, sz, capa], i) => {
    // las que apuntan arriba son más cortas que las que caen a los lados: la lechuga es ancha y baja
    const rad = (ang * Math.PI) / 180,
      L = sz * (R * 1.25 * Math.abs(Math.cos(rad)) + H * 1.1 * Math.abs(Math.sin(rad))),
      bx = x0 + Math.cos(rad) * R * 0.08,
      rampa = capas[capa];
    hojaV(B, bx, y0, L, L * 0.95, ang, rampa, capa ? { ...PERFIL.ancha, festones: 3 } : PERFIL.redonda, (i % 3) / 3);
    nervadura(B, bx, y0, L * 0.78, ang, rampa[2], 4);
  });
  for (const [ang, sz] of [
    [-104, 0.5],
    [-76, 0.5],
    [-90, 0.38],
  ]) {
    hojaV(B, x0, y0 - R * 0.12, H * sz * 1.7, H * sz * 1.5, ang, clara, { ...PERFIL.ancha, festones: 2 });
    nervadura(B, x0, y0 - R * 0.12, H * sz * 1.3, ang, clara[2], 2);
  }
};

const penca: Variante = (B, { a, H }, e, pal, st) => {
  const rampa = rampaDeHoja(pal),
    rpenca = rampaDe(e.tinta || pal.c),
    n = 2 + Math.round(a * 3);
  for (let i = 0; i < n; i++) {
    const ang = (i - (n - 1) / 2) * 24,
      rad = (ang * Math.PI) / 180,
      tx = Math.sin(rad) * H * 0.9 + st.dx(-H),
      ty = -Math.cos(rad) * H,
      dir = (Math.atan2(ty + 1, tx) * 180) / Math.PI,
      largo = Math.hypot(tx, ty + 1);
    // la penca clara y, encima, la hoja
    hojaV(B, 0, -1, largo * 0.86, a > 0.5 ? 1.7 : 1.1, dir, rpenca, PERFIL.fina);
    const bx = tx * 0.42,
      by = -1 + (ty + 1) * 0.42,
      bl = largo * 0.62 + 1,
      bw = 3 + a * 5.5;
    hojaV(B, bx, by, bl, bw, dir, rampa, { p: 0.85, filo: 0.7 });
    nervadura(B, bx, by, bl * 0.85, dir, rampa[2], 3);
  }
};

const lanza: Variante = (B, { a, R, H }, _e, pal, st) => {
  const rampa = rampaDeHoja(pal),
    n = 3 + Math.round(a * 4);
  for (let i = 0; i < n; i++) {
    const rad = ((i - (n - 1) / 2) * 28.6 * Math.PI) / 180,
      tx = Math.sin(rad) * R + st.dx(-H),
      ty = -Math.cos(rad) * H * 0.9 - 1,
      dir = (Math.atan2(ty + 1, tx) * 180) / Math.PI,
      largo = Math.hypot(tx, ty + 1);
    B.linea(0, -1, tx * 0.4, -1 + (ty + 1) * 0.4, rampa[2], 0.25);
    hojaV(B, tx * 0.35, -1 + (ty + 1) * 0.35, largo * 0.7 + 1, 2.2 + a * 3.4, dir, rampa, PERFIL.oval);
    nervadura(B, tx * 0.35, -1 + (ty + 1) * 0.35, largo * 0.6, dir, rampa[2], 2);
  }
};

/** tallitos finos con foliolos */
const pluma: Variante = (B, { a, R, H }, _e, pal, st) => {
  const rampa = rampaDeHoja(pal),
    clara = rampaClara(pal),
    n = 4 + Math.round(a * 5);
  for (let i = 0; i < n; i++) {
    const rad = ((i - (n - 1) / 2) * 20.6 * Math.PI) / 180,
      tx = Math.sin(rad) * R * 0.9 + st.dx(-H),
      ty = -Math.cos(rad) * H,
      dir = (Math.atan2(ty + 1, tx) * 180) / Math.PI,
      r = i % 2 ? rampa : clara;
    B.linea(0, -1, tx, ty, rampa[2], 0.25);
    for (let k = 0.45; k <= 1.01; k += 0.27) {
      const lx = tx * k,
        ly = -1 + (ty + 1) * k;
      for (const lado of [1, -1]) hojaV(B, lx, ly, 3, 1.7, dir + lado * 55, r, PERFIL.lanza);
    }
    hojaV(B, tx, ty, 2.8, 1.6, dir, r, PERFIL.lanza);
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
