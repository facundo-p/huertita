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
import { cap, clamp, r1 } from './util';
import { especieDe, nombreDe, vivas } from './planta';

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
  ev: (tipo: TipoEvento, txt: string, celda?: CeldaId | null) => void;
  /** anota solo en el diario de la planta que se está procesando: lo que no amerita un aviso en el cuaderno */
  nota: (tipo: TipoEvento, txt: string) => void;
}
type Sigue = boolean; // false = la planta ya no sigue este turno (murió, se perdió o terminó su parte)

/** [REPO] dias_germinacion + temperaturas.germinacion. [SUPUESTO] poder germinativo 85 % / 55 %. */
function germinar({ E, w, ev, evs }: Ctx, pl: Planta, sp: Especie, z: ZonaId): void {
  const tg = sp.tg,
    nom = sp.nombre,
    t = tempEfectiva(E, pl.celda, w),
    H = humedad(E, pl.celda, w);
  if (H < GERM.humedadMinima) {
    if (pl.edad === DIAS)
      ev(
        'mal',
        nom + ': la semilla está en tierra seca y no arranca. Necesita humedad pareja para germinar.',
        pl.celda,
      );
  } else if (t < tg.min || t > tg.max) {
    if (pl.edad === DIAS)
      ev(
        'mal',
        nom +
          ' no germina: el suelo está a ~' +
          Math.round(t) +
          ' °C y necesita entre ' +
          tg.min +
          ' y ' +
          tg.max +
          ' °C.' +
          (!zona(E, z).cria && t < tg.min ? ' En la almaciguera reparada habría arrancado.' : ''),
        pl.celda,
      );
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
      ev(
        'mal',
        'No germinó ninguna de las ' +
          S +
          ' semillas de ' +
          nombreDe(sp) +
          '. ' +
          (ideal
            ? 'A veces pasa: por eso se siembra de más.'
            : 'El suelo a ~' +
              Math.round(t) +
              ' °C está fuera del rango ideal (' +
              tg.ideal_min +
              '–' +
              tg.ideal_max +
              ' °C).'),
        pl.celda,
      );
      quitarPlanta(E, pl, false);
      return;
    }
    pl.n = nacieron;
    pl.etapa = zona(E, z).cria ? 'plantin' : 'creciendo';
    pl.prog = Math.round(necesita);
    ev(
      'bien',
      '¡Germinó ' +
        nombreDe(sp) +
        '!' +
        (S > 1
          ? ' Nacieron ' + nacieron + ' de ' + S + (ideal ? '.' : ': con el suelo fuera del rango ideal nacen menos.')
          : ''),
      pl.celda,
    );
    cumplir(E, 'germina', evs);
  } else if (pl.edad >= GERM.diasHastaPerderse) {
    ev('mal', 'La semilla de ' + nombreDe(sp) + ' se perdió: pasaron 30 días sin condiciones para germinar.', pl.celda);
    quitarPlanta(E, pl, false);
  }
}

