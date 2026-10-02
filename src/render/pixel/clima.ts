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
    const hx = q.bx - 4 + i * 4 + Math.sin(t * 0.3 + i) * 2,
      hy = q.y + q.h - 28 - u * 14;
    // un copito con luz arriba y sombra abajo, que se ensancha al subir
    const w = 3 + u * 2;
    r(hx + 0.5, hy, w - 1, w, '#ffffff');
    r(hx, hy + 0.5, w, w - 1, '#f0f4fa');
    r(hx + 0.5, hy, w - 1.5, 0.5, '#ffffff');
    r(hx + 0.5, hy + w - 0.5, w - 1, 0.5, '#c8d4e4');
    g.globalAlpha = 1;
  }
}

/** Una gota que cae: un hilo de un píxel que se afina hacia arriba y termina en una cabecita clara. */
function gotaQueCae(r: R, x: number, y: number): void {
  r(x, y, 0.25, 1.5, 'rgba(127,200,240,0.35)');
  r(x, y + 1.5, 0.25, 2, 'rgba(160,220,250,0.7)');
  r(x, y + 3.5, 0.5, 1.5, '#bfeaff');
  r(x, y + 3.5, 0.25, 1.5, '#ffffff');
  r(x + 0.25, y + 5, 0.25, 0.5, '#7fc8f0');
}

/** La salpicadura en el piso: un anillo que se abre, chato como una elipse, y se apaga. */
function salpicadura(r: R, x: number, y: number, f: number): void {
  const rx = 1 + f * 1.3,
    ry = 0.4 + f * 0.45;
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    r(x + Math.cos(a) * rx, y + Math.sin(a) * ry, 0.5, 0.25, f > 1 ? 'rgba(223,246,255,0.55)' : '#dff6ff');
  }
}

function lluvia(g: CanvasRenderingContext2D, r: R, W: number, H: number, t: number): void {
  g.fillStyle = 'rgba(40,60,140,0.16)';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const rx = (ruido(i, 1) * W + t * 5) % W,
      ry = (ruido(i, 2) * H + t * 34 + i * 9) % H;
    gotaQueCae(r, rx, ry);
    if (i % 6 === 0) salpicadura(r, ruido(i, 3) * W, ruido(i, 4) * H, Math.floor(t + i) % 3);
  }
}

/** Un copo de seis puntas: tres líneas de un píxel que se cruzan, con un brillo en el medio. */
function copo(r: R, x: number, y: number): void {
  for (const [dx, dy] of [
    [1, 0],
    [0.5, 0.87],
    [-0.5, 0.87],
  ])
    for (let k = -2; k <= 2; k += 0.25)
      r(x + dx * k, y + dy * k, 0.25, 0.25, Math.abs(k) > 1.5 ? '#d8ecff' : '#ffffff');
  r(x - 0.25, y - 0.25, 0.75, 0.75, '#ffffff');
}

function helada(g: CanvasRenderingContext2D, r: R, W: number, H: number, t: number): void {
  g.fillStyle = 'rgba(200,228,255,0.34)';
  g.fillRect(0, 0, W, H);
  // la escarcha en los bordes de la imagen: se espesa hacia afuera
  for (let k = 0; k < 6; k++) {
    g.fillStyle = `rgba(235,246,255,${(0.28 - k * 0.045).toFixed(2)})`;
    g.fillRect(0, k * 1.5, W, 1.5);
    g.fillRect(0, H - (k + 1) * 1.5, W, 1.5);
    g.fillRect(k * 1.5, 0, 1.5, H);
    g.fillRect(W - (k + 1) * 1.5, 0, 1.5, H);
  }
  for (let i = 0; i < 80; i++) {
    const hx = (ruido(i, 7) * W + Math.sin(t * 0.2 + i) * 6) % W,
      hy = (ruido(i, 9) * H + t * 3) % H;
    if (i % 9 === 0) copo(r, hx, hy);
    else {
      r(hx, hy, i % 3 ? 0.75 : 1.25, i % 3 ? 0.75 : 1.25, '#ffffff');
      r(hx - 0.25, hy + 0.25, 0.25, 0.25, 'rgba(255,255,255,0.5)');
    }
  }
}

/** El aire que tiembla: una línea de un píxel que serpentea y se corta en tramos. */
function onda(r: R, W: number, y: number, fase: number): void {
  for (let x = 0; x < W; x += 1.5)
    if (Math.floor(x / 22 + fase) % 3 !== 0)
      r(x, y + Math.sin(x * 0.09 + fase * 2) * 1.2, 1.75, 0.25, 'rgba(255,236,170,0.3)');
}

function calor(g: CanvasRenderingContext2D, r: R, W: number, H: number, t: number): void {
  g.fillStyle = 'rgba(255,120,20,' + (0.13 + Math.sin(t * 0.5) * 0.05) + ')';
  g.fillRect(0, 0, W, H);
  // un resplandor que sube desde abajo
  const brillo = g.createLinearGradient(0, H, 0, H * 0.45);
  brillo.addColorStop(0, 'rgba(255,170,60,0.22)');
  brillo.addColorStop(1, 'rgba(255,170,60,0)');
  g.fillStyle = brillo;
  g.fillRect(0, H * 0.45, W, H * 0.55);
  for (let i = 0; i < 9; i++) onda(r, W, (i * 37 + t * 2) % H, t * 0.4 + i);
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
  if (es.animar === 'calor') calor(g, r, W, H, t);
  const tinte = TINTE[es.estacion];
  if (tinte) {
    g.fillStyle = tinte;
    g.fillRect(0, 0, W, H);
  }
}
