/**
 * Los pedidos de los vecinos: la tabla está en `datos/juego/pedidos.ts` y acá, cuándo llega uno,
 * cuándo se cumple y qué pasa si vence. Un pedido se cumple cosechando lo pedido antes de su fecha;
 * se cuenta lo que se coseche de la especie desde que llegó.
 *
 * Solo llega un pedido que se puede cumplir: entre que llega y la fecha tiene que haber una década
 * ideal de siembra desde la que, en un año normal, se llega a cosechar. Tira con `tirada`, no con `azar`.
 */
import { PEDIDOS, type Pedido, type PremioDePedido } from '../../datos/juego/pedidos';
import { REGLAS } from '../../datos/juego/reglas';
import { tirada } from './azar';
import { DECADAS_DEL_ANIO, diaCentral, fechaDe, interp } from './calendario';
import { ESPECIES, metodoDe, objetivoCosecha, ventana } from './catalogo';
import { anotar } from './estado';
import { compostera } from './estructuras';
import { fLuz, fMaceta, fSuelo, fTemp } from './factores';
import { horasSol, zonaDe, zonasDe } from './patio';
import { nombreDe } from './planta';
import { decadaEstacional, enTramo, regionDe } from './region';
import { DIAS_POR_TURNO } from './sistemas/contexto';
import { probEspigar } from './sistemas/madurar';
import * as T from './textos/pedidos';
import type { Frase } from './textos/frase';
import type { CeldaId, Especie, Estado, Evento, PedidoAbierto } from './tipos';
import { clamp, r1 } from './util';

export { PEDIDOS, type Pedido };

const { pedidos: P, germinacion: GERM, crecimiento: CREC } = REGLAS;

export const pedidoPorId = (id: string): Pedido | null => PEDIDOS.find((p) => p.id === id) ?? null;

/** La década del año en que cae un turno de esta partida (pasado o futuro). */
export function decadaDelTurno(E: Pick<Estado, 'tiempo'>, turno: number): number {
  const d = E.tiempo.dec - 1 + turno - E.tiempo.turno;
  return (((d % DECADAS_DEL_ANIO) + DECADAS_DEL_ANIO) % DECADAS_DEL_ANIO) + 1;
}

/** Días de la siembra a la cosecha con buen tiempo, según la ficha. */
export const diasHastaCosecha = (slug: string): number => Math.round(objetivoCosecha(ESPECIES[slug]));

/** La temperatura media normal de la región en la década de ese turno, sin el azar del año. */
function tempNormal(E: Estado, turno: number): number {
  return interp(regionDe(E).clima.media, diaCentral(decadaDelTurno(E, turno)));
}

/**
 * Luz, suelo y maceta de una celda para la especie en la década de ese turno, como en `factoresPlanta`.
 * La sombra de lo que hoy está plantado no cuenta: para cuando crezca el pedido eso ya se cosechó o se
 * sacó, y quien planifica hace lugar. La de las paredes y los árboles del patio sí.
 */
function lugar(E: Estado, sp: Especie, celda: CeldaId, turno: number): number {
  return (
    fLuz(sp, horasSinPlantas(E, celda, turno), P.temperaturaDeReferencia) *
    clamp(fSuelo(E, sp, celda) * fMaceta(E, sp, celda), 0, 1)
  );
}
const horasSinPlantas = (E: Estado, celda: CeldaId, turno: number): number =>
  horasSol({ tiempo: E.tiempo, mundo: { ...E.mundo, plantas: {} } }, celda, decadaDelTurno(E, turno));

/** La celda de la almaciguera con más luz para la especie cuando se siembra. */
function mejorAlmaciguera(E: Estado, sp: Especie, turno: number): CeldaId | null {
  let mejor: CeldaId | null = null,
    f = -1;
  for (const c in E.mundo.celdas) {
    if (!zonaDe(E, c).cria) continue;
    const fc = lugar(E, sp, c, turno);
    if (fc > f) [mejor, f] = [c, fc];
  }
  return mejor;
}

