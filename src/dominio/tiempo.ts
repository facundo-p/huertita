/**
 * El paso del tiempo. Hoy avanza de a una década (10 días) y esa cifra está metida
 * en las fórmulas; el paso 4 de los cimientos lo lleva a un tic diario con
 * `avanzar(estado, días)`. Mientras tanto, cada sistema ya vive en su función,
 * en el orden en que corre, para que ese cambio sea mover números y no desenredar.
 *
 * OJO con el orden: cada llamada a `azar` consume la secuencia de la partida. Cambiar
 * el orden de los sistemas cambia todas las partidas guardadas y rompe el test dorado.
 */
import { REGLAS } from '../../datos/juego/reglas';
import { ABRIGO, abrigo, type Abrigo } from './abrigo';
import { azar } from './azar';
import { objetivoCosecha } from './catalogo';
import { fechaDe, generarTiempo } from './clima';
import { anotar, quitarPlanta, ratosLibres } from './estado';
import {
  aliadosCerca,
  factoresPlanta,
  fVecinos,
  floresAbiertas,
  humedad,
  tempEfectiva,
  type Factores,
} from './factores';
import { porCelda } from './espacio';
import { cumplir } from './misiones';
import { apuntar, cerrar } from './diario';
import { idsDeZonas, macetaDe, zona } from './patio';
import type { CeldaId, Especie, Estado, Evento, Planta, Tiempo, TipoEvento, ZonaId } from './tipos';
import { clamp, r1 } from './util';
import { especieDe, vivas } from './planta';
import * as TC from './textos/crecimiento';
import type { Frase } from './textos/frase';
import * as TG from './textos/germinacion';
import * as TH from './textos/heladas';
import * as TP from './textos/plagas';
import * as TT from './textos/temporada';

const DIAS = 10;
const {
  germinacion: GERM,
  crecimiento: CREC,
  estres: ESTRES,
  plagas: PLAGAS,
  espigado: ESPIGA,
  madurez: MADUREZ,
} = REGLAS;
const { helada: HELADA, compost: COMPOST } = REGLAS;
interface Ctx {
  E: Estado;
  w: Tiempo;
  evs: Evento[];
  flores: number;
  salvadas: Partial<Record<ZonaId, string[]>>;
  ev: (tipo: TipoEvento, f: Frase, celda?: CeldaId | null) => void;
  /** anota solo en el diario de la planta que se está procesando: lo que no amerita un aviso en el cuaderno */
  nota: (tipo: TipoEvento, f: Frase) => void;
}
type Sigue = boolean; // false = la planta ya no sigue este turno (murió, se perdió o terminó su parte)

/** [REPO] dias_germinacion + temperaturas.germinacion. [SUPUESTO] poder germinativo 85 % / 55 %. */
function germinar({ E, w, ev, evs }: Ctx, pl: Planta, sp: Especie, z: ZonaId): void {
  const tg = sp.tg,
    t = tempEfectiva(E, pl.celda, w),
    H = humedad(E, pl.celda, w),
    primeraDecada = pl.edad === DIAS;
  if (H < GERM.humedadMinima) {
    if (primeraDecada) ev('mal', TG.tierraSeca(sp), pl.celda);
  } else if (t < tg.min || t > tg.max) {
    if (primeraDecada) ev('mal', TG.sueloFueraDeRango(sp, t, tg, !zona(E, z).cria && t < tg.min), pl.celda);
  } else pl.germ += DIAS * (t >= tg.ideal_min && t <= tg.ideal_max ? 1 : GERM.ritmoFueraDeIdeal);
  const necesita = (sp.dg.min + sp.dg.max) / 2;
  if (pl.germ >= necesita) {
    const ideal = t >= tg.ideal_min && t <= tg.ideal_max,
      pg = (ideal ? GERM.poder.ideal : GERM.poder.fueraDeIdeal) * clamp(pl.vigor + GERM.vigorExtra, GERM.vigorMin, 1),
      S = pl.semillas || 1;
    let nacieron = 0;
    for (let si = 0; si < S; si++) if (azar(E) < pg) nacieron++;
    if (S === 1) nacieron = 1;
    if (!nacieron) {
      ev('mal', TG.ningunaGermino(sp, S, ideal, t, tg), pl.celda);
      quitarPlanta(E, pl, false);
      return;
    }
    pl.n = nacieron;
    pl.etapa = zona(E, z).cria ? 'plantin' : 'creciendo';
    pl.prog = Math.round(necesita);
    ev('bien', TG.germino(sp, S, nacieron, ideal), pl.celda);
    cumplir(E, 'germina', evs);
  } else if (pl.edad >= GERM.diasHastaPerderse) {
    ev('mal', TG.semillaPerdida(sp, GERM.diasHastaPerderse), pl.celda);
    quitarPlanta(E, pl, false);
  }
}

