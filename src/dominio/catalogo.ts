/** El catálogo que ve el motor: datos de huertapp + lo que agrega el juego, sin huecos. */
import catalogoJson from '../../datos/catalogo.json';
import type { Catalogo } from '../../datos/contrato';
import { completar, type Especie } from '../../datos/juego/especies';
import { mesDe } from './clima';

const CATALOGO = catalogoJson as unknown as Catalogo;
export const META = CATALOGO.meta;
export const ESPECIES: Record<string, Especie> = {};
for (const [slug, r] of Object.entries(CATALOGO.especies)) ESPECIES[slug] = completar(slug, r);

export type Ventana = 'ideal' | 'posible' | 'fuera';
/** [REPO] calendario.decadas.conurbano */
export function ventana(slug: string, dec: number, que: 'siembra' | 'trasplante' = 'siembra'): Ventana {
  const d = ESPECIES[slug].dec;
  if ((d[`${que}_ideal`] ?? []).includes(dec)) return 'ideal';
  if ((d[`${que}_posible`] ?? []).includes(dec)) return 'posible';
  return 'fuera';
}
export const metodoDe = (slug: string, dec: number): string | null => ESPECIES[slug].metodo[String(mesDe(dec))] || null;
/** días efectivos de crecimiento para llegar a cosecha */
export const objetivoCosecha = (sp: Especie): number => sp.dc.min + (sp.dc.max - sp.dc.min) * 0.35;

// [SUPUESTO] cuántas semillas van por siembra: una tanda de celdas en la almaciguera, un golpe o chorrillo en directa
const VEGETATIVAS = 'ajo papa batata frutilla romero menta lavanda laurel'.split(' ');
export function semillasPorSiembra(slug: string, enAlmacigo: boolean): number {
  const sp = ESPECIES[slug];
  if (VEGETATIVAS.includes(slug)) return 1;
  if (enAlmacigo) return 6;
  return sp.familia === 'leguminosa' || sp.familia === 'cucurbitacea' || slug === 'choclo' || slug === 'girasol'
    ? 3
    : 4;
}
export const RALEO_SE_COME =
  'rabanito zanahoria remolacha nabo lechuga rucula espinaca acelga kale cebolla-de-verdeo perejil cilantro'.split(' ');
export const BIENALES =
  'zanahoria remolacha acelga cebolla puerro perejil apio repollo kale nabo repollitos-de-bruselas'.split(' ');
