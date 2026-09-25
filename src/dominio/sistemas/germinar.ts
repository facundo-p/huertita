/** [REPO] dias_germinacion + temperaturas.germinacion. [SUPUESTO] el poder germinativo (ver `reglas.ts`). */
import { REGLAS } from '../../../datos/juego/reglas';
import { azar } from '../azar';
import { quitarPlanta } from '../estado';
import { humedad, tempEfectiva } from '../factores';
import { cumplir } from '../misiones';
import { zona } from '../patio';
import * as TG from '../textos/germinacion';
import { clamp } from '../util';
import type { SistemaDePlanta } from './contexto';

const GERM = REGLAS.germinacion;

/** Una semilla acumula días de germinación si tiene humedad y el suelo está en su rango; al llegar, nacen las que nacen. */
export const germinar: SistemaDePlanta = (ctx, { pl, sp, z }) => {
  if (pl.etapa !== 'semilla') return 'sigue';
  const { E, w, ev, evs, dias } = ctx;
  const tg = sp.tg,
    t = tempEfectiva(E, pl.celda, w),
    H = humedad(E, pl.celda, w),
    primerTurno = pl.edad === dias,
    ideal = t >= tg.ideal_min && t <= tg.ideal_max;
  if (H < GERM.humedadMinima) {
    if (primerTurno) ev('mal', TG.tierraSeca(sp), pl.celda);
  } else if (t < tg.min || t > tg.max) {
    if (primerTurno) ev('mal', TG.sueloFueraDeRango(sp, t, tg, !zona(E, z).cria && t < tg.min), pl.celda);
  } else pl.germ += dias * (ideal ? 1 : GERM.ritmoFueraDeIdeal);
  const necesita = (sp.dg.min + sp.dg.max) / 2;
  if (pl.germ >= necesita) {
    const poder =
        (ideal ? GERM.poder.ideal : GERM.poder.fueraDeIdeal) * clamp(pl.vigor + GERM.vigorExtra, GERM.vigorMin, 1),
      S = pl.semillas || 1;
    let nacieron = 0;
    for (let i = 0; i < S; i++) if (azar(E) < poder) nacieron++;
    if (S === 1) nacieron = 1;
    if (!nacieron) {
      ev('mal', TG.ningunaGermino(sp, S, ideal, t, tg), pl.celda);
      quitarPlanta(E, pl, false);
      return 'basta';
    }
    pl.n = nacieron;
    pl.etapa = zona(E, z).cria ? 'plantin' : 'creciendo';
    pl.prog = Math.round(necesita);
    ev('bien', TG.germino(sp, S, nacieron, ideal), pl.celda);
    cumplir(E, 'germina', evs);
  } else if (pl.edad >= GERM.diasHastaPerderse) {
    ev('mal', TG.semillaPerdida(sp, GERM.diasHastaPerderse), pl.celda);
    quitarPlanta(E, pl, false);
  }
  return 'basta';
};