/**
 * Cuántas décadas pasan, en un año normal, de sembrar en `turno` a tener algo para cosechar en este
 * patio. Es el mismo modelo que `germinar` y `crecer`: la temperatura normal de cada década, la luz,
 * el suelo y la maceta de cada lugar, el vigor de la ventana de siembra y una huerta bien cuidada
 * (`REGLAS.pedidos.cuidado`). Vale el lugar donde llega antes, esté libre u ocupado: quien planifica
 * hace lugar, y así «a más tardar» es verdad también para quien lo hace. La luz de un lugar cambia con
 * la estación, así que se cuenta década por década y no solo la del día de la siembra. Si en esa
 * época la especie va a almácigo y el patio tiene dónde criar, nace y crece en la almaciguera, con su
 * luz, y se trasplanta cuando el plantín está hecho y es época de trasplante; si espera de más, se
 * pasa. Una hoja que con el calor espiga antes de la cosecha más de `REGLAS.pedidos.espigaComoMucho`
 * de las veces no llega. Si no llega a nacer, espiga o tarda más de un año, da `Infinity`.
 */
export function decadasHastaCosecha(E: Estado, slug: string, turno: number): number {
  const sp = ESPECIES[slug],
    cria = zonasDe(E).find((z) => z.cria),
    dec = decadaDelTurno(E, turno),
    enAlmacigo = !!(sp.dt && cria && /almacigo/.test(metodoDe(slug, dec) || '')),
    almaciguera = enAlmacigo ? mejorAlmaciguera(E, sp, turno) : null,
    vigor = REGLAS.siembra.vigorPorVentana[ventana(regionDe(E), slug, dec)];
  let mejor = Infinity;
  for (const celda in E.mundo.celdas) {
    if (zonaDe(E, celda).cria) continue;
    const s: Siembra = {
        E,
        sp,
        celda,
        cria: almaciguera ? cria!.calor || 0 : null,
        almaciguera,
        sembrada: turno,
        vigor,
      },
      nace = decadasHastaNacer(s, turno);
    if (nace < mejor) mejor = Math.min(mejor, nace + decadasHastaCrecer(s, turno + nace, mejor - nace));
  }
  return mejor;
}

/** Una siembra que se estima: dónde crece y, si nace en almácigo, cuánto abriga la zona de cría. */
interface Siembra {
  E: Estado;
  sp: Especie;
  celda: CeldaId;
  /** el calor de la zona de cría, si nace en almácigo; `null` si va directo a la tierra */
  cria: number | null;
  /** la mejor celda de la zona de cría, si nace en almácigo */
  almaciguera: CeldaId | null;
  /** el turno en que se siembra: de ahí se cuenta la edad del plantín */
  sembrada: number;
  vigor: number;
}
const tempEn = (s: Siembra, t: number, enAlmacigo: boolean): number =>
  tempNormal(s.E, t) + ((enAlmacigo ? s.cria : zonaDe(s.E, s.celda).calor) || 0);

/** Como `germinar`: décadas hasta que nace, o `Infinity` si la semilla se pierde. */
function decadasHastaNacer(s: Siembra, turno: number): number {
  const { tg, dg } = s.sp,
    necesita = (dg.min + dg.max) / 2;
  let germ = 0;
  for (let n = 1; n * DIAS_POR_TURNO <= GERM.diasHastaPerderse; n++) {
    const T = tempEn(s, turno + n - 1, s.cria !== null);
    if (T >= tg.min && T <= tg.max)
      germ += DIAS_POR_TURNO * (T >= tg.ideal_min && T <= tg.ideal_max ? 1 : GERM.ritmoFueraDeIdeal);
    if (germ >= necesita) return n;
  }
  return Infinity;
}

/** Un plantín que se estima: dónde está, cuánto creció y si ya se pasó en la almaciguera. */
interface Brote {
  prog: number;
  enAlmacigo: boolean;
  vigor: number;
  pasado: boolean;
  shock: boolean;
}

/**
 * El plantín hecho se trasplanta recién cuando es época de trasplante. Con margen: en un año más
 * fresco está hecho unas décadas después, así que se cuenta que llega a esta época solo si sigue
 * abierta `REGLAS.pedidos.margen` décadas más; si no, espera la próxima.
 */
