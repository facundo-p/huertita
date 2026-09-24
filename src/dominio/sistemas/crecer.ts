/** Crecer y sufrir: los cinco factores deciden cuánto avanza la planta y qué le baja o le sube la salud. */
import { REGLAS } from '../../../datos/juego/reglas';
import { objetivoCosecha } from '../catalogo';
import { porCelda } from '../espacio';
import { factoresPlanta, type Factores } from '../factores';
import { macetaDe, zona } from '../patio';
import { vivas } from '../planta';
import * as TC from '../textos/crecimiento';
import { clamp, r1 } from '../util';
import type { Especie, Planta } from '../tipos';
import type { Contexto, SistemaDePlanta } from './contexto';

const { crecimiento: CREC, estres: ESTRES } = REGLAS;

/** Mide los cinco factores de crecimiento de esta década. No cambia nada. */
export const medir: SistemaDePlanta = ({ E, w }, t) => {
  t.F = factoresPlanta(E, t.pl, w);
  return 'sigue';
};

/** El producto de los factores, el vigor, y lo que la frena: plaga, trasplante reciente, falta de tutor. */
function factorDeCrecimiento(pl: Planta, sp: Especie, F: Factores): number {
  let g =
    F.luz.f *
    F.agua.f *
    F.temp.f *
    F.suelo.f *
    F.vecinos.f *
    pl.vigor *
    (pl.plaga ? CREC.conPlaga : 1) *
    (pl.shock ? CREC.conShock : 1);
  if (sp.cuidados.includes('tutorado') && !pl.tutor && pl.prog > objetivoCosecha(sp) * CREC.sinTutorDesde)
    g *= CREC.sinTutor;
  return g;
}

/** Un plantín en la almaciguera avisa cuando está listo, y se pasa si se queda de más. */
function plantinEnAlmacigo({ ev }: Contexto, pl: Planta, sp: Especie): void {
  if (!sp.dt) return;
  if (pl.prog >= sp.dt.max && pl.edad > sp.dt.max + CREC.diasHastaPasarse && !pl.avisoPasado) {
    pl.avisoPasado = true;
    pl.vigor = r1(pl.vigor * CREC.vigorPlantinPasado) / 100;
    ev('mal', TC.plantinPasado(sp), pl.celda);
  }
  if (pl.prog >= sp.dt.min && !pl.avisoListo) {
    pl.avisoListo = true;
    ev('bien', TC.plantinListo(sp), pl.celda);
  }
}

/** Cuánto avanza la planta esta década. Varias juntas en una celda compiten; en la almaciguera, un plantín hecho espera. */
export const crecer: SistemaDePlanta = (ctx, t) => {
  const { E, ev, dias } = ctx,
    { pl, sp, z } = t,
    enAlm = !!zona(E, z).cria;
  let g = factorDeCrecimiento(pl, sp, t.F!);
  const cabe = porCelda(sp);
  if (!enAlm && vivas(pl) > cabe) {
    g *= Math.max(CREC.competenciaPiso, 1 - CREC.competenciaPorPlanta * (pl.n - cabe));
    if (!pl.avisoRaleo) {
      pl.avisoRaleo = true;
      ev('info', TC.compitenJuntas(sp, pl.n), pl.celda);
    }
  }
  pl.shock = 0;
  if (!(enAlm && sp.dt && pl.prog >= sp.dt.max)) pl.prog += dias * clamp(g, 0, CREC.factorMaximo);
  if (enAlm) plantinEnAlmacigo(ctx, pl, sp);
  t.g = g;
  return 'sigue';
};

/** Lo que más frenó a una planta que creció lento. */
function queLaFreno(F: Factores): string {
  const frenos: [string, number][] = [
    [TC.frenoLuz(F.luz.horas, F.luz.pide), F.luz.f],
    [TC.frenoAgua(), F.agua.f],
    [TC.frenoTemperatura(F.temp.t, F.temp.pide), F.temp.f],
    [TC.frenoSuelo(F.suelo.maceta < 1), F.suelo.f],
    [TC.frenoVecinos(), F.vecinos.f],
  ];
  frenos.sort((a, b) => a[1] - b[1]);
  return frenos[0][0];
}

/** Sed, exceso de agua, calor, frío y poca luz bajan la salud; crecer a gusto la sube. */
export const estresar: SistemaDePlanta = ({ E, w, ev, nota }, t) => {
  const { pl, sp, z } = t,
    F = t.F!,
    g = t.g!,
    bajoTunel = !!E.recursos.tunel[z];
  if (F.agua.estado === 'seco' && F.agua.f < ESTRES.sedDesde) {
    pl.salud -= (1 - F.agua.f) * ESTRES.danioSed;
    if (F.agua.f >= ESTRES.sedGrave) nota('mal', TC.faltoAgua(sp));
    else ev('mal', TC.pasaSed(sp, !!macetaDe(E, pl.celda)), pl.celda);
  }
  if (F.agua.estado === 'exceso' && F.agua.diff > ESTRES.excesoDesde) {
    pl.salud -= ESTRES.danioExceso;
    ev('mal', TC.excesoDeAgua(sp), pl.celda);
  }
  if (w.tmax + (bajoTunel ? ESTRES.calorBajoTunel : 0) > sp.tc.tolera_max + ESTRES.margenDeCalor) {
    pl.salud -= ESTRES.danioCalorBase + (w.tmax - sp.tc.tolera_max) * ESTRES.danioCalorPorGrado;
    ev('mal', TC.sufrioCalor(sp, w.tmax, bajoTunel), pl.celda);
  }
  if (!w.helada && w.tmin + t.ab!.grados < sp.tc.tolera_min) {
    pl.salud -= ESTRES.danioFrio;
    ev('mal', TC.sufrioFrio(sp, w.tmin), pl.celda);
  }
  if (F.luz.f < ESTRES.pocaLuz && pl.edad % ESTRES.avisoDeLuzCada === 0)
    ev('mal', TC.pocaLuz(sp, F.luz.horas, F.luz.pide), pl.celda);
  if (g > ESTRES.creceBien && !pl.plaga) {
    if (pl.salud < 100) nota('bien', TC.recuperoSalud());
    pl.salud = Math.min(100, pl.salud + ESTRES.curaPorDecada);
  } else if (g < ESTRES.creceLento) nota('info', TC.crecioLento(queLaFreno(F), !!pl.plaga));
  return 'sigue';
};
