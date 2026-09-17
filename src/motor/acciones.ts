/** Todo lo que puede hacer el jugador. Cada acción valida, cobra ratos, cambia el estado y cuenta qué pasó. */
import { ABRIGO, abrigo } from './abrigo';
import { BIENALES, ESPECIES, RALEO_SE_COME, objetivoCosecha, semillasPorSiembra, ventana } from './catalogo';
import { anotar, gastar, quitarPlanta, ratosLibres } from './estado';
import { fMaceta, floresAbiertas } from './factores';
import { cumplir } from './misiones';
import { ZONAS } from './patio';
import type { Accion, Estado, Evento, NivelRiego, Planta, Resultado } from './tipos';
import { clamp, r1 } from './util';

type Hacer<A> = (E: Estado, a: A, evs: Evento[]) => string | void;
type De<T extends Accion['tipo']> = Extract<Accion, { tipo: T }>;
const SIN_RATOS = 'No te quedan ratos esta década.';

const sembrar: Hacer<De<'sembrar'>> = (E, a, evs) => {
  const sp = ESPECIES[a.slug], c = E.celdas[a.celda];
  if (!sp || !c) return 'No se puede sembrar ahí.';
  if (c.planta) return 'Esa celda está ocupada.';
  if (!(E.sobres[a.slug] > 0)) return 'No te quedan semillas de ' + sp.nombre.toLowerCase() + '.';
  if (!gastar(E, 1)) return SIN_RATOS;
  E.sobres[a.slug]--;
  const vent = ventana(a.slug, E.dec), gen = E.gen[a.slug] || 0;
  const vigor = (vent === 'ideal' ? 1 : vent === 'posible' ? 0.85 : 0.6) * (1 + 0.05 * Math.min(gen, 3)) * (c.fam === sp.familia ? 0.85 : 1);
  const id = 'p' + (E.nextId++), ns = semillasPorSiembra(a.slug, c.zona === 'almacigo');
  E.plantas[id] = { id, slug: a.slug, celda: a.celda, etapa: 'semilla', edad: 0, prog: 0, germ: 0, salud: 100, vigor: r1(vigor * 100) / 100, gen, cosechas: 0, listoHace: 0, plaga: null, tutor: false, shock: 0, dulce: false, semillar: 0, pote: fMaceta(sp, a.celda), reserva: 0, n: 0, semillas: ns };
  c.planta = id;
  let txt = 'Sembraste ' + sp.nombre.toLowerCase() + ' en ' + ZONAS[c.zona].nombre.toLowerCase() + (ns > 1 ? (c.zona === 'almacigo' ? ': una tanda de ' + ns + ' celdas.' : ': ' + ns + ' semillas juntas.') : '.');
  if (vent === 'fuera') txt += ' Está fuera de época: va a venir floja.';
  if (c.fam === sp.familia) txt += ' Repetís familia en la misma tierra: rinde menos y junta plagas.';
  evs.push(anotar(E, 'info', txt, a.celda));
};

