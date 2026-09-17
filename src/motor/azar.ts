/** Azar con semilla guardada en el estado: misma semilla + mismas acciones = misma partida. */
import type { Estado } from './tipos';
export function azar(E: Pick<Estado, 'rng'>): number {
  E.rng = (E.rng + 0x6D2B79F5) | 0;
  let t = Math.imul(E.rng ^ (E.rng >>> 15), 1 | E.rng);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function gauss(E: Pick<Estado, 'rng'>): number { return Math.sqrt(-2 * Math.log(azar(E) + 1e-9)) * Math.cos(6.2831853 * azar(E)); }
