/**
 * Cómo se dibuja cada especie: forma, paleta y color del fruto o la flor.
 * Una especie nueva de huertapp que no esté acá usa el dibujo genérico de su grupo (`estiloDe`).
 */
import { AZ, GR, OS, V, type Paleta } from './paleta';

export const FORMAS_DE_PLANTA = [
  'roseta',
  'repollo',
  'raiz',
  'varas',
  'mata',
  'baja',
  'rastrera',
  'trepadora',
  'aromatica',
  'alta',
  'flor',
] as const;
export type Forma = (typeof FORMAS_DE_PLANTA)[number];

/** Cada forma mira solo algunos campos; todos son opcionales salvo la forma. */
export interface Estilo {
  f: Forma;
  /** variante dentro de la forma: rizada, lanza, penca, pluma (roseta y raíz); redonda (raíz); ancha, cojin, aguja, espiga, arbolito (aromática) */
  tipo?: string;
  pal?: Paleta;
  /** color del fruto, la raíz, el bulbo o la flor */
  tinta?: string;
  /** color de la flor (mata, trepadora, aromática) */
  florc?: string;
  /** cuánto más alta que su forma, 1 = normal */
  alto?: number;
  // raíz y varas
  largo?: boolean;
  nervio?: string;
  bulbo?: boolean;
  grueso?: boolean;
  fino?: boolean;
  // repollo
  cabeza?: string;
  lisa?: boolean;
  rizado?: boolean;
  tallo?: boolean;
  // mata y rastrera
  fr?: 'bola' | 'largo' | 'fino' | 'gota';
  sinfruto?: boolean;
  tuber?: string;
  hojac?: string;
  /** radio del fruto redondo */
  frr?: number;
  /** fruto largo (pepino) */
  frl?: boolean;
  raya?: string;
  // trepadora y alta
  sincana?: boolean;
  sol?: boolean;
  // flor
  centro?: string;
  n?: number;
  pompon?: boolean;
  pluma?: boolean;
  estrella?: boolean;
  escudo?: boolean;
}

const ROJO = '#e8342a';

