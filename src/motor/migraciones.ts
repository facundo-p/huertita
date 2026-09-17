/**
 * Migraciones de partidas guardadas.
 * Regla: si cambia la forma de `Estado`, se sube `v` y se agrega acá el paso de la versión
 * anterior a la nueva. Nunca se rompe una partida guardada de alguien.
 */
import type { Estado } from './tipos';

export function esPartidaValida(E: unknown): E is Estado {
  const e = E as Partial<Estado> | null;
  return !!(e && typeof e === 'object' && e.v === 1 && e.celdas && e.plantas && e.prox);
}
/** Lleva cualquier partida vieja a la forma actual. Devuelve null si no se puede. */
export function migrar(E: unknown): Estado | null {
  if (!esPartidaValida(E)) return null;
  // v1 → v1: partidas del prototipo anteriores a la almaciguera real no tenían n ni semillas
  for (const pl of Object.values(E.plantas)) { if (pl.n == null) pl.n = pl.etapa === 'semilla' ? 0 : 1; if (pl.semillas == null) pl.semillas = 1; }
  if (!E.manta) E.manta = {};
  return E;
}
