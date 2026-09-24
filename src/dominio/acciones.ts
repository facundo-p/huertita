/** Todo lo que puede hacer el jugador. Cada acción valida, cobra ratos, cambia el estado y cuenta qué pasó. */
import { REGLAS } from '../../datos/juego/reglas';
import { ABRIGO, abrigo } from './abrigo';
import { BIENALES, ESPECIES, RALEO_SE_COME, objetivoCosecha, semillasPorSiembra, ventana } from './catalogo';
import { apuntar } from './diario';
import { anotar, gastar, quitarPlanta, ratosLibres } from './estado';
import { bajoTunel as estaBajoTunel, fMaceta, floresAbiertas } from './factores';
import { cumplir } from './misiones';
import { bloqueDe, celdasDePlanta, ocupadaEn, porCelda, semillasDeSiembra } from './espacio';
import { zona, zonaDeTunel } from './patio';
import type { Accion, Especie, Estado, Evento, NivelRiego, Planta, Resultado } from './tipos';
import { clamp, r1 } from './util';
import { especieDe, vivas } from './planta';
import * as T from './textos/acciones';
import { tratada } from './textos/plagas';
import { empiezaAnio } from './textos/temporada';

type Hacer<A> = (E: Estado, a: A, evs: Evento[]) => string | void;
type De<T extends Accion['tipo']> = Extract<Accion, { tipo: T }>;
const {
  ratos: RATOS,
  siembra: SIEMBRA,
  trasplante: TRASPLANTE,
  cosecha: COSECHA,
  suelo: SUELO,
  compost: COMPOST,
} = REGLAS;

const sembrar: Hacer<De<'sembrar'>> = (E, a, evs) => {
  const sp = ESPECIES[a.slug],
    c = E.celdas[a.celda];
  if (!sp || !c) return T.noSeSiembraAhi();
  const Z = zona(E, c.zona),
    cria = !!Z.cria,
    bloque = bloqueDe(E, sp, a.celda, cria);
  if (!bloque) return T.noEntra(sp);
  const tomada = ocupadaEn(E, bloque);
  if (tomada) return tomada === a.celda ? T.celdaOcupada() : T.laDeAlLadoOcupada(sp);
  if (!(E.sobres[a.slug] > 0)) return T.sinSemillas(sp);
  if (!gastar(E, RATOS.accion)) return T.sinRatos();
  E.sobres[a.slug]--;
  const vent = ventana(a.slug, E.dec),
    gen = E.gen[a.slug] || 0;
  const vigor =
    SIEMBRA.vigorPorVentana[vent] *
    (1 + SIEMBRA.vigorPorGeneracion * Math.min(gen, SIEMBRA.generacionesQueSuman)) *
    (c.fam === sp.familia ? SIEMBRA.vigorRepitiendoFamilia : 1);
  const id = 'p' + E.nextId++,
    ns = semillasDeSiembra(sp, Z, semillasPorSiembra(a.slug, cria));
  E.plantas[id] = {
    id,
    slug: a.slug,
    celda: a.celda,
    etapa: 'semilla',
    edad: 0,
    prog: 0,
    germ: 0,
    salud: 100,
    vigor: r1(vigor * 100) / 100,
    gen,
    cosechas: 0,
    listoHace: 0,
    plaga: null,
    tutor: false,
    shock: 0,
    dulce: false,
    semillar: 0,
    pote: fMaceta(E, sp, a.celda),
    reserva: 0,
    n: 0,
    semillas: ns,
  };
  if (bloque.length > 1) E.plantas[id].celdas = bloque;
  for (const k of bloque) E.celdas[k].planta = id;
  evs.push(anotar(E, 'info', T.sembraste(sp, Z, ns, bloque.length, vent === 'fuera', c.fam === sp.familia), a.celda));
};

