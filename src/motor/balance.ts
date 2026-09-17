import { moMedia } from './estado';
import { patioDe } from './patio';
import type { Estado } from './tipos';
import { r1 } from './util';
export interface Balance { porciones: number; especies: number; semillas: number; dMo: number; visitas: number; logros: number; puntos: number; estrellas: 0 | 1 | 2 | 3 }
export function balance(E: Estado): Balance {
  const especies = Object.keys(E.cosechado).length, dMo = r1(moMedia(E) - E.moInicial);
  const [e1, e2, e3] = patioDe(E).estrellas;
  const puntos = E.porciones + especies * 3 + E.semillasGuardadas * 0.5 + Math.max(0, dMo) + Math.min(20, E.visitas / 10);
  return { porciones: E.porciones, especies, semillas: E.semillasGuardadas, dMo, visitas: E.visitas, logros: Object.keys(E.misiones).length, puntos: Math.round(puntos), estrellas: puntos >= e3 ? 3 : puntos >= e2 ? 2 : puntos >= e1 ? 1 : 0 };
}