const trasplantar: Hacer<De<'trasplantar'>> = (E, a, evs) => {
  let pl: Planta | undefined = E.plantas[a.planta]; const dest = E.celdas[a.celda];
  if (!pl || !dest) return 'No se puede trasplantar ahí.';
  if (dest.planta) return 'Esa celda está ocupada.';
  if (dest.zona === 'almacigo') return 'La almaciguera es para criar plantines, no para recibirlos.';
  if (pl.etapa === 'semilla') return 'Todavía no germinó.';
  const sp = ESPECIES[pl.slug], zo = E.celdas[pl.celda].zona;
  if (zo !== 'almacigo' && !sp.dt) return sp.nombre + ' no tolera el trasplante: si salieron varias juntas, raleá.';
  if (zo !== 'almacigo' && !((pl.n || 1) > 1) && !(sp.dt && pl.prog < sp.dt.max + 40)) return 'Ya está grande para moverla.';
  if (!gastar(E, 1)) return SIN_RATOS;
  let suelto = false;
  if ((pl.n || 1) > 1) { // del grupo sale un plantín; el resto queda esperando
    pl.n--; const hijo = JSON.parse(JSON.stringify(pl)) as Planta; hijo.id = 'p' + (E.nextId++); hijo.n = 1; hijo.avisoRaleo = false;
    E.plantas[hijo.id] = hijo; pl = hijo; suelto = true;
  }
  const origen = E.celdas[pl.celda]; let txt = 'Trasplantaste ' + sp.nombre.toLowerCase() + '.', tipo: 'info' | 'mal' = 'info';
  if (!sp.dt) { pl.salud -= 40; pl.vigor = r1(pl.vigor * 70) / 100; tipo = 'mal'; txt += ' No tolera el trasplante: la raíz sufrió mucho. Esta especie va de siembra directa.'; }
  else if (pl.prog < sp.dt.min) { pl.salud -= 15; tipo = 'mal'; txt += ' Era muy chico todavía (se trasplanta a los ' + sp.dt.min + '–' + sp.dt.max + ' días).'; }
  else if (ventana(pl.slug, E.dec, 'trasplante') === 'fuera') { pl.vigor = r1(pl.vigor * 88) / 100; txt += ' Está fuera de la ventana de trasplante.'; }
  if (!suelto) origen.planta = null;
  dest.planta = pl.id; pl.celda = a.celda; pl.shock = 1; pl.pote = fMaceta(sp, a.celda);
  if (pl.etapa === 'plantin') pl.etapa = 'creciendo';
  if (dest.fam === sp.familia) { pl.vigor = r1(pl.vigor * 85) / 100; txt += ' Repetís familia en esa tierra.'; }
  evs.push(anotar(E, tipo, txt, a.celda));
  if (sp.dt && pl.prog >= sp.dt.min) cumplir(E, 'plantin', evs);
};

const cosechar: Hacer<De<'cosechar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta]; if (!pl || pl.etapa !== 'cosechable') return 'Todavía no está para cosechar.';
  const sp = ESPECIES[pl.slug], c = E.celdas[pl.celda];
  if (sp.flor) return 'Las flores se dejan: trabajan atrayendo polinizadores. Podés dejarla semillar.';
  const bajoTunel = c.zona === 'elevado' && E.tunel;
  const pol = sp.fruto ? (bajoTunel ? 0.45 : clamp(0.55 + 0.12 * floresAbiertas(E), 0, 1)) : 1;
  const tut = sp.cuidados.includes('tutorado') && !pl.tutor ? 0.8 : 1;
  const apret = (pl.n || 1) > 1 ? 0.7 : 1;
  const n = r1(apret * (sp.pasadas > 1 ? 1 : 2) * (pl.salud / 100) * pol * tut * (pl.dulce ? 1.2 : 1) * clamp(pl.pote + 0.2, 0, 1) * Math.max(1, pl.reserva));
  E.porciones = r1(E.porciones + n); E.cosechado[pl.slug] = r1((E.cosechado[pl.slug] || 0) + n);
  pl.cosechas++; pl.reserva = 0; pl.listoHace = 0; c.mo = clamp(c.mo - 2, 5, 100); E.compost.carga += 0.5;
  let txt = 'Cosechaste ' + sp.nombre.toLowerCase() + ': ' + n + ' porciones.';
  if (sp.fruto && pol < 0.8) txt += bajoTunel ? ' Bajo el microtúnel no entran polinizadores: cuajó poco.' : ' Cuajó poco: faltan flores que atraigan polinizadores.';
  if (pl.dulce) txt += ' La helada la endulzó.';
  if (tut < 1) txt += ' Sin tutor rindió menos.';
  if (apret < 1) txt += ' Crecieron apretadas por no ralear: rindió menos.';
  evs.push(anotar(E, 'bien', txt, pl.celda));
  if (sp.pasadas <= 1 || (pl.cosechas >= sp.pasadas && !sp.perenne)) { quitarPlanta(E, pl, true); evs.push(anotar(E, 'info', sp.nombre + ' terminó su ciclo. Los restos van a la compostera.', pl.celda)); }
  else { pl.etapa = 'creciendo'; pl.prog = objetivoCosecha(sp) - (sp.perenne ? 20 : 10); }
  cumplir(E, 'cosecha1', evs);
  if (E.cosechado.lechuga && E.cosechado.tomate && E.cosechado.albahaca) cumplir(E, 'ensalada', evs);
  if (Object.keys(E.cosechado).length >= 5) cumplir(E, 'cinco', evs);
  if (E.dec >= 16 && E.dec <= 24) cumplir(E, 'invierno', evs);
};