const trasplantar: Hacer<De<'trasplantar'>> = (E, a, evs) => {
  let pl: Planta | undefined = E.plantas[a.planta];
  const dest = E.celdas[a.celda];
  if (!pl || !dest) return T.noSeTrasplantaAhi();
  if (dest.planta) return T.celdaOcupada();
  if (zona(E, dest.zona).cria) return T.almacigueraNoRecibe();
  if (pl.etapa === 'semilla') return T.noGermino();
  const sp = especieDe(pl),
    deCria = !!zona(E, E.celdas[pl.celda].zona).cria;
  const bloque = bloqueDe(E, sp, a.celda, false);
  if (!bloque) return T.noEntra(sp);
  if (ocupadaEn(E, bloque)) return T.laDeAlLadoOcupada(sp);
  if (!deCria && !sp.dt) return T.noToleraTrasplante(sp);
  if (!deCria && !(vivas(pl) > 1) && !(sp.dt && pl.prog < sp.dt.max + TRASPLANTE.margenDeEdad)) return T.yaGrande();
  if (!gastar(E, RATOS.accion)) return T.sinRatos();
  let suelto = false;
  if (vivas(pl) > 1) {
    // del grupo sale un plantín; el resto queda esperando
    pl.n--;
    const hijo = JSON.parse(JSON.stringify(pl)) as Planta;
    hijo.id = 'p' + E.nextId++;
    hijo.n = 1;
    hijo.avisoRaleo = false;
    E.plantas[hijo.id] = hijo;
    pl = hijo;
    suelto = true;
  }
  const celdasOrigen = celdasDePlanta(pl);
  let como: T.ComoFueElTrasplante = 'bien';
  if (!sp.dt) {
    pl.salud -= TRASPLANTE.danioSinTolerar;
    pl.vigor = r1(pl.vigor * TRASPLANTE.vigorSinTolerar) / 100;
    como = 'no-tolera';
  } else if (pl.prog < sp.dt.min) {
    pl.salud -= TRASPLANTE.danioChico;
    como = 'chico';
  } else if (ventana(pl.slug, E.dec, 'trasplante') === 'fuera') {
    pl.vigor = r1(pl.vigor * TRASPLANTE.vigorFueraDeVentana) / 100;
    como = 'fuera-de-ventana';
  }
  if (!suelto) for (const k of celdasOrigen) E.celdas[k].planta = null;
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
};

/** Cuántas décadas ocupa el lugar una planta que se deja semillar: un fruto se aparta enseguida, una bienal espera el frío. */
function comoSemilla(sp: Especie): 'fruto' | 'bienal' | 'resto' {
  if (sp.fruto || sp.familia === 'leguminosa') return 'fruto';
  return BIENALES.includes(sp.slug) ? 'bienal' : 'resto';
}
/** Qué parte de las flores de un fruto cuaja: bajo el microtúnel casi nada; afuera, más con más flores cerca. */
function polinizacion(E: Estado, bajoTunel: boolean): number {
  if (bajoTunel) return COSECHA.polinizacionBajoTunel;
  return clamp(COSECHA.polinizacionBase + COSECHA.polinizacionPorFlor * floresAbiertas(E), 0, 1);
}

