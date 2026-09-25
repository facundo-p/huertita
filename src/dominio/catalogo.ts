/** El catálogo que ve el motor: datos de huertapp + lo que agrega el juego, sin huecos. */
import catalogoJson from '../../datos/catalogo.json';
import type { Catalogo } from '../../datos/contrato';
import { completar, type Especie } from '../../datos/juego/especies';
import { REGLAS } from '../../datos/juego/reglas';
import { mesDe } from './clima';
import type { Region } from './region';
import type { Ventana } from './vocabulario';

const CATALOGO = catalogoJson as unknown as Catalogo;
export const META = CATALOGO.meta;
export const ESPECIES: Record<string, Especie> = {};
for (const [slug, r] of Object.entries(CATALOGO.especies)) ESPECIES[slug] = completar(slug, r);

export type { Ventana };
/** Si una década es buena para sembrar o trasplantar una especie, según el calendario de la región. */
export function ventana(R: Region, slug: string, dec: number, que: 'siembra' | 'trasplante' = 'siembra'): Ventana {
  const d = R.calendario[slug] ?? {};
  if ((d[`${que}_ideal`] ?? []).includes(dec)) return 'ideal';
  if ((d[`${que}_posible`] ?? []).includes(dec)) return 'posible';
  return 'fuera';
}
export const metodoDe = (slug: string, dec: number): string | null => ESPECIES[slug].metodo[String(mesDe(dec))] || null;
/** días efectivos de crecimiento para llegar a cosecha */
export const objetivoCosecha = (sp: Especie): number => sp.dc.min + (sp.dc.max - sp.dc.min) * REGLAS.cosecha.objetivo;

/** [SUPUESTO] las que se plantan de diente, tubérculo, estolón o esqueje: una por siembra */
const VEGETATIVAS = 'ajo papa batata frutilla romero menta lavanda laurel'.split(' ');
/** Cuántas semillas van por siembra: una tanda de celdas en la almaciguera, un golpe o chorrillo en directa. */
export function semillasPorSiembra(slug: string, enAlmacigo: boolean): number {
  const sp = ESPECIES[slug];
  if (VEGETATIVAS.includes(slug)) return 1;
  const S = REGLAS.siembra.semillas;
  if (enAlmacigo) return S.almacigo;
  const grande =
    sp.familia === 'leguminosa' || sp.familia === 'cucurbitacea' || slug === 'choclo' || slug === 'girasol';
  return grande ? S.grandes : S.resto;
}
export const RALEO_SE_COME =
  'rabanito zanahoria remolacha nabo lechuga rucula espinaca acelga kale cebolla-de-verdeo perejil cilantro'.split(' ');
export const BIENALES =
  'zanahoria remolacha acelga cebolla puerro perejil apio repollo kale nabo repollitos-de-bruselas'.split(' ');
