import { REGLAS } from '../../../datos/juego/reglas';
import { regionDe } from '../region';
import { ESPECIES, semillasPorSiembra, ventana } from '../catalogo';
import { bloqueDe, ocupadaEn, semillasDeSiembra } from '../espacio';
import { anotar } from '../estado';
import { fMaceta } from '../factores';
import { alSembrar } from '../pedidos';
import { zona } from '../patio';
import type { Estado, Planta } from '../tipos';
import { r1 } from '../util';
import * as T from '../textos/acciones';
import type { De, Regla } from './regla';

const SIEMBRA = REGLAS.siembra;

export const sembrar: Regla<De<'sembrar'>> = {
  puede(E, a) {
    const sp = ESPECIES[a.slug],
      c = E.mundo.celdas[a.celda];
    if (!sp || !c) return T.noSeSiembraAhi();
    const bloque = bloqueDe(E, sp, a.celda, !!zona(E, c.zona).cria);
    if (!bloque) return T.noEntra(sp);
    const tomada = ocupadaEn(E, bloque);
    if (tomada) return tomada === a.celda ? T.celdaOcupada() : T.laDeAlLadoOcupada(sp);
    if (!(E.recursos.sobres[a.slug] > 0)) return T.sinSemillas(sp);
    return null;
  },
  costo: () => REGLAS.ratos.accion,
  aplicar(E, a, evs) {
    const sp = ESPECIES[a.slug],
      c = E.mundo.celdas[a.celda],
      Z = zona(E, c.zona),
      cria = !!Z.cria,
      bloque = bloqueDe(E, sp, a.celda, cria)!;
    E.recursos.sobres[a.slug]--;
    const vent = ventana(regionDe(E), a.slug, E.tiempo.dec),
      gen = E.recursos.gen[a.slug] || 0,
      repite = c.fam === sp.familia;
    const vigor =
      SIEMBRA.vigorPorVentana[vent] *
      (1 + SIEMBRA.vigorPorGeneracion * Math.min(gen, SIEMBRA.generacionesQueSuman)) *
      (repite ? SIEMBRA.vigorRepitiendoFamilia : 1);
    const semillas = semillasDeSiembra(sp, Z, semillasPorSiembra(a.slug, cria));
    const pl = nuevaPlanta(E, a.slug, a.celda, r1(vigor * 100) / 100, gen, fMaceta(E, sp, a.celda), semillas);
    if (bloque.length > 1) pl.celdas = bloque;
    for (const k of bloque) E.mundo.celdas[k].planta = pl.id;
    alSembrar(E, a.slug);
    evs.push(anotar(E, 'info', T.sembraste(sp, Z, semillas, bloque.length, vent === 'fuera', repite), a.celda));
  },
};

/** Una siembra recién hecha: todavía semilla, con toda la salud. */
function nuevaPlanta(
  E: Estado,
  slug: string,
  celda: string,
  vigor: number,
  gen: number,
  pote: number,
  semillas: number,
): Planta {
  const id = 'p' + E.progreso.nextId++;
  const pl: Planta = {
    id,
    slug,
    celda,
    etapa: 'semilla',
    edad: 0,
    prog: 0,
    germ: 0,
    salud: 100,
    vigor,
    gen,
    cosechas: 0,
    listoHace: 0,
    plaga: null,
    tutor: false,
    shock: 0,
    dulce: false,
    semillar: 0,
    pote,
    reserva: 0,
    n: 0,
    semillas,
  };
  E.mundo.plantas[id] = pl;
  return pl;
}
