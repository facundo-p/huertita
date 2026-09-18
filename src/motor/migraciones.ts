/**
 * Migraciones de partidas guardadas.
 * Regla: si cambia la forma de `Estado`, se sube `v` y se agrega acá el paso de la versión
 * anterior a la nueva. Nunca se rompe una partida guardada de alguien.
 */
import { PATIOS } from './patio';
import type { Estado } from './tipos';

export const VERSION = 3;
type Guardada = Record<string, any>;

/** Cada paso lleva una partida de la versión de su clave a la siguiente. */
const PASOS: Record<number, (e: Guardada) => void> = {
  // v1 → v2 (0.6): el patio pasa a ser un dato. Todas las partidas v1 son del fondo, y el microtúnel,
  // que era un sí/no, pasa a anotarse por zona.
  1: (e) => { e.patio = 'fondo'; e.tunel = e.tunel ? { elevado: true } : {}; e.v = 2; },
  // v2 → v3 (0.8): una planta puede ocupar varias celdas (`pl.celdas`). Las partidas v2 se jugaron
  // todas con una planta por celda, así que no hay nada que llenar: el ancla alcanza.
  2: (e) => { e.v = 3; },
};

export function esPartidaValida(E: unknown): E is Estado {
  const e = E as Partial<Estado> | null;
  return !!(e && typeof e === 'object' && e.v === VERSION && e.celdas && e.plantas && e.prox && typeof e.patio === 'string' && PATIOS[e.patio]);
}
/** Lleva cualquier partida vieja a la forma actual. Devuelve null si no se puede. */
export function migrar(E: unknown): Estado | null {
  const e = E as Guardada | null;
  if (!e || typeof e !== 'object' || typeof e.v !== 'number' || !e.celdas || !e.plantas || !e.prox) return null;
  // partidas del prototipo anteriores a la almaciguera real: no tenían n ni semillas, ni mantas
  for (const pl of Object.values<Guardada>(e.plantas)) { if (pl.n == null) pl.n = pl.etapa === 'semilla' ? 0 : 1; if (pl.semillas == null) pl.semillas = 1; }
  if (!e.manta) e.manta = {};
  while (e.v < VERSION) { const paso = PASOS[e.v]; if (!paso) return null; paso(e); }
  return esPartidaValida(e) ? e : null;
}
