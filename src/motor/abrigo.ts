/**
 * Abrigo contra heladas.
 * [SUPUESTO] grados que suma cada protección a la mínima de la noche. Se acumulan.
 * Hay helada para la planta si mínima + abrigo ≤ 3 °C (el umbral agrometeorológico de FAUBA).
 */
import { ESPECIES } from './catalogo';
import { zona as zonaDelPatio } from './patio';
import type { Estado, ZonaId } from './tipos';
import { clamp, phi } from './util';

/** El reparo fijo de cada zona (alero, pared, techo) está en los datos del patio. */
export const ABRIGO = { manta: 4, tunel: 5 };
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
  if (E.tunel[zona]) {
    g += ABRIGO.tunel;
    partes.push('microtúnel');
  }
  if (E.manta[zona]) {
    g += ABRIGO.manta;
    partes.push('manta');
  }
  return { grados: g, partes, aguanta: 3 - g };
}
/** % de que la helada le llegue a esa zona esta década, con el abrigo puesto y el pronóstico a la vista. */
export const riesgoHelada = (E: Estado, zona: ZonaId): number =>
  Math.round(clamp(phi((3 - abrigo(E, zona).grados - E.prox.pron.tmin) / 2.2), 0, 1) * 100);
export function enRiesgo(E: Estado, zona: ZonaId): string[] {
  const out: string[] = [];
  for (const id in E.plantas) {
    const pl = E.plantas[id],
      sp = ESPECIES[pl.slug];
    if (
      E.celdas[pl.celda].zona === zona &&
      pl.etapa !== 'semilla' &&
      (sp.helada === 'muere' || sp.helada === 'sensible') &&
      !out.includes(sp.nombre)
    )
      out.push(sp.nombre);
  }
  return out;
}
