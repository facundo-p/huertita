/** Textos de la partida y del paso del tiempo: el clima de cada década, el compost, los logros, el año. */
import type { Caracter } from '../clima';
import type { Tiempo } from '../tipos';
import { cap } from '../util';
import { frase, type Frase } from './frase';

export function climaDeLaDecada(fecha: string, w: Tiempo): Frase {
  const lluvia = w.lluvia < 8 ? 'casi sin lluvia' : w.lluvia + ' mm de lluvia';
  let cierre = '.';
  if (w.helada) cierre = '. HELÓ.';
  else if (w.ola) cierre = '. Ola de calor.';
  return frase('clima.decada', cap(fecha) + ': máx ' + w.tmax + ' °C, mín ' + w.tmin + ' °C, ' + lluvia + cierre);
}
export const anioTerminado = (): Frase =>
  frase('partida.fin-de-anio', 'Pasó un año entero en la huerta. Mirá el balance.');
export const empiezaAnio = (anio: number): Frase =>
  frase('partida.nuevo-anio', 'Empieza el año ' + anio + '. La tierra y las semillas que guardaste siguen con vos.');
export const arranca = (fecha: string, c: Caracter): Frase =>
  frase('partida.arranca', 'Arranca la huerta a ' + fecha + '. ' + c.nombre + ': ' + c.texto);
export const bienvenida = (texto: string): Frase => frase('partida.bienvenida', texto);
export const logro = (titulo: string, especies: string[]): Frase =>
  frase('logro', 'Logro: ' + titulo + '. Una vecina te pasa sobres de ' + especies.join(', ') + '.');
