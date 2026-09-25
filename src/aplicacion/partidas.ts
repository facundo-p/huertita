/**
 * Guardar y cargar partidas: los casos de uso y el puerto que implementan los adaptadores de
 * `src/infra/` (dispositivo, ranuras, nube). La vista llama a esto sin saber dónde queda guardado.
 */
import * as M from '../dominio';
import type { Estado } from '../dominio';
import { resumenDePartida } from './consultas';

/** Un lugar donde se guarda una partida. Cualquiera puede fallar (sin espacio, sin permiso, sin red). */
export interface Almacen {
  readonly nombre: string;
  guardar(E: Estado, resumen: string): Promise<void>;
  /** la partida guardada, ya migrada a la versión de hoy; null si no hay o no se puede leer */
  cargar(): Promise<Estado | null>;
  /** qué hay guardado y cuándo, para mostrarlo antes de cargarlo */
  mirar(): Promise<Vistazo | null>;
}
/** Lo que se muestra de una partida guardada: el resumen que se guardó con ella, o la partida para armarlo. */
export interface Vistazo {
  t: number;
  resumen: string | null;
  E: Estado | null;
}
/** El resumen de una partida guardada. */
export const resumenDe = (v: Vistazo): string => v.resumen ?? (v.E ? resumenDePartida(v.E) : '');

/** La hora, para anotar cuándo se guardó. Se inyecta para poder probar sin reloj. */
export interface Reloj {
  ahora(): number;
}

/** Guarda la partida y anota cuándo. Devuelve si se pudo. */
export async function guardar(E: Estado, donde: Almacen, reloj: Reloj): Promise<boolean> {
  E.meta.guardado = reloj.ahora();
  try {
    await donde.guardar(E, resumenDePartida(E));
    return true;
  } catch {
    return false;
  }
}

/** Una partida nueva en un patio. La semilla sale de la hora: cada partida es distinta. */
export const nueva = (patio: string, reloj: Reloj): Estado =>
  M.crearPartida((reloj.ahora() % 2147483647) | 0, { patio });

// ── el código para llevar una partida a otro dispositivo ──
const PREFIJO = 'HUERTITA1:';

function aBase64(texto: string): string {
  let bin = '';
  for (const b of new TextEncoder().encode(texto)) bin += String.fromCharCode(b);
  return btoa(bin);
}
function deBase64(b64: string): string {
  const bin = atob(b64.replace(/\s+/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** Un texto que se copia y se pega: la partida entera, con el cuaderno recortado para que no pese. */
export function aCodigo(E: Estado): string {
  const copia = JSON.parse(JSON.stringify(E)) as Estado;
  copia.progreso.cuaderno = copia.progreso.cuaderno.slice(-40);
  return PREFIJO + aBase64(JSON.stringify(copia));
}

/** Lee un código o el contenido de un archivo guardado. null si no es una partida. */
export function deCodigo(texto: string): Estado | null {
  try {
    const t = String(texto || '').trim();
    return M.migrar(JSON.parse(t.startsWith(PREFIJO) ? deBase64(t.slice(PREFIJO.length)) : t));
  } catch {
    return null;
  }
}

/** El nombre del archivo que se baja: año y fecha del juego. */
export const nombreDeArchivo = (E: Estado): string =>
  'huertita-año' + E.tiempo.anio + '-' + M.fechaDe(E.tiempo.dec).replace(/ /g, '-') + '.json';
