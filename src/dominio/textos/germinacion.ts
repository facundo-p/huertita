/** Textos de la germinación. [REPO] dias_germinacion y temperaturas.germinacion de cada ficha. */
import type { TempGerminacion } from '../../../datos/contrato';
import { nombreDe } from '../planta';
import type { Especie } from '../tipos';
import { frase, type Frase } from './frase';

export const tierraSeca = (sp: Especie): Frase =>
  frase(
    'germinacion.tierra-seca',
    sp.nombre + ': la semilla está en tierra seca y no arranca. Necesita humedad pareja para germinar.',
  );

export const sueloFueraDeRango = (
  sp: Especie,
  t: number,
  tg: TempGerminacion<number>,
  enAlmacigoArrancaba: boolean,
): Frase =>
  frase(
    'germinacion.temperatura',
    sp.nombre +
      ' no germina: el suelo está a ~' +
      Math.round(t) +
      ' °C y necesita entre ' +
      tg.min +
      ' y ' +
      tg.max +
      ' °C.' +
      (enAlmacigoArrancaba ? ' En la almaciguera reparada habría arrancado.' : ''),
  );

export function ningunaGermino(
  sp: Especie,
  semillas: number,
  ideal: boolean,
  t: number,
  tg: TempGerminacion<number>,
): Frase {
  const porque = ideal
    ? 'A veces pasa: por eso se siembra de más.'
    : 'El suelo a ~' + Math.round(t) + ' °C está fuera del rango ideal (' + tg.ideal_min + '–' + tg.ideal_max + ' °C).';
  return frase(
    'germinacion.ninguna',
    'No germinó ninguna de las ' + semillas + ' semillas de ' + nombreDe(sp) + '. ' + porque,
  );
}

export function germino(sp: Especie, semillas: number, nacieron: number, ideal: boolean): Frase {
  const cuantas =
    semillas > 1
      ? ' Nacieron ' +
        nacieron +
        ' de ' +
        semillas +
        (ideal ? '.' : ': con el suelo fuera del rango ideal nacen menos.')
      : '';
  return frase('germinacion.germino', '¡Germinó ' + nombreDe(sp) + '!' + cuantas);
}

export const semillaPerdida = (sp: Especie, dias: number): Frase =>
  frase(
    'germinacion.perdida',
    'La semilla de ' + nombreDe(sp) + ' se perdió: pasaron ' + dias + ' días sin condiciones para germinar.',
  );
