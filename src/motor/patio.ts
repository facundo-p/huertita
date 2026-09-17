/**
 * El patio. Hoy es uno solo y está escrito acá; el paso 2 de los cimientos lo
 * convierte en un archivo de datos (contenedores con propiedades y obstáculos
 * con altura) para poder tener otros patios y un editor.
 *
 * El norte está ARRIBA: en el hemisferio sur el sol anda por el norte, así que el
 * paredón de arriba sombrea el patio, y más en invierno, con el sol bajo.
 */
import type { CategoriaSuelo } from '../../datos/contrato';
import { diaCentral } from './clima';
import type { CeldaId, Estado, ZonaId } from './tipos';
import { clamp, r1 } from './util';

export const ANCHO = 8, ALTO = 9;
export const MAPA = ['PPPPPPPP', 'ssssss.T', 'ssssss.T', '........', 'eeee.mm.', 'eeee.mm.', '........', 'aaaa.C..', 'HHHHHHHH'];
export interface Zona { nombre: string; suelo: CategoriaSuelo; mo: number; drenaje: number; riegoCosto: [number, number, number, number]; desc: string }
export const ZONAS: Record<ZonaId, Zona> = {
  suelo: { nombre: 'Bancal a suelo', suelo: 'FRANCO_FERTIL', mo: 42, drenaje: 0, riegoCosto: [0, 1, 2, 3], desc: 'Tierra del lugar, profunda y algo pesada. El paredón norte le saca sol en invierno.' },
  elevado: { nombre: 'Bancal elevado', suelo: 'PROFUNDO_SUELTO', mo: 60, drenaje: 0.3, riegoCosto: [0, 1, 2, 3], desc: 'Cajón con sustrato mullido. Drena rápido, calienta antes y admite microtúnel.' },
  macetas: { nombre: 'Macetas', suelo: 'FRANCO_FERTIL', mo: 55, drenaje: 0.7, riegoCosto: [0, 1, 1, 2], desc: 'Se secan mucho antes que la tierra. El tamaño decide qué entra.' },
  almacigo: { nombre: 'Almaciguera', suelo: 'FRANCO_FERTIL', mo: 70, drenaje: 0.5, riegoCosto: [0, 0, 1, 1], desc: 'Contra la casa, mirando al norte y bajo alero: reparada de heladas y de la lluvia. Solo para criar plantines.' },
};
export const ZONA_IDS: ZonaId[] = ['suelo', 'elevado', 'macetas', 'almacigo'];
const LETRA_ZONA: Record<string, ZonaId> = { s: 'suelo', e: 'elevado', m: 'macetas', a: 'almacigo' };
export const MACETAS: Record<CeldaId, { litros: number; prof: number }> = { '5,4': { litros: 4, prof: 15 }, '6,4': { litros: 8, prof: 30 }, '5,5': { litros: 8, prof: 30 }, '6,5': { litros: 20, prof: 45 } };

export function celdasDe(zona: ZonaId): CeldaId[] {
  const out: CeldaId[] = [];
  for (let y = 0; y < ALTO; y++) for (let x = 0; x < ANCHO; x++) if (LETRA_ZONA[MAPA[y][x]] === zona) out.push(x + ',' + y);
  return out;
}
export function zonaDeCelda(c: CeldaId): ZonaId | null { const p = c.split(','), fila = MAPA[+p[1]]; return (fila && LETRA_ZONA[fila[+p[0]]]) || null; }
export function xy(c: CeldaId): { x: number; y: number } { const p = c.split(','); return { x: +p[0], y: +p[1] }; }
export function vecinas(celda: CeldaId): CeldaId[] {
  const p = xy(celda), out: CeldaId[] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) out.push((p.x + dx) + ',' + (p.y + dy));
  return out;
}

/** [SUPUESTO] Horas de sol directo de una celda en una década: geometría de este patio. */
export function horasSol(E: Pick<Estado, 'dec'>, celda: CeldaId, dec?: number): number {
  const d = dec || E.dec, p = xy(celda), dia = diaCentral(d);
  const inv = (Math.cos(6.2831853 * (dia - 172) / 365) + 1) / 2;
  const base = 10 - 3.5 * inv;
  const pared = [0, 2 + 3.5 * inv, 3 * inv, 1.2 * inv, 0.5 * inv][p.y] || 0;
  const conHojas = d >= 28 || d <= 12; // el paraíso es caduco
  const dist = Math.max(Math.abs(p.x - 7), Math.min(Math.abs(p.y - 1), Math.abs(p.y - 2)));
  const arbol = (dist <= 1 ? 4.5 : dist === 2 ? 3 : dist === 3 ? 1.5 : 0) * (conHojas ? 1 : 0.3);
  return r1(clamp(base - pared - arbol, 0, 12));
}
