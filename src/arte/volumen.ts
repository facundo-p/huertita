/**
 * El volumen sin contorno: una forma (polígonos y elipses en píxeles del lienzo) se rasteriza en una
 * grilla y cada píxel se pinta con uno de los siete tonos de una rampa, según cuántos píxeles seguidos
 * hay adentro de la forma yendo hacia la luz (arriba a la izquierda) y hacia el lado contrario.
 */
import type { Rampa } from './paleta';

export type Forma = { tipo: 'p'; pts: [number, number][] } | { tipo: 'e'; c: [number, number, number, number] };

export interface Rejilla {
  x0: number;
  y0: number;
  w: number;
  h: number;
  /** 1 donde el centro del píxel cae adentro de la forma */
  d: Uint8Array;
}

/** Lo mínimo del lienzo que usa el volumen: el mismo que el del pincel. */
interface Lienzo {
  fillStyle: unknown;
  fillRect(x: number, y: number, w: number, h: number): void;
}

const caja = (f: Forma): [number, number, number, number] => {
  if (f.tipo === 'e') {
    const [cx, cy, rx, ry] = f.c;
    return [cx - rx, cy - ry, cx + rx, cy + ry];
  }
  const xs = f.pts.map((p) => p[0]),
    ys = f.pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

function rellenarElipse(r: Rejilla, yc: number, [cx, cy, rx, ry]: [number, number, number, number], j: number): void {
  const t = ry === 0 ? 0 : (yc - cy) / ry;
  if (Math.abs(t) > 1) return;
  const hw = rx * Math.sqrt(1 - t * t);
  for (let i = Math.ceil(cx - hw - 0.5); i < Math.ceil(cx + hw - 0.5); i++) r.d[j * r.w + i - r.x0] = 1;
}

/** Dónde corta la fila `yc` los lados del polígono, de izquierda a derecha. */
function cortes(pts: [number, number][], yc: number): number[] {
  const xs: number[] = [];
  pts.forEach(([ax, ay], k) => {
    const [bx, by] = pts[(k + 1) % pts.length];
    if (ay !== by && yc >= Math.min(ay, by) && yc < Math.max(ay, by)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
  });
  return xs.sort((a, b) => a - b);
}

function rellenarPoligono(r: Rejilla, yc: number, pts: [number, number][], j: number): void {
  const xs = cortes(pts, yc);
  for (let k = 0; k + 1 < xs.length; k += 2)
    for (let i = Math.ceil(xs[k] - 0.5); i < Math.ceil(xs[k + 1] - 0.5); i++) r.d[j * r.w + i - r.x0] = 1;
}

/** Rasteriza las formas en una grilla que las contiene justas. */
export function rasterizar(formas: Forma[]): Rejilla | null {
  if (!formas.length) return null;
  const cajas = formas.map(caja),
    x0 = Math.floor(Math.min(...cajas.map((c) => c[0]))) - 1,
    y0 = Math.floor(Math.min(...cajas.map((c) => c[1]))) - 1,
    w = Math.ceil(Math.max(...cajas.map((c) => c[2]))) + 2 - x0,
    h = Math.ceil(Math.max(...cajas.map((c) => c[3]))) + 2 - y0,
    r: Rejilla = { x0, y0, w, h, d: new Uint8Array(w * h) };
  for (let j = 0; j < h; j++)
    for (const f of formas) {
      if (f.tipo === 'e') rellenarElipse(r, y0 + j + 0.5, f.c, j);
      else rellenarPoligono(r, y0 + j + 0.5, f.pts, j);
    }
  return r;
}

/** Cuánto mide de lado lo más chico de la forma, en píxeles. */
function lado({ w, h, d }: Rejilla): number {
  let ax = w,
    bx = -1,
    ay = h,
    by = -1;
  d.forEach((v, k) => {
    if (!v) return;
    const i = k % w,
      j = (k - i) / w;
    ax = Math.min(ax, i);
    bx = Math.max(bx, i);
    ay = Math.min(ay, j);
    by = Math.max(by, j);
  });
  return bx < 0 ? 0 : Math.min(bx - ax + 1, by - ay + 1);
}

/**
 * Cuántos píxeles seguidos hay adentro, contando el propio, yendo en diagonal: hacia arriba-izquierda
 * (`sentido` = -1, la luz) o hacia abajo-derecha (`sentido` = 1, la sombra). Se corta en `tope`.
 */
function corrida({ w, h, d }: Rejilla, sentido: 1 | -1, tope: number): Uint8Array {
  const c = new Uint8Array(w * h),
    j0 = sentido < 0 ? 0 : h - 1,
    paso = -sentido;
  for (let j = j0; j >= 0 && j < h; j += paso)
    for (let i = sentido < 0 ? 0 : w - 1; i >= 0 && i < w; i += paso) {
      const k = j * w + i,
        ant = i + sentido >= 0 && i + sentido < w && j + sentido >= 0 && j + sentido < h ? c[k + sentido * (w + 1)] : 0;
      if (d[k]) c[k] = Math.min(tope, 1 + ant);
    }
  return c;
}

/** El tono (0 sombra honda … 6 luz viva) de un píxel, según sus corridas hacia la luz (`l`) y hacia la sombra (`s`). */
function tonoDe(l: number, s: number, banda: number): number {
  if (l <= banda) return 6;
  if (l <= banda * 2) return 5;
  if (l <= banda * 3) return 4;
  if (s <= banda) return 0;
  if (s <= banda * 2) return 1;
  return s <= banda * 3 ? 2 : 3;
}

/** Pinta la rejilla con la rampa: una fila a la vez, juntando los píxeles seguidos del mismo tono. */
export function pintarVolumen(g: Lienzo, rej: Rejilla, rampa: Rampa, res: number): void {
  const banda = Math.max(1, Math.round(lado(rej) / 15)),
    tope = banda * 3 + 1,
    luz = corrida(rej, -1, tope),
    sombra = corrida(rej, 1, tope),
    { x0, y0, w, h, d } = rej,
    tono = (k: number): number => tonoDe(luz[k], sombra[k], banda);
  for (let j = 0; j < h; j++) {
    let i = 0;
    while (i < w) {
      if (!d[j * w + i]) {
        i++;
        continue;
      }
      const t = tono(j * w + i);
      let n = 1;
      while (i + n < w && d[j * w + i + n] && tono(j * w + i + n) === t) n++;
      g.fillStyle = rampa[t];
      g.fillRect((x0 + i) / res, (y0 + j) / res, n / res, 1 / res);
      i += n;
    }
  }
}