function trasplantaSiEsEpoca(s: Siembra, b: Brote, t: number): void {
  const dt = s.sp.dt,
    esEpoca = (turno: number): boolean =>
      ventana(regionDe(s.E), s.sp.slug, decadaDelTurno(s.E, turno), 'trasplante') !== 'fuera';
  if (!b.enAlmacigo || !dt || b.prog < dt.min) return;
  if (!esEpoca(t) || !esEpoca(t + P.margen)) return;
  b.enAlmacigo = false;
  b.shock = true;
}

/** Como `plantinEnAlmacigo`: si espera hecho de más, se pasa y pierde vigor. */
function sePasaSiEspera(s: Siembra, b: Brote, t: number): void {
  const dt = s.sp.dt;
  if (!b.enAlmacigo || !dt || b.pasado || b.prog < dt.max) return;
  if ((t - s.sembrada + 1) * DIAS_POR_TURNO <= dt.max + CREC.diasHastaPasarse) return;
  b.pasado = true;
  b.vigor *= CREC.vigorPlantinPasado / 100;
}

/**
 * Como `crecer`: décadas desde que nace hasta que se puede cosechar. En la almaciguera crece con su
 * luz; el plantín hecho se trasplanta recién cuando es época, y si espera de más se pasa y pierde vigor.
 * Si pasa de `tope` décadas, da `Infinity`: ya hay un lugar donde llega antes.
 */
function decadasHastaCrecer(s: Siembra, desde: number, tope: number): number {
  const { sp, E } = s,
    b: Brote = {
      prog: Math.round((sp.dg.min + sp.dg.max) / 2),
      enAlmacigo: !!(s.almaciguera && sp.dt),
      vigor: s.vigor,
      pasado: false,
      shock: false,
    };
  let t = desde,
    sinEspigar = 1;
  while (b.prog < objetivoCosecha(sp)) {
    trasplantaSiEsEpoca(s, b, t);
    const donde = b.enAlmacigo ? s.almaciguera! : s.celda,
      aca = lugar(E, sp, donde, t),
      g = fTemp(sp, tempEn(s, t, b.enAlmacigo)) * aca * b.vigor * P.cuidado * (b.shock ? CREC.conShock : 1),
      esperaHecho = b.enAlmacigo && sp.dt && b.prog >= sp.dt.max;
    if (!esperaHecho) b.prog += DIAS_POR_TURNO * clamp(g, 0, CREC.factorMaximo);
    b.shock = false;
    sePasaSiEspera(s, b, t);
    // como `espigar`: con calor, una hoja se sube a flor antes de la cosecha
    sinEspigar *= 1 - clamp(probEspigar(sp, b.prog, tempNormal(E, t), horasSinPlantas(E, donde, t)), 0, 1);
    if (1 - sinEspigar > P.espigaComoMucho) return Infinity;
    // más de un año no llega; más que `tope`, ya hay un lugar mejor
    if (++t - desde > Math.min(DECADAS_DEL_ANIO, tope)) return Infinity;
  }
  return t - desde;
}

/** Si una siembra en `turno` llega a cosecharse para `vence`, en un año normal y con margen (`REGLAS.pedidos.margen`). */
export const llegaA = (E: Estado, slug: string, turno: number, vence: number): boolean =>
  turno + decadasHastaCosecha(E, slug, turno) <= vence - P.margen;

/** Cuánto tarda cada siembra posible entre que llega el pedido y la fecha (`PedidoAbierto.cuenta`). */
export function cuentaDe(E: Estado, slug: string, desde: number, vence: number): (number | null)[] {
  return Array.from({ length: vence - desde + 1 }, (_, i) => {
    const d = decadasHastaCosecha(E, slug, desde + i);
    return Number.isFinite(d) ? d : null;
  });
}
/** Lo que tardaba una siembra en ese turno, según la cuenta de cuando llegó el pedido. */
export const tardaba = (pd: PedidoAbierto, turno: number): number => pd.cuenta[turno - pd.desde] ?? Infinity;
/** Si una siembra en ese turno llegaba a la fecha con margen, según la cuenta de cuando llegó el pedido. */
export const llegaba = (pd: PedidoAbierto, turno: number): boolean => turno + tardaba(pd, turno) <= pd.vence - P.margen;
/** La última siembra que llegaba a la fecha, según la cuenta de cuando llegó el pedido, o `null`. */
export function limiteDe(pd: PedidoAbierto): number | null {
  for (let s = pd.vence; s >= pd.desde; s--) if (llegaba(pd, s)) return s;
  return null;
}

