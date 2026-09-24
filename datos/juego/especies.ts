/**
 * Lo que el juego agrega a cada especie y huertapp no trae.
 *
 * Dos clases de cosas viven acá, y ninguna otra:
 *  1. Conocimiento que no es de huertapp (familia botánica, cómo se cosecha, emoji).
 *  2. SUPUESTOS para los huecos del catálogo. Cada uno queda anotado en `sup` de la
 *     especie, y la ficha del juego lo muestra como "dato supuesto por el juego".
 *
 * Si huertapp completa un hueco, el supuesto deja de usarse solo.
 */
import type { EspecieRepo, Helada, Rango, RegimenRiego, TempCrecimiento, TempGerminacion } from '../contrato';

const FAMILIAS: Record<string, string> = {
  // botánica estándar
  solanacea: 'tomate pimiento aji-picante berenjena papa',
  brasicacea: 'repollo brocoli coliflor kale rucula rabanito nabo repollitos-de-bruselas berro',
  cucurbitacea: 'zapallo zapallito-de-tronco pepino melon sandia',
  leguminosa: 'chaucha arveja haba',
  aliacea: 'cebolla ajo puerro cebolla-de-verdeo ciboulette',
  apiacea: 'zanahoria apio perejil cilantro eneldo',
  quenopodiacea: 'acelga espinaca remolacha',
  asteracea: 'lechuga radicchio calendula copete cosmos girasol',
  lamiacea: 'albahaca oregano tomillo romero salvia menta melisa lavanda',
};
const FAMILIA_DE: Record<string, string> = {};
for (const [f, ss] of Object.entries(FAMILIAS)) for (const s of ss.split(' ')) FAMILIA_DE[s] = f;

const EMOJI: Record<string, string> = {
  lechuga: '🥬',
  tomate: '🍅',
  zanahoria: '🥕',
  pimiento: '🫑',
  'aji-picante': '🌶️',
  berenjena: '🍆',
  pepino: '🥒',
  choclo: '🌽',
  frutilla: '🍓',
  papa: '🥔',
  batata: '🍠',
  cebolla: '🧅',
  ajo: '🧄',
  brocoli: '🥦',
  sandia: '🍉',
  melon: '🍈',
  girasol: '🌻',
  calendula: '🌼',
  copete: '🌼',
  cosmos: '🌸',
  borraja: '💠',
  capuchina: '🏵️',
  lavanda: '🪻',
  chaucha: '🫛',
  arveja: '🫛',
  haba: '🫘',
  zapallo: '🎃',
};

// [SUPUESTO] cuántas pasadas de cosecha da cada planta
const PASADAS_GRUPO: Record<string, number> = { 'Hortaliza de fruto': 6, Legumbre: 4, Aromática: 99 };
const PASADAS_HOJA: Record<string, number> = {
  acelga: 8,
  kale: 8,
  rucula: 4,
  espinaca: 4,
  perejil: 8,
  'cebolla-de-verdeo': 4,
  apio: 4,
  berro: 4,
};
const PASADAS_UNICA: Record<string, number> = { zapallo: 3, melon: 2, sandia: 2, choclo: 2 };
const PERENNES = 'oregano tomillo romero salvia menta melisa lavanda laurel ciboulette frutilla'.split(' ');

/** Una especie lista para el motor: sin huecos. */
export interface Especie extends Omit<EspecieRepo, 'hmin' | 'hideal' | 'riego' | 'dg' | 'dc' | 'tg' | 'tc' | 'helada'> {
  slug: string;
  familia: string;
  emoji: string;
  hmin: number;
  hideal: number;
  riego: RegimenRiego;
  dg: Rango;
  dc: Rango;
  tg: TempGerminacion<number>;
  tc: TempCrecimiento<number>;
  helada: Helada;
  pasadas: number;
  perenne: boolean;
  flor: boolean;
  fruto: boolean;
  /** cuánto lugar pide: huella en celdas, cuántas entran en una celda y cuánto levanta */
  marco: Marco;
  /** campos de esta especie que son supuesto del juego y no dato de huertapp */
  sup: string[];
}

