/**
 * Los eventos sorpresa: la tabla está en `datos/juego/sorpresas.ts` y acá, lo que sabe hacer cada
 * clase de efecto. Un regalo llega sin aviso; una amenaza se anuncia al empezar la década y pasa al
 * terminarla, y le pega solo a lo que sigue expuesto: lo que se tapó o se tutoró a tiempo se salva.
 *
 * Tiran con `tirada`, no con `azar`: sumar o sacar una fila no le cambia a nadie el clima ni las plagas.
 */
import { REGLAS } from '../../datos/juego/reglas';
import { SORPRESAS, type EfectoDeSorpresa, type Sorpresa } from '../../datos/juego/sorpresas';
import { tirada } from './azar';
import { ESPECIES, ventana } from './catalogo';
import { apuntar } from './diario';
import { compostera } from './estructuras';
import { riesgoConAliados } from './factores';
import { zona } from './patio';
import { especieDe, nombreDe } from './planta';
import { decadaEstacional, enTramo, regionDe } from './region';
import type { Golpe } from './textos/sorpresas';
import type { Accion, Estado, Planta, ZonaId } from './tipos';
import { r1 } from './util';

export { SORPRESAS, type Sorpresa };
export type { Golpe };

const S = REGLAS.sorpresas;
type De<T extends EfectoDeSorpresa['tipo']> = Extract<EfectoDeSorpresa, { tipo: T }>;

export const sorpresaPorId = (id: string): Sorpresa | null => SORPRESAS.find((s) => s.id === id) ?? null;

// ── a quién le pega cada amenaza ──

const zonaDePlanta = (E: Estado, pl: Planta): ZonaId => E.mundo.celdas[pl.celda].zona;
const tapada = (E: Estado, pl: Planta): boolean => {
  const z = zonaDePlanta(E, pl);
  return !!(E.recursos.manta[z] || E.recursos.tunel[z]);
};
const germinadas = (E: Estado): Planta[] => Object.values(E.mundo.plantas).filter((pl) => pl.etapa !== 'semilla');

/** Las que la amenaza va a lastimar si nadie hace nada, y las que se salvan por lo que ya se hizo. */
export interface Blancos {
  expuestas: Planta[];
  protegidas: Planta[];
}
function partir(xs: Planta[], protegida: (pl: Planta) => boolean): Blancos {
  return { expuestas: xs.filter((pl) => !protegida(pl)), protegidas: xs.filter(protegida) };
}

const BLANCOS: { [T in 'granizo' | 'viento' | 'plaga']: (E: Estado, ef: De<T>) => Blancos } = {
  // un techo lo para siempre; la manta o el microtúnel, si están puestos
  granizo: (E) =>
    partir(
      germinadas(E).filter((pl) => !zona(E, zonaDePlanta(E, pl)).techo),
      (pl) => tapada(E, pl),
    ),
  // [REPO] cuidados.tutorado: lo que pide tutor, ya en su lugar (en la almaciguera no se tutora)
  viento: (E) =>
    partir(
      germinadas(E).filter((pl) => especieDe(pl).cuidados.includes('tutorado') && !zona(E, zonaDePlanta(E, pl)).cria),
      (pl) => pl.tutor,
    ),
  plaga: (E, ef) =>
    partir(
      germinadas(E).filter((pl) => especieDe(pl).familia === ef.familia && !pl.plaga),
      (pl) => tapada(E, pl),
    ),
};
type Amenaza = De<'granizo' | 'viento' | 'plaga'>;
const esAmenaza = (ef: EfectoDeSorpresa): ef is Amenaza => ef.tipo in BLANCOS;
export function blancos(E: Estado, ef: EfectoDeSorpresa): Blancos {
  if (!esAmenaza(ef)) return { expuestas: [], protegidas: [] };
  return (BLANCOS[ef.tipo] as (E: Estado, ef: Amenaza) => Blancos)(E, ef);
}

// ── los regalos ──

/** Las especies que están en fecha ideal de siembra esta década, en un orden que sale de la tirada. */
function enFecha(E: Estado, id: string): string[] {
  const R = regionDe(E);
  return Object.keys(ESPECIES)
    .filter((s) => ventana(R, s, E.tiempo.dec) === 'ideal')
    .map((s) => ({ s, u: tirada(E, id + ':' + s) }))
    .sort((a, b) => a.u - b.u)
    .map((x) => x.s);
}

/** Si un regalo tiene sentido ahora: hay algo en fecha, hay tandas que adelantar. */
function regaloVa(E: Estado, ef: EfectoDeSorpresa): boolean {
  if (ef.tipo === 'sobres') return enFecha(E, '').length > 0;
  if (ef.tipo === 'lombrices') return (compostera(E)?.tandas.length ?? 0) > 0;
  return ef.tipo === 'secos';
}

