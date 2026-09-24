/**
 * Dónde se guarda la partida de esta interfaz: el dispositivo siempre, la nube si el artifact la
 * ofrece. La nube se busca al arrancar y puede tardar o no llegar nunca: la interfaz lo muestra.
 */
import { signal } from '@preact/signals';
import type { Almacen, Vistazo } from '../aplicacion/partidas';
import { autoguardado, ranura } from '../infra/dispositivo';
import { conectarDescargas, conectarNube, type Descargas } from '../infra/nube';
import { relojDelSistema } from '../infra/reloj';

export const almacenes: {
  local: Almacen;
  ranura: (n: number) => Almacen;
  nube: Almacen | null;
  descargas: Descargas | null;
  reloj: typeof relojDelSistema;
} = { local: autoguardado(), ranura: (n) => ranura(n), nube: null, descargas: null, reloj: relojDelSistema };

export const nube = signal<{ estado: 'buscando' | 'lista' | 'no'; remota: Vistazo | null; error: string }>({
  estado: 'buscando',
  remota: null,
  error: '',
});

/** Busca la nube y las descargas del artifact. Devuelve lo que hay en la nube, si hay algo. */
export async function conectar(): Promise<Vistazo | null> {
  void conectarDescargas().then((d) => (almacenes.descargas = d));
  const n = await conectarNube();
  almacenes.nube = n;
  if (!n) {
    nube.value = { estado: 'no', remota: null, error: '' };
    return null;
  }
  const remota = await n.mirar().catch(() => null);
  nube.value = { estado: 'lista', remota, error: '' };
  return remota;
}
