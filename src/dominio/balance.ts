import { REGLAS } from '../../datos/juego/reglas';
import { moMedia } from './estado';
import { patioDe } from './patio';
import type { Estado } from './tipos';
import { r1 } from './util';
export interface Balance {
  porciones: number;
  especies: number;
  semillas: number;
  dMo: number;
  visitas: number;
  logros: number;
  puntos: number;
  estrellas: 0 | 1 | 2 | 3;
}
export function balance(E: Estado): Balance {
  const especies = Object.keys(E.progreso.cosechado).length,
    dMo = r1(moMedia(E) - E.progreso.moInicial);
  const B = REGLAS.balance;
  const puntos =
    E.progreso.porciones +
    especies * B.porEspecie +
    E.progreso.semillasGuardadas * B.porSobreGuardado +
    Math.max(0, dMo) +
    Math.min(B.topeDeVisitas, E.progreso.visitas / B.visitasPorPunto);
  return {
    porciones: E.progreso.porciones,
    especies,
    semillas: E.progreso.semillasGuardadas,
    dMo,
    visitas: E.progreso.visitas,
    logros: Object.keys(E.progreso.misiones).length,
    puntos: Math.round(puntos),
    estrellas: estrellasPara(puntos, patioDe(E).estrellas),
  };
}
/** Las estrellas del año: cada patio dice cuántos puntos pide cada una, así uno chico no compite con uno grande. */
function estrellasPara(puntos: number, [una, dos, tres]: [number, number, number]): Balance['estrellas'] {
  if (puntos >= tres) return 3;
  if (puntos >= dos) return 2;
  return puntos >= una ? 1 : 0;
}
