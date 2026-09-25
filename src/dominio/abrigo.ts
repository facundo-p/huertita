/**
 * Abrigo contra heladas.
 * [SUPUESTO] grados que suma cada protección a la mínima de la noche. Se acumulan.
 * Hay helada para la planta si mínima + abrigo ≤ 3 °C (el umbral agrometeorológico de FAUBA).
 */
import { REGLAS } from '../../datos/juego/reglas';
import { zona as zonaDelPatio } from './patio';
import type { Estado, ZonaId } from './tipos';
import { clamp, phi } from './util';
import { especieDe } from './planta';

/** El reparo fijo de cada zona (alero, pared, techo) está en los datos del patio. */
export const ABRIGO = REGLAS.abrigo;
const { umbral: UMBRAL, desvioPronostico } = REGLAS.helada;
/** Hasta qué mínima aguanta sin daño (exclusiva) una planta con tantos grados de abrigo. */
export const aguantaCon = (grados: number): number => UMBRAL - grados;
export interface Abrigo {
  grados: number;
  partes: string[];
  /** mínima más baja sin daño (exclusiva) */ aguanta: number;
}
export function abrigo(E: Estado, zona: ZonaId): Abrigo {
  let g = 0;
  const partes: string[] = [],
    fijo = zonaDelPatio(E, zona).abrigo;
  if (fijo) {
    g += fijo.grados;
    partes.push(fijo.nombre);
  }
  if (E.recursos.tunel[zona]) {
    g += ABRIGO.tunel;
    partes.push('microtúnel');
  }
  if (E.recursos.manta[zona]) {
    g += ABRIGO.manta;
    partes.push('manta');
  }
  return { grados: g, partes, aguanta: aguantaCon(g) };
}
/** % de que la helada le llegue a esa zona esta década, con el abrigo puesto y el pronóstico a la vista. */
export const riesgoHelada = (E: Estado, zona: ZonaId): number =>
  Math.round(clamp(phi((UMBRAL - abrigo(E, zona).grados - E.tiempo.pronostico.tmin) / desvioPronostico), 0, 1) * 100);
export function enRiesgo(E: Estado, zona: ZonaId): string[] {
  const out: string[] = [];
  for (const id in E.mundo.plantas) {
    const pl = E.mundo.plantas[id],
      sp = especieDe(pl);
    if (
      E.mundo.celdas[pl.celda].zona === zona &&
      pl.etapa !== 'semilla' &&
      (sp.helada === 'muere' || sp.helada === 'sensible') &&
      !out.includes(sp.nombre)
    )
      out.push(sp.nombre);
  }
  return out;
}
