/**
 * El clima de una partida: el tiempo de cada década, sorteado alrededor de las normales de la región
 * (`datos/juego/regiones`), y su pronóstico. Lo que es del lugar sale de la región; lo que queda acá
 * es el modelo, que es el mismo en todos lados.
 */
import type { Caracter } from '../../datos/juego/region';
import { REGLAS } from '../../datos/juego/reglas';
import { azar, gauss } from './azar';
import { decadaEstacional, regionDe, type Region } from './region';
import type { Estado, Pronostico, Tiempo } from './tipos';
import { clamp, phi, r1 } from './util';

export type { Caracter };
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
/**
 * [REPO] P(estar dentro de la temporada de heladas), modelo FAUBA de dos normales. Si la temporada
 * cruza el año nuevo (hemisferio norte), la última helada se cuenta en el año siguiente.
 */
export function pTemporadaHelada(R: Region, dec: number): number {
  const { primera, desvioPrimera, ultima: u, desvioUltima } = R.heladas;
  const cruza = u < primera,
    ultima = cruza ? u + 365 : u,
    d0 = diaCentral(dec),
    d = cruza && d0 < (primera + ultima) / 2 - 182.5 ? d0 + 365 : d0;
  return phi((d - primera) / desvioPrimera) * (1 - phi((d - ultima) / desvioUltima));
}
export const fechaDe = (dec: number): string => TERCIOS[(dec - 1) % 3] + ' de ' + MESES[mesDe(dec) - 1];
/** La estación de una década en la región. */
export function estacionDe(R: Region, dec: number): string {
  const d = decadaEstacional(R, dec);
  if (d >= 34 || d <= 8) return 'verano';
  if (d <= 17) return 'otoño';
  return d <= 26 ? 'invierno' : 'primavera';
}
/** 1 en el solsticio de invierno, 0 en el de verano */
export const invierno = (R: Region, dec: number): number =>
  (Math.cos((6.2831853 * (diaCentral(decadaEstacional(R, dec)) - 172)) / 365) + 1) / 2;

export function generarTiempo(E: Estado, dec: number): { real: Tiempo; pron: Pronostico } {
  const R = regionDe(E),
    CLIMA = R.clima,
    car = R.caracteres[E.tiempo.caracter],
    dia = diaCentral(dec),
    est = estacionDe(R, dec),
    [tardiasDesde, tardiasHasta] = R.heladas.tardias,
    { umbral, desvioPronostico } = REGLAS.helada;
  const anom = gauss(E) * 2.1 + car.dT; // [SUPUESTO] desvío de la anomalía decádica
  const tmed = interp(CLIMA.media, dia) + anom;
  const tmax = interp(CLIMA.maxima, dia) + anom + 1 + Math.abs(gauss(E)) * 1.5; // el día más caluroso de los 10
  let tmin = interp(CLIMA.minima, dia) + anom - 3 - Math.abs(gauss(E)) * 1.8; // la noche más fría
  const tardia = dec >= tardiasDesde && dec <= tardiasHasta ? car.helada : 0;
  const pTemp = clamp(pTemporadaHelada(R, dec) + tardia, 0, 1);
  if (azar(E) < pTemp * 0.35) tmin = Math.min(tmin, 2.5 - azar(E) * 3); // [SUPUESTO] frecuencia dentro de la temporada
  const lluvia = (CLIMA.lluvia[mesDe(dec) - 1] / 3) * car.lluvia * clamp(Math.exp(gauss(E) * 0.75 - 0.2), 0, 3.5);
  const real: Tiempo = {
    dec,
    tmed: r1(tmed),
    tmax: r1(tmax),
    tmin: r1(tmin),
    lluvia: Math.round(lluvia),
    helada: tmin <= umbral,
    ola: tmax >= 35,
    estacion: est,
  };
  // El pronóstico es la realidad con ruido: informa, no garantiza.
  const ftmin = tmin + gauss(E) * 1.8,
    ftmax = tmax + gauss(E) * 1.5;
  const pron: Pronostico = {
    tmin: Math.round(ftmin),
    tmax: Math.round(ftmax),
    pHelada: Math.round(clamp(phi((umbral - ftmin) / desvioPronostico), 0, 1) * 100),
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
