/**
 * Guardar en el dispositivo (localStorage): el autoguardado y las tres ranuras. Es comodidad, nunca
 * requisito: si el navegador no deja (ventana privada, sin espacio), el juego sigue igual.
 */
import type { Almacen } from '../aplicacion/partidas';
import { migrar } from '../dominio';

/** La clave del autoguardado es la de siempre: cambiarla perdería las partidas guardadas. */
const CLAVE = 'huertita-v1';

interface Guardada {
  t: number;
  E: unknown;
}

/** Un almacén sobre una clave de un Storage. `envuelta`: guarda { t, E } (las ranuras) en vez de la partida sola. */
function enStorage(storage: () => Storage, clave: string, envuelta: boolean, nombre: string): Almacen {
  const leer = (): Guardada | null => {
    const t = storage().getItem(clave);
    if (!t) return null;
    const o = JSON.parse(t);
    // la marca de la hora está en `meta` desde la v4; antes, suelta
    return envuelta ? o : { t: o.meta?.guardado ?? o.guardado ?? 0, E: o };
  };
  return {
    nombre,
    async guardar(E) {
      storage().setItem(clave, JSON.stringify(envuelta ? { t: E.meta.guardado ?? 0, E } : E));
    },
    async cargar() {
      try {
        const g = leer();
        return g ? migrar(g.E) : null;
      } catch {
        return null;
      }
    },
    async mirar() {
      try {
        const g = leer(),
          E = g && migrar(g.E);
        return g && E ? { t: g.t, resumen: null, E } : null;
      } catch {
        return null;
      }
    },
  };
}

const local = (): Storage => globalThis.localStorage;

export const autoguardado = (storage: () => Storage = local): Almacen =>
  enStorage(storage, CLAVE, false, 'este dispositivo');
export const ranura = (n: number, storage: () => Storage = local): Almacen =>
  enStorage(storage, CLAVE + '-ranura-' + n, true, 'ranura ' + n);
export const RANURAS = [1, 2, 3];
