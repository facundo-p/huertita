/**
 * La nube del artifact de Claude: una carpeta privada de cada persona, para seguir en el celular
 * lo que se empezó en la compu. Si el artifact no la ofrece (archivo suelto, otro navegador), no hay
 * nube y todo lo demás funciona igual.
 */
import type { Almacen } from '../aplicacion/partidas';
import { migrar } from '../dominio';

interface Documento {
  get(): Promise<{ exists: boolean; data(): { t: number; resumen: string; json: string } }>;
  set(d: { t: number; resumen: string; json: string }): Promise<void>;
}
/** Lo que el juego usa del runtime de artifacts (`window.claude`). */
export interface RuntimeDeClaude {
  use(capacidad: 'db'): Promise<{ doc(ruta: string): Documento } | null>;
  use(capacidad: 'user'): Promise<{ id(): Promise<string | null> } | null>;
  use(capacidad: 'downloads'): Promise<Descargas | null>;
}
export interface Descargas {
  save(a: { filename: string; data: string }): Promise<void>;
}

export const runtime = (): RuntimeDeClaude | null => (globalThis as { claude?: RuntimeDeClaude }).claude ?? null;

/** Se conecta a la nube de la persona. null si no hay. */
export async function conectarNube(cl: RuntimeDeClaude | null = runtime()): Promise<Almacen | null> {
  if (!cl?.use) return null;
  try {
    const [db, user] = await Promise.all([cl.use('db'), cl.use('user')]);
    const id = db && user ? await user.id() : null;
    if (!db || !id) return null;
    const doc = db.doc('data/users/' + id + '/auto');
    return {
      nombre: 'la nube',
      async guardar(E, resumen) {
        await doc.set({ t: E.meta.guardado ?? 0, resumen, json: JSON.stringify(E) });
      },
      async cargar() {
        const snap = await doc.get();
        return snap.exists ? migrar(JSON.parse(snap.data().json)) : null;
      },
      async mirar() {
        const snap = await doc.get();
        return snap.exists ? { t: snap.data().t, resumen: snap.data().resumen, E: null } : null;
      },
    };
  } catch {
    return null;
  }
}

/** La capacidad de bajar archivos del artifact, si la hay. */
export async function conectarDescargas(cl: RuntimeDeClaude | null = runtime()): Promise<Descargas | null> {
  try {
    return (await cl?.use('downloads')) ?? null;
  } catch {
    return null;
  }
}
