/**
 * Qué suena de fondo según el clima de la década: la lluvia, los pájaros y las chicharras. Es una
 * cuenta pura (sin audio) para poder probarla: la síntesis está en `sintes.ts`.
 *
 * Con `prefers-reduced-motion` no hay ambiente continuo; los sonidos cortos, que responden a lo que
 * hace el que juega, siguen.
 */

/** Lo que el sonido necesita saber de la década que pasó. */
export interface Ambiente {
  /** mm de lluvia de la década */
  lluvia: number;
  estacion: string;
  helada: boolean;
  ola: boolean;
}

export interface Mezcla {
  /** volumen de la lluvia, de 0 a 1 */
  lluvia: number;
  /** cada cuántos segundos canta un pájaro, en promedio; null si no cantan */
  pajaros: number | null;
  /** chicharras de fondo (en las olas de calor) */
  chicharras: boolean;
}

export const SILENCIO: Mezcla = { lluvia: 0, pajaros: null, chicharras: false };

/** mm de la década desde los que se oye llover, y los que suenan a lluvia fuerte */
const LLUVIA_DESDE = 8,
  LLUVIA_FUERTE = 60;
/** con esta lluvia los pájaros se callan */
const LLUVIA_SIN_PAJAROS = 30;
/** cada cuántos segundos canta un pájaro según la estación: la primavera es la más cantora */
const PAJAROS: Record<string, number> = { primavera: 3, verano: 5, otoño: 8, invierno: 13 };

export function mezcla(a: Ambiente, reducido: boolean): Mezcla {
  if (reducido) return SILENCIO;
  const lluvia = Math.min(1, Math.max(0, (a.lluvia - LLUVIA_DESDE) / (LLUVIA_FUERTE - LLUVIA_DESDE)));
  const callados = a.helada || a.lluvia >= LLUVIA_SIN_PAJAROS;
  return {
    lluvia,
    pajaros: callados ? null : (PAJAROS[a.estacion] ?? PAJAROS.otoño),
    chicharras: a.ola && lluvia === 0,
  };
}
