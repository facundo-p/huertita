/**
 * Una superficie de píxeles para el fondo del patio: una grilla de `RES` píxeles por unidad de dibujo que
 * se pinta con ruido, damero, sombras y texturas píxel a píxel (algo que con `fillRect` sería carísimo)
 * y se pega de una vez en el lienzo, agrandada por un factor entero. Cumple `Lienzo2D`, así el pincel
 * (`pincel(superficie, …)`) y el volumen sin contorno de `arte` dibujan sobre ella también.
 */
import { RES, type Lienzo2D } from '../../arte';

type RGBA = [number, number, number, number];

const cache = new Map<string, RGBA>();

/** '#rrggbb' o 'rgba(r,g,b,a)' → [r, g, b, a] con a de 0 a 1 */
export function colorA(c: string): RGBA {
  let v = cache.get(c);
  if (v) return v;
  if (c.startsWith('rgba')) {
    const m = c.slice(c.indexOf('(') + 1, -1).split(',');
    v = [+m[0], +m[1], +m[2], +m[3]];
  } else {
    const n = parseInt(c.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  cache.set(c, v);
  return v;
}

const empaquetados = new Map<string, number>();

/** Un color opaco como entero (0xAABBGGRR), para escribir de a miles de píxeles sin parsear. */
export function empaquetar(c: string): number {
  let v = empaquetados.get(c);
  if (v === undefined) {
    const [r, g, b] = colorA(c);
    v = (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
    empaquetados.set(c, v);
  }
  return v;
}

/** Un número entre 0 y 1 que depende solo de (i, j, s): el mismo punto da siempre lo mismo. */
export function hash(i: number, j: number, s = 0): number {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Recorre una región de a bloques de 4 × 4 píxeles (los de los bordes, más chicos): `bloque` recibe la esquina y el tamaño. */
export function porBloques(
  i: number,
  j: number,
  w: number,
  h: number,
  bloque: (bx: number, by: number, bw: number, bh: number) => void,
): void {
  for (let by = j; by < j + h; by += 4)
    for (let bx = i; bx < i + w; bx += 4) bloque(bx, by, Math.min(4, i + w - bx), Math.min(4, j + h - by));
}

export class Superficie implements Lienzo2D {
  fillStyle: unknown = '#000000';
  readonly w: number;
  readonly h: number;
  /** RGBA de cada píxel (0xAABBGGRR en un procesador little-endian) */
  readonly datos: Uint32Array;

  /** `ancho` y `alto` en unidades de dibujo */
  constructor(ancho: number, alto: number) {
    this.w = Math.ceil(ancho * RES);
    this.h = Math.ceil(alto * RES);
    this.datos = new Uint32Array(this.w * this.h);
  }

  /** unidades de dibujo → píxel */
  static px(v: number): number {
    return Math.round(v * RES);
  }

  /** Un píxel, con la transparencia del color si la tiene. */
  px(i: number, j: number, c: string): void {
    if (i < 0 || j < 0 || i >= this.w || j >= this.h) return;
    const [r, g, b, a] = colorA(c);
    this.mezclar(i, j, r, g, b, a);
  }

  /** Escribe un píxel con un color ya empaquetado (el camino rápido para las texturas). */
  set(i: number, j: number, v: number): void {
    if (i >= 0 && j >= 0 && i < this.w && j < this.h) this.datos[j * this.w + i] = v;
  }

  /** Mezcla un píxel con un color: a = 1 lo reemplaza. */
  mezclar(i: number, j: number, r: number, g: number, b: number, a: number): void {
    if (i < 0 || j < 0 || i >= this.w || j >= this.h) return;
    const k = j * this.w + i;
    if (a >= 1) {
      this.datos[k] = 0xff000000 | (b << 16) | (g << 8) | r;
      return;
    }
    const d = this.datos[k],
      dr = d & 255,
      dg = (d >> 8) & 255,
      db = (d >> 16) & 255;
    this.datos[k] =
      0xff000000 |
      (Math.round(db + (b - db) * a) << 16) |
      (Math.round(dg + (g - dg) * a) << 8) |
      Math.round(dr + (r - dr) * a);
  }

  /** El color de un píxel, como '#rrggbb'. */
  leer(i: number, j: number): string {
    const d = this.datos[Math.max(0, Math.min(this.h - 1, j)) * this.w + Math.max(0, Math.min(this.w - 1, i))];
    return '#' + (((d & 255) << 16) | (d & 0xff00) | ((d >> 16) & 255)).toString(16).padStart(6, '0');
  }

  /** Un rectángulo en píxeles. */
  rectPx(i: number, j: number, w: number, h: number, c: string): void {
    const [r, g, b, a] = colorA(c),
      i1 = Math.min(this.w, i + w),
      j1 = Math.min(this.h, j + h);
    for (let y = Math.max(0, j); y < j1; y++) for (let x = Math.max(0, i); x < i1; x++) this.mezclar(x, y, r, g, b, a);
  }

  /** Un rectángulo en unidades de dibujo (lo que pide el pincel). */
  rect(x: number, y: number, w: number, h: number, c: string): void {
    const i = Superficie.px(x),
      j = Superficie.px(y);
    this.rectPx(i, j, Math.max(1, Superficie.px(x + w) - i), Math.max(1, Superficie.px(y + h) - j), c);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this.rect(x, y, w, h, this.fillStyle as string);
  }

  /** Una línea de un píxel entre dos puntos. */
  lineaPx(x0: number, y0: number, x1: number, y1: number, c: string): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) this.px(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), c);
  }

  /** Una elipse llena en píxeles. */
  elipsePx(cx: number, cy: number, rx: number, ry: number, c: string): void {
    const [r, g, b, a] = colorA(c);
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      const t = ry === 0 ? 0 : (y + 0.5 - cy) / ry;
      if (Math.abs(t) > 1) continue;
      const hw = rx * Math.sqrt(1 - t * t);
      for (let x = Math.ceil(cx - hw - 0.5); x < Math.ceil(cx + hw - 0.5); x++) this.mezclar(x, y, r, g, b, a);
    }
  }

  /** Un damero de dos colores en un rectángulo de píxeles. */
  damero(i: number, j: number, w: number, h: number, c1: string, c2: string, fase = 0): void {
    for (let y = j; y < j + h; y++) for (let x = i; x < i + w; x++) this.px(x, y, (x + y + fase) % 2 === 0 ? c1 : c2);
  }

  /** Oscurece (o aclara) una elipse con un color transparente, con el borde en damero. */
  sombraEn(cx: number, cy: number, rx: number, ry: number, c: string, borde = 3): void {
    const [r, g, b, a] = colorA(c);
    for (let y = Math.floor(cy - ry - borde); y <= Math.ceil(cy + ry + borde); y++)
      for (let x = Math.floor(cx - rx - borde); x <= Math.ceil(cx + rx + borde); x++) {
        const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
        if (d <= 1 || (d <= ((rx + borde) / rx) ** 2 && (x + y) % 2 === 0)) this.mezclar(x, y, r, g, b, a);
      }
  }

  /** Una copia con los mismos píxeles. */
  clonar(): Superficie {
    const c = new Superficie(this.w / RES, this.h / RES);
    c.datos.set(this.datos);
    return c;
  }

  /** La imagen para pegar en un canvas. */
  imagen(): ImageData {
    return new ImageData(new Uint8ClampedArray(this.datos.buffer as ArrayBuffer), this.w, this.h);
  }
}
