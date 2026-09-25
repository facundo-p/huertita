/** Azar con semilla guardada en el estado: misma semilla + mismas acciones = misma partida. */
import type { Estado } from './tipos';
export function azar(E: Pick<Estado, 'meta'>): number {
  E.meta.rng = (E.meta.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(E.meta.rng ^ (E.meta.rng >>> 15), 1 | E.meta.rng);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function gauss(E: Pick<Estado, 'meta'>): number {
  return Math.sqrt(-2 * Math.log(azar(E) + 1e-9)) * Math.cos(6.2831853 * azar(E));
}

/**
 * Una tirada que no consume la secuencia de la partida: sale de la semilla, el turno y una sal. La
 * usan los eventos sorpresa, para que sumar una fila a la tabla no le cambie a nadie el clima ni las
 * plagas. Misma semilla, mismo turno y misma sal: mismo número.
 */
export function tirada(E: Pick<Estado, 'meta' | 'tiempo'>, sal: string): number {
  let h = Math.imul(E.meta.semilla ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ E.tiempo.turno, 0x27d4eb2d);
  for (let i = 0; i < sal.length; i++) h = Math.imul(h ^ sal.charCodeAt(i), 0x01000193);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
