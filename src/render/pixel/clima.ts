/** Lo que pasa en el aire: el humito de la compostera, la lluvia, la helada, el calor y el tinte de la estación. */
import type { Pincel } from '../../arte';
import type { Escena } from '../contrato';
import type { Geometria } from './geometria';
import { ruido } from './paleta';

type R = Pincel['r'];

function humo(g: CanvasRenderingContext2D, r: R, es: Escena, G: Geometria, t: number): void {
  const q = G.celda(es.compostera!)!;
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.12 + i * 0.33) % 1;
    g.globalAlpha = 0.5 * (1 - u);
    r(q.bx - 4 + i * 4 + Math.sin(t * 0.3 + i) * 2, q.y + q.h - 28 - u * 14, 3, 3, '#ffffff');
    g.globalAlpha = 1;
  }
}

function lluvia(g: CanvasRenderingContext2D, r: R, W: number, H: number, t: number): void {
  g.fillStyle = 'rgba(40,60,140,0.16)';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const rx = (ruido(i, 1) * W + t * 5) % W,
      ry = (ruido(i, 2) * H + t * 34 + i * 9) % H;
    r(rx, ry, 1, 6, '#bfeaff');
    r(rx + 1, ry + 5, 1, 2, '#7fc8f0');
    if (i % 6 === 0) {
      const sx = ruido(i, 3) * W,
        sy2 = ruido(i, 4) * H,
        f = Math.floor(t + i) % 3;
      r(sx - f, sy2, 1, 1, '#dff6ff');
      r(sx + f + 1, sy2, 1, 1, '#dff6ff');
      r(sx, sy2 - f, 1, 1, '#dff6ff');
    }
  }
}

function helada(g: CanvasRenderingContext2D, r: R, W: number, H: number, t: number): void {
  g.fillStyle = 'rgba(200,228,255,0.34)';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) {
    const hx = (ruido(i, 7) * W + Math.sin(t * 0.2 + i) * 6) % W,
      hy = (ruido(i, 9) * H + t * 3) % H;
    r(hx, hy, i % 3 ? 1 : 2, i % 3 ? 1 : 2, '#ffffff');
    if (i % 9 === 0) {
      r(hx - 1, hy, 3, 1, '#ffffff');
      r(hx, hy - 1, 1, 3, '#ffffff');
    }
  }
}

function calor(g: CanvasRenderingContext2D, W: number, H: number, t: number): void {
  g.fillStyle = 'rgba(255,120,20,' + (0.13 + Math.sin(t * 0.5) * 0.05) + ')';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) {
    const cy2 = (i * 37 + t * 2) % H;
    g.fillStyle = 'rgba(255,230,160,0.16)';
    g.fillRect(Math.sin(t * 0.4 + i) * 8, cy2, W, 2);
  }
}

const TINTE: Record<string, string> = {
  invierno: 'rgba(60,90,200,0.09)',
  otoño: 'rgba(255,140,40,0.07)',
  verano: 'rgba(255,220,80,0.05)',
};

export function clima(g: CanvasRenderingContext2D, r: R, es: Escena, G: Geometria, t: number): void {
  const { W, H } = G;
  if (es.compostera && es.compost.tandas > 0 && G.humo) humo(g, r, es, G, t);
  if (es.animar === 'lluvia') lluvia(g, r, W, H, t);
  if (es.animar === 'helada') helada(g, r, W, H, t);
  if (es.animar === 'calor') calor(g, W, H, t);
  const tinte = TINTE[es.estacion];
  if (tinte) {
    g.fillStyle = tinte;
    g.fillRect(0, 0, W, H);
  }
}
