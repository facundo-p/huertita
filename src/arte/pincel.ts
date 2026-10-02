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
import { rampaDe, rampaDeHoja, type Paleta, type Rampa } from './paleta';
import { pintarVolumen, rasterizar, type Forma } from './volumen';

/** Píxeles del lienzo por unidad de dibujo. Quien escala un lienzo lo hace por un múltiplo de esto. */
export const RES = 4;

/** Una escala de lienzo entera, múltiplo de `RES` y lo más cerca posible de la pedida. */
export const escalaDeLienzo = (pedida: number, res = RES): number => res * Math.max(1, Math.round(pedida / res));

export type Color = string | undefined;

/** Lo mínimo del lienzo que usa el pincel: un canvas 2D, o uno falso para los tests. */
export interface Lienzo2D {
  fillStyle: unknown;
  fillRect(x: number, y: number, w: number, h: number): void;
}

/**
 * Una forma por llenar: se arma con polígonos y elipses (en unidades de dibujo, como todo lo del pincel)
 * y se pinta con `volumen`, que le da luz y sombra sin contorno.
 */
export interface Mascara {
  poligono(pts: [number, number][]): Mascara;
  elipse(cx: number, cy: number, rx: number, ry: number): Mascara;
}

export interface Pincel {
  r(x: number, y: number, w: number, h: number, c: Color): void;
  mascara(): Mascara;
  /**
   * Pinta una forma con siete tonos de `rampa` (de la sombra más honda a la luz más viva), según cuánto
   * falta para salir de la forma yendo hacia la luz (arriba a la izquierda) o hacia el lado contrario.
   * Sin contorno: el volumen se lee por el color.
   */
  volumen(m: Mascara, rampa: Rampa): void;
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
  /**
   * Fila por fila de píxel del lienzo; el ancho se mide en el centro de cada fila. Dentro de una
   * unidad, las filas del mismo ancho van en un solo rectángulo (el redibujo es cada 90 ms).
   */
  function elipse(cx: number, cy: number, rx: number, ry: number, c: Color): void {
    const ancho = (yc: number): number =>
      ry === 0 ? rx : q(rx * Math.sqrt(Math.max(0, 1 - (yc * yc) / (ry * ry + 0.01))));
    for (let y = -ry; y <= ry; y++)
      for (let k = 0; k < res;) {
        const w = ancho(y + (k + 0.5) / res - 0.5);
        let n = 1;
        while (k + n < res && ancho(y + (k + n + 0.5) / res - 0.5) === w) n++;
        r(cx - w, cy + y + k / res, w * 2 + 1, n / res, c);
        k += n;
      }
  }
  const disco = (cx: number, cy: number, rad: number, c: Color): void => elipse(cx, cy, rad, rad, c);
  function linea(x0: number, y0: number, x1: number, y1: number, c: Color, grosor?: number): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * res;
    for (let i = 0; i <= n; i++)
      r(q(x0 + ((x1 - x0) * i) / n), q(y0 + ((y1 - y0) * i) / n), grosor || 1, grosor || 1, c);
  }
  /** unidades de dibujo → píxeles del lienzo (con decimales) */
  const aPx = (x: number, y: number): [number, number] => [(ox + x * s) * res, (oy + y * s) * res];

  function mascara(): Mascara {
    const formas: Forma[] = [],
      m: Mascara & { formas: Forma[] } = {
        formas,
        poligono(pts) {
          formas.push({ tipo: 'p', pts: pts.map(([x, y]) => aPx(x, y)) });
          return m;
        },
        elipse(cx, cy, rx, ry) {
          const [px, py] = aPx(cx, cy);
          formas.push({ tipo: 'e', c: [px, py, rx * s * res, ry * s * res] });
          return m;
        },
      };
    return m;
  }

  function volumen(m: Mascara, rampa: Rampa): void {
    const rej = rasterizar((m as Mascara & { formas: Forma[] }).formas);
    if (rej) pintarVolumen(g, rej, rampa, res);
  }
  return { r, mascara, volumen, elipse, disco, linea, s };
}

/** Una hoja oval con volumen y una nervadura central de un píxel a lo largo. */
export function hojaOval(
  B: Pincel,
  x: number,
  y: number,
  rx: number,
  ry: number,
  pal: Paleta,
  luzArriba?: boolean,
): void {
  const rampa = rampaDeHoja(pal);
  B.volumen(B.mascara().elipse(x, y, rx, ry), rampa);
  if (luzArriba === false) return;
  if (rx >= ry && rx > 1.5) B.r(x - rx * 0.7, y, rx * 1.4, 0.25, rampa[2]);
  else if (ry > 1.5) B.r(x, y - ry * 0.7, 0.25, ry * 1.4, rampa[2]);
}

/** Una flor chica: un disco con volumen, o una estrella de cinco pétalos, con su centro. */
export function florcita(
  B: Pincel,
  x: number,
  y: number,
  rad: number,
  c: Color,
  centro?: string,
  estrella?: boolean,
): void {
  const rampa = rampaDe(c || '#ffe34a'),
    m = B.mascara();
  if (estrella)
    for (let k = 0; k < 5; k++) {
      const an = (k * 72 - 90) * (Math.PI / 180);
      m.elipse(x + Math.cos(an) * rad * 0.62, y + Math.sin(an) * rad * 0.62, rad * 0.55, rad * 0.55);
    }
  else m.elipse(x, y, rad, rad);
  B.volumen(m, rampa);
  if (rad > 1) B.disco(x, y, Math.max(0.5, rad * 0.32), centro || '#c8741a');
}
