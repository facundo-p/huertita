/**
 * El patio de una partida. Los patios son datos (`datos/juego/patios`); acá está lo que el motor
 * necesita preguntarles: qué zona es cada celda, qué propiedades tiene, cuánto sol le da.
 */
import type { CategoriaSuelo } from '../../datos/contrato';
import type { Patio, ZonaDePatio } from '../../datos/juego/patio';
import { PATIOS, PATIO_INICIAL } from '../../datos/juego/patios';
import { plantasQueSombrean } from './espacio';
import { horasSolGeometria, horasSolV04 } from './sol';
import type { CeldaId, Estado, ZonaId } from './tipos';
import { idCelda, xy } from './vocabulario';

export { xy };

export { PATIOS, PATIO_INICIAL };
export type { Patio, ZonaDePatio };

type ConPatio = Pick<Estado, 'patio'>;
interface Indice {
  zonas: Record<ZonaId, ZonaDePatio>;
  ids: ZonaId[];
  porLetra: Record<string, ZonaId>;
  celdas: Record<ZonaId, CeldaId[]>;
  macetas: Record<CeldaId, { litros: number; prof: number }>;
}
const indices = new Map<string, Indice>();
function indice(p: Patio): Indice {
  let i = indices.get(p.id);
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
    indices.set(p.id, i);
  }
  return i;
}

export function patioDe(E: ConPatio): Patio {
  const p = PATIOS[E.patio];
  if (!p) throw new Error('Patio desconocido: ' + E.patio);
  return p;
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
export const zonaDe = (E: Pick<Estado, 'patio' | 'celdas'>, celda: CeldaId): ZonaDePatio =>
  zona(E, E.celdas[celda].zona);
export const celdasDe = (E: ConPatio, id: ZonaId): CeldaId[] => indice(patioDe(E)).celdas[id] || [];
export function zonaDeCelda(E: ConPatio, c: CeldaId): ZonaId | null {
  const { x, y } = xy(c),
    fila = patioDe(E).plano[y];
  return (fila && indice(patioDe(E)).porLetra[fila[x]]) || null;
}
export const macetaDe = (E: ConPatio, celda: CeldaId): { litros: number; prof: number } | null =>
  indice(patioDe(E)).macetas[celda] || null;
export const sueloBase = (E: Pick<Estado, 'patio' | 'celdas'>, celda: CeldaId): CategoriaSuelo =>
  zonaDe(E, celda).suelo;
/** Primera zona que admite microtúnel, o null si el patio no tiene. */
export const zonaDeTunel = (E: ConPatio): ZonaId | null => zonasDe(E).find((z) => z.admiteTunel)?.id ?? null;

export function vecinas(celda: CeldaId): CeldaId[] {
  const p = xy(celda),
    out: CeldaId[] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) out.push(idCelda(p.x + dx, p.y + dy));
  return out;
}

/** Horas de sol directo de una celda en una década (por defecto, la actual). Las plantas altas de al lado también hacen sombra. */
export function horasSol(
  E: Pick<Estado, 'patio' | 'dec' | 'celdas' | 'plantas'>,
  celda: CeldaId,
  dec?: number,
): number {
  const p = patioDe(E),
    q = xy(celda),
    d = dec || E.dec;
  return p.sol === 'v04' ? horasSolV04(q.x, q.y, d) : horasSolGeometria(p, q.x, q.y, d, plantasQueSombrean(E, celda));
}
