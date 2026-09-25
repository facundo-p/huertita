/**
 * El sonido en la interfaz: si está prendido (arranca apagado y se recuerda en este dispositivo),
 * qué suena con cada animación y el ambiente de la década que pasó. Con `prefers-reduced-motion` no
 * hay ambiente continuo, solo los sonidos cortos.
 */
import { effect, signal } from '@preact/signals';
import type { Efecto } from '../render/contrato';
import { crearParlante, mezcla, type Sonido } from '../sonido';
import { partida, version } from './estado';

const CLAVE = 'huertita-sonido';

/** Qué suena con cada animación; las que no están, no suenan. */
const SONIDO_DE: Partial<Record<Efecto, Sonido>> = {
  cosechar: 'pop',
  brote: 'pop',
  sembrar: 'tierra',
  trasplantar: 'tierra',
  polvo: 'tierra',
  mulch: 'tierra',
  compost: 'tierra',
  regar: 'agua',
  logro: 'campanita',
};

function recordado(): boolean {
  try {
    return globalThis.localStorage?.getItem(CLAVE) === 'si';
  } catch {
    return false;
  }
}
function reducido(): boolean {
  try {
    return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

const parlante = crearParlante();
/** si el sonido está prendido */
export const sonido = signal(false);

export function prenderSonido(si: boolean): void {
  sonido.value = si;
  parlante.prender(si);
  try {
    globalThis.localStorage?.setItem(CLAVE, si ? 'si' : 'no');
  } catch {
    // sin storage se prende igual, solo no se recuerda
  }
}
export const alternarSonido = (): void => prenderSonido(!sonido.value);

/** El sonido de una animación, si tiene. */
export function sonar(e: Efecto): void {
  const s = SONIDO_DE[e];
  if (s && sonido.value) parlante.sonar(s);
}

/**
 * Si quedó prendido de otra vez, se prende con el primer gesto (antes el navegador no deja sonar), y
 * el ambiente sigue al clima de la década.
 */
export function arrancarSonido(): void {
  if (recordado() && globalThis.document) {
    const alPrimerGesto = (): void => {
      document.removeEventListener('pointerdown', alPrimerGesto);
      if (!sonido.value) prenderSonido(true);
    };
    document.addEventListener('pointerdown', alPrimerGesto);
  }
  effect(() => {
    void version.value;
    const w = partida.value?.tiempo.clima;
    if (w) parlante.ambiente(mezcla(w, reducido()));
  });
}
