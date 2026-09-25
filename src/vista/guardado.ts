/**
 * Lo que hace el panel de partidas: ranuras, nube, archivo, código, partida nueva. Cada operación
 * cuenta cómo le fue en la nota (salió) o en el aviso (no salió, y qué hacer).
 */
import { resumenDePartida } from '../aplicacion/consultas';
import { aCodigo, deCodigo, guardar as guardarEn, nombreDeArchivo, nueva } from '../aplicacion/partidas';
import { bajarArchivo } from '../infra/archivo';
import { aviso, nota, partida } from './estado';
import { cambiarPartida } from './mensajes';
import { almacenes, nube } from './persistencia';

const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));

export async function guardarEnRanura(n: number): Promise<void> {
  const ok = await guardarEn(copia(partida.value), almacenes.ranura(n), almacenes.reloj);
  if (ok) nota.value = 'Guardada en la ranura ' + n + '.';
  else aviso.value = 'Este navegador no deja guardar acá. Usá el código o la nube.';
}
export async function cargarRanura(n: number): Promise<void> {
  const E = await almacenes.ranura(n).cargar();
  if (E) cambiarPartida(E, 'Cargué la ranura ' + n + '.');
}

/** Sube la partida a la nube. A mano, avisa; sola (al pasar la década), solo actualiza lo que se muestra. */
export async function subirANube(aMano: boolean): Promise<void> {
  const donde = almacenes.nube;
  if (!donde) return;
  try {
    await donde.guardar(partida.value, resumenDePartida(partida.value));
    nube.value = { ...nube.value, remota: await donde.mirar(), error: '' };
    if (aMano) nota.value = 'Subida a la nube.';
  } catch (e) {
    const llena = (e as { code?: string })?.code === 'quota_exceeded';
    nube.value = { ...nube.value, error: llena ? 'La nube está llena.' : 'No se pudo subir a la nube ahora.' };
  }
}
export async function traerDeLaNube(): Promise<void> {
  try {
    const E = await almacenes.nube?.cargar();
    if (E) cambiarPartida(E, 'Traje la partida de la nube.');
    else aviso.value = 'No hay partida en la nube todavía.';
  } catch {
    aviso.value = 'No se pudo leer la nube ahora.';
  }
}

export async function bajar(): Promise<void> {
  const E = partida.value,
    r = await bajarArchivo(nombreDeArchivo(E), JSON.stringify(E), almacenes.descargas);
  if (r === 'ok') nota.value = 'Archivo guardado.';
  if (r === 'no-se-pudo') aviso.value = 'No se pudo bajar el archivo acá. Usá el código.';
}

export const codigoDeLaPartida = (): string => aCodigo(partida.value);

/** Copia el código. Si el navegador no deja, lo deja seleccionado para copiarlo a mano. */
export function copiar(texto: HTMLTextAreaElement): void {
  texto.focus();
  texto.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    /* sin permiso */
  }
  if (!ok) void navigator.clipboard?.writeText(texto.value).catch(() => undefined);
  nota.value = ok ? 'Código copiado.' : 'Quedó seleccionado: copialo con el menú del teléfono o Ctrl+C.';
}

export function importar(texto: string): void {
  const E = deCodigo(texto);
  if (E) cambiarPartida(E, 'Partida cargada.');
  else aviso.value = 'Eso no parece una partida de Huertita. Pegá el código completo, desde HUERTITA1.';
}

export function empezarEn(patio: string): void {
  cambiarPartida(nueva(patio, almacenes.reloj), '', true);
}
