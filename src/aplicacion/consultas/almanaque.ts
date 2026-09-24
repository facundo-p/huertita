/** Las listas de especies: los sobres que tenés y el almanaque, primero lo que conviene sembrar ahora. */
import * as M from '../../dominio';
import type { Estado, Ventana } from '../../dominio';
import { nombreCorto } from './escena';

const ORDEN: Record<Ventana, number> = { ideal: 0, posible: 1, fuera: 2 };

export interface EspecieEnLista {
  slug: string;
  nombre: string;
  ventana: Ventana;
  /** sobres que tenés de esta especie */
  sobres: number;
  /** generación de semilla propia (0 si es comprada) */
  gen: number;
}

function ordenar(E: Estado, slugs: string[]): EspecieEnLista[] {
  return slugs
    .map((slug) => ({
      slug,
      nombre: nombreCorto(M.ESPECIES[slug].nombre),
      ventana: M.ventana(slug, E.tiempo.dec),
      sobres: E.recursos.sobres[slug] || 0,
      gen: E.recursos.gen[slug] || 0,
    }))
    .sort(
      (a, b) =>
        ORDEN[a.ventana] - ORDEN[b.ventana] || M.ESPECIES[a.slug].nombre.localeCompare(M.ESPECIES[b.slug].nombre),
    );
}

/** Los sobres que te quedan, primero los de época ideal. */
export const sobresDisponibles = (E: Estado): EspecieEnLista[] =>
  ordenar(
    E,
    Object.keys(E.recursos.sobres).filter((s) => E.recursos.sobres[s] > 0),
  );

/** El almanaque: tus sobres, o todas las especies del catálogo. */
export const almanaque = (E: Estado, todas: boolean): EspecieEnLista[] =>
  ordenar(
    E,
    Object.keys(M.ESPECIES).filter((s) => todas || E.recursos.sobres[s] > 0),
  );
