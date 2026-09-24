/** El panel de protección: por zona, qué abrigo tiene, qué riesgo corre y qué tiene sensible. */
import * as M from '../../dominio';
import type { Abrigo } from '../../dominio/abrigo';
import type { Estado, ZonaId } from '../../dominio';

export interface ZonaAbrigada {
  id: ZonaId;
  nombre: string;
  abrigo: Abrigo;
  /** % de que la helada le llegue esta década */
  riesgo: number;
  /** nombres de lo sensible a la helada que hay plantado */
  sensibles: string[];
  nivel: 'nada' | 'bajo' | 'medio' | 'alto';
  conManta: boolean;
  conTunel: boolean;
  admiteTunel: boolean;
}

function nivelDeRiesgo(sensibles: number, riesgo: number): ZonaAbrigada['nivel'] {
  if (!sensibles) return 'nada';
  if (riesgo >= 50) return 'alto';
  return riesgo >= 15 ? 'medio' : 'bajo';
}

export function riesgoPorZona(E: Estado): ZonaAbrigada[] {
  return M.zonasDe(E).map((z) => {
    const riesgo = M.riesgoHelada(E, z.id),
      sensibles = M.enRiesgo(E, z.id);
    return {
      id: z.id,
      nombre: z.nombre,
      abrigo: M.abrigo(E, z.id),
      riesgo,
      sensibles,
      nivel: nivelDeRiesgo(sensibles.length, riesgo),
      conManta: !!E.manta[z.id],
      conTunel: !!E.tunel[z.id],
      admiteTunel: !!z.admiteTunel,
    };
  });
}
