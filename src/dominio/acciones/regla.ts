/**
 * Cómo es una acción del jugador. Cada una dice tres cosas por separado:
 *  - `puede`: si se puede hacer ahora y, si no, por qué. Es pura: no cambia nada. La interfaz la usa
 *    para decidir qué botones mostrar, así nunca repite una regla (innegociable de la epic #39).
 *  - `costo`: cuántos ratos lleva.
 *  - `aplicar`: lo que cambia y lo que se anota, sabiendo ya que se puede y que los ratos se cobraron.
 * `despachar` (index.ts) las junta siempre en ese orden: primero las razones, después los ratos.
 */
import type { Accion, Estado, Evento } from '../tipos';

export type De<T extends Accion['tipo']> = Extract<Accion, { tipo: T }>;

export interface Regla<A extends Accion> {
  puede(E: Estado, a: A): string | null;
  costo(E: Estado, a: A): number;
  /** qué se dice cuando no alcanzan los ratos; si falta, "No te quedan ratos esta década." */
  sinRatos?: string;
  aplicar(E: Estado, a: A, evs: Evento[]): void;
}

/** Para acciones que no cuestan ratos. */
export const gratis = (): number => 0;
