/**
 * El panel de protección: por zona, qué abrigo tiene, qué riesgo corre, qué tiene sensible y qué se
 * le puede sumar. Si se puede y cuánto cuesta lo dice el dominio (`puede`, `costoDe`), y la ayuda
 * sale con los números del dominio: la vista solo pinta.
 */
import { REGLAS } from '../../../datos/juego/reglas';
import * as M from '../../dominio';
import type { Abrigo } from '../../dominio/abrigo';
import * as TH from '../../dominio/textos/heladas';
import type { Accion, Estado, ZonaDePatio, ZonaId } from '../../dominio';

/** Un abrigo que se pone o se saca: si se puede ahora (sin contar los ratos) y cuántos ratos lleva. */
export interface AbrigoMovil {
  puesto: boolean;
  se: boolean;
  costo: number;
}

export interface ZonaAbrigada {
  id: ZonaId;
  nombre: string;
  /** la zona con artículo ("el cantero elevado"), para los botones */
  conArticulo: string;
  abrigo: Abrigo;
  /** el abrigo en palabras: qué tiene y hasta cuánto aguanta */
  textoDeAbrigo: string;
  /** % de que la helada le llegue esta década */
  riesgo: number;
  /** nombres de lo sensible a la helada que hay plantado */
  sensibles: string[];
  nivel: 'nada' | 'bajo' | 'medio' | 'alto';
  /** si conviene taparla: hay algo sensible y el riesgo no es bajo */
  prioridad: boolean;
  manta: AbrigoMovil;
  /** null si ahí no se arma microtúnel */
  tunel: AbrigoMovil | null;
}

export interface Proteccion {
  tmin: number;
  zonas: ZonaAbrigada[];
  ayuda: { cuandoHiela: string; queAbriga: string; fijos: string; seSuman: string };
}

const RIESGO = REGLAS.helada.riesgo;

function nivelDeRiesgo(sensibles: number, riesgo: number): ZonaAbrigada['nivel'] {
  if (!sensibles) return 'nada';
  if (riesgo >= RIESGO.alto) return 'alto';
  return riesgo >= RIESGO.medio ? 'medio' : 'bajo';
}

function movil(E: Estado, accion: Accion, puesto: boolean): AbrigoMovil {
  return { puesto, se: M.puede(E, accion, { sinMirarRatos: true }) === null, costo: M.costoDe(E, accion) };
}

function zonaAbrigada(E: Estado, z: ZonaDePatio): ZonaAbrigada {
  const riesgo = M.riesgoHelada(E, z.id),
    sensibles = M.enRiesgo(E, z.id),
    nivel = nivelDeRiesgo(sensibles.length, riesgo),
    tunel = movil(E, { tipo: 'tunel', zona: z.id }, !!E.recursos.tunel[z.id]),
    abrigo = M.abrigo(E, z.id);
  return {
    id: z.id,
    nombre: z.nombre,
    conArticulo: z.conArticulo,
    abrigo,
    textoDeAbrigo: TH.abrigoDeZona(abrigo),
    riesgo,
    sensibles,
    nivel,
    prioridad: nivel === 'medio' || nivel === 'alto',
    manta: movil(E, { tipo: 'manta', zona: z.id }, !!E.recursos.manta[z.id]),
    tunel: tunel.se ? tunel : null,
  };
}

export function proteccion(E: Estado): Proteccion {
  const A = M.ABRIGO,
    zonas = M.zonasDe(E);
  return {
    tmin: E.tiempo.pronostico.tmin,
    zonas: zonas.map((z) => zonaAbrigada(E, z)),
    ayuda: {
      cuandoHiela: TH.cuandoHiela(M.aguantaCon(0)),
      queAbriga: TH.queAbrigaCada(A.manta, A.tunel),
      fijos: zonas
        .filter((z) => z.abrigo)
        .map((z) => TH.yaTieneAbrigo(z, z.abrigo!.grados, z.abrigo!.nombre))
        .join(''),
      seSuman: TH.seSuman(M.aguantaCon(A.manta + A.tunel)),
    },
  };
}
