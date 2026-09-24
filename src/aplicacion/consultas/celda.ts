/**
 * La ficha de una celda: dónde está, cómo está el suelo y, si hay una planta, cómo va y qué se le
 * puede hacer. Qué se puede hacer lo decide el dominio (`puede`), nunca la interfaz.
 */
import * as M from '../../dominio';
import type { CeldaId, Especie, Estado, Planta, ZonaDePatio } from '../../dominio';
import type { Factores } from '../../dominio/factores';
import { horasDeSol } from './sol';

export type AccionDePlanta = 'cosechar' | 'semillar' | 'mover' | 'ralear' | 'tutorar' | 'tratar';

export interface PlantaEnFicha {
  pl: Planta;
  sp: Especie;
  punto: ReturnType<typeof M.puntoDeTrasplante>;
  /** los factores de esta década (null si todavía es semilla) */
  factores: Factores | null;
  /** 0..1 hacia la cosecha, o hacia el trasplante si es un plantín */
  avance: number;
  enAlmacigo: boolean;
  /** lo que se le puede hacer ahora, según el dominio (sin contar si alcanzan los ratos) */
  acciones: AccionDePlanta[];
}

export interface FichaDeCelda {
  celda: CeldaId;
  zona: ZonaDePatio;
  maceta: { litros: number; prof: number } | null;
  horasDeSol: number;
  suelo: string;
  mo: number;
  mulch: boolean;
  /** la familia de lo último que hubo, para rotar */
  familiaAnterior: string | null;
  puedeMulch: boolean;
  /** si la zona recibe compost (el botón se muestra aunque no haya dosis: dice cuántas hay) */
  admiteCompost: boolean;
  dosisDeCompost: number;
  planta: PlantaEnFicha | null;
}

/** en el orden en que se muestran */
const ACCIONES: AccionDePlanta[] = ['cosechar', 'semillar', 'mover', 'ralear', 'tutorar', 'tratar'];

function plantaEnFicha(E: Estado, pl: Planta): PlantaEnFicha {
  const sp = M.especieDe(pl),
    punto = M.puntoDeTrasplante(pl);
  const se = (a: AccionDePlanta): boolean =>
    a === 'mover'
      ? M.puedeMoverse(E, pl) === null
      : M.puede(E, { tipo: a, planta: pl.id }, { sinMirarRatos: true }) === null;
  return {
    pl,
    sp,
    punto,
    factores: pl.etapa === 'semilla' ? null : M.factoresPlanta(E, pl),
    avance: Math.min(1, pl.prog / (punto ? punto.min : M.objetivoCosecha(sp))),
    enAlmacigo: !!M.zona(E, E.mundo.celdas[pl.celda].zona).cria,
    acciones: ACCIONES.filter(se),
  };
}

export function fichaDeCelda(E: Estado, k: CeldaId): FichaDeCelda | null {
  const c = E.mundo.celdas[k];
  if (!c) return null;
  const z = M.zona(E, c.zona),
    pl = M.plantaEn(E, k);
  return {
    celda: k,
    zona: z,
    maceta: M.macetaDe(E, k),
    horasDeSol: horasDeSol(E)[k],
    suelo: M.META.suelos[M.sueloDeCelda(E, k)].nombre,
    mo: Math.round(c.mo),
    mulch: c.mulch,
    familiaAnterior: c.fam,
    puedeMulch: M.puede(E, { tipo: 'mulch', celda: k }, { sinMirarRatos: true }) === null,
    admiteCompost: !z.cria,
    dosisDeCompost: M.dosisDeCompost(E),
    planta: pl ? plantaEnFicha(E, pl) : null,
  };
}
