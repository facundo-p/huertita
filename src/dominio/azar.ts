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