/** [REPO] temperaturas.helada. [SUPUESTO] grados de cada abrigo. */
function helar({ E, w, ev, salvadas }: Ctx, pl: Planta, sp: Especie, z: ZonaId, ab: Abrigo): Sigue {
  const nom = sp.nombre,
    hiela = w.helada && w.tmin + ab.grados <= HELADA.umbral;
  if (w.helada && !hiela && (sp.helada === 'muere' || sp.helada === 'sensible'))
    (salvadas[z] = salvadas[z] || []).push(nom);
  if (!hiela) return true;
  let falta: string;
  const Z = zona(E, z);
  if (!(ab.grados > 0))
    falta =
      w.tmin + ABRIGO.manta > HELADA.umbral
        ? 'Una manta antihelada (+' + ABRIGO.manta + ' °C) la habría salvado.'
        : Z.admiteTunel && w.tmin + ABRIGO.manta + ABRIGO.tunel > HELADA.umbral
          ? 'Fue una helada fuerte: hacían falta manta y microtúnel juntos.'
          : 'Fue una helada muy fuerte: con ' + w.tmin + ' °C una manta sola no alcanzaba.';
  else
    falta =
      'Estaba con ' +
      ab.partes.join(' y ') +
      ', que abriga unos ' +
      ab.grados +
      ' °C y aguanta hasta ' +
      (ab.aguanta + 0.1).toFixed(0) +
      ' °C. ' +
      (Z.admiteTunel && !(E.tunel[z] && E.manta[z])
        ? 'Manta y microtúnel juntos suman ' + (ABRIGO.manta + ABRIGO.tunel) + ' °C.'
        : !Z.cria && !E.manta[z]
          ? 'Con una manta encima sumaba ' + ABRIGO.manta + ' °C más.'
          : 'En pleno invierno esta especie no tiene lugar afuera.');
  if (sp.helada === 'muere') {
    ev('mal', nom + ' murió: heló (mín ' + w.tmin + ' °C) y no tolera heladas. ' + falta, pl.celda);
    quitarPlanta(E, pl, true);
    return false;
  }
  if (sp.helada === 'sensible') {
    pl.salud -= HELADA.danioSensible;
    ev('mal', nom + ' se quemó con la helada (mín ' + w.tmin + ' °C). ' + falta, pl.celda);
  }
  if (sp.helada === 'mejora' && !pl.dulce) {
    pl.dulce = true;
    ev('bien', nom + ': la helada le concentra azúcares. Va a estar más rica.', pl.celda);
  }
  return true;
}

function semillarOSecarse({ E, ev, evs }: Ctx, pl: Planta, sp: Especie): Sigue {
  const nom = sp.nombre;
  if (pl.etapa === 'semillando') {
    if (--pl.semillar <= 0) {
      E.gen[pl.slug] = Math.max(E.gen[pl.slug] || 0, pl.gen + 1);
      E.sobres[pl.slug] = (E.sobres[pl.slug] || 0) + REGLAS.cosecha.sobresPorSemillar;
      E.semillasGuardadas += REGLAS.cosecha.sobresPorSemillar;
      ev(
        'bien',
        'Guardaste 4 sobres de ' +
          nombreDe(sp) +
          ' (generación ' +
          (pl.gen + 1) +
          '). Semilla criada en tu patio: se adapta un poco más cada año.',
        pl.celda,
      );
      cumplir(E, 'semillas', evs);
      quitarPlanta(E, pl, true);
    }
    return false;
  }
  if (pl.etapa === 'pasada') {
    if (++pl.listoHace > MADUREZ.pasadaSeSeca) {
      ev('info', nom + ' pasada se secó. Al compost.', pl.celda);
      quitarPlanta(E, pl, true);
    }
    return false;
  }
  return true;
}