/**
 * El último turno en que una siembra todavía llega a cosecharse para la fecha, en un año normal, o
 * `null` si ninguna llega. Un pedido solo llega si hay alguna (`hayFechaDeSiembra`).
 */
export function ultimaSiembra(E: Estado, pd: Pick<PedidoAbierto, 'desde' | 'vence'>, p: Pedido): number | null {
  for (let s = pd.vence; s >= pd.desde; s--) if (llegaA(E, p.especie, s, pd.vence)) return s;
  return null;
}

/** Si entre `desde` y `vence` hay una década ideal para sembrar la especie que llegue a cosecharse. */
export function hayFechaDeSiembra(E: Estado, slug: string, desde: number, vence: number): boolean {
  const R = regionDe(E);
  for (let s = desde; s <= vence; s++)
    if (ventana(R, slug, decadaDelTurno(E, s)) === 'ideal' && llegaA(E, slug, s, vence)) return true;
  return false;
}

/** Lo cosechado de la especie desde que llegó el pedido. */
export const llevas = (E: Estado, pd: PedidoAbierto, p: Pedido): number =>
  r1((E.progreso.cosechado[p.especie] || 0) - pd.base);

// ── cuándo llega uno ──

function premioVa(E: Estado, pr: PremioDePedido): boolean {
  if (pr.tipo === 'goteo') return !E.recursos.goteo;
  return pr.tipo !== 'compost' || !!compostera(E);
}

/** Si este pedido puede llegar ahora: su época, que no esté abierto ni cerrado hace poco, que haya semillas y fecha. */
function puedeLlegar(E: Estado, p: Pedido): boolean {
  const PP = E.progreso.pedidos,
    ultimo = PP.cerrados[p.id];
  // dos pedidos abiertos de la misma especie se contarían la misma cosecha
  if (PP.abiertos.some((pd) => pd.id === p.id || pedidoPorId(pd.id)?.especie === p.especie)) return false;
  if (ultimo != null && E.tiempo.turno - ultimo < P.mismoCada) return false;
  if (!(E.recursos.sobres[p.especie] > 0) || !premioVa(E, p.premio)) return false;
  const d = decadaEstacional(regionDe(E), E.tiempo.dec);
  if (!p.cuando.some(([desde, hasta]) => enTramo(d, desde, hasta))) return false;
  return hayFechaDeSiembra(E, p.especie, E.tiempo.turno, E.tiempo.turno + p.plazo);
}

/** Si esta década llega un pedido, cuál. */
export function pedidoQueLlega(E: Estado): Pedido | null {
  if (E.progreso.pedidos.abiertos.length >= P.maxAbiertos) return null;
  if (Object.keys(E.progreso.misiones).length < P.desdeLogros) return null;
  if (tirada(E, 'pedido') >= P.prob) return null;
  const xs = PEDIDOS.filter((p) => puedeLlegar(E, p));
  return xs.length ? xs[Math.floor(tirada(E, 'pedido:cual') * xs.length)] : null;
}

/** Un pedido contado para las frases. */
export const deUnPedido = (E: Estado, pd: PedidoAbierto, p: Pedido): T.DeUnPedido => ({
  quien: p.quien,
  para: p.para,
  especie: nombreDe(ESPECIES[p.especie]),
  porciones: p.porciones,
  fecha: fechaDe(decadaDelTurno(E, pd.vence)),
});

