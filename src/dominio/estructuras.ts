/**
 * Lo construido en el patio que no es una zona de cultivo. Hoy hay una sola clase, la compostera, y
 * cada patio trae la suya en su plantilla. Si una partida no tiene compostera, lo que iría a ella se
 * pierde y no hay compost para repartir.
 */
import type { Patio } from '../../datos/juego/patio';
import type { Compostera, Estado, Estructura } from './tipos';

export function compostera(E: Pick<Estado, 'mundo'>): Compostera | null {
  return E.mundo.estructuras.find((s) => s.tipo === 'compostera') ?? null;
}

/** Suma restos a la compostera, si hay. */
export function alCompost(E: Pick<Estado, 'mundo'>, carga: number): void {
  const k = compostera(E);
  if (k) k.carga += carga;
}

/** Dosis de compost listas para usar. */
export const dosisDeCompost = (E: Pick<Estado, 'mundo'>): number => compostera(E)?.dosis ?? 0;

/** Las estructuras con las que arranca una partida en este patio. */
export function estructurasIniciales(p: Patio, dosisDeCompost: number): Estructura[] {
  return p.estructuras.map((s) => ({ tipo: s.tipo, en: s.en, carga: 0, tandas: [], dosis: dosisDeCompost }));
}
