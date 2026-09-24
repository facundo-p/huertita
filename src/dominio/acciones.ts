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
import { especieDe, nombreDe, vivas } from './planta';

type Hacer<A> = (E: Estado, a: A, evs: Evento[]) => string | void;
type De<T extends Accion['tipo']> = Extract<Accion, { tipo: T }>;
const SIN_RATOS = 'No te quedan ratos esta década.';
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
  if (!sp || !c) return 'No se puede sembrar ahí.';
  const Z = zona(E, c.zona),
    cria = !!Z.cria,
    bloque = bloqueDe(E, sp, a.celda, cria);
  if (!bloque)
    return (
      sp.nombre +
      ' hecha ocupa ' +
      sp.marco.huella +
      ' celdas y ahí no entran: probá más al norte o al oeste, en el mismo cantero.'
    );
  const tomada = ocupadaEn(E, bloque);
  if (tomada)
    return tomada === a.celda
      ? 'Esa celda está ocupada.'
      : sp.nombre + ' ocupa ' + sp.marco.huella + ' celdas y la de al lado está ocupada.';
  if (!(E.sobres[a.slug] > 0)) return 'No te quedan semillas de ' + nombreDe(sp) + '.';
  if (!gastar(E, RATOS.accion)) return SIN_RATOS;
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
  let txt =
    'Sembraste ' +
    nombreDe(sp) +
    ' en ' +
    Z.nombre.toLowerCase() +
    (ns > 1 ? (cria ? ': una tanda de ' + ns + ' celdas.' : ': ' + ns + ' semillas juntas.') : '.');
  if (bloque.length > 1) txt += ' Se guardó ' + bloque.length + ' celdas: cuando crezca las va a tapar.';
  if (vent === 'fuera') txt += ' Está fuera de época: va a venir floja.';
  if (c.fam === sp.familia) txt += ' Repetís familia en la misma tierra: rinde menos y junta plagas.';
  evs.push(anotar(E, 'info', txt, a.celda));
};

const trasplantar: Hacer<De<'trasplantar'>> = (E, a, evs) => {
  let pl: Planta | undefined = E.plantas[a.planta];
  const dest = E.celdas[a.celda];
  if (!pl || !dest) return 'No se puede trasplantar ahí.';
  if (dest.planta) return 'Esa celda está ocupada.';
  if (zona(E, dest.zona).cria) return 'La almaciguera es para criar plantines, no para recibirlos.';
  if (pl.etapa === 'semilla') return 'Todavía no germinó.';
  const sp = especieDe(pl),
    deCria = !!zona(E, E.celdas[pl.celda].zona).cria;
  const bloque = bloqueDe(E, sp, a.celda, false);
  if (!bloque)
    return (
      sp.nombre +
      ' hecha ocupa ' +
      sp.marco.huella +
      ' celdas y ahí no entran: probá más al norte o al oeste, en el mismo cantero.'
    );
  const tomada = ocupadaEn(E, bloque);
  if (tomada) return sp.nombre + ' ocupa ' + sp.marco.huella + ' celdas y la de al lado está ocupada.';
  if (!deCria && !sp.dt) return sp.nombre + ' no tolera el trasplante: si salieron varias juntas, raleá.';
  if (!deCria && !(vivas(pl) > 1) && !(sp.dt && pl.prog < sp.dt.max + TRASPLANTE.margenDeEdad))
    return 'Ya está grande para moverla.';
  if (!gastar(E, RATOS.accion)) return SIN_RATOS;
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
  let txt = 'Trasplantaste ' + nombreDe(sp) + '.',
    tipo: 'info' | 'mal' = 'info';
  if (!sp.dt) {
    pl.salud -= TRASPLANTE.danioSinTolerar;
    pl.vigor = r1(pl.vigor * TRASPLANTE.vigorSinTolerar) / 100;
    tipo = 'mal';
    txt += ' No tolera el trasplante: la raíz sufrió mucho. Esta especie va de siembra directa.';
  } else if (pl.prog < sp.dt.min) {
    pl.salud -= TRASPLANTE.danioChico;
    tipo = 'mal';
    txt += ' Era muy chico todavía (se trasplanta a los ' + sp.dt.min + '–' + sp.dt.max + ' días).';
  } else if (ventana(pl.slug, E.dec, 'trasplante') === 'fuera') {
    pl.vigor = r1(pl.vigor * TRASPLANTE.vigorFueraDeVentana) / 100;
    txt += ' Está fuera de la ventana de trasplante.';
  }
  if (!suelto) for (const k of celdasOrigen) E.celdas[k].planta = null;
  for (const k of bloque) E.celdas[k].planta = pl.id;
  pl.celda = a.celda;
  if (bloque.length > 1) pl.celdas = bloque;
  else delete pl.celdas;
  pl.shock = 1;
  pl.pote = fMaceta(E, sp, a.celda);
  if (pl.etapa === 'plantin') pl.etapa = 'creciendo';
  if (dest.fam === sp.familia) {
    pl.vigor = r1(pl.vigor * TRASPLANTE.vigorRepitiendoFamilia) / 100;
    txt += ' Repetís familia en esa tierra.';
  }
  evs.push(anotar(E, tipo, txt, a.celda));
  if (sp.dt && pl.prog >= sp.dt.min) cumplir(E, 'plantin', evs);
};

