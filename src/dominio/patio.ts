/**
 * El patio de una partida. Cada partida lleva su propio patio (`mundo.patio`, copiado de una plantilla
 * de `datos/juego/patios` al empezar); acá está lo que el motor necesita preguntarle: qué zona es
 * cada celda, qué propiedades tiene, cuánto sol le da.
 */
import type { CategoriaSuelo } from '../../datos/contrato';
import type { Patio, ZonaDePatio } from '../../datos/juego/patio';
import { PLANTILLAS, PLANTILLA_INICIAL } from '../../datos/juego/patios';
import { plantasQueSombrean } from './espacio';
import { horasSolGeometria, horasSolV04 } from './sol';
import type { CeldaId, Estado, ZonaId } from './tipos';
import { idCelda, xy } from './vocabulario';

export { xy };

export { PLANTILLAS, PLANTILLA_INICIAL };
export type { Patio, ZonaDePatio };

type ConPatio = { mundo: { patio: Patio } };
interface Indice {
  zonas: Record<ZonaId, ZonaDePatio>;
  ids: ZonaId[];
  porLetra: Record<string, ZonaId>;
  celdas: Record<ZonaId, CeldaId[]>;
  macetas: Record<CeldaId, { litros: number; prof: number }>;
}
/** Los índices se arman una vez por objeto patio: si el patio se edita, se arma uno nuevo. */
const indices = new WeakMap<Patio, Indice>();
function indice(p: Patio): Indice {
  let i = indices.get(p);
  if (!i) {
    i = { zonas: {}, ids: [], porLetra: {}, celdas: {}, macetas: {} };
    for (const z of p.zonas) {
      i.zonas[z.id] = z;
      i.ids.push(z.id);
      i.porLetra[z.letra] = z.id;
      i.celdas[z.id] = [];
      Object.assign(i.macetas, z.macetas);
    }
    p.plano.forEach((fila, y) =>
      [...fila].forEach((ch, x) => {
        const z = i!.porLetra[ch];
        if (z) i!.celdas[z].push(idCelda(x, y));
      }),
    );
    indices.set(p, i);
  }
  return i;
}

export const patioDe = (E: ConPatio): Patio => E.mundo.patio;

/** Una copia de la plantilla, para una partida nueva. */
export function copiarPlantilla(id: string): Patio {
  const p = PLANTILLAS[id];
  if (!p) throw new Error('Patio desconocido: ' + id);
  return JSON.parse(JSON.stringify(p));
}
/** Las zonas del patio, en el orden en que están declaradas. */
export const zonasDe = (E: ConPatio): ZonaDePatio[] => patioDe(E).zonas;
export const idsDeZonas = (E: ConPatio): ZonaId[] => indice(patioDe(E)).ids;
export function zona(E: ConPatio, id: ZonaId): ZonaDePatio {
  const z = indice(patioDe(E)).zonas[id];
  if (!z) throw new Error('Zona desconocida: ' + id);
  return z;
}
/** La zona de una celda de la partida. */
export const zonaDe = (E: Pick<Estado, 'mundo'>, celda: CeldaId): ZonaDePatio => zona(E, E.mundo.celdas[celda].zona);
export const celdasDe = (E: ConPatio, id: ZonaId): CeldaId[] => indice(patioDe(E)).celdas[id] || [];
export function zonaDeCelda(E: ConPatio, c: CeldaId): ZonaId | null {
  const { x, y } = xy(c),
    fila = patioDe(E).plano[y];
  return (fila && indice(patioDe(E)).porLetra[fila[x]]) || null;
}
export const macetaDe = (E: ConPatio, celda: CeldaId): { litros: number; prof: number } | null =>
  indice(patioDe(E)).macetas[celda] || null;
export const sueloBase = (E: Pick<Estado, 'mundo'>, celda: CeldaId): CategoriaSuelo => zonaDe(E, celda).suelo;
/** Primera zona que admite microtúnel, o null si el patio no tiene. */
export const zonaDeTunel = (E: ConPatio): ZonaId | null => zonasDe(E).find((z) => z.admiteTunel)?.id ?? null;

export function vecinas(celda: CeldaId): CeldaId[] {
  const p = xy(celda),
    out: CeldaId[] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) out.push(idCelda(p.x + dx, p.y + dy));
  return out;
}

/** Horas de sol directo de una celda en una década (por defecto, la actual). Las plantas altas de al lado también hacen sombra. */
export function horasSol(E: Pick<Estado, 'mundo' | 'tiempo'>, celda: CeldaId, dec?: number): number {
  const p = patioDe(E),
    q = xy(celda),
    d = dec || E.tiempo.dec;
  return p.sol === 'v04' ? horasSolV04(q.x, q.y, d) : horasSolGeometria(p, q.x, q.y, d, plantasQueSombrean(E, celda));
}