const semillar: Hacer<De<'semillar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta]; if (!pl || (pl.etapa !== 'cosechable' && pl.etapa !== 'pasada')) return 'Solo una planta madura o pasada puede dar semilla.';
  const sp = ESPECIES[pl.slug];
  pl.etapa = 'semillando'; pl.semillar = sp.fruto || sp.familia === 'leguminosa' ? 1 : BIENALES.includes(pl.slug) ? 9 : 3;
  evs.push(anotar(E, 'info', 'Dejás semillar ' + sp.nombre.toLowerCase() + '. ' + (pl.semillar >= 9 ? 'Es bienal: florece recién después del frío, va a ocupar el lugar unos 3 meses.' : pl.semillar === 1 ? 'Apartás el mejor fruto para semilla.' : 'Va a ocupar el lugar unas 3 décadas más.'), pl.celda));
};

const ralear: Hacer<De<'ralear'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta]; if (!pl || !((pl.n || 1) > 1)) return 'No hay nada que ralear.';
  if (!gastar(E, 1)) return SIN_RATOS;
  const sp = ESPECIES[pl.slug], saco = pl.n - 1, come = RALEO_SE_COME.includes(pl.slug) && pl.prog > 18;
  let txt = 'Raleaste ' + sp.nombre.toLowerCase() + ': dejaste la más fuerte y sacaste ' + saco + '.';
  pl.n = 1;
  if (come) { const por = r1(0.2 * saco); E.porciones = r1(E.porciones + por); txt += ' El raleo se come: +' + por + ' porciones de hojitas tiernas.'; } else { E.compost.carga += 0.5; txt += ' Van a la compostera.'; }
  evs.push(anotar(E, 'bien', txt, pl.celda));
};

