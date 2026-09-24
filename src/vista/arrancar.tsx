/**
 * Arranque de la interfaz: carga la partida guardada (o arranca una nueva), monta la App y busca la
 * nube. Si la página se republica con alguien jugando (el artifact de Claude), la partida sigue.
 */
import { render } from 'preact';
import { nueva } from '../aplicacion/partidas';
import * as M from '../dominio';
import type { Estado } from '../dominio';
import { App } from './App';
import { interaccion, partida, tocada } from './estado';
import { activo } from './efectos';
import { escenaActual, usarPartida } from './mensajes';
import { almacenes, conectar } from './persistencia';

interface Hot {
  snapshot?(f: () => unknown): void;
  ready?(f: (datos: unknown) => void): void;
  data?: unknown;
}

async function partidaInicial(previa: unknown): Promise<{ E: Estado; guardada: boolean }> {
  const deAntes = M.migrar(previa);
  if (deAntes) return { E: deAntes, guardada: true };
  const local = await almacenes.local.cargar();
  if (local) return { E: local, guardada: true };
  return { E: nueva(M.PLANTILLA_INICIAL, almacenes.reloj), guardada: false };
}

async function empezar(raiz: HTMLElement, previa: unknown): Promise<void> {
  const { E, guardada } = await partidaInicial(previa);
  partida.value = E;
  interaccion.value = { modo: E.tiempo.terminado ? { modo: 'fin' } : { modo: 'inicio' }, sel: null };
  tocada();
  render(<App />, raiz);
  const remota = await conectar();
  // sin partida en este dispositivo, se sigue la de la nube si hay
  if (!guardada && remota && almacenes.nube && partida.value.tiempo.turno === 0) {
    const deLaNube = await almacenes.nube.cargar();
    if (deLaNube) usarPartida(deLaNube, 'Seguís la partida que tenías en la nube.');
  }
}

export function arrancar(raiz: HTMLElement): void {
  const hot = (globalThis as { claude?: { hot?: Hot } }).claude?.hot;
  if (hot?.snapshot) hot.snapshot(() => partida.value);
  if (hot?.ready) hot.ready((datos) => void empezar(raiz, datos));
  else void empezar(raiz, hot?.data);
  // para el humo y las capturas: la partida, la escena, el renderer montado y el dominio, a mano desde la consola
  (globalThis as { Huertita?: unknown }).Huertita = {
    ui: {
      get E() {
        return partida.value;
      },
      get escena() {
        return escenaActual();
      },
      get renderer() {
        return activo.value;
      },
    },
    Motor: M,
  };
}