const cosechar: Hacer<De<'cosechar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl || pl.etapa !== 'cosechable') return 'Todavía no está para cosechar.';
  const sp = especieDe(pl),
    c = E.celdas[pl.celda];
  if (sp.flor) return 'Las flores se dejan: trabajan atrayendo polinizadores. Podés dejarla semillar.';
  const bajoTunel = estaBajoTunel(E, pl.celda);
  const pol = sp.fruto ? polinizacion(E, bajoTunel) : 1;
  const tut = sp.cuidados.includes('tutorado') && !pl.tutor ? COSECHA.sinTutor : 1;
  const cabe = porCelda(sp),
    cuantas = Math.min(vivas(pl), cabe),
    apret = vivas(pl) > cabe ? COSECHA.apretadas : 1;
  const n = r1(
    cuantas *
      apret *
      (sp.pasadas > 1 ? COSECHA.porcionesPorPlanta.variasPasadas : COSECHA.porcionesPorPlanta.unaPasada) *
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
  let txt = 'Cosechaste ' + nombreDe(sp) + ': ' + n + ' porciones.';
  if (sp.fruto && pol < COSECHA.polinizacionPobre)
    txt += bajoTunel
      ? ' Bajo el microtúnel no entran polinizadores: cuajó poco.'
      : ' Cuajó poco: faltan flores que atraigan polinizadores.';
  if (pl.dulce) txt += ' La helada la endulzó.';
  if (tut < 1) txt += ' Sin tutor rindió menos.';
  if (apret < 1) txt += ' Crecieron apretadas por no ralear: rindió menos.';
  evs.push(anotar(E, 'bien', txt, pl.celda));
  if (sp.pasadas <= 1 || (pl.cosechas >= sp.pasadas && !sp.perenne)) {
    quitarPlanta(E, pl, true);
    evs.push(anotar(E, 'info', sp.nombre + ' terminó su ciclo. Los restos van a la compostera.', pl.celda));
  } else {
    pl.etapa = 'creciendo';
    pl.prog = objetivoCosecha(sp) - (sp.perenne ? COSECHA.vuelveAtras.perenne : COSECHA.vuelveAtras.resto);
  }
  cumplir(E, 'cosecha1', evs);
  if (E.cosechado.lechuga && E.cosechado.tomate && E.cosechado.albahaca) cumplir(E, 'ensalada', evs);
  if (Object.keys(E.cosechado).length >= 5) cumplir(E, 'cinco', evs);
  if (E.dec >= 16 && E.dec <= 24) cumplir(E, 'invierno', evs);
};

