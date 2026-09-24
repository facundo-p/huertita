/** Aromáticas: mata de hojas anchas o en cojín, romero de agujas, lavanda de espigas, laurel como arbolito. */
import type { Estilo } from '../estilos';
import { MADERA, type Paleta } from '../paleta';
import type { Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

interface Medidas {
  a: number;
  R: number;
  H: number;
}

function arbolito(B: Pincel, { R, H }: Medidas, pal: Paleta, st: Postura): void {
  B.r(-1, -H, 2, H, MADERA);
  B.elipse(st.dx(-H), -H, Math.round(R * 0.8), Math.round(H * 0.45), pal.oo);
  B.elipse(st.dx(-H) - 1, -H - 1, Math.round(R * 0.65), Math.round(H * 0.38), pal.v);
  for (let i = 0; i < 6; i++)
    B.r(Math.round(Math.sin(i * 2.4) * R * 0.5) + st.dx(-H), -H + Math.round(Math.cos(i * 1.7) * H * 0.3), 2, 1, pal.c);
}

function agujas(B: Pincel, { a, H }: Medidas, e: Estilo, pal: Paleta, st: Postura): void {
  const n = 3 + Math.round(a * 4);
  for (let i = 0; i < n; i++) {
    const sx = (i - (n - 1) / 2) * 2.2,
      tx = Math.round(sx * 1.6) + st.dx(-H),
      ty = -H + Math.abs(Math.round(sx));
    B.linea(Math.round(sx * 0.5), 0, tx, ty, MADERA);
    for (let k = 0.25; k <= 1; k += 0.15) {
      const px = Math.round(sx * 0.5 + (tx - sx * 0.5) * k),
        py = Math.round(ty * k);
      B.r(px - 2, py, 5, 1, (k * 10) % 2 < 1 ? pal.v : pal.c);
    }
    if (st.madura && i % 2) B.r(tx, ty + 2, 2, 2, e.florc);
  }
}

function mata(B: Pincel, { a, R, H }: Medidas, e: Estilo, pal: Paleta, st: Postura): void {
  B.elipse(0, -Math.round(H * 0.45), R, Math.max(2, Math.round(H * 0.5)), pal.oo);
  B.elipse(st.dx(-H * 0.5), -Math.round(H * 0.55), Math.max(2, R - 1), Math.max(2, Math.round(H * 0.45)), pal.v);
  const n = 4 + Math.round(a * 8);
  for (let i = 0; i < n; i++) {
    const lx = Math.round(Math.sin(i * 2.4) * R * 0.75) + st.dx(-H * 0.5),
      ly = -Math.round(H * 0.55 + Math.cos(i * 1.9) * H * 0.35);
    if (e.tipo === 'ancha') {
      B.r(lx - 1, ly, 3, 2, pal.c);
      B.r(lx, ly + 2, 1, 1, pal.o);
    } else B.r(lx, ly, 2, 1, pal.c);
  }
}

function espigas(B: Pincel, { a, H }: Medidas, e: Estilo, pal: Paleta, st: Postura): void {
  for (let i = -2; i <= 2; i++) {
    const ex = i * 4 + st.dx(-H - 6),
      eh = Math.round(a * 9);
    B.linea(i * 2, -H + 2, ex, -H - eh, pal.c);
    if (a > 0.7) B.r(ex - 1, -H - eh - 4, 2, 5, st.madura ? e.florc : pal.c);
  }
}

function flores(B: Pincel, { R, H }: Medidas, e: Estilo, pal: Paleta, st: Postura): void {
  for (let i = -1; i <= 1; i++) {
    const fx = i * Math.round(R * 0.55) + st.dx(-H);
    B.r(fx, -H - 3 + Math.abs(i), 1, 4, pal.c);
    B.r(fx - 1, -H - 4 + Math.abs(i), 3, 2, e.florc);
  }
}

/** cuánto sube cada tipo con el crecimiento */
const SUBE: Record<string, number> = { aguja: 22, arbolito: 22, cojin: 7 };

export const aromatica: DibujoDeForma = (B, a, e, pal, st) => {
  const m: Medidas = { a, R: Math.round(3 + a * 9), H: Math.round(3 + a * (SUBE[e.tipo ?? ''] ?? 14)) };
  if (e.tipo === 'arbolito') return arbolito(B, m, pal, st);
  if (e.tipo === 'aguja') return agujas(B, m, e, pal, st);
  mata(B, m, e, pal, st);
  if (e.tipo === 'espiga') espigas(B, m, e, pal, st);
  else if (st.madura && e.florc) flores(B, m, e, pal, st);
};
