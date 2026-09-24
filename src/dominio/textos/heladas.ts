/**
 * Textos de las heladas. Cuando una helada mata o daña, el cuaderno dice qué abrigo tenía y qué la
 * habría salvado; qué frase va lo decide `sistemas/helar`, acá solo está cómo se dice.
 */
import type { Abrigo } from '../abrigo';
import type { Especie, ZonaDePatio } from '../tipos';
import { frase, type Frase } from './frase';

/** Sin ningún abrigo: qué habría alcanzado. */
export const mantaAlcanzaba = (manta: number): string => 'Una manta antihelada (+' + manta + ' °C) la habría salvado.';
export const hacianFaltaMantaYTunel = (): string => 'Fue una helada fuerte: hacían falta manta y microtúnel juntos.';
export const heladaMuyFuerte = (tmin: number): string =>
  'Fue una helada muy fuerte: con ' + tmin + ' °C una manta sola no alcanzaba.';

/** Con abrigo que no alcanzó: qué tenía y qué más se podía sumar. */
export const estabaAbrigada = (ab: Abrigo, yDespues: string): string =>
  'Estaba con ' +
  ab.partes.join(' y ') +
  ', que abriga unos ' +
  ab.grados +
  ' °C y aguanta hasta ' +
  (ab.aguanta + 0.1).toFixed(0) +
  ' °C. ' +
  yDespues;
export const mantaYTunelSuman = (grados: number): string => 'Manta y microtúnel juntos suman ' + grados + ' °C.';
export const conMantaSumaba = (manta: number): string => 'Con una manta encima sumaba ' + manta + ' °C más.';
export const sinLugarAfuera = (): string => 'En pleno invierno esta especie no tiene lugar afuera.';

export const murio = (sp: Especie, tmin: number, queFalto: string): Frase =>
  frase('helada.murio', sp.nombre + ' murió: heló (mín ' + tmin + ' °C) y no tolera heladas. ' + queFalto);
export const seQuemo = (sp: Especie, tmin: number, queFalto: string): Frase =>
  frase('helada.quemo', sp.nombre + ' se quemó con la helada (mín ' + tmin + ' °C). ' + queFalto);
export const laEndulzo = (sp: Especie): Frase =>
  frase('helada.endulzo', sp.nombre + ': la helada le concentra azúcares. Va a estar más rica.');
export const seSalvaron = (tmin: number, ab: Abrigo, z: ZonaDePatio, nombres: string[]): Frase =>
  frase(
    'helada.salvadas',
    'Heló (mín ' +
      tmin +
      ' °C) pero ' +
      ab.partes.join(' y ') +
      ' en ' +
      z.nombre.toLowerCase() +
      ' aguantó: se salvaron ' +
      nombres.join(', ').toLowerCase() +
      '.',
  );
