/**
 * Los pedidos de los vecinos: la tabla está en `datos/juego/pedidos.ts` y acá, cuándo llega uno,
 * cuándo se cumple y qué pasa si vence. Un pedido se cumple cosechando lo pedido antes de su fecha;
 * se cuenta lo que se coseche de la especie desde que llegó.
 *
 * Solo llega un pedido que se puede cumplir: entre que llega y la fecha tiene que haber una década
 * ideal de siembra con tiempo para crecer. Tira con `tirada`, no con `azar`.
 */
import { PEDIDOS, type Pedido, type PremioDePedido } from '../../datos/juego/pedidos';
import { REGLAS } from '../../datos/juego/reglas';
import { tirada } from './azar';
import { DECADAS_DEL_ANIO, fechaDe } from './calendario';
import { ESPECIES, objetivoCosecha, ventana } from './catalogo';
import { anotar } from './estado';
import { compostera } from './estructuras';
import { nombreDe } from './planta';
import { decadaEstacional, enTramo, regionDe } from './region';
import { DIAS_POR_TURNO } from './sistemas/contexto';
import * as T from './textos/pedidos';
import type { Frase } from './textos/frase';
import type { Estado, Evento, PedidoAbierto } from './tipos';
import { r1 } from './util';

export { PEDIDOS, type Pedido };

const P = REGLAS.pedidos;

export const pedidoPorId = (id: string): Pedido | null => PEDIDOS.find((p) => p.id === id) ?? null;

/** La década del año en que cae un turno de esta partida (pasado o futuro). */
export function decadaDelTurno(E: Pick<Estado, 'tiempo'>, turno: number): number {
  const d = E.tiempo.dec - 1 + turno - E.tiempo.turno;
  return (((d % DECADAS_DEL_ANIO) + DECADAS_DEL_ANIO) % DECADAS_DEL_ANIO) + 1;
}

/** Días de la siembra a la cosecha con buen tiempo, y cuántas décadas son. */
export const diasHastaCosecha = (slug: string): number => Math.round(objetivoCosecha(ESPECIES[slug]));
export const decadasHastaCosecha = (slug: string): number =>
  Math.ceil(objetivoCosecha(ESPECIES[slug]) / DIAS_POR_TURNO);

/** El último turno en que una siembra todavía llega a cosecharse para la fecha. */
export const ultimaSiembra = (pd: PedidoAbierto, p: Pedido): number => pd.vence - decadasHastaCosecha(p.especie);

/** Si entre `desde` y la última siembra que llega a `vence` hay una década ideal para sembrar la especie. */
export function hayFechaDeSiembra(E: Estado, slug: string, desde: number, vence: number): boolean {
  const R = regionDe(E);
  for (let s = desde; s <= vence - decadasHastaCosecha(slug); s++)
    if (ventana(R, slug, decadaDelTurno(E, s)) === 'ideal') return true;
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
  const pd: PedidoAbierto = {
    id: p.id,
    desde: E.tiempo.turno,
    vence: E.tiempo.turno + p.plazo,
    base: E.progreso.cosechado[p.especie] || 0,
    sembrado: null,
  };
  E.progreso.pedidos.abiertos.push(pd);
  return T.llegaPedido(deUnPedido(E, pd, p));
}

// ── mientras está abierto ──

/** Anota la primera siembra de la especie de cada pedido abierto: el cuaderno la usa si no se llega. */
export function alSembrar(E: Estado, slug: string): void {
  for (const pd of E.progreso.pedidos.abiertos)
    if (pd.sembrado == null && pedidoPorId(pd.id)?.especie === slug) pd.sembrado = E.tiempo.turno;
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

/** Por qué no se llegó: no se sembró, se sembró tarde, o se sembró a tiempo y no alcanzó. */
function porQueNo(E: Estado, pd: PedidoAbierto, p: Pedido): Frase {
  const de = deUnPedido(E, pd, p),
    ultima = ultimaSiembra(pd, p),
    c: T.Cuenta = {
      dias: diasHastaCosecha(p.especie),
      limite: fechaDe(decadaDelTurno(E, ultima)),
      llevas: Math.max(0, llevas(E, pd, p)),
    };
  if (pd.sembrado == null) return T.pedidoSinSembrar(de, c);
  const cuando = fechaDe(decadaDelTurno(E, pd.sembrado));
  return pd.sembrado > ultima ? T.pedidoTarde(de, c, cuando) : T.pedidoNoAlcanzo(de, c, cuando);
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
