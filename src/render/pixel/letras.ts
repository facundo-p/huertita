/**
 * Letras de píxel 5×7 para números y signos: las horas de sol, los litros de una maceta, la regla del
 * corte, lo que sube al cosechar. Cada píxel de la letra mide `0,75 × k` unidades de dibujo (tres
 * píxeles del lienzo con `k = 1`), así que a `RES = 4` los trazos tienen el mismo grosor que el resto
 * del detalle y no son tacos de una baldosa.
 */
import type { Lienzo2D } from '../../arte';

/** las siete filas de cada glifo, de cinco columnas */
const GLIFOS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00000', '00100'],
  ',': ['00000', '00000', '00000', '00000', '00100', '00100', '01000'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  h: ['10000', '10000', '10110', '11001', '10001', '10001', '10001'],
};
const VACIO = ['00000', '00000', '00000', '00000', '00000', '00000', '00000'];

/** el lado de un píxel de la letra, en unidades de dibujo */
const lado = (k: number): number => k * 0.75;

/** Cuánto mide de ancho un texto (unidades de dibujo), para centrarlo. */
export function anchoDeLetras(s: string, k = 1): number {
  return Math.max(0, s.length * 6 - 1) * lado(k);
}

/** Escribe `s` desde (x, y), con píxeles de lado `0,75 × k`, corrido `dy` hacia abajo. */
export function letras(g: Lienzo2D, x: number, y: number, s: string, col: string, k = 1, dy = 0): void {
  const p = lado(k);
  g.fillStyle = col;
  s.split('').forEach((ch, i) => {
    const filas = GLIFOS[ch] || VACIO;
    filas.forEach((fila, j) => {
      // los píxeles seguidos de una fila van en un solo rectángulo
      for (let c = 0; c < 5; c++) {
        if (fila[c] !== '1') continue;
        let n = 1;
        while (c + n < 5 && fila[c + n] === '1') n++;
        g.fillRect(x + (i * 6 + c) * p, y + j * p + dy, n * p, p);
        c += n - 1;
      }
    });
  });
}