/** Qué le faltó a una planta que heló: la frase que el cuaderno agrega después del daño. */
function queFaltoContraLaHelada(E: Estado, w: Tiempo, z: ZonaId, ab: Abrigo): string {
  const Z = zona(E, z);
  if (!(ab.grados > 0)) {
    if (w.tmin + ABRIGO.manta > HELADA.umbral) return TH.mantaAlcanzaba(ABRIGO.manta);
    if (Z.admiteTunel && w.tmin + ABRIGO.manta + ABRIGO.tunel > HELADA.umbral) return TH.hacianFaltaMantaYTunel();
    return TH.heladaMuyFuerte(w.tmin);
  }
  let yDespues = TH.sinLugarAfuera();
  if (Z.admiteTunel && !(E.tunel[z] && E.manta[z])) yDespues = TH.mantaYTunelSuman(ABRIGO.manta + ABRIGO.tunel);
  else if (!Z.cria && !E.manta[z]) yDespues = TH.conMantaSumaba(ABRIGO.manta);
  return TH.estabaAbrigada(ab, yDespues);
}

/** [REPO] temperaturas.helada. [SUPUESTO] grados de cada abrigo. */
function helar({ E, w, ev, salvadas }: Ctx, pl: Planta, sp: Especie, z: ZonaId, ab: Abrigo): Sigue {
  const hiela = w.helada && w.tmin + ab.grados <= HELADA.umbral;
  if (w.helada && !hiela && (sp.helada === 'muere' || sp.helada === 'sensible'))
    (salvadas[z] = salvadas[z] || []).push(sp.nombre);
  if (!hiela) return true;
  const falta = queFaltoContraLaHelada(E, w, z, ab);
  if (sp.helada === 'muere') {
    ev('mal', TH.murio(sp, w.tmin, falta), pl.celda);
    quitarPlanta(E, pl, true);
    return false;
  }
  if (sp.helada === 'sensible') {
    pl.salud -= HELADA.danioSensible;
    ev('mal', TH.seQuemo(sp, w.tmin, falta), pl.celda);
  }
  if (sp.helada === 'mejora' && !pl.dulce) {
    pl.dulce = true;
    ev('bien', TH.laEndulzo(sp), pl.celda);
  }
  return true;
}

function semillarOSecarse({ E, ev, evs }: Ctx, pl: Planta, sp: Especie): Sigue {
  if (pl.etapa === 'semillando') {
    if (--pl.semillar <= 0) {
      const sobres = REGLAS.cosecha.sobresPorSemillar;
      E.gen[pl.slug] = Math.max(E.gen[pl.slug] || 0, pl.gen + 1);
      E.sobres[pl.slug] = (E.sobres[pl.slug] || 0) + sobres;
      E.semillasGuardadas += sobres;
      ev('bien', TC.semillasGuardadas(sp, sobres, pl.gen + 1), pl.celda);
      cumplir(E, 'semillas', evs);
      quitarPlanta(E, pl, true);
    }
    return false;
  }
  if (pl.etapa === 'pasada') {
    if (++pl.listoHace > MADUREZ.pasadaSeSeca) {
      ev('info', TC.pasadaSeSeco(sp), pl.celda);
      quitarPlanta(E, pl, true);
    }
    return false;
  }
  return true;
}

/** Devuelve el factor de crecimiento g de esta década, que después usan salud y plagas. */
function crecer({ E, ev }: Ctx, pl: Planta, sp: Especie, z: ZonaId, F: Factores): number {
  const enAlm = !!zona(E, z).cria;
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
  const cabe = porCelda(sp);
  if (!enAlm && vivas(pl) > cabe) {
    g *= Math.max(CREC.competenciaPiso, 1 - CREC.competenciaPorPlanta * (pl.n - cabe));
    if (!pl.avisoRaleo) {
      pl.avisoRaleo = true;
      ev('info', TC.compitenJuntas(sp, pl.n), pl.celda);
    }
  }
  pl.shock = 0;
  if (!(enAlm && sp.dt && pl.prog >= sp.dt.max)) pl.prog += DIAS * clamp(g, 0, CREC.factorMaximo);
  if (enAlm && sp.dt && pl.prog >= sp.dt.max && pl.edad > sp.dt.max + CREC.diasHastaPasarse && !pl.avisoPasado) {
    pl.avisoPasado = true;
    pl.vigor = r1(pl.vigor * CREC.vigorPlantinPasado) / 100;
    ev('mal', TC.plantinPasado(sp), pl.celda);
  }
  if (enAlm && sp.dt && pl.prog >= sp.dt.min && !pl.avisoListo) {
    pl.avisoListo = true;
    ev('bien', TC.plantinListo(sp), pl.celda);
  }
  return g;
}

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

