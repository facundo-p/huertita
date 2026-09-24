/**
 * El estado de la interfaz, en signals: lo que cambia se vuelve a dibujar solo.
 *
 * La partida se muta en el lugar (el dominio trabaja así, y el test dorado lo exige), así que no
 * alcanza con que cambie la referencia: después de cada cambio se llama `tocada()` y todo lo que
 * lee la partida con `usarPartida()` se entera.
 */
import { signal } from '@preact/signals';
import type { Estado, Evento } from '../dominio';
import type { Interaccion } from './modos';

export const partida = signal<Estado>(null as unknown as Estado);
/** sube cada vez que la partida cambia por dentro */
export const version = signal(0);
export const tocada = (): void => {
  version.value++;
};
/** Lee la partida y se suscribe a sus cambios. */
export function usarPartida(): Estado {
  void version.value;
  return partida.value;
}

export const interaccion = signal<Interaccion>({ modo: { modo: 'inicio' }, sel: null });
/** lo último que pasó, para el resumen: lo que anotó la década o la última acción */
export const ultimos = signal<Evento[]>([]);
/** un error de una acción, con su explicación */
export const aviso = signal('');
/** una confirmación que se muestra una sola vez ("Guardada en la ranura 2.") */
export const nota = signal('');

/** cómo se mira el patio */
export const capa = signal<'sol' | null>(null);
export const camara = signal(0);
export const renderer = signal(0);
export const zonaCerca = signal<string | null>(null);
/** animación de clima después de pasar la década */
export const animar = signal<'lluvia' | 'helada' | 'calor' | null>(null);

/** si el navegador no deja guardar en el dispositivo */
export const sinStorage = signal(false);