/** Devuelve el factor de crecimiento g de esta década, que después usan salud y plagas. */
function crecer({ E, ev }: Ctx, pl: Planta, sp: Especie, z: ZonaId, F: Factores): number {
  const nom = sp.nombre,
    enAlm = !!zona(E, z).cria;
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
      ev(
        'info',
        nom +
          ': salieron ' +
          pl.n +
          ' juntas y compiten por luz y agua. ' +
          (sp.dt ? 'Podés repicar las que sobran a otro lugar o ralear.' : 'Hay que ralear y dejar una.'),
        pl.celda,
      );
    }
  }
  pl.shock = 0;
  if (!(enAlm && sp.dt && pl.prog >= sp.dt.max)) pl.prog += DIAS * clamp(g, 0, CREC.factorMaximo);
  if (enAlm && sp.dt && pl.prog >= sp.dt.max && pl.edad > sp.dt.max + CREC.diasHastaPasarse && !pl.avisoPasado) {
    pl.avisoPasado = true;
    pl.vigor = r1(pl.vigor * CREC.vigorPlantinPasado) / 100;
    ev(
      'mal',
      'El plantín de ' +
        nombreDe(sp) +
        ' se pasó en la almaciguera: raíces enruladas. Ya tendría que estar en su lugar.',
      pl.celda,
    );
  }
  if (enAlm && sp.dt && pl.prog >= sp.dt.min && !pl.avisoListo) {
    pl.avisoListo = true;
    ev('bien', 'Plantín de ' + nombreDe(sp) + ' listo para trasplantar.', pl.celda);
  }
  return g;
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
  const nom = sp.nombre,
    bajoTunel = !!E.tunel[z];
  if (F.agua.estado === 'seco' && F.agua.f < ESTRES.sedDesde) {
    pl.salud -= (1 - F.agua.f) * ESTRES.danioSed;
    if (F.agua.f >= ESTRES.sedGrave)
      nota('mal', 'Le faltó agua: pide riego ' + sp.riego + ' y tuvo menos. Perdió salud.');
    else
      ev(
        'mal',
        nom +
          ' pasa sed' +
          (macetaDe(E, pl.celda)
            ? ': las macetas se secan mucho más rápido que la tierra.'
            : ': subí el riego o poné mulch.'),
        pl.celda,
      );
  }
  if (F.agua.estado === 'exceso' && F.agua.diff > ESTRES.excesoDesde) {
    pl.salud -= ESTRES.danioExceso;
    ev(
      'mal',
      nom +
        ' tiene exceso de agua: pide riego ' +
        sp.riego +
        '. Con los pies mojados aparecen hongos y se pudre la raíz.',
      pl.celda,
    );
  }
  if (w.tmax + (bajoTunel ? ESTRES.calorBajoTunel : 0) > sp.tc.tolera_max + ESTRES.margenDeCalor) {
    pl.salud -= ESTRES.danioCalorBase + (w.tmax - sp.tc.tolera_max) * ESTRES.danioCalorPorGrado;
    ev(
      'mal',
      nom + ' sufrió el calor (máx ' + w.tmax + ' °C' + (bajoTunel ? ', y bajo el microtúnel es peor' : '') + ').',
      pl.celda,
    );
  }
  if (!w.helada && w.tmin + ab.grados < sp.tc.tolera_min) {
    pl.salud -= ESTRES.danioFrio;
    ev('mal', nom + ' sufrió el frío (mín ' + w.tmin + ' °C).', pl.celda);
  }
  if (F.luz.f < ESTRES.pocaLuz && pl.edad % ESTRES.avisoDeLuzCada === 0)
    ev('mal', nom + ' recibe ' + F.luz.horas + ' h de sol y pide ' + F.luz.pide + '. ' + sp.luzNo, pl.celda);
  if (g > ESTRES.creceBien && !pl.plaga) {
    if (pl.salud < 100) nota('bien', 'Creció a gusto y recuperó salud.');
    pl.salud = Math.min(100, pl.salud + ESTRES.curaPorDecada);
  } else if (g < ESTRES.creceLento) {
    const fs: [string, number][] = [
      ['poca luz (' + F.luz.horas + ' h, pide ' + F.luz.pide + ')', F.luz.f],
      ['el agua', F.agua.f],
      ['la temperatura (media ' + F.temp.t + ' °C, ideal ' + F.temp.pide + ')', F.temp.f],
      ['el suelo' + (F.suelo.maceta < 1 ? ' y la maceta chica' : ''), F.suelo.f],
      ['los vecinos', F.vecinos.f],
    ];
    fs.sort((a, b) => a[1] - b[1]);
    nota('info', 'Creció lento: lo que más la frenó fue ' + fs[0][0] + (pl.plaga ? ', además de la plaga' : '') + '.');
  }
}