/** Cuántas décadas ocupa el lugar una planta que se deja semillar: un fruto se aparta enseguida, una bienal espera el frío. */
function decadasSemillando(sp: Especie): number {
  const D = COSECHA.decadasSemillando;
  if (sp.fruto || sp.familia === 'leguminosa') return D.fruto;
  return BIENALES.includes(sp.slug) ? D.bienal : D.resto;
}
/** Qué parte de las flores de un fruto cuaja: bajo el microtúnel casi nada; afuera, más con más flores cerca. */
function polinizacion(E: Estado, bajoTunel: boolean): number {
  if (bajoTunel) return COSECHA.polinizacionBajoTunel;
  return clamp(COSECHA.polinizacionBase + COSECHA.polinizacionPorFlor * floresAbiertas(E), 0, 1);
}

const semillar: Hacer<De<'semillar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl || (pl.etapa !== 'cosechable' && pl.etapa !== 'pasada'))
    return 'Solo una planta madura o pasada puede dar semilla.';
  const sp = especieDe(pl);
  pl.etapa = 'semillando';
  pl.semillar = decadasSemillando(sp);
  evs.push(
    anotar(
      E,
      'info',
      'Dejás semillar ' +
        nombreDe(sp) +
        '. ' +
        (pl.semillar >= COSECHA.decadasSemillando.bienal
          ? 'Es bienal: florece recién después del frío, va a ocupar el lugar unos 3 meses.'
          : pl.semillar === COSECHA.decadasSemillando.fruto
            ? 'Apartás el mejor fruto para semilla.'
            : 'Va a ocupar el lugar unas 3 décadas más.'),
      pl.celda,
    ),
  );
};

const ralear: Hacer<De<'ralear'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl) return 'No hay nada que ralear.';
  const sp = especieDe(pl),
    dejo = Math.min(vivas(pl), porCelda(sp)),
    saco = vivas(pl) - dejo;
  if (saco < 1) return 'No hay nada que ralear.';
  if (!gastar(E, RATOS.accion)) return SIN_RATOS;
  const come = RALEO_SE_COME.includes(pl.slug) && pl.prog > REGLAS.raleo.seComeDesde;
  let txt =
    'Raleaste ' +
    nombreDe(sp) +
    ': dejaste ' +
    (dejo === 1 ? 'la más fuerte' : 'las ' + dejo + ' más fuertes') +
    ' y sacaste ' +
    saco +
    '.';
  pl.n = dejo;
  if (come) {
    const por = r1(REGLAS.raleo.porcionesPorPlanta * saco);
    E.porciones = r1(E.porciones + por);
    txt += ' El raleo se come: +' + por + ' porciones de hojitas tiernas.';
  } else {
    E.compost.carga += COMPOST.porRaleo;
    txt += ' Van a la compostera.';
  }
  evs.push(anotar(E, 'bien', txt, pl.celda));
};