const cosechar: Hacer<De<'cosechar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl || pl.etapa !== 'cosechable') return T.noCosechable();
  const sp = especieDe(pl),
    c = E.celdas[pl.celda];
  if (sp.flor) return T.floresSeDejan();
  const bajoTunel = estaBajoTunel(E, pl.celda);
  const pol = sp.fruto ? polinizacion(E, bajoTunel) : 1;
  const tut = sp.cuidados.includes('tutorado') && !pl.tutor ? COSECHA.sinTutor : 1;
  const cabe = porCelda(sp),
    cuantas = Math.min(vivas(pl), cabe),
    apret = vivas(pl) > cabe ? COSECHA.apretadas : 1;
  const porPlanta = sp.pasadas > 1 ? COSECHA.porcionesPorPlanta.variasPasadas : COSECHA.porcionesPorPlanta.unaPasada;
  const n = r1(
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
  E.porciones = r1(E.porciones + n);
  E.cosechado[pl.slug] = r1((E.cosechado[pl.slug] || 0) + n);
  pl.cosechas++;
  pl.reserva = 0;
  pl.listoHace = 0;
  c.mo = clamp(c.mo - COSECHA.moQueSeLleva, SUELO.moMin, SUELO.moMax);
  E.compost.carga += COMPOST.porCosecha;
  const cuajoPoco = sp.fruto && pol < COSECHA.polinizacionPobre ? (bajoTunel ? 'tunel' : 'sin-flores') : null;
  const como = { porciones: n, cuajoPoco, dulce: pl.dulce, sinTutor: tut < 1, apretadas: apret < 1 } as const;
  evs.push(anotar(E, 'bien', T.cosechaste(sp, como), pl.celda));
  if (sp.pasadas <= 1 || (pl.cosechas >= sp.pasadas && !sp.perenne)) {
    quitarPlanta(E, pl, true);
    evs.push(anotar(E, 'info', T.terminoSuCiclo(sp), pl.celda));
  } else {
    pl.etapa = 'creciendo';
    pl.prog = objetivoCosecha(sp) - (sp.perenne ? COSECHA.vuelveAtras.perenne : COSECHA.vuelveAtras.resto);
  }
  cumplir(E, 'cosecha1', evs);
  if (E.cosechado.lechuga && E.cosechado.tomate && E.cosechado.albahaca) cumplir(E, 'ensalada', evs);
  if (Object.keys(E.cosechado).length >= 5) cumplir(E, 'cinco', evs);
  if (E.dec >= 16 && E.dec <= 24) cumplir(E, 'invierno', evs);
};

const semillar: Hacer<De<'semillar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl || (pl.etapa !== 'cosechable' && pl.etapa !== 'pasada')) return T.noSemilla();
  const sp = especieDe(pl),
    como = comoSemilla(sp);
  pl.etapa = 'semillando';
  pl.semillar = COSECHA.decadasSemillando[como];
  evs.push(anotar(E, 'info', T.dejasSemillar(sp, como), pl.celda));
};

const ralear: Hacer<De<'ralear'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl) return T.nadaQueRalear();
  const sp = especieDe(pl),
    dejo = Math.min(vivas(pl), porCelda(sp)),
    saco = vivas(pl) - dejo;
  if (saco < 1) return T.nadaQueRalear();
  if (!gastar(E, RATOS.accion)) return T.sinRatos();
  const come = RALEO_SE_COME.includes(pl.slug) && pl.prog > REGLAS.raleo.seComeDesde;
  pl.n = dejo;
  let porciones: number | null = null;
  if (come) {
    porciones = r1(REGLAS.raleo.porcionesPorPlanta * saco);
    E.porciones = r1(E.porciones + porciones);
  } else E.compost.carga += COMPOST.porRaleo;
  evs.push(anotar(E, 'bien', T.raleaste(sp, dejo, saco, porciones), pl.celda));
};