// [SUPUESTO] cuánto frío aguanta sin helada, si huertapp no lo dice, según cómo le cae la helada
const TOLERA_MIN: Record<Helada, number> = { muere: 2, sensible: 0, tolera: -5, mejora: -8 };

export function completar(slug: string, r: EspecieRepo): Especie {
  const sup: string[] = [];
  const o = <T>(v: T | null | undefined, porDefecto: T, campo: string): T => {
    if (v == null) {
      sup.push(campo);
      return porDefecto;
    }
    return v;
  };
  const helada = o(r.helada, 'tolera' as Helada, 'helada');
  const esFlor = r.grupo === 'Flor polinizadora';
  const hmin = o(r.hmin, 4, 'horas mínimas de sol');
  const tgR = r.tg,
    tcR = r.tc;
  const tg: TempGerminacion<number> = {
    min: o(tgR?.min, 8, 'germinación: mínima'),
    ideal_min: o(tgR?.ideal_min, 15, 'germinación: ideal'),
    ideal_max: o(tgR?.ideal_max, 25, 'germinación: ideal'),
    max: o(tgR?.max, 35, 'germinación: máxima'),
  };
  const tc: TempCrecimiento<number> = {
    ideal_min: o(tcR?.ideal_min, 15, 'crecimiento: ideal'),
    ideal_max: o(tcR?.ideal_max, 25, 'crecimiento: ideal'),
    tolera_min: o(tcR?.tolera_min, TOLERA_MIN[helada], 'crecimiento: frío que tolera'),
    tolera_max: o(tcR?.tolera_max, 35, 'crecimiento: calor que tolera'),
  };
  return {
    ...r,
    slug,
    familia: FAMILIA_DE[slug] ?? 'otra',
    emoji: EMOJI[slug] ?? (r.grupo === 'Aromática' ? '🌿' : '🌱'),
    hmin,
    hideal: r.hideal ?? Math.max(hmin, 6),
    riego: o(r.riego, 'parejo' as RegimenRiego, 'riego'),
    dg: o(r.dg, { min: 7, max: 14 }, 'días de germinación'),
    dc: o(r.dc, esFlor ? { min: 60, max: 90 } : { min: 90, max: 120 }, 'días a cosecha'),
    tg,
    tc,
    helada,
    pasadas: PASADAS_HOJA[slug] ?? PASADAS_UNICA[slug] ?? PASADAS_GRUPO[r.grupo] ?? 1,
    marco: marcoDe(slug, r.grupo),
    perenne: PERENNES.includes(slug),
    flor: esFlor || slug === 'lavanda' || slug === 'borraja',
    fruto: r.grupo === 'Hortaliza de fruto' && slug !== 'choclo',
    sup: [...new Set(sup)],
  };
}

/**
 * Marco de plantación: cuánto lugar pide cada planta.
 *
 * [SUPUESTO] todo esto. huertapp todavía no trae distancias de plantación (#36): los centímetros de
 * abajo son los que se usan en la huerta agroecológica del conurbano, redondeados. De ahí salen la
 * huella (celdas de 0,5 m que ocupa una planta hecha) y cuántas entran en una celda.
 */