function estresar(
  { E, w, ev, nota }: Ctx,
  pl: Planta,
  sp: Especie,
  z: ZonaId,
  F: Factores,
  ab: Abrigo,
  g: number,
): void {
  const bajoTunel = !!E.tunel[z];
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
  if (!w.helada && w.tmin + ab.grados < sp.tc.tolera_min) {
    pl.salud -= ESTRES.danioFrio;
    ev('mal', TC.sufrioFrio(sp, w.tmin), pl.celda);
  }
  if (F.luz.f < ESTRES.pocaLuz && pl.edad % ESTRES.avisoDeLuzCada === 0)
    ev('mal', TC.pocaLuz(sp, F.luz.horas, F.luz.pide), pl.celda);
  if (g > ESTRES.creceBien && !pl.plaga) {
    if (pl.salud < 100) nota('bien', TC.recuperoSalud());
    pl.salud = Math.min(100, pl.salud + ESTRES.curaPorDecada);
  } else if (g < ESTRES.creceLento) nota('info', TC.crecioLento(queLaFreno(F), !!pl.plaga));
}

/** [REPO] el texto de plagas de cada ficha. [SUPUESTO] las probabilidades. */
function plagas({ E, w, ev, nota, flores }: Ctx, pl: Planta, sp: Especie): void {
  const c = E.celdas[pl.celda];
  if (!pl.plaga) {
    const prot = clamp(1 - PLAGAS.proteccionPorAliado * aliadosCerca(E, pl.celda), PLAGAS.proteccionMaxima, 1),
      joven = pl.prog < objetivoCosecha(sp) * PLAGAS.jovenHasta;
    const rot = c.fam === sp.familia ? PLAGAS.riesgoRepitiendoFamilia : 1,
      d = w.dec,
      p = azar(E),
      sinAliados = prot === 1;
    if (sp.familia === 'brasicacea' && (d >= 31 || d <= 12) && p < PLAGAS.oruga.prob * prot * rot) {
      pl.plaga = 'oruga';
      ev('mal', TP.orugas(sp, sinAliados), pl.celda);
    } else if (
      joven &&
      w.lluvia > PLAGAS.babosa.lluviaDesde &&
      !macetaDe(E, pl.celda) &&
      p < PLAGAS.babosa.prob * prot
    ) {
      pl.plaga = 'babosa';
      ev('mal', TP.babosas(sp), pl.celda);
    } else if (
      /hoja|fruto|Legumbre/.test(sp.grupo) &&
      ((d >= 25 && d <= 33) || (d >= 7 && d <= 12)) &&
      p < PLAGAS.pulgon.prob * prot * rot
    ) {
      pl.plaga = 'pulgon';
      ev('mal', TP.pulgones(sp, sinAliados), pl.celda);
    }
  } else {
    pl.salud -= PLAGAS.danioPorDecada;
    nota('mal', TP.sigueConPlaga(pl.plaga));
    if (flores >= PLAGAS.floresParaVaquitas && azar(E) < PLAGAS.probVaquitas) {
      ev('bien', TP.llegaronVaquitas(sp, pl.plaga), pl.celda);
      pl.plaga = null;
    }
  }
}

/** [REPO] riesgos de la ficha (subida a flor). [SUPUESTO] la probabilidad. */
function espigar({ E, w, ev }: Ctx, pl: Planta, sp: Especie, F: Factores): Sigue {
  if (!(
    sp.grupo === 'Hortaliza de hoja' &&
    sp.familia !== 'brasicacea' &&
    pl.prog > objetivoCosecha(sp) * ESPIGA.desde
  ))
    return true;
  const aMediaSombra = F.luz.horas <= ESPIGA.horasDeMediaSombra;
  const pe =
    (w.tmed - (sp.tc.ideal_max + ESPIGA.margen)) * ESPIGA.probPorGrado * (aMediaSombra ? ESPIGA.aMediaSombra : 1);
  if (pe > 0 && azar(E) < pe) {
    pl.etapa = 'pasada';
    pl.listoHace = 0;
    ev('mal', TC.espigo(sp, w.tmed, !aMediaSombra), pl.celda);
    return false;
  }
  return true;
}

