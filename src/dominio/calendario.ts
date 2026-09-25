/**
 * El calendario del juego: 36 décadas por año, tres por mes, y cómo se nombra cada una. Es la
 * regla del tiempo, no del balance: por eso sus números viven acá y no en `datos/juego/reglas.ts`.
 * Las estaciones se cuentan en décadas estacionales (ver `region.ts`), así valen en los dos hemisferios.
 */
import { decadaEstacional, type Region } from './region';

export const DECADAS_DEL_ANIO = 36;
export const DIAS_DEL_ANIO = 365;
export const DECADAS_POR_MES = 3;
const DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const TERCIOS = ['principios', 'mediados', 'fines'];

export const mesDe = (dec: number): number => Math.floor((dec - 1) / DECADAS_POR_MES) + 1;
export function diaCentral(dec: number): number {
  const mes = mesDe(dec),
    t = (dec - 1) % DECADAS_POR_MES;
  // principios: el 5; mediados: el 15; fines: el medio entre el 21 y el último del mes
  let d = t < 2 ? [5, 15][t] : Math.round((21 + DIAS_MES[mes - 1]) / 2);
  for (let m = 1; m < mes; m++) d += DIAS_MES[m - 1];
  return d;
}
export function interp(vals: number[], dia: number): number {
  const centros: number[] = [];
  let acc = 0;
  for (let i = 0; i < 12; i++) {
    centros.push(acc + 15);
    acc += DIAS_MES[i];
  }
  for (let j = 0; j < 12; j++) {
    const a = centros[j],
      b = j === 11 ? centros[0] + DIAS_DEL_ANIO : centros[j + 1];
    const d = dia < centros[0] ? dia + DIAS_DEL_ANIO : dia;
    if (d >= a && d <= b) return vals[j] + ((d - a) / (b - a)) * (vals[(j + 1) % 12] - vals[j]);
  }
  return vals[0];
}
export const fechaDe = (dec: number): string => TERCIOS[(dec - 1) % DECADAS_POR_MES] + ' de ' + MESES[mesDe(dec) - 1];
/** La estación de una década en la región. */
export function estacionDe(R: Region, dec: number): string {
  const d = decadaEstacional(R, dec);
  if (d >= 34 || d <= 8) return 'verano';
  if (d <= 17) return 'otoño';
  return d <= 26 ? 'invierno' : 'primavera';
}
/** 1 en el solsticio de invierno, 0 en el de verano */
export const invierno = (R: Region, dec: number): number =>
  (Math.cos((6.2831853 * (diaCentral(decadaEstacional(R, dec)) - 172)) / DIAS_DEL_ANIO) + 1) / 2;
