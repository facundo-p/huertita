/** Los colores del arte: paletas de hoja por familia de verdes, maderas, y cómo mezclar dos colores. */

/** Una paleta de hoja: `v` el verde, `c` el claro (luz), `o` el oscuro (sombra), `oo` el más oscuro. */
export interface Paleta {
  v: string;
  c: string;
  o: string;
  oo: string;
}

/** verde huerta */
export const V: Paleta = { v: '#3fae4a', c: '#86db5c', o: '#23773a', oo: '#174f2a' };
/** verde azulado (brasicáceas, aliáceas) */
export const AZ: Paleta = { v: '#5aa890', c: '#8fd0b4', o: '#357563', oo: '#24503f' };
/** gris verdoso (salvia, lavanda) */
export const GR: Paleta = { v: '#7fa88a', c: '#b3d1b0', o: '#55806a', oo: '#3a5c4c' };
/** verde oscuro (espinaca, perejil) */
export const OS: Paleta = { v: '#2f8a4a', c: '#5cc46a', o: '#1b5e34', oo: '#123f24' };

export const MADERA = '#8a5526',
  CANA = '#d9b779',
  PAJA = '#f0d071',
  TIERRA = '#4a2e1a';

/** Mezcla dos colores `#rrggbb`: t = 0 es `a`, t = 1 es `b`. */
export function mezcla(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  const [r, g, bl] = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}
