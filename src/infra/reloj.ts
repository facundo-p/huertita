import type { Reloj } from '../aplicacion/partidas';

export const relojDelSistema: Reloj = { ahora: () => Date.now() };