export const ESTILO: Record<string, Estilo> = {
  lechuga: { f: 'roseta', tipo: 'rizada', pal: { v: '#6fcf4f', c: '#b5f07a', o: '#3a9a3f', oo: '#23773a' } },
  espinaca: { f: 'roseta', tipo: 'lanza', pal: OS },
  acelga: { f: 'roseta', tipo: 'penca', pal: OS, tinta: '#fff1d0' },
  rucula: { f: 'roseta', tipo: 'pluma', pal: V },
  radicchio: { f: 'roseta', tipo: 'rizada', pal: { v: '#a23a5a', c: '#d66a86', o: '#6e2440', oo: '#4a1830' } },
  berro: { f: 'roseta', tipo: 'pluma', pal: OS },
  apio: { f: 'roseta', tipo: 'penca', pal: V, tinta: '#c9f0a0' },
  perejil: { f: 'roseta', tipo: 'pluma', pal: OS },
  cilantro: { f: 'roseta', tipo: 'pluma', pal: V },
  eneldo: { f: 'roseta', tipo: 'pluma', pal: { v: '#6fbf5a', c: '#a8e07a', o: '#3f8a45', oo: '#2a6035' }, alto: 1.3 },

  'cebolla-de-verdeo': { f: 'varas', tinta: '#fff6e0' },
  cebolla: { f: 'varas', tinta: '#d9a05a', bulbo: true },
  ajo: { f: 'varas', tinta: '#f4ead8', bulbo: true },
  puerro: { f: 'varas', tinta: '#fff6e0', grueso: true },
  ciboulette: { f: 'varas', fino: true, tinta: '#c48aff' },

  repollo: { f: 'repollo', cabeza: '#c8eaa0', lisa: true },
  coliflor: { f: 'repollo', cabeza: '#fff6e0' },
  brocoli: { f: 'repollo', cabeza: '#2f8f4a' },
  kale: { f: 'repollo', rizado: true },
  'repollitos-de-bruselas': { f: 'repollo', tallo: true, cabeza: '#9ad06a' },

  zanahoria: { f: 'raiz', tipo: 'pluma', tinta: '#f08a24', largo: true },
  rabanito: { f: 'raiz', tipo: 'redonda', tinta: '#e8346a' },
  remolacha: { f: 'raiz', tipo: 'redonda', tinta: '#8e2a5a', nervio: '#c43a6a' },
  nabo: { f: 'raiz', tipo: 'redonda', tinta: '#efe0f6' },

  papa: { f: 'mata', tuber: '#d9b779', florc: '#fff6e0', sinfruto: true },
  batata: { f: 'rastrera', tuber: '#c9603a', sinfruto: true, hojac: '#3f9a5a' },
  tomate: { f: 'mata', tinta: ROJO, fr: 'bola' },
  pimiento: { f: 'mata', tinta: '#f2b632', fr: 'largo' },
  'aji-picante': { f: 'mata', tinta: ROJO, fr: 'fino' },
  berenjena: { f: 'mata', tinta: '#5a2f8a', fr: 'gota', florc: '#c48aff' },
  frutilla: { f: 'baja', tinta: ROJO },

  'zapallito-de-tronco': { f: 'rastrera', tinta: '#2f7f3a', frr: 3 },
  zapallo: { f: 'rastrera', tinta: '#f08a24', frr: 5 },
  pepino: { f: 'rastrera', tinta: '#2f8f4a', frl: true },
  melon: { f: 'rastrera', tinta: '#e9d27a', frr: 4 },
  sandia: { f: 'rastrera', tinta: '#2a7a3f', frr: 5, raya: '#7fd06a' },

  chaucha: { f: 'trepadora', tinta: '#7bd058', florc: '#fff6e0' },
  arveja: { f: 'trepadora', tinta: '#9be06a', florc: '#f4d0ff' },
  haba: { f: 'trepadora', sincana: true, pal: AZ, tinta: '#8fcf6a', florc: '#fff6e0' },
  choclo: { f: 'alta', tinta: '#ffd23f' },
  girasol: { f: 'alta', sol: true, tinta: '#ffd23f' },

  albahaca: {
    f: 'aromatica',
    tipo: 'ancha',
    pal: { v: '#4fc04a', c: '#9af06a', o: '#2a8a3a', oo: '#1b5e2a' },
    florc: '#fff6e0',
  },
  menta: { f: 'aromatica', tipo: 'ancha', pal: OS, florc: '#e0c8ff' },
  melisa: { f: 'aromatica', tipo: 'ancha', pal: V, florc: '#fff6e0' },
  oregano: { f: 'aromatica', tipo: 'cojin', pal: V, florc: '#f0b8e0' },
  tomillo: { f: 'aromatica', tipo: 'cojin', pal: GR, florc: '#e0a8f0' },
  salvia: { f: 'aromatica', tipo: 'ancha', pal: GR, florc: '#9a7aff' },
  romero: {
    f: 'aromatica',
    tipo: 'aguja',
    pal: { v: '#4a8a6a', c: '#7ab89a', o: '#2f6048', oo: '#1f4030' },
    florc: '#a8b8ff',
  },
  lavanda: { f: 'aromatica', tipo: 'espiga', pal: GR, florc: '#9a6aff' },
  laurel: { f: 'aromatica', tipo: 'arbolito', pal: OS },

  calendula: { f: 'flor', tinta: '#ff9a1f', centro: '#a8500a', n: 3 },
  copete: { f: 'flor', tinta: '#ff6a1f', centro: '#ffc233', n: 3, pompon: true, pluma: true },
  borraja: { f: 'flor', tinta: '#4a7bff', centro: '#1d1b4b', n: 4, estrella: true, pal: AZ },
  capuchina: { f: 'flor', tinta: '#ff4a2a', centro: '#ffc233', n: 3, escudo: true },
  cosmos: { f: 'flor', tinta: '#ff7ab8', centro: '#ffd23f', n: 3, pluma: true, alto: 1.35 },
};

/** La forma genérica de una especie sin estilo propio, por su grupo y su familia. Gana la primera que coincide. */
const GENERICAS: [(g: string, f: string) => boolean, Forma][] = [
  [(g) => g === 'Flor polinizadora', 'flor'],
  [(_, f) => f === 'cucurbitacea', 'rastrera'],
  [(g) => g === 'Legumbre', 'trepadora'],
  [(g) => g === 'Hortaliza de fruto', 'mata'],
  [(_, f) => f === 'aliacea', 'varas'],
  [(g) => g === 'Hortaliza de raíz/bulbo', 'raiz'],
  [(g) => g === 'Aromática', 'aromatica'],
  [(_, f) => f === 'brasicacea', 'repollo'],
];

export function estiloDe(p: { slug: string; grupo?: string; familia?: string }): Estilo {
  const e = ESTILO[p.slug];
  if (e) return e;
  const g = p.grupo || '',
    fam = p.familia || '';
  return { f: GENERICAS.find(([es]) => es(g, fam))?.[1] ?? 'roseta', tinta: '#ffd23f' };
}
