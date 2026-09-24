/**
 * Clima del conurbano.
 * [REPO] huertapp · scripts/clima-gba.mjs — Ezeiza Aero, normales SMN 1991-2020 y heladas FAUBA (umbral 3 °C).
 */
import { azar, gauss } from './azar';
import type { CaracterId, Estado, Pronostico, Tiempo } from './tipos';
import { clamp, phi, r1 } from './util';

export const CLIMA = {
  media: [24.1, 23.0, 21.0, 17.1, 13.6, 10.8, 9.8, 11.8, 13.8, 16.8, 20.0, 22.7],
  maxima: [30.3, 28.8, 26.8, 22.9, 19.0, 15.9, 15.0, 17.5, 19.3, 22.2, 25.8, 29.0],
  minima: [17.9, 17.1, 15.4, 11.8, 8.9, 6.1, 5.2, 6.6, 8.3, 11.2, 13.8, 16.2],
  primeraHelada: 119,
  desvioPrimera: 16, // 29-abr
  ultimaHelada: 278,
  desvioUltima: 23, // 5-oct
  /** [SUPUESTO] lluvia mensual aproximada de Ezeiza, en mm. No está en huertapp. */
  lluvia: [110, 105, 115, 95, 75, 55, 55, 60, 65, 105, 100, 100],
};
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

export interface Caracter {
  nombre: string;
  dT: number;
  lluvia: number;
  helada: number;
  texto: string;
}
export const CARACTERES: Record<CaracterId, Caracter> = {
  normal: {
    nombre: 'Año normal',
    dT: 0,
    lluvia: 1,
    helada: 0,
    texto: 'Sin señales fuertes: un año parecido al promedio.',
  },
  nina: {
    nombre: 'Año Niña',
    dT: 0.7,
    lluvia: 0.62,
    helada: 0,
    texto: 'Se espera menos lluvia que lo normal y un verano caluroso. El riego va a pesar.',
  },
  nino: {
    nombre: 'Año Niño',
    dT: -0.2,
    lluvia: 1.45,
    helada: 0,
    texto: 'Se espera más lluvia que lo normal: ojo con babosas y encharcamientos.',
  },
  tardia: {
    nombre: 'Año de heladas tardías',
    dT: -0.8,
    lluvia: 1,
    helada: 0.18,
    texto: 'Primavera fría: las heladas pueden estirarse hasta fines de octubre.',
  },
};

export const mesDe = (dec: number): number => Math.floor((dec - 1) / 3) + 1;
export function diaCentral(dec: number): number {
  const mes = mesDe(dec),
    t = (dec - 1) % 3;
  let d = t === 0 ? 5 : t === 1 ? 15 : Math.round((21 + DIAS_MES[mes - 1]) / 2);
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
      b = j === 11 ? centros[0] + 365 : centros[j + 1];
    const d = dia < centros[0] ? dia + 365 : dia;
    if (d >= a && d <= b) return vals[j] + ((d - a) / (b - a)) * (vals[(j + 1) % 12] - vals[j]);
  }
  return vals[0];
}
/** [REPO] P(estar dentro de la temporada de heladas), modelo FAUBA de dos normales. */
export function pTemporadaHelada(dec: number): number {
  const d = diaCentral(dec);
  return (
    phi((d - CLIMA.primeraHelada) / CLIMA.desvioPrimera) * (1 - phi((d - CLIMA.ultimaHelada) / CLIMA.desvioUltima))
  );
}
export const fechaDe = (dec: number): string => TERCIOS[(dec - 1) % 3] + ' de ' + MESES[mesDe(dec) - 1];
export const estacionDe = (dec: number): string =>
  dec >= 34 || dec <= 8 ? 'verano' : dec <= 17 ? 'otoño' : dec <= 26 ? 'invierno' : 'primavera';
/** 1 en el solsticio de invierno, 0 en el de verano */
export const invierno = (dec: number): number => (Math.cos((6.2831853 * (diaCentral(dec) - 172)) / 365) + 1) / 2;

export function generarTiempo(E: Estado, dec: number): { real: Tiempo; pron: Pronostico } {
  const car = CARACTERES[E.tiempo.caracter],
    dia = diaCentral(dec),
    est = estacionDe(dec);
  const anom = gauss(E) * 2.1 + car.dT; // [SUPUESTO] desvío de la anomalía decádica
  const tmed = interp(CLIMA.media, dia) + anom;
  const tmax = interp(CLIMA.maxima, dia) + anom + 1 + Math.abs(gauss(E)) * 1.5; // el día más caluroso de los 10
  let tmin = interp(CLIMA.minima, dia) + anom - 3 - Math.abs(gauss(E)) * 1.8; // la noche más fría
  const pTemp = clamp(pTemporadaHelada(dec) + (dec >= 25 && dec <= 31 ? car.helada : 0), 0, 1);
  if (azar(E) < pTemp * 0.35) tmin = Math.min(tmin, 2.5 - azar(E) * 3); // [SUPUESTO] frecuencia dentro de la temporada
  const lluvia = (CLIMA.lluvia[mesDe(dec) - 1] / 3) * car.lluvia * clamp(Math.exp(gauss(E) * 0.75 - 0.2), 0, 3.5);
  const real: Tiempo = {
    dec,
    tmed: r1(tmed),
    tmax: r1(tmax),
    tmin: r1(tmin),
    lluvia: Math.round(lluvia),
    helada: tmin <= 3,
    ola: tmax >= 35,
    estacion: est,
  };
  // El pronóstico es la realidad con ruido: informa, no garantiza.
  const ftmin = tmin + gauss(E) * 1.8,
    ftmax = tmax + gauss(E) * 1.5;
  const pron: Pronostico = {
    tmin: Math.round(ftmin),
    tmax: Math.round(ftmax),
    pHelada: Math.round(clamp(phi((3 - ftmin) / 2.2), 0, 1) * 100),
    lluvia:
      azar(E) < 0.72
        ? lluvia < 12
          ? 'seca'
          : lluvia > 45
            ? 'llovedora'
            : 'normal'
        : (['seca', 'normal', 'llovedora'] as const)[Math.floor(azar(E) * 3)],
  };
  return { real, pron };
}
