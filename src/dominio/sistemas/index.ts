/**
 * El paso del tiempo, como una tubería de sistemas.
 *
 * OJO con el orden: cada llamada a `azar` consume la secuencia de la partida (germinar, plagas,
 * espigar y pronosticar tiran dados). Cambiar el orden de estos arrays cambia todas las partidas
 * guardadas y rompe el test dorado. `tests/sistemas.test.ts` vigila que sea este.
 */
import { cerrar } from '../diario';
import { fechaDe } from '../calendario';
import { especieDe } from '../planta';
import * as TT from '../textos/temporada';
import type { Estado, Evento, Planta } from '../tipos';
import { crearContexto, type Contexto, type SistemaDelPatio, type SistemaDePlanta } from './contexto';
import { estresar, crecer, medir } from './crecer';
import { germinar } from './germinar';
import { helar } from './helar';
import { espigar, madurar, semillarOSecarse } from './madurar';
import {
  anotarAvisos,
  ajustarRiego,
  avisarSalvadas,
  cerrarTurno,
  crecerElJardin,
  logroDeSocios,
  pronosticar,
  suelosYCompost,
} from './patio';
import { plagas } from './plagas';
import { anunciarSorpresa, llegaSorpresa } from './sorpresas';

export { DIAS_POR_TURNO } from './contexto';

/** Lo que le pasa a cada planta, en orden. Cada sistema puede cortar ahí el turno de esa planta. */
export const SISTEMAS_POR_PLANTA: SistemaDePlanta[] = [
  germinar,
  helar,
  semillarOSecarse,
  medir,
  crecer,
  estresar,
  plagas,
  espigar,
  madurar,
];

/** Lo que pasa en el patio después de recorrer las plantas, en orden. */
export const SISTEMAS_DEL_PATIO: SistemaDelPatio[] = [
  avisarSalvadas,
  anotarAvisos,
  logroDeSocios,
  suelosYCompost,
  crecerElJardin,
  llegaSorpresa,
  anotarAvisos,
  cerrarTurno,
  anotarAvisos,
  pronosticar,
  anunciarSorpresa,
  anotarAvisos,
  ajustarRiego,
];

function unaPlanta(ctx: Contexto, pl: Planta): void {
  const { E } = ctx,
    saludAntes = pl.salud,
    t = { pl, sp: especieDe(pl), z: E.mundo.celdas[pl.celda].zona };
  pl.edad += ctx.dias;
  ctx.planta = pl;
  for (const sistema of SISTEMAS_POR_PLANTA) if (sistema(ctx, t) === 'basta') break;
  if (E.mundo.plantas[pl.id]) cerrar(E, pl, saludAntes); // si sigue viva, su diario cierra la década
  ctx.planta = null;
}

/** Corre un turno entero y devuelve lo que quedó anotado en el cuaderno. */
export function correrTurno(E: Estado): Evento[] {
  const ctx = crearContexto(E);
  ctx.ev('clima', TT.climaDeLaDecada(fechaDe(ctx.w.dec), ctx.w));
  for (const id of Object.keys(E.mundo.plantas)) if (E.mundo.plantas[id]) unaPlanta(ctx, E.mundo.plantas[id]);
  for (const sistema of SISTEMAS_DEL_PATIO) sistema(ctx);
  return ctx.evs;
}
