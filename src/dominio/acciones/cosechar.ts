import { REGLAS } from '../../../datos/juego/reglas';
import { alCompost } from '../estructuras';
import { BIENALES, RALEO_SE_COME, objetivoCosecha } from '../catalogo';
import { porCelda } from '../espacio';
import { anotar, quitarPlanta } from '../estado';
import { bajoTunel as estaBajoTunel, floresAbiertas } from '../factores';
import { cumplir } from '../misiones';
import { zona } from '../patio';
import { especieDe, vivas } from '../planta';
import type { Especie, Estado, Evento, Planta } from '../tipos';
import { clamp, r1 } from '../util';
import * as T from '../textos/acciones';
import { type De, type Regla, gratis } from './regla';

const { cosecha: COSECHA, suelo: SUELO, compost: COMPOST, raleo: RALEO } = REGLAS;

/** Qué parte de las flores de un fruto cuaja: bajo el microtúnel casi nada; afuera, más con más flores cerca. */
function polinizacion(E: Estado, bajoTunel: boolean): number {
  if (bajoTunel) return COSECHA.polinizacionBajoTunel;
  return clamp(COSECHA.polinizacionBase + COSECHA.polinizacionPorFlor * floresAbiertas(E), 0, 1);
}

/** Cuántas porciones da esta cosecha, y por qué dio menos si dio menos. */
function rinde(E: Estado, pl: Planta, sp: Especie): T.ComoFueLaCosecha {
  const bajoTunel = estaBajoTunel(E, pl.celda);
  const pol = sp.fruto ? polinizacion(E, bajoTunel) : 1;
  const tut = sp.cuidados.includes('tutorado') && !pl.tutor ? COSECHA.sinTutor : 1;
  const cabe = porCelda(sp),
    cuantas = Math.min(vivas(pl), cabe),
    apret = vivas(pl) > cabe ? COSECHA.apretadas : 1;
  const porPlanta = sp.pasadas > 1 ? COSECHA.porcionesPorPlanta.variasPasadas : COSECHA.porcionesPorPlanta.unaPasada;
  const porciones = r1(
    cuantas *
      apret *
      porPlanta *
      (pl.salud / 100) *
      pol *
      tut *
      (pl.dulce ? COSECHA.dulce : 1) *
      clamp(pl.pote + COSECHA.extraDeMaceta, 0, 1) *
      Math.max(1, pl.reserva),
  );
  let cuajoPoco: T.ComoFueLaCosecha['cuajoPoco'] = null;
  if (sp.fruto && pol < COSECHA.polinizacionPobre) cuajoPoco = bajoTunel ? 'tunel' : 'sin-flores';
  return { porciones, cuajoPoco, dulce: pl.dulce, sinTutor: tut < 1, apretadas: apret < 1 };
}

/** Los logros que puede destrabar una cosecha. */
function logrosDeCosecha(E: Estado, evs: Evento[]): void {
  cumplir(E, 'cosecha1', evs);
  if (E.progreso.cosechado.lechuga && E.progreso.cosechado.tomate && E.progreso.cosechado.albahaca)
    cumplir(E, 'ensalada', evs);
  if (Object.keys(E.progreso.cosechado).length >= 5) cumplir(E, 'cinco', evs);
  if (E.tiempo.dec >= 16 && E.tiempo.dec <= 24) cumplir(E, 'invierno', evs);
}

