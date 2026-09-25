/**
 * En qué está la interfaz. Cada modo lleva solo lo que le hace falta: no existe "trasplantando sin
 * planta" ni "sobre elegido fuera de la siembra". Las transiciones están en `transicion` (#50).
 */
import type { Accion, CeldaId } from '../dominio';

export type ModoUI =
  | { modo: 'inicio' }
  | { modo: 'semillas'; sobre: string | null }
  | { modo: 'celda' }
  | { modo: 'moviendo'; planta: string; desde: CeldaId }
  | { modo: 'ficha'; slug: string }
  | { modo: 'almanaque' }
  | { modo: 'riego' }
  | { modo: 'proteger' }
  | { modo: 'compost' }
  | { modo: 'cuaderno' }
  | { modo: 'logros' }
  | { modo: 'partidas'; verCodigo: boolean }
  | { modo: 'patios' }
  | { modo: 'resumen' }
  | { modo: 'fin' };
export type NombreDeModo = ModoUI['modo'];

/** Lo que la persona está haciendo: el modo y la celda elegida (que sirve en varios modos). */
export interface Interaccion {
  modo: ModoUI;
  sel: CeldaId | null;
}

/** El modo con sus valores de arranque, para los botones que llevan a cada uno. */
export function modoNuevo(nombre: Exclude<NombreDeModo, 'moviendo' | 'ficha'>): ModoUI {
  switch (nombre) {
    case 'semillas':
      return { modo: 'semillas', sobre: null };
    case 'partidas':
      return { modo: 'partidas', verCodigo: false };
    default:
      return { modo: nombre };
  }
}

/** Lo que puede pasar en la interfaz. */
export type EventoUI =
  | { tipo: 'tocar'; celda: CeldaId }
  | { tipo: 'ir'; modo: Exclude<NombreDeModo, 'moviendo' | 'ficha'> }
  | { tipo: 'sobre'; slug: string }
  | { tipo: 'ficha'; slug: string }
  | { tipo: 'sembrarDesdeFicha'; slug: string }
  | { tipo: 'irACelda'; celda: CeldaId }
  | { tipo: 'mover'; planta: string }
  | { tipo: 'cancelar' }
  | { tipo: 'zona' }
  | { tipo: 'verCodigo' }
  | { tipo: 'decadaPasada'; terminado: boolean }
  | { tipo: 'partidaNueva'; terminada: boolean }
  | { tipo: 'partidaCargada'; terminada: boolean };

/** Lo que la transición necesita saber de la partida, sin depender de su forma. */
export interface Patio {
  existe(celda: CeldaId): boolean;
  libre(celda: CeldaId): boolean;
}

/** El resultado de un evento: cómo queda la interacción y, si corresponde, qué acción despachar. */
export interface Transicion {
  i: Interaccion;
  accion?: Accion;
  /** cómo queda si la acción no se pudo hacer (por defecto, `i`) */
  siFalla?: Interaccion;
}

const quieto = (i: Interaccion): Transicion => ({ i });

function tocar(i: Interaccion, celda: CeldaId, P: Patio): Transicion {
  const { modo } = i;
  if (!P.existe(celda)) return quieto({ modo: modo.modo === 'celda' ? { modo: 'inicio' } : modo, sel: null });
  if (modo.modo === 'moviendo')
    return {
      accion: { tipo: 'trasplantar', planta: modo.planta, celda },
      i: { modo: { modo: 'celda' }, sel: celda },
      siFalla: i,
    };
  if (modo.modo === 'semillas' && modo.sobre && P.libre(celda)) {
    if (i.sel !== celda) return quieto({ ...i, sel: celda });
    return { accion: { tipo: 'sembrar', slug: modo.sobre, celda }, i: { modo, sel: null } };
  }
  return quieto({ modo: { modo: 'celda' }, sel: celda });
}

type Manejador<T extends EventoUI['tipo']> = (
  i: Interaccion,
  ev: Extract<EventoUI, { tipo: T }>,
  P: Patio,
) => Transicion;

/** Qué hace cada evento. Una fila por evento: el modo nuevo, y la acción del juego si hace falta. */
const MANEJADORES: { [T in EventoUI['tipo']]: Manejador<T> } = {
  tocar: (i, ev, P) => tocar(i, ev.celda, P),
  // volver a la siembra no suelta el sobre que ya estaba elegido
  ir: (i, ev) =>
    quieto(ev.modo === 'semillas' && i.modo.modo === 'semillas' ? i : { modo: modoNuevo(ev.modo), sel: i.sel }),
  sobre: (i, ev, P) => {
    const m = i.modo,
      sobre = m.modo === 'semillas' && m.sobre === ev.slug ? null : ev.slug;
    // si la celda elegida está ocupada, deja de estar elegida: ahí no se siembra
    return quieto({ modo: { modo: 'semillas', sobre }, sel: i.sel && P.libre(i.sel) ? i.sel : null });
  },
  ficha: (i, ev) => quieto({ modo: { modo: 'ficha', slug: ev.slug }, sel: i.sel }),
  sembrarDesdeFicha: (_i, ev) => quieto({ modo: { modo: 'semillas', sobre: ev.slug }, sel: null }),
  irACelda: (i, ev, P) => quieto(P.existe(ev.celda) ? { modo: { modo: 'celda' }, sel: ev.celda } : i),
  mover: (i, ev) => quieto(i.sel ? { modo: { modo: 'moviendo', planta: ev.planta, desde: i.sel }, sel: i.sel } : i),
  cancelar: (i) => quieto(i.modo.modo === 'moviendo' ? { modo: { modo: 'celda' }, sel: i.modo.desde } : i),
  zona: (i) => quieto({ modo: i.modo.modo === 'celda' ? { modo: 'inicio' } : i.modo, sel: null }),
  verCodigo: (i) =>
    quieto(i.modo.modo === 'partidas' ? { ...i, modo: { modo: 'partidas', verCodigo: !i.modo.verCodigo } } : i),
  decadaPasada: (i, ev, P) =>
    quieto({ modo: { modo: ev.terminado ? 'fin' : 'resumen' }, sel: i.sel && P.existe(i.sel) ? i.sel : null }),
  partidaNueva: () => quieto({ modo: { modo: 'inicio' }, sel: null }),
  partidaCargada: (_i, ev) =>
    quieto({ modo: ev.terminada ? { modo: 'fin' } : { modo: 'partidas', verCodigo: false }, sel: null }),
};

/**
 * Cómo cambia la interfaz con cada cosa que pasa. Pura: no toca la partida ni el DOM. Si hace falta
 * una acción del juego, la devuelve para que la despache quien llama (ver `mensajes.ts`).
 */
export function transicion(i: Interaccion, ev: EventoUI, P: Patio): Transicion {
  return (MANEJADORES[ev.tipo] as Manejador<EventoUI['tipo']>)(i, ev as never, P);
}

/** Después de una acción, lo que ya no tiene sentido se suelta: un sobre sin semillas, una planta que ya no está. */
export function normalizar(
  i: Interaccion,
  sobres: Record<string, number>,
  hayPlanta: (id: string) => boolean,
): Interaccion {
  const { modo } = i;
  if (modo.modo === 'semillas' && modo.sobre && !(sobres[modo.sobre] > 0))
    return { ...i, modo: { modo: 'semillas', sobre: null } };
  if (modo.modo === 'moviendo' && !hayPlanta(modo.planta)) return { ...i, modo: { modo: 'celda' } };
  return i;
}
