/** La ficha de una especie: lo que pide y cuándo, con los nombres de sus vecinos buenos y malos. */
import * as M from '../../dominio';
import type { Especie, Estado, Ventana } from '../../dominio';
import { nombreCorto } from './escena';

export interface Vecino {
  slug: string;
  nombre: string;
}
export interface FichaDeEspecie {
  sp: Especie;
  ventana: Ventana;
  ventanaDeTrasplante: Ventana;
  /** cómo conviene sembrarla este mes, según el calendario: null si no es mes de siembra */
  metodo: string | null;
  luz: string;
  suelo: string;
  buenas: Vecino[];
  malas: Vecino[];
  /** la temperatura media pronosticada para esta década, para marcarla en los indicadores */
  tmed: number;
}

const vecinos = (slugs: string[]): Vecino[] =>
  slugs.filter((s) => M.ESPECIES[s]).map((s) => ({ slug: s, nombre: nombreCorto(M.ESPECIES[s].nombre) }));

export function fichaDeEspecie(E: Estado, slug: string): FichaDeEspecie | null {
  const sp = M.ESPECIES[slug];
  if (!sp) return null;
  return {
    sp,
    ventana: M.ventana(M.regionDe(E), slug, E.tiempo.dec),
    ventanaDeTrasplante: M.ventana(M.regionDe(E), slug, E.tiempo.dec, 'trasplante'),
    metodo: M.metodoDe(slug, E.tiempo.dec),
    luz: M.META.luces[sp.luz].nombre,
    suelo: M.META.suelos[sp.suelo].nombre,
    buenas: vecinos(sp.buenas),
    malas: vecinos(sp.malas),
    tmed: E.tiempo.clima.tmed,
  };
}
