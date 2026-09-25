/**
 * La región de una partida: clima, heladas, sol, años típicos y calendario (`datos/juego/regiones`).
 * La partida la nombra en `meta.region` y el patio en `region`; son la misma.
 */
import type { Patio } from '../../datos/juego/patio';
import type { Region } from '../../datos/juego/region';
import { REGIONES } from '../../datos/juego/regiones';
import type { Estado } from './tipos';

export type { Region };
export { REGIONES };

export function regionPorId(id: string): Region {
  const r = REGIONES[id];
  if (!r) throw new Error('Región desconocida: ' + id);
  return r;
}
export const regionDe = (E: Pick<Estado, 'meta'>): Region => regionPorId(E.meta.region);
export const regionDelPatio = (p: Patio): Region => regionPorId(p.region);

/**
 * La década contada como si fuera en el hemisferio sur. Las reglas que dependen de la estación
 * (cuándo hay pulgón, qué es invierno) están escritas para el sur; en el norte se corren medio año.
 */
export const decadaEstacional = (R: Region, dec: number): number =>
  R.hemisferio === 'S' ? dec : ((dec + 17) % 36) + 1;

/** Si una década está en un tramo [desde, hasta] que puede cruzar el año nuevo. */
export const enTramo = (dec: number, desde: number, hasta: number): boolean =>
  desde <= hasta ? dec >= desde && dec <= hasta : dec >= desde || dec <= hasta;
