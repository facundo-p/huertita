/** Lo que va delante de las plantas en las cámaras del patio entero: el árbol, los microtúneles y las mantas. */
import { pincel, type Pincel } from '../../arte';
import type { Escena } from '../contrato';
import type { GeometriaPlana } from './camaras/plano';
import { pegarArbol } from './arbol';
import { C, T } from './paleta';

type Arbol = Escena['arboles'][number];

function arbol(g: CanvasRenderingContext2D, es: Escena, G: GeometriaPlana, t: number, ar: Arbol): void {
  const q = G.celda(Math.floor(ar.x) + ',' + ar.base)!,
    ax = Math.round(q.x + (ar.x - Math.floor(ar.x)) * T),
    ay = q.y + q.h - 4,
    alto = G.obl ? 58 : 40,
    sw = Math.round(Math.sin(t * 0.3) * 1.5),
    hojas = es.arbolConHojas || !ar.caduco;
  if (hojas) {
    g.fillStyle = C.sombra;
    g.beginPath();
    g.ellipse(ax - 22, ay + 2, 44, G.obl ? 20 : 34, 0, 0, 6.3);
    g.fill();
  }
  pegarArbol(g, ax, ay, { alto, sw, hojas, estacion: es.estacion });
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