/** [REPO] el texto de plagas de cada ficha. [SUPUESTO] las probabilidades. */
function plagas({ E, w, ev, nota, flores }: Ctx, pl: Planta, sp: Especie): void {
  const c = E.celdas[pl.celda];
  if (!pl.plaga) {
    const prot = clamp(1 - PLAGAS.proteccionPorAliado * aliadosCerca(E, pl.celda), PLAGAS.proteccionMaxima, 1),
      joven = pl.prog < objetivoCosecha(sp) * PLAGAS.jovenHasta;
    const rot = c.fam === sp.familia ? PLAGAS.riesgoRepitiendoFamilia : 1,
      d = w.dec,
      p = azar(E);
    if (sp.familia === 'brasicacea' && (d >= 31 || d <= 12) && p < PLAGAS.oruga.prob * prot * rot) {
      pl.plaga = 'oruga';
      ev(
        'mal',
        'Orugas en ' +
          nombreDe(sp) +
          ': la mariposa blanca pone en las brasicáceas. ' +
          (prot === 1 ? 'Sin flores ni aromáticas cerca no hay quien las controle.' : ''),
        pl.celda,
      );
    } else if (
      joven &&
      w.lluvia > PLAGAS.babosa.lluviaDesde &&
      !macetaDe(E, pl.celda) &&
      p < PLAGAS.babosa.prob * prot
    ) {
      pl.plaga = 'babosa';
      ev('mal', 'Babosas en ' + nombreDe(sp) + ': con tanta lluvia salen de noche y se comen lo tierno.', pl.celda);
    } else if (
      /hoja|fruto|Legumbre/.test(sp.grupo) &&
      ((d >= 25 && d <= 33) || (d >= 7 && d <= 12)) &&
      p < PLAGAS.pulgon.prob * prot * rot
    ) {
      pl.plaga = 'pulgon';
      ev(
        'mal',
        'Pulgones en ' +
          nombreDe(sp) +
          '. ' +
          (prot === 1 ? 'Flores y aromáticas cerca atraen vaquitas y crisopas que se los comen.' : ''),
        pl.celda,
      );
    }
  } else {
    pl.salud -= PLAGAS.danioPorDecada;
    nota(
      'mal',
      'Sigue con ' +
        (pl.plaga === 'pulgon' ? 'pulgones' : pl.plaga === 'oruga' ? 'orugas' : 'babosas') +
        ': pierde salud cada década hasta que la trates o lleguen aliados.',
    );
    if (flores >= PLAGAS.floresParaVaquitas && azar(E) < PLAGAS.probVaquitas) {
      ev(
        'bien',
        'Llegaron vaquitas de San Antonio atraídas por tus flores: limpiaron ' +
          nombreDe(sp) +
          ' de ' +
          (pl.plaga === 'pulgon' ? 'pulgones' : 'plaga') +
          '.',
        pl.celda,
      );
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
  const pe =
    (w.tmed - (sp.tc.ideal_max + ESPIGA.margen)) *
    ESPIGA.probPorGrado *
    (F.luz.horas <= ESPIGA.horasDeMediaSombra ? ESPIGA.aMediaSombra : 1);
  if (pe > 0 && azar(E) < pe) {
    pl.etapa = 'pasada';
    pl.listoHace = 0;
    ev(
      'mal',
      sp.nombre +
        ' se subió a flor por el calor (media ' +
        w.tmed +
        ' °C) y amargó. ' +
        (F.luz.horas > ESPIGA.horasDeMediaSombra ? 'A media sombra aguanta mucho más en verano.' : '') +
        ' Todavía podés dejarla semillar.',
      pl.celda,
    );
    return false;
  }
  return true;
}

function madurar({ E, w, ev }: Ctx, pl: Planta, sp: Especie, z: ZonaId): void {
  const nom = sp.nombre;
  if (pl.salud <= 0) {
    ev('mal', nom + ' murió. Revisá en el cuaderno qué le venía faltando.', pl.celda);
    quitarPlanta(E, pl, true);
    return;
  }
  if (pl.etapa === 'cosechable') {
    pl.listoHace++;
    if (sp.pasadas > 1) pl.reserva = Math.min(MADUREZ.reservaMaxima, pl.reserva + 1);
    else if (
      !sp.flor &&
      pl.listoHace > (w.tmed > MADUREZ.calorDesde ? MADUREZ.aguantaConCalor : MADUREZ.aguantaSinCalor)
    ) {
      pl.etapa = 'pasada';
      pl.listoHace = 0;
      ev('mal', nom + ' se pasó: había que cosecharla antes. ' + sp.listo, pl.celda);
    }
    if (sp.flor && pl.listoHace > MADUREZ.floracion) {
      ev('info', nom + ' terminó de florecer.', pl.celda);
      if (sp.perenne) {
        pl.etapa = 'creciendo';
        pl.prog = objetivoCosecha(sp) * MADUREZ.perenneVuelveA;
      } else quitarPlanta(E, pl, true);
    }
  } else if (!zona(E, z).cria && pl.prog >= objetivoCosecha(sp)) {
    pl.etapa = 'cosechable';
    pl.listoHace = 0;
    pl.reserva = 1;
    ev(
      'bien',
      sp.flor ? nom + ' abrió sus flores: empiezan a llegar polinizadores.' : nom + ' está para cosechar. ' + sp.listo,
      pl.celda,
    );
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
    ev('info', 'Cerraste una tanda de compost. En unos 4 meses va a estar madura.');
  }
  E.compost.tandas = E.compost.tandas.filter((t) => {
    t.avance += avanceDelCompost(w.tmed);
    if (t.avance >= COMPOST.madura) {
      E.compost.dosis += COMPOST.dosisPorTanda;
      ev('bien', 'Una tanda de compost maduró: huele a tierra de monte. +3 dosis.');
      return false;
    }
    return true;
  });
  E.visitas += Math.round(
    floresAbiertas(E) * (w.tmed > REGLAS.polinizadores.calorDesde ? REGLAS.polinizadores.visitasConCalor : 1),
  );
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
  let pend: { tipo: TipoEvento; texto: string; celda: CeldaId | null; n?: number }[] = [];
  const volcar = () => {
    // junta los avisos idénticos: "(×6)"
    const vistos: Record<string, (typeof pend)[number]> = {};
    for (const p of pend) {
      const k = p.tipo + p.texto;
      if (vistos[k]) vistos[k].n!++;
      else {
        vistos[k] = p;
        p.n = 1;
      }
    }
    for (const p of pend) if (p.n) evs.push(anotar(E, p.tipo, p.texto + (p.n > 1 ? ' (×' + p.n + ')' : ''), p.celda));
    pend = [];
  };
  let actual: Planta | null = null; // la planta que se está procesando: sus avisos van también a su diario
  const ctx: Ctx = {
    E,
    w,
    evs,
    flores: floresAbiertas(E),
    salvadas: {},
    ev: (tipo, texto, celda) => {
      pend.push({ tipo, texto, celda: celda || null });
      if (actual && celda === actual.celda) apuntar(E, actual, tipo, texto);
    },
    nota: (tipo, texto) => {
      if (actual) apuntar(E, actual, tipo, texto);
    },
  };
  ctx.ev(
    'clima',
    cap(fechaDe(w.dec)) +
      ': máx ' +
      w.tmax +
      ' °C, mín ' +
      w.tmin +
      ' °C, ' +
      (w.lluvia < 8 ? 'casi sin lluvia' : w.lluvia + ' mm de lluvia') +
      (w.helada ? '. HELÓ.' : w.ola ? '. Ola de calor.' : '.'),
  );

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
    const u = [...new Set(ctx.salvadas[zz])];
    ctx.ev(
      'bien',
      'Heló (mín ' +
        w.tmin +
        ' °C) pero ' +
        abrigo(E, zz).partes.join(' y ') +
        ' en ' +
        zona(E, zz).nombre.toLowerCase() +
        ' aguantó: se salvaron ' +
        u.join(', ').toLowerCase() +
        '.',
    );
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
    ctx.ev('logro', 'Pasó un año entero en la huerta. Mirá el balance.');
  }
  volcar();
  E.prox = generarTiempo(E, E.dec);
  while (ratosLibres(E) < 0) for (const zz of idsDeZonas(E)) if (E.riego[zz] > 0 && ratosLibres(E) < 0) E.riego[zz]--;
  return evs;
}
