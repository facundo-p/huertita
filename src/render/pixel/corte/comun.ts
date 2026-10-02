/** Lo que comparten las piezas del corte de suelo de la cámara de cerca: medidas, la zona de píxeles y la tierra en capas. */
import { mezcla } from '../../../arte';
import type { CeldaEnPantalla } from '../geometria';
import { granoDeTierra, tablaDeTierra } from '../bancales';
import { hash, Superficie } from '../superficie';

export const px = Superficie.px;

/** Las medidas del corte, en unidades de dibujo. */
export const CORTE = {
  /** la ventana es cuadrada: 256 × 256 */
  ancho: 256,
  /** donde apoyan las plantas del frente y las de atrás */
  yFrente: 170,
  yAtras: 132,
  /** de la cara de arriba del cantero y del corte */
  caraDeArriba: 114,
  yCorte: 172,
  /** el horizonte del piso */
  yPiso: 108,
  /** unidades de dibujo por centímetro de tierra */
  porCm: 1 / 0.75,
};

/** Lo que el corte necesita saber de la cámara: las columnas que muestra y dónde cae cada celda. */
export interface DatosDelCorte {
  cols: number[];
  filas: number[];
  /** ancho de una columna */
  cw: number;
  x0: number;
  zona: string;
  tipo: string;
  masIzq: boolean;
  masDer: boolean;
  celda(k: string): CeldaEnPantalla | null;
}

/** una región de píxeles */
export interface Zona {
  i: number;
  j: number;
  w: number;
  h: number;
}

/** Una región dada en unidades de dibujo. */
export const zonaU = (x: number, y: number, w: number, h: number): Zona => ({
  i: px(x),
  j: px(y),
  w: px(w),
  h: px(h),
});

/**
 * Tierra en dos capas, la materia orgánica oscura arriba y el suelo claro abajo, con la frontera en
 * `lim` (píxel) hecha un damero irregular. `x` va de `i0` a `i1` y `y` de `j0` a `j1` (píxeles).
 */
export function tierraEnCapas(
  s: Superficie,
  [i0, i1, j0, j1]: [number, number, number, number],
  [osc, sub]: [number[], number[]],
  lim: number,
  semilla: number,
): void {
  for (let j = j0; j < j1; j++)
    for (let i = i0; i < i1; i++) {
      const d = j - lim - (Math.floor(hash(i >> 1, semilla, 83) * 5) - 2),
        oscura = d < -2 || (d <= 2 && (i + j) % 2 === 0);
      s.set(i, j, granoDeTierra(i, j, oscura ? osc : sub));
    }
}

/** Rellena una región de píxeles `[i0, i1, j0, j1]` con una tabla de tierra. */
export function rellenarDeTierra(
  s: Superficie,
  [i0, i1, j0, j1]: [number, number, number, number],
  tabla: number[],
): void {
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) s.set(i, j, granoDeTierra(i, j, tabla));
}

/** Las dos tablas de color de un perfil de suelo: [la capa orgánica, el suelo claro]. */
export function tablasDelPerfil(t: string): [number[], number[]] {
  return [tablaDeTierra(mezcla(t, '#1e0f08', 0.55)), tablaDeTierra(mezcla(t, '#c9a070', 0.35))];
}

/** Una gota de agua en la tierra: cuerpo azul, brillo arriba a la izquierda y sombra abajo a la derecha. */
export function gota(s: Superficie, i: number, j: number): void {
  const FORMA = ['.XX.', 'XXXX', 'XXXX', 'XXXX', '.XX.'];
  FORMA.forEach((fila, y) =>
    [...fila].forEach((c, x) => {
      if (c === 'X') s.px(i + x, j + y, '#4aa6d8');
    }),
  );
  s.px(i + 1, j + 1, '#d8f6ff');
  s.px(i + 1, j + 2, '#9adcf6');
  s.px(i + 3, j + 3, '#2a6aa0');
  s.px(i + 2, j + 4, '#2a6aa0');
}

/** Un manojo de pajas tiradas sobre la tierra (el mantillo), de `i0` a `i1` y apoyado en la fila `j`. */
export function pajas(s: Superficie, i0: number, i1: number, j: number, semilla: number): void {
  for (let n = 0; n < (i1 - i0) / 7; n++) {
    const x = i0 + Math.floor(hash(n, semilla, 84) * (i1 - i0 - 14)),
      y = j - 6 + Math.floor(hash(n, semilla, 85) * 9),
      largo = 10 + Math.floor(hash(n, semilla, 86) * 8),
      dy = Math.round((hash(n, semilla, 87) - 0.5) * 8);
    s.lineaPx(x, y, x + largo, y + dy, '#d9b04a');
    s.lineaPx(x, y - 1, x + largo, y + dy - 1, '#f0d071');
    s.px(x + largo, y + dy, '#a8842a');
  }
}