const MARCO_CM: Record<string, number> = {
  // hoja
  lechuga: 25,
  espinaca: 15,
  acelga: 30,
  rucula: 8,
  kale: 40,
  repollo: 45,
  radicchio: 30,
  berro: 15,
  apio: 25,
  brocoli: 45,
  coliflor: 45,
  'repollitos-de-bruselas': 50,
  'cebolla-de-verdeo': 8,
  // raíz y bulbo
  nabo: 10,
  zanahoria: 6,
  remolacha: 10,
  rabanito: 5,
  papa: 30,
  batata: 35,
  cebolla: 10,
  ajo: 12,
  puerro: 12,
  // fruto
  tomate: 50,
  pimiento: 40,
  'aji-picante': 40,
  berenjena: 50,
  'zapallito-de-tronco': 80,
  zapallo: 120,
  pepino: 40,
  melon: 100,
  sandia: 120,
  choclo: 25,
  frutilla: 25,
  // legumbres
  chaucha: 15,
  arveja: 8,
  haba: 20,
  // aromáticas
  albahaca: 25,
  perejil: 15,
  cilantro: 15,
  oregano: 30,
  tomillo: 25,
  romero: 60,
  salvia: 40,
  menta: 30,
  melisa: 30,
  ciboulette: 15,
  laurel: 120,
  eneldo: 20,
  lavanda: 60,
  // flores
  calendula: 25,
  copete: 20,
  borraja: 40,
  capuchina: 40,
  cosmos: 30,
  girasol: 40,
};
/** [SUPUESTO] cuánto levanta cada planta hecha, en metros: es lo que le hace sombra a lo que tiene al sur */
const ALTO_M: Record<string, number> = {
  choclo: 2.2,
  girasol: 2,
  chaucha: 1.8,
  pepino: 1.8,
  tomate: 1.6,
  laurel: 3,
  arveja: 1.2,
  haba: 1.2,
  cosmos: 1.2,
  eneldo: 1.2,
  romero: 1.2,
  berenjena: 1,
  'repollitos-de-bruselas': 0.9,
  pimiento: 0.8,
  'aji-picante': 0.8,
  kale: 0.8,
  borraja: 0.8,
  lavanda: 0.7,
  puerro: 0.7,
  brocoli: 0.7,
  coliflor: 0.6,
  papa: 0.6,
  ajo: 0.6,
  salvia: 0.6,
  melisa: 0.6,
  'zapallito-de-tronco': 0.6,
  apio: 0.5,
  cilantro: 0.5,
  calendula: 0.5,
  cebolla: 0.5,
  'cebolla-de-verdeo': 0.5,
  menta: 0.5,
  acelga: 0.45,
  nabo: 0.4,
  zanahoria: 0.4,
  repollo: 0.4,
  oregano: 0.4,
  zapallo: 0.4,
  perejil: 0.35,
  remolacha: 0.35,
  batata: 0.3,
  melon: 0.3,
  sandia: 0.3,
  radicchio: 0.3,
  rucula: 0.3,
  espinaca: 0.3,
  copete: 0.3,
  capuchina: 0.3,
  lechuga: 0.25,
  tomillo: 0.25,
  frutilla: 0.25,
  berro: 0.2,
  rabanito: 0.2,
};
const POR_GRUPO: Record<string, { cm: number; alto: number }> = {
  'Hortaliza de hoja': { cm: 25, alto: 0.35 },
  'Hortaliza de raíz/bulbo': { cm: 10, alto: 0.4 },
  'Hortaliza de fruto': { cm: 50, alto: 1 },
  Legumbre: { cm: 15, alto: 1.2 },
  Aromática: { cm: 30, alto: 0.5 },
  'Flor polinizadora': { cm: 30, alto: 0.6 },
};

/** Lo que ocupa una planta hecha. La celda del juego mide `celdaM` (0,5 m en todos los patios). */
export interface Marco {
  /** [SUPUESTO] centímetros entre plantas */
  cm: number;
  /** celdas que ocupa una planta: 1, 2 (dos de frente) o 4 (un cuadrado de 1 m) */
  huella: 1 | 2 | 4;
  /** cuántas entran en una celda de 0,5 m. Tope de 9: el juego no llega al marco más apretado, y con eso ya hay rompecabezas */
  porCelda: number;
  /** cuánto levanta cuando está hecha, en metros */
  alto: number;
}
export function marcoDe(slug: string, grupo: string): Marco {
  const g = POR_GRUPO[grupo] ?? { cm: 25, alto: 0.4 };
  const cm = MARCO_CM[slug] ?? g.cm;
  const huella: Marco['huella'] = cm > 90 ? 4 : cm > 55 ? 2 : 1;
  return {
    cm,
    huella,
    alto: ALTO_M[slug] ?? g.alto,
    porCelda: huella > 1 ? 1 : Math.min(9, Math.max(1, Math.floor(50 / cm) ** 2)),
  };
}
