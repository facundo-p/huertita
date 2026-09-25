/**
 * Lo que dicen los pedidos de los vecinos (`datos/juego/pedidos.ts`). El que llega no dice cuándo
 * sembrar: eso se cuenta para atrás con la ficha, dejando margen. El que vence dice por qué no se llegó
 * y hasta cuándo había que sembrar: los días de la ficha son con buen tiempo, y fuera de su temperatura
 * la planta tarda más, así que la fecha límite se cuenta con el crecimiento de un año normal.
 */
import { cap, numero as n } from '../util';
import { frase, type Frase } from './frase';

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
      '. Fijate en la ficha cuánto tarda de la siembra a la cosecha y contá para atrás, con margen: ' +
      'fuera de su temperatura crece más lento. ¿Llegás a sembrar en fecha?',
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
  /** días de la siembra a la cosecha, con buen tiempo, según la ficha */
  dias: number;
  /** décadas de la siembra a la cosecha sembrando en la fecha límite, en un año normal */
  decadas: number;
  /** si en esa época tarda al menos una década más de lo que dice la ficha */
  masLento: boolean;
  /** la última fecha de siembra que llegaba con margen, en un año normal */
  limite: string;
  /** lo cosechado desde que llegó el pedido */
  llevas: number;
}
function noLlegaste(p: DeUnPedido, llevas: number): string {
  return (
    'Ya es ' +
    p.fecha +
    ' y no llegaste con el pedido de ' +
    p.quien +
    (llevas > 0 ? ': cosechaste ' + n(llevas) + ' de ' + porciones(p.porciones) + '. ' : '. ')
  );
}
const cuenta = (p: DeUnPedido, c: Cuenta): string =>
  'Con buen tiempo, de la siembra a la cosecha de ' +
  p.especie +
  ' pasan unos ' +
  c.dias +
  ' días' +
  (c.masLento
    ? ', pero en esa época crece más lento: un año normal son unas ' +
      c.decadas +
      ' décadas, y para llegar con margen a ' +
      p.fecha +
      ' había que sembrar a más tardar a '
    : ': para llegar con margen a ' + p.fecha + ' había que sembrar a más tardar a ') +
  c.limite +
  '.';
/** Cómo le iba a la siembra que se hizo, en un año normal, según la cuenta de cuando llegó el pedido. */
export interface Sembrado {
  /** cuándo se sembró, como "fines de septiembre" */
  cuando: string;
  /** décadas de la siembra a la cosecha; `Infinity` si no daba cosecha */
  decadas: number;
  /** si llegaba a la fecha, aunque fuera sin margen */
  justo: boolean;
  /** si la especie se sube a flor con calor */
  puedeEspigar: boolean;
}
/** Por qué la siembra no llegaba con margen, como sigue a "Sembraste lechuga a fines de agosto". */
function porQueNoLlegaba(s: Sembrado, tarde: boolean): string {
  if (s.justo)
    return (
      (tarde ? ', pasado el límite: ' : ': con el tiempo de esa época tardaba unas ' + s.decadas + ' décadas, y ') +
      'en un año normal llegaba, pero sin margen: un año más fresco, o un plantín que no llega a la época ' +
      'de trasplante, la podía dejar afuera. '
    );
  if (!Number.isFinite(s.decadas))
    return (
      (tarde ? ', pasado el límite, y' : ', pero') +
      ' con el tiempo de esa época no llegaba a dar cosecha' +
      (s.puedeEspigar ? ', o se arriesgaba a espigar antes. ' : '. ')
    );
  return tarde
    ? ' y ya era tarde: en un año normal no llegaba a la fecha. '
    : ', pero con el tiempo de esa época tardaba unas ' + s.decadas + ' décadas y no llegaba. ';
}

export const pedidoSinSembrar = (p: DeUnPedido, c: Cuenta): Frase =>
  frase(
    'pedido.sin-sembrar',
    noLlegaste(p, c.llevas) + 'Desde que te lo pidió no sembraste ' + p.especie + '. ' + cuenta(p, c),
  );
/** Sembró después del límite. */
export const pedidoTarde = (p: DeUnPedido, c: Cuenta, s: Sembrado): Frase =>
  frase(
    'pedido.tarde',
    noLlegaste(p, c.llevas) + 'Sembraste ' + p.especie + ' a ' + s.cuando + porQueNoLlegaba(s, true) + cuenta(p, c),
  );
/** Sembró antes de la fecha límite, pero en una época en que no llegaba, o llegaba sin margen. */
export const pedidoADestiempo = (p: DeUnPedido, c: Cuenta, s: Sembrado): Frase =>
  frase(
    'pedido.a-destiempo',
    noLlegaste(p, c.llevas) + 'Sembraste ' + p.especie + ' a ' + s.cuando + porQueNoLlegaba(s, false) + cuenta(p, c),
  );
/** Ninguna siembra llegaba con margen: pasa con un pedido de una partida vieja, contado al cargarla. */
export const pedidoSinFecha = (p: DeUnPedido, llevas: number): Frase =>
  frase(
    'pedido.sin-fecha',
    noLlegaste(p, llevas) +
      'Con el tiempo de un año normal, en tu patio ninguna siembra de ' +
      p.especie +
      ' llegaba con margen a ' +
      p.fecha +
      ': no había fecha segura para sembrar, y el pedido era muy difícil de cumplir.',
  );
export const pedidoNoAlcanzo = (p: DeUnPedido, c: Cuenta, sembraste: string): Frase =>
  frase(
    'pedido.no-alcanzo',
    noLlegaste(p, c.llevas) +
      'Sembraste ' +
      p.especie +
      ' a tiempo, a ' +
      sembraste +
      ', pero no alcanzó: ningún año es igual al normal, y siempre alguna planta se pierde o rinde menos. ' +
      'Para un pedido conviene sembrar de más y con margen; el diario de cada planta dice qué la frenó.',
  );
