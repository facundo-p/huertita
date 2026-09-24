import { REGLAS } from '../../../datos/juego/reglas';
import { ventana } from '../catalogo';
import { bloqueDe, celdasDePlanta, ocupadaEn } from '../espacio';
import { anotar } from '../estado';
import { fMaceta } from '../factores';
import { cumplir } from '../misiones';
import { zona } from '../patio';
import { especieDe, vivas } from '../planta';
import type { Estado, Planta } from '../tipos';
import { r1 } from '../util';
import * as T from '../textos/acciones';
import type { De, Regla } from './regla';

const TRASPLANTE = REGLAS.trasplante;

/**
 * Si esta planta se puede sacar de donde está, sin mirar todavía adónde va. Es lo que decide si la
 * interfaz ofrece "Trasplantar": de la almaciguera sale cualquier plantín; de la tierra, solo una
 * especie que tolere el trasplante, joven o con varias juntas para repicar.
 */
export function puedeMoverse(E: Estado, pl: Planta): string | null {
  if (pl.etapa === 'semilla') return T.noGermino();
  if (pl.etapa !== 'plantin' && pl.etapa !== 'creciendo') return T.noEsDeMover();
  const sp = especieDe(pl);
  if (zona(E, E.celdas[pl.celda].zona).cria) return null;
  if (!sp.dt) return T.noToleraTrasplante(sp);
  if (!(vivas(pl) > 1) && !(pl.prog < sp.dt.max + TRASPLANTE.margenDeEdad)) return T.yaGrande();
  return null;
}

export const trasplantar: Regla<De<'trasplantar'>> = {
  puede(E, a) {
    const pl = E.plantas[a.planta],
      dest = E.celdas[a.celda];
    if (!pl || !dest) return T.noSeTrasplantaAhi();
    if (dest.planta) return T.celdaOcupada();
    if (zona(E, dest.zona).cria) return T.almacigueraNoRecibe();
    const origen = puedeMoverse(E, pl);
    if (origen) return origen;
    const sp = especieDe(pl),
      bloque = bloqueDe(E, sp, a.celda, false);
    if (!bloque) return T.noEntra(sp);
    if (ocupadaEn(E, bloque)) return T.laDeAlLadoOcupada(sp);
    return null;
  },
  costo: () => REGLAS.ratos.accion,
  aplicar(E, a, evs) {
    const sp = especieDe(E.plantas[a.planta]),
      dest = E.celdas[a.celda],
      bloque = bloqueDe(E, sp, a.celda, false)!;
    // de un grupo sale un plantín y el resto queda esperando; si es uno solo, se mueve entero
    const varios = vivas(E.plantas[a.planta]) > 1,
      pl = varios ? separarUno(E, E.plantas[a.planta]) : E.plantas[a.planta];
    const celdasOrigen = celdasDePlanta(pl);
    const como = danioDelTrasplante(E, pl);
    if (!varios) for (const k of celdasOrigen) E.celdas[k].planta = null;
    for (const k of bloque) E.celdas[k].planta = pl.id;
    pl.celda = a.celda;
    if (bloque.length > 1) pl.celdas = bloque;
    else delete pl.celdas;
    pl.shock = 1;
    pl.pote = fMaceta(E, sp, a.celda);
    if (pl.etapa === 'plantin') pl.etapa = 'creciendo';
    const repite = dest.fam === sp.familia;
    if (repite) pl.vigor = r1(pl.vigor * TRASPLANTE.vigorRepitiendoFamilia) / 100;
    const tipo = como === 'no-tolera' || como === 'chico' ? 'mal' : 'info';
    evs.push(anotar(E, tipo, T.trasplantaste(sp, como, repite), a.celda));
    if (sp.dt && pl.prog >= sp.dt.min) cumplir(E, 'plantin', evs);
  },
};

/** Saca un plantín de un grupo: una copia con su misma historia, que va a otro lugar. */
function separarUno(E: Estado, grupo: Planta): Planta {
  grupo.n--;
  const hijo = JSON.parse(JSON.stringify(grupo)) as Planta;
  hijo.id = 'p' + E.nextId++;
  hijo.n = 1;
  hijo.avisoRaleo = false;
  E.plantas[hijo.id] = hijo;
  return hijo;
}

/** Cuánto sufre la raíz: mucho si la especie no tolera el trasplante, algo si el plantín era chico. */
function danioDelTrasplante(E: Estado, pl: Planta): T.ComoFueElTrasplante {
  const sp = especieDe(pl);
  if (!sp.dt) {
    pl.salud -= TRASPLANTE.danioSinTolerar;
    pl.vigor = r1(pl.vigor * TRASPLANTE.vigorSinTolerar) / 100;
    return 'no-tolera';
  }
  if (pl.prog < sp.dt.min) {
    pl.salud -= TRASPLANTE.danioChico;
    return 'chico';
  }
  if (ventana(pl.slug, E.dec, 'trasplante') === 'fuera') {
    pl.vigor = r1(pl.vigor * TRASPLANTE.vigorFueraDeVentana) / 100;
    return 'fuera-de-ventana';
  }
  return 'bien';
}
