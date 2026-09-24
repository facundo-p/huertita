/** Letras de píxel 3×5 para números y signos: las horas de sol, los litros de una maceta, la regla del corte. */
import type { Lienzo2D } from '../../arte';

const GLIFOS: Record<string, string> = {
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '111001111100111',
  '3': '111001111001111',
  '4': '101101111001001',
  '5': '111100111001111',
  '6': '111100111101111',
  '7': '111001001001001',
  '8': '111101111101111',
  '9': '111101111001111',
  '+': '000010111010000',
  '-': '000000111000000',
  '.': '000000000000010',
  ',': '000000000010100',
  L: '100100100100111',
  ' ': '000000000000000',
  h: '100100111101101',
};

/** Escribe `s` desde (x, y), con píxeles de lado `k`, corrido `dy` hacia abajo. */
export function letras(g: Lienzo2D, x: number, y: number, s: string, col: string, k = 1, dy = 0): void {
  g.fillStyle = col;
  s.split('').forEach((ch, i) => {
    const m = GLIFOS[ch] || GLIFOS[' '];
    for (let j = 0; j < 15; j++)
      if (m[j] === '1') g.fillRect(x + i * 4 * k + (j % 3) * k, y + Math.floor(j / 3) * k + dy, k, k);
  });
}
