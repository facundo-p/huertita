/**
 * Bajar la partida como archivo. En el artifact de Claude, por su capacidad de descargas (el
 * navegador ahí bloquea los enlaces de descarga); fuera de él, con un enlace común.
 */
import type { Descargas } from './nube';

export type Bajada = 'ok' | 'cancelada' | 'no-se-pudo';

export async function bajarArchivo(nombre: string, datos: string, descargas: Descargas | null): Promise<Bajada> {
  if (descargas) {
    try {
      await descargas.save({ filename: nombre, data: datos });
      return 'ok';
    } catch (e) {
      return (e as { code?: string })?.code === 'declined' ? 'cancelada' : 'no-se-pudo';
    }
  }
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([datos], { type: 'application/json' }));
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return 'ok';
  } catch {
    return 'no-se-pudo';
  }
}
