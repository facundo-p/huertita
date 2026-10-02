/** Las capas de información sobre las celdas: horas de sol, el tinte de "cómo le iría acá" y la celda elegida. */
import { pincel, type Pincel } from '../../arte';
import type { CeldaDeEscena, Escena } from '../contrato';
import type { Geometria } from './geometria';
import { anchoDeLetras, letras } from './letras';
import { C } from './paleta';

interface Marco {
  x: number;
  y: number;
  w: number;
  h: number;
}

function horasDeSol(g: CanvasRenderingContext2D, c: CeldaDeEscena, { x: X, y: Y, w, h }: Marco): void {
  g.fillStyle = 'rgba(255,' + Math.round(120 + c.sol * 12) + ',0,' + (0.18 + c.sol / 18) + ')';
  g.fillRect(X, Y, w, h);
  const n = String(Math.round(c.sol)),
    x = X + (w - anchoDeLetras(n, 2)) / 2,
    y = Y + (h - 7 * 0.75 * 2) / 2,
    clara = c.sol >= 6;
  letras(g, x + 0.75, y + 0.75, n, clara ? 'rgba(255,246,224,0.5)' : 'rgba(24,20,70,0.5)', 2);
  letras(g, x, y, n, clara ? C.anil : C.blanco, 2);
}

const ICONO: Record<string, string> = { bien: '#0c5a1c', mal: '#7a0c0c', regular: '#6a4a00' };

function tinte(
  g: CanvasRenderingContext2D,
  B: Pincel,
  cual: 'bien' | 'regular' | 'mal',
  { x: X, y: Y, w, h }: Marco,
): void {
  g.fillStyle = C[cual];
  g.fillRect(X, Y, w, h);
  const ic = ICONO[cual],
    cx = X + w / 2,
    cy = Y + h / 2;
  // el ícono, con una luz debajo para que se lea sobre el tinte
  for (const [d, col] of [
    [0.75, 'rgba(255,255,255,0.45)'],
    [0, ic],
  ] as const) {
    if (cual === 'mal') {
      B.linea(cx - 3 + d, cy - 3 + d, cx + 3 + d, cy + 3 + d, col, 1.25);
      B.linea(cx + 3 + d, cy - 3 + d, cx - 3 + d, cy + 3 + d, col, 1.25);
    } else if (cual === 'bien') {
      B.linea(cx - 4 + d, cy + d, cx - 1 + d, cy + 3 + d, col, 1.25);
      B.linea(cx - 1 + d, cy + 3 + d, cx + 5 + d, cy - 3 + d, col, 1.25);
    }
  }
}

/** Las cuatro esquinas de la celda elegida, titilando. */
function seleccion(r: Pincel['r'], { x: X, y: Y, w, h }: Marco, t: number): void {
  const on = Math.floor(t) % 2 ? C.blanco : C.maiz,
    L = 7;
  esquinas(r, { x: X + 0.5, y: Y + 0.5, w, h }, 'rgba(24,20,70,0.5)', L);
  esquinas(r, { x: X, y: Y, w, h }, on, L);
}

/** Las cuatro esquinas de un marco, en L, de un color. */
function esquinas(r: Pincel['r'], { x: X, y: Y, w, h }: Marco, on: string, L: number): void {
  for (const [ex, ey, dx, dy] of [
    [X, Y, 1, 1],
    [X + w - 1, Y, -1, 1],
    [X, Y + h - 1, 1, -1],
    [X + w - 1, Y + h - 1, -1, -1],
  ]) {
    r(dx > 0 ? ex : ex - L + 1, ey - (dy > 0 ? 0 : 1), L, 2, on);
    r(ex - (dx > 0 ? 0 : 1), dy > 0 ? ey : ey - L + 1, 2, L, on);
  }
}

export function capas(g: CanvasRenderingContext2D, es: Escena, G: Geometria, claves: string[], t: number): void {
  const B = pincel(g, 0, 0, 1);
  for (const k of claves) {
    const c = es.celdas[k],
      m = G.marco(G.celda(k)!);
    if (es.capa === 'sol') horasDeSol(g, c, m);
    if (c.tinte) tinte(g, B, c.tinte, m);
    if (c.seleccion) seleccion(B.r, m, t);
  }
}