export const cosechar: Regla<De<'cosechar'>> = {
  puede(E, a) {
    const pl = E.mundo.plantas[a.planta];
    if (!pl || pl.etapa !== 'cosechable') return T.noCosechable();
    if (especieDe(pl).flor) return T.floresSeDejan();
    return null;
  },
  costo: gratis,
  aplicar(E, a, evs) {
    const pl = E.mundo.plantas[a.planta],
      sp = especieDe(pl),
      c = E.mundo.celdas[pl.celda];
    const como = rinde(E, pl, sp);
    E.progreso.porciones = r1(E.progreso.porciones + como.porciones);
    E.progreso.cosechado[pl.slug] = r1((E.progreso.cosechado[pl.slug] || 0) + como.porciones);
    pl.cosechas++;
    pl.reserva = 0;
    pl.listoHace = 0;
    c.mo = clamp(c.mo - COSECHA.moQueSeLleva, SUELO.moMin, SUELO.moMax);
    alCompost(E, COMPOST.porCosecha);
    evs.push(anotar(E, 'bien', T.cosechaste(sp, como), pl.celda));
    if (sp.pasadas <= 1 || (pl.cosechas >= sp.pasadas && !sp.perenne)) {
      quitarPlanta(E, pl, true);
      evs.push(anotar(E, 'info', T.terminoSuCiclo(sp), pl.celda));
    } else {
      pl.etapa = 'creciendo';
      pl.prog = objetivoCosecha(sp) - (sp.perenne ? COSECHA.vuelveAtras.perenne : COSECHA.vuelveAtras.resto);
    }
    logrosDeCosecha(E, evs);
  },
};

/** Cómo semilla una especie: un fruto se aparta enseguida, una bienal espera el frío, el resto unas décadas. */
function comoSemilla(sp: Especie): 'fruto' | 'bienal' | 'resto' {
  if (sp.fruto || sp.familia === 'leguminosa') return 'fruto';
  return BIENALES.includes(sp.slug) ? 'bienal' : 'resto';
}

export const semillar: Regla<De<'semillar'>> = {
  puede(E, a) {
    const pl = E.mundo.plantas[a.planta];
    if (!pl || (pl.etapa !== 'cosechable' && pl.etapa !== 'pasada')) return T.noSemilla();
    return null;
  },
  costo: gratis,
  aplicar(E, a, evs) {
    const pl = E.mundo.plantas[a.planta],
      sp = especieDe(pl),
      como = comoSemilla(sp);
    pl.etapa = 'semillando';
    pl.semillar = COSECHA.decadasSemillando[como];
    evs.push(anotar(E, 'info', T.dejasSemillar(sp, como), pl.celda));
  },
};

export const ralear: Regla<De<'ralear'>> = {
  puede(E, a) {
    const pl = E.mundo.plantas[a.planta];
    if (!pl) return T.nadaQueRalear();
    if (zona(E, E.mundo.celdas[pl.celda].zona).cria) return T.enAlmacigoSeRepica();
    if (vivas(pl) - Math.min(vivas(pl), porCelda(especieDe(pl))) < 1) return T.nadaQueRalear();
    return null;
  },
  costo: () => REGLAS.ratos.accion,
  aplicar(E, a, evs) {
    const pl = E.mundo.plantas[a.planta],
      sp = especieDe(pl),
      dejo = Math.min(vivas(pl), porCelda(sp)),
      saco = vivas(pl) - dejo;
    const seCome = RALEO_SE_COME.includes(pl.slug) && pl.prog > RALEO.seComeDesde;
    pl.n = dejo;
    let porciones: number | null = null;
    if (seCome) {
      porciones = r1(RALEO.porcionesPorPlanta * saco);
      E.progreso.porciones = r1(E.progreso.porciones + porciones);
    } else alCompost(E, COMPOST.porRaleo);
    evs.push(anotar(E, 'bien', T.raleaste(sp, dejo, saco, porciones), pl.celda));
  },
};

export const arrancar: Regla<De<'arrancar'>> = {
  puede: (E, a) => (E.mundo.plantas[a.planta] ? null : T.nadaAhi()),
  costo: gratis,
  aplicar(E, a, evs) {
    const pl = E.mundo.plantas[a.planta];
    evs.push(anotar(E, 'info', T.sacaste(especieDe(pl)), pl.celda));
    quitarPlanta(E, pl, pl.etapa !== 'semilla');
  },
};
