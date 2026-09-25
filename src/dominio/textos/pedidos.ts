/**
 * Lo que dicen los pedidos de los vecinos (`datos/juego/pedidos.ts`). El que llega no dice cuándo
 * sembrar: eso se cuenta para atrás con la ficha. El que vence dice por qué no se llegó y hasta cuándo
 * había que sembrar, con los días a cosecha del catálogo.
 */
import { cap } from '../util';
import { frase, type Frase } from './frase';

const n = (v: number): string => String(Math.round(v * 10) / 10).replace('.', ',');
/** "tomate", "tomate y arveja", "tomate, arveja y haba" */
function lista(xs: string[]): string {
  if (xs.length < 2) return xs.join('');
  return xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
}
const porciones = (k: number): string => n(k) + (k === 1 ? ' porción' : ' porciones');

/** Un pedido, contado con sus datos: quién, para qué, qué especie, cuánto y para cuándo. */
export interface DeUnPedido {
  quien: string;
  para: string;
  especie: string;
  porciones: number;
  /** la fecha del pedido, como "fines de diciembre" */
  fecha: string;
}

export const llegaPedido = (p: DeUnPedido): Frase =>
  frase(
    'pedido.llega',
    cap(p.quien) +
      ' te pide ' +
      porciones(p.porciones) +
      ' de ' +
      p.especie +
      ' ' +
      p.para +
      ', para ' +
      p.fecha +
      '. Fijate en la ficha cuánto tarda de la siembra a la cosecha y contá para atrás: ¿llegás a sembrar en fecha?',
  );

// ── lo que dan a cambio ──
export const premioSobres = (especies: string[]): string => 'sobres de ' + lista(especies);
export const premioCompost = (dosis: number): string => dosis + ' dosis de compost maduro de su compostera';
export const premioGoteo = (): string =>
  'un kit de riego por goteo: desde ahora, regar cada zona te lleva un rato menos';

export const pedidoCumplido = (p: DeUnPedido, premio: string): Frase =>
  frase(
    'pedido.cumplido',
    'Le llevaste a ' +
      p.quien +
      ' ' +
      porciones(p.porciones) +
      ' de ' +
      p.especie +
      '. A cambio te dio ' +
      premio +
      '.',
  );

// ── lo que vence ──
/** Cuánto tarda la especie y hasta cuándo había que sembrarla para llegar a la fecha. */
export interface Cuenta {
  /** días de la siembra a la cosecha, con buen tiempo */
  dias: number;
  /** la última fecha de siembra que llegaba */
  limite: string;
  /** lo cosechado desde que llegó el pedido */
  llevas: number;
}
function noLlegaste(p: DeUnPedido, c: Cuenta): string {
  return (
    'Ya es ' +
    p.fecha +
    ' y no llegaste con el pedido de ' +
    p.quien +
    (c.llevas > 0 ? ': cosechaste ' + n(c.llevas) + ' de ' + porciones(p.porciones) + '. ' : '. ')
  );
}
const cuenta = (p: DeUnPedido, c: Cuenta): string =>
  'Con buen tiempo, de la siembra a la cosecha de ' +
  p.especie +
  ' pasan unos ' +
  c.dias +
  ' días: para ' +
  p.fecha +
  ' había que sembrar a más tardar a ' +
  c.limite +
  '.';

export const pedidoSinSembrar = (p: DeUnPedido, c: Cuenta): Frase =>
  frase(
    'pedido.sin-sembrar',
    noLlegaste(p, c) + 'Desde que te lo pidió no sembraste ' + p.especie + '. ' + cuenta(p, c),
  );
export const pedidoTarde = (p: DeUnPedido, c: Cuenta, sembraste: string): Frase =>
  frase(
    'pedido.tarde',
    noLlegaste(p, c) + 'Sembraste ' + p.especie + ' a ' + sembraste + ' y ya era tarde. ' + cuenta(p, c),
  );
export const pedidoNoAlcanzo = (p: DeUnPedido, c: Cuenta, sembraste: string): Frase =>
  frase(
    'pedido.no-alcanzo',
    noLlegaste(p, c) +
      'Sembraste ' +
      p.especie +
      ' a tiempo, a ' +
      sembraste +
      ', pero no alcanzó. Para un pedido conviene sembrar de más: siempre alguna planta se pierde o rinde menos, ' +
      'y el diario de cada una dice qué la frenó.',
  );
