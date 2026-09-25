/** Preguntas chicas sobre una planta que se repetían por todo el dominio. */
import { ESPECIES } from './catalogo';
import type { Especie, Planta } from './tipos';

/** La especie de una planta. */
export const especieDe = (pl: Pick<Planta, 'slug'>): Especie => ESPECIES[pl.slug];
/** Cuántas plantas vivas hay en esta siembra: una semilla todavía sin germinar cuenta como una. */
export const vivas = (pl: Pick<Planta, 'n'>): number => pl.n || 1;
/** El nombre de la especie como va en medio de una frase: "sembraste lechuga". */
export const nombreDe = (sp: Pick<Especie, 'nombre'>): string => sp.nombre.toLowerCase();