function madurar({ E, w, ev }: Ctx, pl: Planta, sp: Especie, z: ZonaId): void {
  if (pl.salud <= 0) {
    ev('mal', TC.murio(sp), pl.celda);
    quitarPlanta(E, pl, true);
    return;
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
}

/** [REPO] compostaje.json: listo desde ~120 días, más rápido en verano. */
function suelosYCompost({ E, w, ev }: Ctx): void {
  for (const cel in E.celdas)
    if (E.celdas[cel].mulch) E.celdas[cel].mo = clamp(E.celdas[cel].mo + REGLAS.suelo.moPorMulch, 0, 100);
  E.compost.carga += COMPOST.restosDeCocina;
  if (E.compost.carga >= COMPOST.tanda) {
    E.compost.carga -= COMPOST.tanda;
    E.compost.tandas.push({ avance: 0 });
    ev('info', TT.tandaCerrada());
  }
  E.compost.tandas = E.compost.tandas.filter((t) => {
    t.avance += avanceDelCompost(w.tmed);
    if (t.avance >= COMPOST.madura) {
      E.compost.dosis += COMPOST.dosisPorTanda;
      ev('bien', TT.tandaMadura(COMPOST.dosisPorTanda));
      return false;
    }
    return true;
  });
  const P = REGLAS.polinizadores;
  E.visitas += Math.round(floresAbiertas(E) * (w.tmed > P.calorDesde ? P.visitasConCalor : 1));
}
/** Cuánto avanza una tanda de compost en la década: más rápido con calor, más lento con frío. */
function avanceDelCompost(tmed: number): number {
  if (tmed > COMPOST.calorDesde) return COMPOST.avanceConCalor;
  return tmed < COMPOST.frioDesde ? COMPOST.avanceConFrio : 1;
}

export function pasarDecada(E: Estado): Evento[] {
  if (E.terminado) return [];
  const evs: Evento[] = [],
    w = E.prox.real;
  let pend: { tipo: TipoEvento; f: Frase; celda: CeldaId | null; n?: number }[] = [];
  const volcar = () => {
    // junta los avisos idénticos: "(×6)"
    const vistos: Record<string, (typeof pend)[number]> = {};
    for (const p of pend) {
      const k = p.tipo + p.f.texto;
      if (vistos[k]) vistos[k].n!++;
      else {
        vistos[k] = p;
        p.n = 1;
      }
    }
    for (const p of pend)
      if (p.n) evs.push(anotar(E, p.tipo, p.n > 1 ? { ...p.f, texto: p.f.texto + ' (×' + p.n + ')' } : p.f, p.celda));
    pend = [];
  };
  let actual: Planta | null = null; // la planta que se está procesando: sus avisos van también a su diario
  const ctx: Ctx = {
    E,
    w,
    evs,
    flores: floresAbiertas(E),
    salvadas: {},
    ev: (tipo, f, celda) => {
      pend.push({ tipo, f, celda: celda || null });
      if (actual && celda === actual.celda) apuntar(E, actual, tipo, f);
    },
    nota: (tipo, f) => {
      if (actual) apuntar(E, actual, tipo, f);
    },
  };
  ctx.ev('clima', TT.climaDeLaDecada(fechaDe(w.dec), w));

  for (const id of Object.keys(E.plantas)) {
    const pl = E.plantas[id];
    if (!pl) continue;
    const sp = especieDe(pl),
      z = E.celdas[pl.celda].zona,
      saludAntes = pl.salud;
    pl.edad += DIAS;
    actual = pl;
    const sigue = ((): boolean => {
      if (pl.etapa === 'semilla') {
        germinar(ctx, pl, sp, z);
        return true;
      }
      const ab = abrigo(E, z);
      if (!helar(ctx, pl, sp, z, ab)) return false;
      if (!semillarOSecarse(ctx, pl, sp)) return true;
      const F = factoresPlanta(E, pl, w);
      const g = crecer(ctx, pl, sp, z, F);
      estresar(ctx, pl, sp, z, F, ab, g);
      plagas(ctx, pl, sp);
      if (!espigar(ctx, pl, sp, F)) return true;
      madurar(ctx, pl, sp, z);
      return true;
    })();
    if (sigue && E.plantas[id]) cerrar(E, pl, saludAntes);
    actual = null;
  }

  for (const zz of Object.keys(ctx.salvadas) as ZonaId[]) {
    const nombres = [...new Set(ctx.salvadas[zz])];
    ctx.ev('bien', TH.seSalvaron(w.tmin, abrigo(E, zz), zona(E, zz), nombres));
  }
  volcar();
  for (const id in E.plantas) {
    const a = E.plantas[id];
    if (a.etapa !== 'semilla' && fVecinos(E, a.slug, a.celda, a.id).buenas.length) {
      cumplir(E, 'socios', evs);
      break;
    }
  }
  suelosYCompost(ctx);
  volcar();

  E.manta = {};
  E.ratosGastados = 0;
  E.turno++;
  E.dec = (E.dec % 36) + 1;
  if (E.turno % 36 === 0) {
    E.terminado = true;
    ctx.ev('logro', TT.anioTerminado());
  }
  volcar();
  E.prox = generarTiempo(E, E.dec);
  while (ratosLibres(E) < 0) for (const zz of idsDeZonas(E)) if (E.riego[zz] > 0 && ratosLibres(E) < 0) E.riego[zz]--;
  return evs;
}