/** Lo que llegó: qué (si son cosas con nombre) y cuánto de cada una. */
export interface Regalo {
  que: string[];
  cuanto: number;
}
export function darRegalo(E: Estado, s: Sorpresa): Regalo {
  const ef = s.efecto;
  if (ef.tipo === 'sobres') {
    const especies = enFecha(E, s.id).slice(0, ef.especies);
    for (const sl of especies) E.recursos.sobres[sl] = (E.recursos.sobres[sl] || 0) + ef.porEspecie;
    return { que: especies.map((sl) => nombreDe(ESPECIES[sl])), cuanto: ef.porEspecie };
  }
  if (ef.tipo === 'secos') {
    E.recursos.secos = r1(E.recursos.secos + ef.carga);
    return { que: [], cuanto: ef.carga };
  }
  if (ef.tipo === 'lombrices') {
    for (const t of compostera(E)?.tandas ?? []) t.avance = r1(t.avance + ef.avance);
    return { que: [], cuanto: ef.avance };
  }
  return { que: [], cuanto: 0 };
}

// ── cuándo pasa cada una ──

/** Si esta sorpresa puede pasar en esta década: su región, su época, que no se repita tan seguido, y que tenga a quién. */
function puedePasar(E: Estado, s: Sorpresa): boolean {
  if (s.regiones && !s.regiones.includes(E.meta.region)) return false;
  const d = decadaEstacional(regionDe(E), E.tiempo.dec),
    ultima = E.progreso.sorpresas[s.id];
  if (!s.cuando.some(([desde, hasta]) => enTramo(d, desde, hasta))) return false;
  if (ultima != null && E.tiempo.turno - ultima < S.mismaCada) return false;
  return s.clase === 'regalo' ? regaloVa(E, s.efecto) : blancos(E, s.efecto).expuestas.length > 0;
}

/** Una de la lista, con más chances las de más peso. `u` va de 0 a 1. */
function elegir(xs: Sorpresa[], u: number): Sorpresa | null {
  let resto = u * xs.reduce((t, s) => t + s.peso, 0);
  for (const s of xs) if ((resto -= s.peso) < 0) return s;
  return xs[xs.length - 1] ?? null;
}

/** Si esta década llega un regalo, cuál. */
export function regaloDeLaDecada(E: Estado): Sorpresa | null {
  if (tirada(E, 'regalo') >= S.probRegalo) return null;
  return elegir(
    SORPRESAS.filter((s) => s.clase === 'regalo' && puedePasar(E, s)),
    tirada(E, 'regalo:cual'),
  );
}

/** Décadas desde la última amenaza que pasó. */
function desdeLaUltimaAmenaza(E: Estado): number {
  const turnos = SORPRESAS.filter((s) => s.clase === 'amenaza')
    .map((s) => E.progreso.sorpresas[s.id])
    .filter((t) => t != null);
  return turnos.length ? E.tiempo.turno - Math.max(...turnos) : Infinity;
}

/** Si se anuncia una amenaza para la década que empieza, cuál. Nunca dos seguidas ni dos a la vez. */
export function amenazaParaAnunciar(E: Estado): Sorpresa | null {
  if (E.tiempo.anunciada || desdeLaUltimaAmenaza(E) < S.respiro) return null;
  if (tirada(E, 'amenaza') >= S.probAmenaza) return null;
  return elegir(
    SORPRESAS.filter((s) => s.clase === 'amenaza' && puedePasar(E, s)),
    tirada(E, 'amenaza:cual'),
  );
}

/** La amenaza anunciada, si hay. */
export const anunciada = (E: Estado): Sorpresa | null =>
  E.tiempo.anunciada ? sorpresaPorId(E.tiempo.anunciada.id) : null;

/**
 * Pasa la amenaza: le pega a lo que sigue expuesto. `enLaPlanta` va al diario de cada una.
 * Una plaga, además, tiene que prender: la frenan los aliados cerca, como a las plagas de siempre.
 */
export function descargar(E: Estado, s: Sorpresa, enLaPlanta: Parameters<typeof apuntar>[3]): Golpe {
  const ef = s.efecto,
    { expuestas, protegidas } = blancos(E, ef),
    lastimadas: Planta[] = [];
  for (const pl of expuestas) {
    if (ef.tipo === 'plaga') {
      if (tirada(E, s.id + ':' + pl.id) >= ef.prob * riesgoConAliados(E, pl.celda)) continue;
      pl.plaga = ef.plaga;
    } else if (ef.tipo === 'granizo' || ef.tipo === 'viento') pl.salud = Math.max(S.saludMinima, pl.salud - ef.danio);
    apuntar(E, pl, 'mal', enLaPlanta);
    lastimadas.push(pl);
  }
  return {
    cuantas: lastimadas.length,
    especies: [...new Set(lastimadas.map((pl) => nombreDe(especieDe(pl))))],
    protegidas: protegidas.length,
  };
}

/** Lo que previene la amenaza anunciada: las acciones concretas, para el que quiera hacerlas todas. */
export function prevenciones(E: Estado): Accion[] {
  const s = anunciada(E);
  if (!s) return [];
  const { expuestas } = blancos(E, s.efecto);
  if (s.efecto.tipo === 'viento') return expuestas.map((pl) => ({ tipo: 'tutorar', planta: pl.id }));
  return [...new Set(expuestas.map((pl) => zonaDePlanta(E, pl)))].map((z) => ({ tipo: 'manta', zona: z }));
}
