/**
 * Lo construido en el patio que no es una zona de cultivo. Hoy hay una sola clase, la compostera, y
 * cada patio trae la suya en su plantilla. Si una partida no tiene compostera, lo que iría a ella se
 * pierde y no hay compost para repartir.
 *
 * [REPO] compostaje.json: cada verde se tapa con secos, entre 1 y 3 por verde (lo más repetido, 2 a 1).
 * Con menos secos la pila se pudre y tarda; con muchos más, no pasa nada.
 */
import type { Patio } from '../../datos/juego/patio';
import { REGLAS } from '../../datos/juego/reglas';
import type { Compostera, Estado, Estructura, Mezcla } from './tipos';
import { r1 } from './util';

const COMPOST = REGLAS.compost;

export function compostera(E: Pick<Estado, 'mundo'>): Compostera | null {
  return E.mundo.estructuras.find((s) => s.tipo === 'compostera') ?? null;
}

/** Suma restos a la tanda abierta de la compostera, si hay: verdes (lo fresco) o secos (lo seco). */
export function alCompost(E: Pick<Estado, 'mundo'>, carga: number, que: 'verde' | 'seco' = 'verde'): void {
  const k = compostera(E);
  if (!k) return;
  if (que === 'verde') k.verdes = r1(k.verdes + carga);
  else k.secos = r1(k.secos + carga);
}

/** Secos por cada verde en una pila. Sin verdes, cuenta como si fuera todo seco. */
export function secosPorVerde(verdes: number, secos: number): number {
  if (verdes > 0) return secos / verdes;
  return secos > 0 ? Infinity : COMPOST.receta.ideal;
}

/** Cómo queda una pila según sus secos por verde. */
export function mezclaDe(verdes: number, secos: number): Mezcla {
  const r = secosPorVerde(verdes, secos);
  if (r < COMPOST.receta.min) return 'humeda';
  return r > COMPOST.receta.max ? 'seca' : 'pareja';
}

/** A qué ritmo avanza una tanda según su mezcla. */
const RITMO: Record<Mezcla, number> = { pareja: 1, humeda: COMPOST.ritmoHumeda, seca: COMPOST.ritmoSeca };
export const ritmoDe = (m: Mezcla): number => RITMO[m];

/**
 * Tapa los verdes de la tanda abierta con secos de la bolsa, hasta la receta. Es lo que se hace cada
 * vez que se echa un balde de restos. Devuelve cuánto usó.
 */
export function tapar(E: Pick<Estado, 'mundo' | 'recursos'>): number {
  const k = compostera(E);
  if (!k) return 0;
  const falta = k.verdes * COMPOST.receta.ideal - k.secos,
    usa = r1(Math.max(0, Math.min(falta, E.recursos.secos)));
  k.secos = r1(k.secos + usa);
  E.recursos.secos = r1(E.recursos.secos - usa);
  return usa;
}

/** Secos que hacen falta para enderezar una tanda húmeda. */
export const secosParaEnderezar = (): number => COMPOST.tanda * COMPOST.receta.min;

/** Dosis de compost listas para usar. */
export const dosisDeCompost = (E: Pick<Estado, 'mundo'>): number => compostera(E)?.dosis ?? 0;

/** Las estructuras con las que arranca una partida en este patio. */
export function estructurasIniciales(p: Patio, dosisDeCompost: number): Estructura[] {
  return p.estructuras.map((s) => ({ tipo: s.tipo, en: s.en, verdes: 0, secos: 0, tandas: [], dosis: dosisDeCompost }));
}
