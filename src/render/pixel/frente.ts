/** Lo que va delante de las plantas en las cámaras del patio entero: el árbol, los microtúneles y las mantas. */
import { pincel, type Pincel } from '../../arte';
import type { Escena } from '../contrato';
import type { GeometriaPlana } from './camaras/plano';
import { C, T } from './paleta';

type Arbol = Escena['arboles'][number];

/** [dx, dy, radio, color] de cada mancha de la copa */
const COPA: [number, number, number, string][] = [
  [0, 0, 28, C.copa3],
  [-12, -8, 20, C.copa],
  [10, -4, 18, C.copa],
  [-4, -16, 14, C.copa2],
  [12, -14, 10, C.copa2],
  [-16, 2, 10, C.copa2],
];

function copa(B: Pincel, es: Escena, ax: number, cy: number, sw: number): void {
  const r = B.r;
  COPA.forEach(([dx, dy, rad, col], i) => B.disco(ax + dx + (i > 2 ? sw : 0), cy + dy, rad, col));
  for (let i = 0; i < 26; i++) {
    const lx = ax + Math.round(Math.sin(i * 2.4) * 22) + sw,
      ly = cy - 6 + Math.round(Math.cos(i * 1.3) * 18);
    r(lx, ly, 3, 2, i % 3 ? C.copa4 : C.copa3);
    if (es.estacion === 'otoño' && i % 2) r(lx + 1, ly + 3, 3, 2, i % 4 ? '#ffc233' : '#e0702f');
    if (es.estacion === 'primavera' && i % 5 === 0) r(lx, ly, 2, 2, '#e0c8ff');
  }
}

function ramasPeladas(B: Pincel, ax: number, cy: number): void {
  for (let j = 0; j < 7; j++) {
    const bx = ax + Math.round(Math.sin(j * 1.9) * 18),
      byy = cy - 4 + Math.round(Math.cos(j * 2.3) * 12);
    B.linea(ax + (j % 2 ? 10 : -14), cy + 2, bx, byy, C.tronco, 2);
    B.linea(bx, byy, bx + (j % 2 ? 5 : -5), byy - 7, C.tronco2, 1);
  }
}

function arbol(g: CanvasRenderingContext2D, es: Escena, G: GeometriaPlana, t: number, ar: Arbol): void {
  const B = pincel(g, 0, 0, 1),
    r = B.r,
    q = G.celda(Math.floor(ar.x) + ',' + ar.base)!,
    ax = Math.round(q.x + (ar.x - Math.floor(ar.x)) * T),
    ay = q.y + q.h - 4,
    alto = G.obl ? 58 : 40,
    sw = Math.round(Math.sin(t * 0.3) * 1.5),
    conHojas = es.arbolConHojas || !ar.caduco;
  if (conHojas) {
    g.fillStyle = C.sombra;
    g.beginPath();
    g.ellipse(ax - 22, ay + 2, 44, G.obl ? 20 : 34, 0, 0, 6.3);
    g.fill();
  }
  r(ax - 4, ay - alto, 8, alto, C.tronco);
  r(ax - 4, ay - alto, 3, alto, C.tronco2);
  r(ax - 7, ay - 3, 14, 3, C.tronco);
  B.linea(ax, ay - alto + 8, ax - 16, ay - alto - 8, C.tronco, 3);
  B.linea(ax, ay - alto + 4, ax + 12, ay - alto - 12, C.tronco, 3);
  const cy = ay - alto - 4;
  if (conHojas) copa(B, es, ax, cy, sw);
  else ramasPeladas(B, ax, cy);
}

function tunel(g: CanvasRenderingContext2D, r: Pincel['r'], es: Escena, G: GeometriaPlana, zona: string): void {
  const ks = Object.keys(es.celdas).filter((k) => es.celdas[k].zona === zona);
  if (!ks.length) return;
  let x0 = 1e9,
    x1 = -1,
    top = 1e9,
    bot = -1;
  ks.forEach((k) => {
    const q = G.celda(k)!;
    x0 = Math.min(x0, q.x);
    x1 = Math.max(x1, q.x + q.w);
    top = Math.min(top, q.y - (G.obl ? 20 : 4));
    bot = Math.max(bot, q.y + q.h + (G.obl ? 4 : 2));
  });
  const w = x1 - x0;
  g.fillStyle = 'rgba(255,255,255,0.34)';
  g.fillRect(x0, top, w, bot - top);
  for (let u = 0; u <= w; u += T) r(Math.min(x1 - 2, x0 + u), top, 2, bot - top, C.blanco);
  r(x0, top, w, 2, C.blanco);
  for (let u = 0; u < w; u += 9) r(x0 + u, top + 5 + (u % 4), 5, 1, 'rgba(255,255,255,0.6)');
}

function mantas(g: CanvasRenderingContext2D, r: Pincel['r'], es: Escena, G: GeometriaPlana): void {
  Object.keys(es.celdas).forEach((k) => {
    const c = es.celdas[k];
    if (!es.mantas[c.zona]) return;
    const q = G.celda(k)!,
      yy = q.y - (G.obl ? 6 : 0);
    g.fillStyle = 'rgba(255,255,255,0.46)';
    g.fillRect(q.x, yy, q.w, q.h + (G.obl ? 6 : 0));
    for (let i = 0; i < 4; i++) r(q.x + 3 + i * 8, yy + 4 + (i % 2) * 8, 3, 1, 'rgba(255,255,255,0.9)');
  });
}

export function frente(g: CanvasRenderingContext2D, es: Escena, G: GeometriaPlana, t: number): void {
  const r = pincel(g, 0, 0, 1).r;
  es.arboles.forEach((ar) => arbol(g, es, G, t, ar));
  es.tuneles.forEach((z) => tunel(g, r, es, G, z));
  mantas(g, r, es, G);
}
