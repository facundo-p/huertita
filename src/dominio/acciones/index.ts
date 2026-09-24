/**
 * Todo lo que puede hacer el jugador, como reglas (ver `regla.ts`). `despachar` es la única puerta:
 * pregunta si se puede, cobra los ratos, aplica, y anota en el diario de cada planta lo que le tocó.
 */
import { apuntar } from '../diario';
import { ratosLibres } from '../estado';
import type { Accion, Estado, Evento, Resultado } from '../tipos';
import * as T from '../textos/acciones';
import { arrancar, cosechar, ralear, semillar } from './cosechar';
import { compost, mulch, tratar, tutorar } from './cuidados';
import type { Regla } from './regla';
import { sembrar } from './sembrar';
import { puedeMoverse, trasplantar } from './trasplantar';
import { manta, riego, seguir, tunel } from './zonas';

export { puedeMoverse };
export type { Regla };

const ACCIONES: { [T in Accion['tipo']]: Regla<Extract<Accion, { tipo: T }>> } = {
  sembrar,
  trasplantar,
  cosechar,
  semillar,
  ralear,
  arrancar,
  tutorar,
  tratar,
  mulch,
  compost,
  riego,
  tunel,
  manta,
  seguir,
};
const reglaDe = (a: Accion): Regla<Accion> | undefined => ACCIONES[a.tipo] as Regla<Accion> | undefined;

/**
 * Si se puede hacer esta acción ahora; si no, por qué. No cambia nada: es lo que usa la interfaz.
 * Con `sinMirarRatos` responde si la acción tiene sentido aunque esta década ya no alcancen los
 * ratos: la interfaz muestra igual el botón, y al tocarlo explica que faltan ratos.
 */
export function puede(E: Estado, accion: Accion, opciones: { sinMirarRatos?: boolean } = {}): string | null {
  if (E.terminado && accion.tipo !== 'seguir') return T.anioTerminado();
  const regla = reglaDe(accion);
  if (!regla) return T.desconocida((accion as { tipo: string }).tipo);
  const razon = regla.puede(E, accion);
  if (razon || opciones.sinMirarRatos) return razon;
  const costo = regla.costo(E, accion);
  if (costo > 0 && ratosLibres(E) < costo) return regla.sinRatos ?? T.sinRatos();
  return null;
}

export function despachar(E: Estado, accion: Accion): Resultado {
  const razon = puede(E, accion);
  if (razon) return { ok: false, error: razon };
  const regla = reglaDe(accion)!,
    evs: Evento[] = [];
  E.ratosGastados += regla.costo(E, accion);
  regla.aplicar(E, accion, evs);
  // lo que el jugador le hizo a una planta queda también en el diario de esa planta
  for (const e of evs) {
    const id = e.celda && E.celdas[e.celda]?.planta,
      pl = id ? E.plantas[id] : null;
    if (pl) apuntar(E, pl, e.tipo, { codigo: e.codigo ?? '', texto: e.texto });
  }
  return { ok: true, eventos: evs };
}