/** Abre el pedido: desde ahora cuenta lo que se coseche de la especie. */
export function abrir(E: Estado, p: Pedido): Frase {
  const desde = E.tiempo.turno,
    vence = desde + p.plazo,
    pd: PedidoAbierto = {
      id: p.id,
      desde,
      vence,
      base: E.progreso.cosechado[p.especie] || 0,
      sembrado: null,
      cuenta: cuentaDe(E, p.especie, desde, vence),
    };
  E.progreso.pedidos.abiertos.push(pd);
  return T.llegaPedido(deUnPedido(E, pd, p));
}

// ── mientras está abierto ──

/**
 * Anota la siembra de la especie de cada pedido abierto, para que el cuaderno diga por qué no se llegó:
 * se queda con la primera que llegaba a la fecha y, mientras no haya una, con la última.
 */
export function alSembrar(E: Estado, slug: string): void {
  for (const pd of E.progreso.pedidos.abiertos)
    if (pedidoPorId(pd.id)?.especie === slug && (pd.sembrado == null || !llegaba(pd, pd.sembrado)))
      pd.sembrado = E.tiempo.turno;
}

function darPremio(E: Estado, pr: PremioDePedido): string {
  if (pr.tipo === 'sobres') {
    for (const s in pr.sobres) E.recursos.sobres[s] = (E.recursos.sobres[s] || 0) + pr.sobres[s];
    return T.premioSobres(Object.keys(pr.sobres).map((s) => nombreDe(ESPECIES[s])));
  }
  if (pr.tipo === 'compost') {
    const k = compostera(E);
    if (k) k.dosis += pr.dosis;
    return T.premioCompost(pr.dosis);
  }
  E.recursos.goteo = true;
  return T.premioGoteo();
}

function cerrar(E: Estado, pd: PedidoAbierto): void {
  const PP = E.progreso.pedidos;
  PP.abiertos = PP.abiertos.filter((x) => x !== pd);
  PP.cerrados[pd.id] = E.tiempo.turno;
}

/** Después de cosechar: los pedidos que ya tienen lo suyo se entregan y dan su premio. */
export function cumplirPedidos(E: Estado, evs: Evento[]): void {
  for (const pd of [...E.progreso.pedidos.abiertos]) {
    const p = pedidoPorId(pd.id);
    if (!p || llevas(E, pd, p) < p.porciones) continue;
    cerrar(E, pd);
    E.progreso.pedidos.cumplidos++;
    const premio = darPremio(E, p.premio);
    evs.push(anotar(E, 'logro', T.pedidoCumplido(deUnPedido(E, pd, p), premio)));
  }
}

/** Por qué no se llegó: no se sembró, se sembró tarde, se sembró en una época en que no llegaba, o no alcanzó. */
function porQueNo(E: Estado, pd: PedidoAbierto, p: Pedido): Frase {
  const de = deUnPedido(E, pd, p),
    ultima = limiteDe(pd) ?? pd.desde,
    dias = diasHastaCosecha(p.especie),
    decadas = tardaba(pd, ultima),
    c: T.Cuenta = {
      dias,
      decadas,
      masLento: Number.isFinite(decadas) && decadas * DIAS_POR_TURNO >= dias + DIAS_POR_TURNO,
      limite: fechaDe(decadaDelTurno(E, ultima)),
      llevas: Math.max(0, llevas(E, pd, p)),
    };
  if (pd.sembrado == null) return T.pedidoSinSembrar(de, c);
  const cuando = fechaDe(decadaDelTurno(E, pd.sembrado));
  if (llegaba(pd, pd.sembrado)) return T.pedidoNoAlcanzo(de, c, cuando);
  if (pd.sembrado > ultima) return T.pedidoTarde(de, c, cuando);
  return T.pedidoADestiempo(de, c, cuando, tardaba(pd, pd.sembrado));
}

/** Al terminar la década de la fecha: los pedidos que no se cumplieron vencen, y el cuaderno dice por qué. */
export function vencidos(E: Estado): Frase[] {
  const out: Frase[] = [];
  for (const pd of [...E.progreso.pedidos.abiertos]) {
    const p = pedidoPorId(pd.id);
    if (p && E.tiempo.turno < pd.vence) continue;
    cerrar(E, pd);
    if (p) out.push(porQueNo(E, pd, p));
  }
  return out;
}
