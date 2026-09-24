/**
 * Lo que comparten los sistemas mientras pasa el tiempo: la partida, el clima de estos días y dos
 * formas de contar lo que pasa. `ev` va al cuaderno (juntando los avisos repetidos: "(×6)") y
 * también al diario de la planta que se está procesando; `nota` va solo a ese diario.
 */
import type { Abrigo } from '../abrigo';
import { apuntar } from '../diario';
import { anotar } from '../estado';
import type { Factores } from '../factores';
import { floresAbiertas } from '../factores';
import type { Frase } from '../textos/frase';
import type { CeldaId, Especie, Estado, Evento, Planta, Tiempo, TipoEvento, ZonaId } from '../tipos';

/** Días que avanza cada turno. El paso 4 (#28) lo vuelve un parámetro de `avanzar(estado, días)`. */
export const DIAS_POR_TURNO = 10;

export interface Contexto {
  E: Estado;
  w: Tiempo;
  dias: number;
  /** lo que ya quedó anotado en el cuaderno este turno */
  evs: Evento[];
  /** flores abiertas al empezar el turno: atraen aliados contra las plagas */
  flores: number;
  /** plantas sensibles que se salvaron de la helada gracias al abrigo, por zona */
  salvadas: Partial<Record<ZonaId, string[]>>;
  /** la planta que se está procesando: sus avisos van también a su diario */
  planta: Planta | null;
  ev(tipo: TipoEvento, f: Frase, celda?: CeldaId | null): void;
  nota(tipo: TipoEvento, f: Frase): void;
  /** pasa al cuaderno los avisos juntados hasta ahora */
  anotarAvisos(): void;
}

/** Lo que se sabe de una planta a medida que la recorren los sistemas del turno. */
export interface TurnoDePlanta {
  pl: Planta;
  sp: Especie;
  z: ZonaId;
  /** abrigo de su zona, desde `helar` */
  ab?: Abrigo;
  /** los cinco factores de crecimiento, desde `medir` */
  F?: Factores;
  /** el factor de crecimiento del turno, desde `crecer` */
  g?: number;
}
/** 'sigue': que pase el próximo sistema; 'basta': esta planta ya terminó su turno (o ya no está). */
export type Paso = 'sigue' | 'basta';
export type SistemaDePlanta = (ctx: Contexto, t: TurnoDePlanta) => Paso;
export type SistemaDelPatio = (ctx: Contexto) => void;

interface Aviso {
  tipo: TipoEvento;
  f: Frase;
  celda: CeldaId | null;
  n?: number;
}

export function crearContexto(E: Estado, dias = DIAS_POR_TURNO): Contexto {
  let avisos: Aviso[] = [];
  const ctx: Contexto = {
    E,
    w: E.prox.real,
    dias,
    evs: [],
    flores: floresAbiertas(E),
    salvadas: {},
    planta: null,
    ev(tipo, f, celda) {
      avisos.push({ tipo, f, celda: celda || null });
      if (ctx.planta && celda === ctx.planta.celda) apuntar(E, ctx.planta, tipo, f);
    },
    nota(tipo, f) {
      if (ctx.planta) apuntar(E, ctx.planta, tipo, f);
    },
    anotarAvisos() {
      for (const a of juntarRepetidos(avisos)) ctx.evs.push(anotar(E, a.tipo, a.f, a.celda));
      avisos = [];
    },
  };
  return ctx;
}

/** Junta los avisos idénticos en uno solo, con cuántos fueron: "(×6)". Conserva el orden de aparición. */
function juntarRepetidos(avisos: Aviso[]): Aviso[] {
  const vistos = new Map<string, Aviso>();
  for (const a of avisos) {
    const k = a.tipo + a.f.texto,
      ya = vistos.get(k);
    if (ya) ya.n!++;
    else vistos.set(k, { ...a, n: 1 });
  }
  return [...vistos.values()].map((a) =>
    a.n! > 1 ? { ...a, f: { ...a.f, texto: a.f.texto + ' (×' + a.n + ')' } } : a,
  );
}