const arrancar: Hacer<De<'arrancar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta]; if (!pl) return 'No hay nada ahí.';
  evs.push(anotar(E, 'info', 'Sacaste ' + ESPECIES[pl.slug].nombre.toLowerCase() + '. Va a la compostera.', pl.celda)); quitarPlanta(E, pl, pl.etapa !== 'semilla');
};
const tutorar: Hacer<De<'tutorar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta]; if (!pl || pl.tutor) return 'No hace falta.';
  if (!gastar(E, 1)) return SIN_RATOS;
  pl.tutor = true; evs.push(anotar(E, 'info', 'Le pusiste tutor a ' + ESPECIES[pl.slug].nombre.toLowerCase() + '.', pl.celda));
};
const COMO_TRATAR = { pulgon: 'Rociaste jabón potásico: adiós pulgones.', oruga: 'Sacaste las orugas a mano, revisando el envés de las hojas.', babosa: 'Pusiste una trampa de cerveza: las babosas cayeron.' };
const tratar: Hacer<De<'tratar'>> = (E, a, evs) => {
  const pl = E.plantas[a.planta]; if (!pl || !pl.plaga) return 'No tiene plaga.';
  if (!gastar(E, 1)) return SIN_RATOS;
  const como = COMO_TRATAR[pl.plaga]; pl.plaga = null; evs.push(anotar(E, 'bien', como, pl.celda));
};
const mulch: Hacer<De<'mulch'>> = (E, a, evs) => {
  const c = E.celdas[a.celda]; if (!c || c.zona === 'almacigo') return 'Ahí no va mulch.'; if (c.mulch) return 'Ya tiene mulch.';
  if (!gastar(E, 1)) return SIN_RATOS;
  c.mulch = true; evs.push(anotar(E, 'info', 'Cubriste el suelo con pasto seco. Guarda humedad, frena yuyos y de a poco se hace tierra.', a.celda));
};
const compost: Hacer<De<'compost'>> = (E, a, evs) => {
  const c = E.celdas[a.celda]; if (!c) return 'Ahí no.'; if (E.compost.dosis < 1) return 'No tenés compost maduro todavía.';
  if (!gastar(E, 1)) return SIN_RATOS;
  E.compost.dosis--; c.mo = clamp(c.mo + 25, 0, 100); evs.push(anotar(E, 'bien', 'Incorporaste compost: la materia orgánica sube a ' + Math.round(c.mo) + ' %.', a.celda));
};
const riego: Hacer<De<'riego'>> = (E, a) => {
  if (!(a.zona in E.riego) || a.nivel < 0 || a.nivel > 3) return 'Riego inválido.';
  const antes = E.riego[a.zona]; E.riego[a.zona] = a.nivel as NivelRiego;
  if (ratosLibres(E) < 0) { E.riego[a.zona] = antes; return 'No te alcanzan los ratos para regar tanto esta década.'; }
};
const tunel: Hacer<De<'tunel'>> = (E, _a, evs) => {
  if (!gastar(E, 2)) return 'Armar o sacar el microtúnel lleva 2 ratos.';
  E.tunel = !E.tunel; evs.push(anotar(E, 'info', E.tunel ? 'Armaste el microtúnel sobre el bancal elevado: unos ' + ABRIGO.tunel + ' °C de abrigo contra heladas y +3 °C de día, pero no entra lluvia ni polinizadores.' : 'Sacaste el microtúnel.'));
};
const manta: Hacer<De<'manta'>> = (E, a, evs) => {
  if (!(a.zona in E.riego)) return 'Ahí no hay nada que tapar.'; if (E.manta[a.zona]) return 'Ya está tapado.';
  if (!gastar(E, 1)) return SIN_RATOS;
  E.manta[a.zona] = true;
  evs.push(anotar(E, 'info', 'Dejaste lista la manta antihelada para ' + ZONAS[a.zona].nombre.toLowerCase() + '. Suma unos ' + ABRIGO.manta + ' °C de abrigo y dura esta década: con lo que tiene puesto, ese cantero aguanta hasta ' + (abrigo(E, a.zona).aguanta + 0.1).toFixed(0) + ' °C de mínima.'));
};

export function despachar(E: Estado, accion: Accion): Resultado {
  if (E.terminado && accion.tipo !== 'seguir') return { ok: false, error: 'El año terminó.' };
  const evs: Evento[] = []; let err: string | void;
  switch (accion.tipo) {
    case 'seguir': E.terminado = false; E.anio++; return { ok: true, eventos: [anotar(E, 'info', 'Empieza el año ' + E.anio + '. La tierra y las semillas que guardaste siguen con vos.')] };
    case 'sembrar': err = sembrar(E, accion, evs); break;
    case 'trasplantar': err = trasplantar(E, accion, evs); break;
    case 'cosechar': err = cosechar(E, accion, evs); break;
    case 'semillar': err = semillar(E, accion, evs); break;
    case 'ralear': err = ralear(E, accion, evs); break;
    case 'arrancar': err = arrancar(E, accion, evs); break;
    case 'tutorar': err = tutorar(E, accion, evs); break;
    case 'tratar': err = tratar(E, accion, evs); break;
    case 'mulch': err = mulch(E, accion, evs); break;
    case 'compost': err = compost(E, accion, evs); break;
    case 'riego': err = riego(E, accion, evs); break;
    case 'tunel': err = tunel(E, accion, evs); break;
    case 'manta': err = manta(E, accion, evs); break;
    default: return { ok: false, error: 'Acción desconocida: ' + (accion as { tipo: string }).tipo };
  }
  return err ? { ok: false, error: err } : { ok: true, eventos: evs };
}
