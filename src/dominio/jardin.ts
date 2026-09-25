/**
 * Lo que el patio da para el compost y el mulch fuera de la huerta: el pasto que crece, las hojas que
 * largan los caducos en otoño (los del patio y los de la vereda) y la poda de invierno.
 *
 * [REPO] compostaje.json: el pasto recién cortado es verde; seco, las hojas y la poda picada son secos.
 * [SUPUESTO] cuánto da cada cosa (`REGLAS.jardin`). Cuándo caen las hojas lo dice la región
 * (`caducos.hasta`): la caída dura `caidaDecadas` y después viene el reposo, cuando se poda.
 */
import type { Obstaculo, Patio } from '../../datos/juego/patio';
import { REGLAS } from '../../datos/juego/reglas';
import { DECADAS_DEL_ANIO } from './calendario';
import { enTramo, regionDelPatio, type Region } from './region';
import type { Jardin } from './tipos';
import { r1 } from './util';

const J = REGLAS.jardin;

export type FaseDeCaducos = 'hoja' | 'caida' | 'reposo';

/** En qué anda un árbol caduco de la región en esta década: con hoja, largándola o pelado. */
export function faseDeCaducos(R: Region, dec: number): FaseDeCaducos {
  const { conHojasDesde, hasta } = R.caducos;
  if (enTramo(dec, conHojasDesde, hasta)) return 'hoja';
  const finCaida = ((hasta + J.caidaDecadas - 1) % DECADAS_DEL_ANIO) + 1;
  return enTramo(dec, (hasta % DECADAS_DEL_ANIO) + 1, finCaida) ? 'caida' : 'reposo';
}

type Arbol = Extract<Obstaculo, { tipo: 'arbol' }>;
const caducos = (p: Patio): Arbol[] => p.obstaculos.filter((o): o is Arbol => o.tipo === 'arbol' && o.caduco);

/** Radio de copa sumado de los caducos del patio: de eso salen hojas y poda. */
export const copaCaduca = (p: Patio): number => caducos(p).reduce((t, a) => t + a.copa, 0);
export const hayCaducos = (p: Patio): boolean => caducos(p).length > 0;

/** Hojas que caen en una década de caída: las de los caducos del patio y las de la vereda. */
export const hojasPorDecada = (p: Patio): number =>
  r1(copaCaduca(p) * J.hojasPorCopa + (p.vereda ? J.hojasDeVereda : 0));

/** Ramas de la poda de un invierno. */
export const podaDelInvierno = (p: Patio): number => r1(copaCaduca(p) * J.podaPorCopa);

/** Lo que crece el pasto en una década, según el calor. */
export function pastoQueCrece(p: Patio, tmed: number): number {
  const m2 = p.pastoM2 ?? 0;
  if (tmed >= J.pastoCalorDesde) return m2 * J.pastoPorM2.calor;
  return tmed < J.pastoFrioBajo ? m2 * J.pastoPorM2.frio : m2 * J.pastoPorM2.templado;
}
/** Hasta dónde llega el pasto sin cortar. */
export const topeDePasto = (p: Patio): number => r1((p.pastoM2 ?? 0) * J.pastoPorM2.calor * J.pastoTopeDecadas);

/** Cómo arranca el jardín: sin pasto crecido ni hojas en el piso; si ya es invierno, con la poda por hacer. */
export function jardinInicial(p: Patio, dec: number): Jardin {
  const reposo = faseDeCaducos(regionDelPatio(p), dec) === 'reposo';
  return { pasto: 0, hojas: 0, poda: reposo ? podaDelInvierno(p) : 0 };
}

/**
 * Una década de jardín. `dec` es la década que termina y `tmed` su temperatura media. Crece el pasto;
 * en la caída se juntan hojas en el piso y fuera de ella se vuelan; al entrar en reposo aparece la
 * poda del invierno, y cuando los árboles brotan ya no se poda.
 */
export function pasarJardin(j: Jardin, p: Patio, dec: number, tmed: number): void {
  const R = regionDelPatio(p),
    fase = faseDeCaducos(R, dec),
    antes = faseDeCaducos(R, dec === 1 ? DECADAS_DEL_ANIO : dec - 1);
  j.pasto = r1(Math.min(topeDePasto(p), j.pasto + pastoQueCrece(p, tmed)));
  if (fase === 'caida') j.hojas = r1(j.hojas + hojasPorDecada(p));
  else {
    j.hojas = r1(j.hojas * J.hojasQuedan);
    if (j.hojas < J.hojasMinimas) j.hojas = 0;
  }
  if (fase === 'hoja') j.poda = 0;
  else if (fase === 'reposo' && antes === 'caida') j.poda = podaDelInvierno(p);
}
