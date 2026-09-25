/** El final de cada planta: semillar, secarse, espigar, madurar, pasarse, florecer. */
import { REGLAS } from '../../../datos/juego/reglas';
import { azar } from '../azar';
import { objetivoCosecha } from '../catalogo';
import { quitarPlanta } from '../estado';
import { cumplir } from '../misiones';
import { zona } from '../patio';
import * as TC from '../textos/crecimiento';
import type { Especie } from '../tipos';
import type { SistemaDePlanta } from './contexto';

const { madurez: MADUREZ, espigado: ESPIGA, cosecha: COSECHA } = REGLAS;

/** Una planta que está dando semilla termina de darla; una pasada, se seca. Ninguna de las dos crece más. */
export const semillarOSecarse: SistemaDePlanta = ({ E, ev, evs }, { pl, sp }) => {
  if (pl.etapa === 'semillando') {
    if (--pl.semillar <= 0) {
      const sobres = COSECHA.sobresPorSemillar;
      E.recursos.gen[pl.slug] = Math.max(E.recursos.gen[pl.slug] || 0, pl.gen + 1);
      E.recursos.sobres[pl.slug] = (E.recursos.sobres[pl.slug] || 0) + sobres;
      E.progreso.semillasGuardadas += sobres;
      ev('bien', TC.semillasGuardadas(sp, sobres, pl.gen + 1), pl.celda);
      cumplir(E, 'semillas', evs);
      quitarPlanta(E, pl, true);
    }
    return 'basta';
  }
  if (pl.etapa === 'pasada') {
    if (++pl.listoHace > MADUREZ.pasadaSeSeca) {
      ev('info', TC.pasadaSeSeco(sp), pl.celda);
      quitarPlanta(E, pl, true);
    }
    return 'basta';
  }
  return 'sigue';
};

/** [REPO] riesgos de la ficha: las hojas (no las brasicáceas) se suben a flor con calor. */
export const puedeEspigar = (sp: Especie): boolean => sp.grupo === 'Hortaliza de hoja' && sp.familia !== 'brasicacea';

/** [SUPUESTO] la probabilidad de espigar por década, que también usa la cuenta de los pedidos. */
export function probEspigar(sp: Especie, prog: number, tmed: number, horas: number): number {
  if (!puedeEspigar(sp) || prog <= objetivoCosecha(sp) * ESPIGA.desde) return 0;
  const aMediaSombra = horas <= ESPIGA.horasDeMediaSombra;
  return (tmed - (sp.tc.ideal_max + ESPIGA.margen)) * ESPIGA.probPorGrado * (aMediaSombra ? ESPIGA.aMediaSombra : 1);
}

export const espigar: SistemaDePlanta = ({ E, w, ev }, t) => {
  const { pl, sp } = t,
    F = t.F!,
    aMediaSombra = F.luz.horas <= ESPIGA.horasDeMediaSombra,
    prob = probEspigar(sp, pl.prog, w.tmed, F.luz.horas);
  if (prob > 0 && azar(E) < prob) {
    pl.etapa = 'pasada';
    pl.listoHace = 0;
    ev('mal', TC.espigo(sp, w.tmed, !aMediaSombra), pl.celda);
    return 'basta';
  }
  return 'sigue';
};

/** Sin salud, muere. Lista, espera la cosecha y se pasa si no llega; una flor florece y termina. */
export const madurar: SistemaDePlanta = ({ E, w, ev }, { pl, sp, z }) => {
  if (pl.salud <= 0) {
    ev('mal', TC.murio(sp), pl.celda);
    quitarPlanta(E, pl, true);
    return 'basta';
  }
  if (pl.etapa === 'cosechable') {
    pl.listoHace++;
    const aguanta = w.tmed > MADUREZ.calorDesde ? MADUREZ.aguantaConCalor : MADUREZ.aguantaSinCalor;
    if (sp.pasadas > 1) pl.reserva = Math.min(MADUREZ.reservaMaxima, pl.reserva + 1);
    else if (!sp.flor && pl.listoHace > aguanta) {
      pl.etapa = 'pasada';
      pl.listoHace = 0;
      ev('mal', TC.sePaso(sp), pl.celda);
    }
    if (sp.flor && pl.listoHace > MADUREZ.floracion) {
      ev('info', TC.terminoDeFlorecer(sp), pl.celda);
      if (sp.perenne) {
        pl.etapa = 'creciendo';
        pl.prog = objetivoCosecha(sp) * MADUREZ.perenneVuelveA;
      } else quitarPlanta(E, pl, true);
    }
  } else if (!zona(E, z).cria && pl.prog >= objetivoCosecha(sp)) {
    pl.etapa = 'cosechable';
    pl.listoHace = 0;
    pl.reserva = 1;
    ev('bien', sp.flor ? TC.abrioFlores(sp) : TC.paraCosechar(sp), pl.celda);
  }
  return 'basta';
};
