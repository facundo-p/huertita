/**
 * Los pedidos de los vecinos en el paso del tiempo (`src/dominio/pedidos.ts`). Se cumplen al cosechar
 * (`acciones/cosechar.ts`); acá vencen los que llegaron a su fecha y llegan los nuevos. Tiran con
 * `tirada`, no con `azar`.
 */
import { abrir, pedidoQueLlega, vencidos } from '../pedidos';
import type { SistemaDelPatio } from './contexto';

/** Al terminar la década: los pedidos cuya fecha era esta y no se cumplieron, vencen. */
export const vencerPedidos: SistemaDelPatio = ({ E, ev }) => {
  for (const f of vencidos(E)) ev('mal', f);
};

/** Al empezar la década que viene: puede llegar un pedido. */
export const llegaPedido: SistemaDelPatio = ({ E, ev }) => {
  const p = pedidoQueLlega(E);
  if (p) ev('info', abrir(E, p));
};
