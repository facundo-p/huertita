/**
 * El clima de una partida: el tiempo de cada década, sorteado alrededor de las normales de la región
 * (`datos/juego/regiones`), y su pronóstico. Lo que es del lugar sale de la región; lo que queda acá
 * es el modelo, que es el mismo en todos lados.
 */
import type { Caracter } from '../../datos/juego/region';
import { REGLAS } from '../../datos/juego/reglas';
import { azar, gauss } from './azar';
import { DECADAS_POR_MES, DIAS_DEL_ANIO, diaCentral, estacionDe, interp, mesDe } from './calendario';
import { regionDe, type Region } from './region';
import type { Estado, Pronostico, Tiempo } from './tipos';
import { clamp, entero, phi, r1 } from './util';

export type { Caracter };
const C = REGLAS.clima;
const LLUVIAS = ['seca', 'normal', 'llovedora'] as const;

/**
 * [REPO] P(estar dentro de la temporada de heladas), modelo FAUBA de dos normales. Si la temporada
 * cruza el año nuevo (hemisferio norte), la última helada se cuenta en el año siguiente.
 */
export function pTemporadaHelada(R: Region, dec: number): number {
  const { primera, desvioPrimera, ultima: u, desvioUltima } = R.heladas;
  const cruza = u < primera,
    ultima = cruza ? u + DIAS_DEL_ANIO : u,
    d0 = diaCentral(dec),
    d = cruza && d0 < (primera + ultima) / 2 - DIAS_DEL_ANIO / 2 ? d0 + DIAS_DEL_ANIO : d0;
  return phi((d - primera) / desvioPrimera) * (1 - phi((d - ultima) / desvioUltima));
}
export function generarTiempo(E: Estado, dec: number): { real: Tiempo; pron: Pronostico } {
  const R = regionDe(E),
    CLIMA = R.clima,
    car = R.caracteres[E.tiempo.caracter],
    dia = diaCentral(dec),
    est = estacionDe(R, dec),
    [tardiasDesde, tardiasHasta] = R.heladas.tardias,
    { umbral, desvioPronostico } = REGLAS.helada;
  const anom = gauss(E) * C.desvioAnomalia + car.dT;
  const tmed = interp(CLIMA.media, dia) + anom;
  // la máxima es la del día más caluroso de los 10; la mínima, la de la noche más fría
  const tmax = interp(CLIMA.maxima, dia) + anom + C.maxima.sobreLaNormal + Math.abs(gauss(E)) * C.maxima.desvio;
  let tmin = interp(CLIMA.minima, dia) + anom - C.minima.bajoLaNormal - Math.abs(gauss(E)) * C.minima.desvio;
  const tardia = dec >= tardiasDesde && dec <= tardiasHasta ? car.helada : 0;
  const pTemp = clamp(pTemporadaHelada(R, dec) + tardia, 0, 1);
  if (azar(E) < pTemp * C.helada.enTemporada) tmin = Math.min(tmin, C.helada.hasta - azar(E) * C.helada.rango);
  const L = C.lluvia,
    lluvia =
      (CLIMA.lluvia[mesDe(dec) - 1] / DECADAS_POR_MES) *
      car.lluvia *
      clamp(Math.exp(gauss(E) * L.desvio - L.sesgo), 0, L.tope);
  const real: Tiempo = {
    dec,
    tmed: r1(tmed),
    tmax: r1(tmax),
    tmin: r1(tmin),
    lluvia: Math.round(lluvia),
    helada: tmin <= umbral,
    ola: tmax >= C.olaDesde,
    estacion: est,
  };
  // El pronóstico es la realidad con ruido: informa, no garantiza.
  const ftmin = tmin + gauss(E) * C.pronostico.errorMinima,
    ftmax = tmax + gauss(E) * C.pronostico.errorMaxima;
  const pron: Pronostico = {
    tmin: entero(ftmin),
    tmax: entero(ftmax),
    pHelada: Math.round(clamp(phi((umbral - ftmin) / desvioPronostico), 0, 1) * 100),
    lluvia: lluviaPronosticada(E, lluvia),
  };
  return { real, pron };
}

/** El pronóstico de lluvia acierta casi siempre; cuando no, dice cualquier cosa. */
function lluviaPronosticada(E: Estado, lluvia: number): Pronostico['lluvia'] {
  const P = C.pronostico;
  if (azar(E) >= P.aciertoLluvia) return LLUVIAS[Math.floor(azar(E) * LLUVIAS.length)];
  if (lluvia < P.secaHasta) return 'seca';
  return lluvia > P.llovedoraDesde ? 'llovedora' : 'normal';
}
