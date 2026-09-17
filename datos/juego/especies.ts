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

const FAMILIAS: Record<string, string> = { // botánica estándar
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

const EMOJI: Record<string, string> = { lechuga: '🥬', tomate: '🍅', zanahoria: '🥕', pimiento: '🫑', 'aji-picante': '🌶️', berenjena: '🍆', pepino: '🥒', choclo: '🌽', frutilla: '🍓', papa: '🥔', batata: '🍠', cebolla: '🧅', ajo: '🧄', brocoli: '🥦', sandia: '🍉', melon: '🍈', girasol: '🌻', calendula: '🌼', copete: '🌼', cosmos: '🌸', borraja: '💠', capuchina: '🏵️', lavanda: '🪻', chaucha: '🫛', arveja: '🫛', haba: '🫘', zapallo: '🎃' };

// [SUPUESTO] cuántas pasadas de cosecha da cada planta
const PASADAS_GRUPO: Record<string, number> = { 'Hortaliza de fruto': 6, Legumbre: 4, 'Aromática': 99 };
const PASADAS_HOJA: Record<string, number> = { acelga: 8, kale: 8, rucula: 4, espinaca: 4, perejil: 8, 'cebolla-de-verdeo': 4, apio: 4, berro: 4 };
const PASADAS_UNICA: Record<string, number> = { zapallo: 3, melon: 2, sandia: 2, choclo: 2 };
const PERENNES = 'oregano tomillo romero salvia menta melisa lavanda laurel ciboulette frutilla'.split(' ');

/** Una especie lista para el motor: sin huecos. */
export interface Especie extends Omit<EspecieRepo, 'hmin' | 'hideal' | 'riego' | 'dg' | 'dc' | 'tg' | 'tc' | 'helada'> {
  slug: string; familia: string; emoji: string;
  hmin: number; hideal: number; riego: RegimenRiego; dg: Rango; dc: Rango;
  tg: TempGerminacion<number>; tc: TempCrecimiento<number>; helada: Helada;
  pasadas: number; perenne: boolean; flor: boolean; fruto: boolean;
  /** campos de esta especie que son supuesto del juego y no dato de huertapp */
  sup: string[];
}

// [SUPUESTO] cuánto frío aguanta sin helada, si huertapp no lo dice, según cómo le cae la helada
const TOLERA_MIN: Record<Helada, number> = { muere: 2, sensible: 0, tolera: -5, mejora: -8 };

export function completar(slug: string, r: EspecieRepo): Especie {
  const sup: string[] = [];
  const o = <T>(v: T | null | undefined, porDefecto: T, campo: string): T => { if (v == null) { sup.push(campo); return porDefecto; } return v; };
  const helada = o(r.helada, 'tolera' as Helada, 'helada');
  const esFlor = r.grupo === 'Flor polinizadora';
  const hmin = o(r.hmin, 4, 'horas mínimas de sol');
  const tgR = r.tg, tcR = r.tc;
  const tg: TempGerminacion<number> = {
    min: o(tgR?.min, 8, 'germinación: mínima'), ideal_min: o(tgR?.ideal_min, 15, 'germinación: ideal'),
    ideal_max: o(tgR?.ideal_max, 25, 'germinación: ideal'), max: o(tgR?.max, 35, 'germinación: máxima'),
  };
  const tc: TempCrecimiento<number> = {
    ideal_min: o(tcR?.ideal_min, 15, 'crecimiento: ideal'), ideal_max: o(tcR?.ideal_max, 25, 'crecimiento: ideal'),
    tolera_min: o(tcR?.tolera_min, TOLERA_MIN[helada], 'crecimiento: frío que tolera'), tolera_max: o(tcR?.tolera_max, 35, 'crecimiento: calor que tolera'),
  };
  return {
    ...r, slug, familia: FAMILIA_DE[slug] ?? 'otra', emoji: EMOJI[slug] ?? (r.grupo === 'Aromática' ? '🌿' : '🌱'),
    hmin, hideal: r.hideal ?? Math.max(hmin, 6), riego: o(r.riego, 'parejo' as RegimenRiego, 'riego'),
    dg: o(r.dg, { min: 7, max: 14 }, 'días de germinación'), dc: o(r.dc, esFlor ? { min: 60, max: 90 } : { min: 90, max: 120 }, 'días a cosecha'),
    tg, tc, helada,
    pasadas: PASADAS_HOJA[slug] ?? PASADAS_UNICA[slug] ?? PASADAS_GRUPO[r.grupo] ?? 1,
    perenne: PERENNES.includes(slug), flor: esFlor || slug === 'lavanda' || slug === 'borraja', fruto: r.grupo === 'Hortaliza de fruto' && slug !== 'choclo',
    sup: [...new Set(sup)],
  };
}