const arrancar: Hacer<De<'arrancar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl) return T.nadaAhi();
  evs.push(anotar(E, 'info', T.sacaste(especieDe(pl)), pl.celda));
  quitarPlanta(E, pl, pl.etapa !== 'semilla');
};
const tutorar: Hacer<De<'tutorar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl || pl.tutor) return T.noHaceFalta();
  if (!gastar(E, RATOS.accion)) return T.sinRatos();
  pl.tutor = true;
  evs.push(anotar(E, 'info', T.tutor(especieDe(pl)), pl.celda));
};
const tratar: Hacer<De<'tratar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl || !pl.plaga) return T.sinPlaga();
  if (!gastar(E, RATOS.accion)) return T.sinRatos();
  const f = tratada(pl.plaga);
  pl.plaga = null;
  evs.push(anotar(E, 'bien', f, pl.celda));
};
const mulch: Hacer<De<'mulch'>> = (E, a, evs) => {
  const c = E.celdas[a.celda];
  if (!c || zona(E, c.zona).cria) return T.mulchNoVa();
  if (c.mulch) return T.yaTieneMulch();
  if (!gastar(E, RATOS.accion)) return T.sinRatos();
  c.mulch = true;
  evs.push(anotar(E, 'info', T.mulch(), a.celda));
};
const compost: Hacer<De<'compost'>> = (E, a, evs) => {
  const c = E.celdas[a.celda];
  if (!c) return T.compostNoVa();
  if (E.compost.dosis < 1) return T.sinCompost();
  if (!gastar(E, RATOS.accion)) return T.sinRatos();
  E.compost.dosis--;
  c.mo = clamp(c.mo + SUELO.moPorCompost, 0, 100);
  evs.push(anotar(E, 'bien', T.compost(c.mo), a.celda));
};
const riego: Hacer<De<'riego'>> = (E, a) => {
  if (!(a.zona in E.riego) || a.nivel < 0 || a.nivel > 3) return T.riegoInvalido();
  const antes = E.riego[a.zona];
  E.riego[a.zona] = a.nivel as NivelRiego;
  if (ratosLibres(E) < 0) {
    E.riego[a.zona] = antes;
    return T.riegoSinRatos();
  }
};
const tunel: Hacer<De<'tunel'>> = (E, a, evs) => {
  const z = a.zona ?? zonaDeTunel(E);
  if (!z || !(z in E.riego) || !zona(E, z).admiteTunel) return T.tunelNoVa();
  if (!gastar(E, RATOS.tunel)) return T.tunelLleva(RATOS.tunel);
  if (E.tunel[z]) delete E.tunel[z];
  else E.tunel[z] = true;
  const f = E.tunel[z] ? T.armasteTunel(zona(E, z), ABRIGO.tunel, REGLAS.temperatura.bajoTunel) : T.sacasteTunel();
  evs.push(anotar(E, 'info', f));
};
const manta: Hacer<De<'manta'>> = (E, a, evs) => {
  if (!(a.zona in E.riego)) return T.nadaQueTapar();
  if (E.manta[a.zona]) return T.yaTapado();
  if (!gastar(E, RATOS.accion)) return T.sinRatos();
  E.manta[a.zona] = true;
  evs.push(anotar(E, 'info', T.manta(zona(E, a.zona), ABRIGO.manta, abrigo(E, a.zona).aguanta)));
};

export function despachar(E: Estado, accion: Accion): Resultado {
  if (E.terminado && accion.tipo !== 'seguir') return { ok: false, error: T.anioTerminado() };
  const evs: Evento[] = [];
  let err: string | void;
  switch (accion.tipo) {
    case 'seguir':
      E.terminado = false;
      E.anio++;
      return {
        ok: true,
        eventos: [anotar(E, 'info', empiezaAnio(E.anio))],
      };
    case 'sembrar':
      err = sembrar(E, accion, evs);
      break;
    case 'trasplantar':
      err = trasplantar(E, accion, evs);
      break;
    case 'cosechar':
      err = cosechar(E, accion, evs);
      break;
    case 'semillar':
      err = semillar(E, accion, evs);
      break;
    case 'ralear':
      err = ralear(E, accion, evs);
      break;
    case 'arrancar':
      err = arrancar(E, accion, evs);
      break;
    case 'tutorar':
      err = tutorar(E, accion, evs);
      break;
    case 'tratar':
      err = tratar(E, accion, evs);
      break;
    case 'mulch':
      err = mulch(E, accion, evs);
      break;
    case 'compost':
      err = compost(E, accion, evs);
      break;
    case 'riego':
      err = riego(E, accion, evs);
      break;
    case 'tunel':
      err = tunel(E, accion, evs);
      break;
    case 'manta':
      err = manta(E, accion, evs);
      break;
    default:
      return { ok: false, error: T.desconocida((accion as { tipo: string }).tipo) };
  }
  if (err) return { ok: false, error: err };
  // lo que el jugador le hizo a una planta queda también en el diario de esa planta
  for (const e of evs) {
    const id = e.celda && E.celdas[e.celda]?.planta,
      pl = id ? E.plantas[id] : null;
    if (pl) apuntar(E, pl, e.tipo, { codigo: e.codigo ?? '', texto: e.texto });
  }
  return { ok: true, eventos: evs };
}
