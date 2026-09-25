/** Las razones del fantasma de siembra: por qué una celda es buena, regular o mala para una especie. */
import type { Especie } from '../tipos';

export const noEntra = (sp: Especie): string =>
  sp.nombre + ' hecha ocupa ' + sp.marco.huella + ' celdas y ahí no entran.';
export const pocaLuz = (sp: Especie, horas: number): string =>
  'Poca luz: ' + horas + ' h ahora, pide ' + sp.hmin + '–' + sp.hideal + ' h. ' + sp.luzNo;
export const malSuelo = (sp: Especie, tiene: string, pide: string): string =>
  'El suelo no le gusta (' + tiene + ', pide ' + pide + '). ' + sp.sueloNo;
export const macetaChica = (litros: number, hondo: number): string =>
  'La maceta le queda chica: pide ' + litros + ' L y ' + hondo + ' cm de hondo.';
export const malVecino = (nombres: string[]): string => 'Mal vecino: ' + nombres.join(', ') + '.';
export const buenVecino = (nombres: string[]): string => 'Buen vecino: ' + nombres.join(', ') + '.';
export const rotar = (familia: string): string => 'Acá recién hubo otra ' + familia + ': conviene rotar.';
export const fueraDeEpoca = (enElLugar: string): string => `Fuera de época de siembra ${enElLugar}.`;
export const epocaPosible = (): string => 'Época posible, no ideal.';
export const sueloFrio = (t: number, necesita: number, enAlmacigo: boolean): string =>
  'Suelo frío para germinar (~' +
  Math.round(t) +
  ' °C, necesita ' +
  necesita +
  ' °C)' +
  (enAlmacigo ? '.' : ': probá en la almaciguera.');
export const sueloCaliente = (): string => 'Suelo demasiado caliente para germinar.';
export const noToleraTrasplante = (sp: Especie): string =>
  sp.nombre + ' no tolera el trasplante: va de siembra directa.';