const arrancar: Hacer<De<'arrancar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl) return 'No hay nada ahí.';
  evs.push(anotar(E, 'info', 'Sacaste ' + nombreDe(especieDe(pl)) + '. Va a la compostera.', pl.celda));
  quitarPlanta(E, pl, pl.etapa !== 'semilla');
};
const tutorar: Hacer<De<'tutorar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl || pl.tutor) return 'No hace falta.';
  if (!gastar(E, RATOS.accion)) return SIN_RATOS;
  pl.tutor = true;
  evs.push(anotar(E, 'info', 'Le pusiste tutor a ' + nombreDe(especieDe(pl)) + '.', pl.celda));
};
const COMO_TRATAR = {
  pulgon: 'Rociaste jabón potásico: adiós pulgones.',
  oruga: 'Sacaste las orugas a mano, revisando el envés de las hojas.',
  babosa: 'Pusiste una trampa de cerveza: las babosas cayeron.',
};
const tratar: Hacer<De<'tratar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta];
  if (!pl || !pl.plaga) return 'No tiene plaga.';
  if (!gastar(E, RATOS.accion)) return SIN_RATOS;
  const como = COMO_TRATAR[pl.plaga];
  pl.plaga = null;
  evs.push(anotar(E, 'bien', como, pl.celda));
};
const mulch: Hacer<De<'mulch'>> = (E, a, evs) => {
  const c = E.celdas[a.celda];
  if (!c || zona(E, c.zona).cria) return 'Ahí no va mulch.';
  if (c.mulch) return 'Ya tiene mulch.';
  if (!gastar(E, RATOS.accion)) return SIN_RATOS;
  c.mulch = true;
  evs.push(
    anotar(
      E,
      'info',
      'Cubriste el suelo con pasto seco. Guarda humedad, frena yuyos y de a poco se hace tierra.',
      a.celda,
    ),
  );
};
const compost: Hacer<De<'compost'>> = (E, a, evs) => {
  const c = E.celdas[a.celda];
  if (!c) return 'Ahí no.';
  if (E.compost.dosis < 1) return 'No tenés compost maduro todavía.';
  if (!gastar(E, RATOS.accion)) return SIN_RATOS;
  E.compost.dosis--;
  c.mo = clamp(c.mo + SUELO.moPorCompost, 0, 100);
  evs.push(anotar(E, 'bien', 'Incorporaste compost: la materia orgánica sube a ' + Math.round(c.mo) + ' %.', a.celda));
};
const riego: Hacer<De<'riego'>> = (E, a) => {
  if (!(a.zona in E.riego) || a.nivel < 0 || a.nivel > 3) return 'Riego inválido.';
  const antes = E.riego[a.zona];
  E.riego[a.zona] = a.nivel as NivelRiego;
  if (ratosLibres(E) < 0) {
    E.riego[a.zona] = antes;
    return 'No te alcanzan los ratos para regar tanto esta década.';
  }
};
const tunel: Hacer<De<'tunel'>> = (E, a, evs) => {
  const z = a.zona ?? zonaDeTunel(E);
  if (!z || !(z in E.riego) || !zona(E, z).admiteTunel) return 'Ahí no se puede armar un microtúnel.';
  if (!gastar(E, RATOS.tunel)) return 'Armar o sacar el microtúnel lleva ' + RATOS.tunel + ' ratos.';
  if (E.tunel[z]) delete E.tunel[z];
  else E.tunel[z] = true;
  evs.push(
    anotar(
      E,
      'info',
      E.tunel[z]
        ? 'Armaste el microtúnel sobre ' +
            zona(E, z).conArticulo +
            ': unos ' +
            ABRIGO.tunel +
            ' °C de abrigo contra heladas y +3 °C de día, pero no entra lluvia ni polinizadores.'
        : 'Sacaste el microtúnel.',
    ),
  );
};
const manta: Hacer<De<'manta'>> = (E, a, evs) => {
  if (!(a.zona in E.riego)) return 'Ahí no hay nada que tapar.';
  if (E.manta[a.zona]) return 'Ya está tapado.';
  if (!gastar(E, RATOS.accion)) return SIN_RATOS;
  E.manta[a.zona] = true;
  evs.push(
    anotar(
      E,
      'info',
      'Dejaste lista la manta antihelada para ' +
        zona(E, a.zona).nombre.toLowerCase() +
        '. Suma unos ' +
        ABRIGO.manta +
        ' °C de abrigo y dura esta década: con lo que tiene puesto, ese cantero aguanta hasta ' +
        (abrigo(E, a.zona).aguanta + 0.1).toFixed(0) +
        ' °C de mínima.',
    ),
  );
};

export function despachar(E: Estado, accion: Accion): Resultado {
  if (E.terminado && accion.tipo !== 'seguir') return { ok: false, error: 'El año terminó.' };
  const evs: Evento[] = [];
  let err: string | void;
  switch (accion.tipo) {
    case 'seguir':
      E.terminado = false;
      E.anio++;
      return {
        ok: true,
        eventos: [
          anotar(E, 'info', 'Empieza el año ' + E.anio + '. La tierra y las semillas que guardaste siguen con vos.'),
        ],
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
      return { ok: false, error: 'Acción desconocida: ' + (accion as { tipo: string }).tipo };
  }
  if (err) return { ok: false, error: err };
  // lo que el jugador le hizo a una planta queda también en el diario de esa planta
  for (const e of evs) {
    const id = e.celda && E.celdas[e.celda]?.planta,
      pl = id ? E.plantas[id] : null;
    if (pl) apuntar(E, pl, e.tipo, e.texto);
  }
  return { ok: true, eventos: evs };
}
