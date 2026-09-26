/**
 * El pincel: rectángulos, discos, elipses y líneas de píxel gordo, con origen y escala. Todo se
 * dibuja anclado en la base de la planta (0,0 = ras del suelo, y negativo hacia arriba), así la
 * misma planta sirve a cualquier escala.
 *
 * Un color `undefined` deja el color anterior del lienzo: así dibujaba el prototipo cuando un estilo
 * no traía color de flor, y los dibujos tienen que salir idénticos.
 *
 * Las coordenadas van en unidades de dibujo (la baldosa mide 32). Cada unidad son `RES` píxeles del
 * lienzo: el pincel redondea a `1/RES`, así que un dibujo con números enteros sale igual a cualquier
 * `RES` y uno con medios (o cuartos) gana detalle. Subir la resolución es subir `RES` y retocar.
 */
import type { Paleta } from './paleta';

/** Píxeles del lienzo por unidad de dibujo. Quien escala un lienzo lo hace por un múltiplo de esto. */
export const RES = 1;

/** Una escala de lienzo entera, múltiplo de `RES` y lo más cerca posible de la pedida. */
export const escalaDeLienzo = (pedida: number, res = RES): number => res * Math.max(1, Math.round(pedida / res));

export type Color = string | undefined;

/** Lo mínimo del lienzo que usa el pincel: un canvas 2D, o uno falso para los tests. */
export interface Lienzo2D {
  fillStyle: unknown;
  fillRect(x: number, y: number, w: number, h: number): void;
}

export interface Pincel {
  r(x: number, y: number, w: number, h: number, c: Color): void;
  elipse(cx: number, cy: number, rx: number, ry: number, c: Color): void;
  disco(cx: number, cy: number, rad: number, c: Color): void;
  linea(x0: number, y0: number, x1: number, y1: number, c: Color, grosor?: number): void;
  s: number;
}

export function pincel(g: Lienzo2D, ox: number, oy: number, escala?: number, res = RES): Pincel {
  const s = escala || 1,
    /** redondea al píxel del lienzo: `1/res` unidades */
    q = (v: number): number => Math.round(v * res) / res;
  function r(x: number, y: number, w: number, h: number, c: Color): void {
    if (c !== undefined) g.fillStyle = c;
    g.fillRect(q(ox + x * s), q(oy + y * s), Math.max(1 / res, q(w * s)), Math.max(1 / res, q(h * s)));
  }
  /** Fila por fila de píxel del lienzo; el ancho se mide en el centro de cada fila. */
  function elipse(cx: number, cy: number, rx: number, ry: number, c: Color): void {
    for (let y = -ry; y <= ry; y++)
      for (let k = 0; k < res; k++) {
        const yc = y + (k + 0.5) / res - 0.5;
        let w = q(rx * Math.sqrt(Math.max(0, 1 - (yc * yc) / (ry * ry + 0.01))));
        if (ry === 0) w = rx;
        r(cx - w, cy + y + k / res, w * 2 + 1, 1 / res, c);
      }
  }
  const disco = (cx: number, cy: number, rad: number, c: Color): void => elipse(cx, cy, rad, rad, c);
  function linea(x0: number, y0: number, x1: number, y1: number, c: Color, grosor?: number): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * res;
    for (let i = 0; i <= n; i++)
      r(q(x0 + ((x1 - x0) * i) / n), q(y0 + ((y1 - y0) * i) / n), grosor || 1, grosor || 1, c);
  }
  return { r, elipse, disco, linea, s };
}

/** Una hoja: elipse oscura, verde encima y un toque de luz arriba. */
export function hojaOval(
  B: Pincel,
  x: number,
  y: number,
  rx: number,
  ry: number,
  pal: Paleta,
  luzArriba?: boolean,
): void {
  B.elipse(x, y, rx, ry, pal.o);
  B.elipse(x, y - 1, Math.max(1, rx - 1), Math.max(1, ry - 1), pal.v);
  if (luzArriba !== false && rx > 1) B.r(x - Math.floor(rx / 2), y - ry + 1, Math.max(1, rx - 1), 1, pal.c);
}

/** Una flor chica: un disco, o una estrella de cinco píxeles. */
export function florcita(
  B: Pincel,
  x: number,
  y: number,
  rad: number,
  c: Color,
  centro?: string,
  estrella?: boolean,
): void {
  if (estrella) {
    B.r(x - rad, y, rad * 2 + 1, 1, c);
    B.r(x, y - rad, 1, rad * 2 + 1, c);
    B.r(x - 1, y - 1, 3, 3, c);
  } else B.disco(x, y, rad, c);
  if (rad > 1) B.r(x, y, 1, 1, centro || '#ffd23f');
}
