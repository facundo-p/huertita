/** Los colores del patio, el cielo de cada estación y dos utilidades de dibujo. */

/** lado de una baldosa, en píxeles de juego */
export const T = 32;

export const C = {
  pasto: '#4f9d3a',
  pasto2: '#62b548',
  pasto3: '#3f8531',
  sendero: '#dcbb7e',
  sendero2: '#c9a263',
  sendero3: '#ecd29a',
  ladrillo: '#c5482e',
  ladrillo2: '#9e3421',
  ladrillo3: '#dc6a48',
  junta: '#e8c9a0',
  tierra: ['#b07a4e', '#94613a', '#7a4d2e', '#603c23'],
  madera: '#b5793a',
  madera2: '#8a5526',
  madera3: '#d39a55',
  terracota: '#e0673a',
  terracota2: '#b84a25',
  terracota3: '#f08a5a',
  paja: '#f0d071',
  paja2: '#d9b04a',
  casa: '#f4e3b5',
  casa2: '#d9c48e',
  techo: '#2f8f9d',
  techo2: '#23707b',
  techo3: '#47adba',
  puerta: '#d9482b',
  tronco: '#6b4226',
  tronco2: '#8a5a36',
  copa: '#2f8f3f',
  copa2: '#46b04f',
  copa3: '#1f6e33',
  copa4: '#6fd060',
  blanco: '#fff6e0',
  anil: '#1d1b4b',
  maiz: '#ffc233',
  sombra: 'rgba(24,20,70,0.32)',
  bien: 'rgba(80,255,120,0.42)',
  regular: 'rgba(255,210,60,0.46)',
  mal: 'rgba(255,70,60,0.46)',
};

/** [arriba, horizonte] */
const CIELOS: Record<string, [string, string]> = {
  verano: ['#58c4f0', '#a8e4f8'],
  otoño: ['#f0a868', '#f8d8a8'],
  invierno: ['#8fa8d8', '#d0dcf0'],
  primavera: ['#6fd0e8', '#c8f0f0'],
};
export const cielo = (estacion: string): [string, string] => CIELOS[estacion] || CIELOS.primavera;

/** La tierra según cuán húmeda está (0 seca … 3 empapada). */
export const tierra = (humedo: number): string => C.tierra[Math.min(3, humedo)];

/** Ruido fijo: el mismo (x, y) da siempre el mismo número entre 0 y 1. Así los dibujos no titilan. */
export function ruido(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Curva que se pasa un poco y vuelve: el brote que asoma. */
export function easeBack(u: number): number {
  const c = 1.70158,
    v = u - 1;
  return 1 + (c + 1) * v * v * v + c * v * v;
}
