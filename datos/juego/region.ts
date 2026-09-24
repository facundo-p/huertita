/**
 * La región como dato: lo que cambia con el lugar y no con la especie.
 *
 * Una especie es la misma en todo el planeta (temperaturas de germinación y de crecimiento, días a
 * cosecha, familia, marco de plantación: todo eso es universal y viene de huertapp). Lo que cambia
 * con el lugar es esta capa: el clima, las heladas, el sol, los años típicos y el calendario.
 *
 * Las décadas son las del año calendario (1 = principios de enero). Las fechas de heladas son días
 * del año (1..365).
 */
import type { Decadas } from '../contrato';

/** Un año típico de la región: cuánto más cálido, más o menos lluvioso, con heladas más largas. */
export interface Caracter {
  nombre: string;
  /** grados que suma a la temperatura media */
  dT: number;
  /** multiplica la lluvia */
  lluvia: number;
  /** probabilidad que suma a la temporada de heladas en las décadas de `heladas.tardias` */
  helada: number;
  texto: string;
}

export interface Region {
  id: string;
  nombre: string;
  hemisferio: 'S' | 'N';
  /** en grados; negativa al sur del ecuador */
  latitud: number;
  /** normales mensuales, de enero a diciembre: temperaturas en °C, lluvia en mm */
  clima: { media: number[]; maxima: number[]; minima: number[]; lluvia: number[] };
  /**
   * La temporada de heladas, con el modelo de dos normales de FAUBA: la primera y la última helada
   * son días del año con su desvío. En el hemisferio norte la temporada cruza el año nuevo (la
   * primera cae después de la última). `tardias`: décadas de primavera en las que un año de heladas
   * tardías puede estirarlas.
   */
  heladas: { primera: number; desvioPrimera: number; ultima: number; desvioUltima: number; tardias: [number, number] };
  /** los años típicos; el sorteo del carácter sigue el orden en que están escritos */
  caracteres: Record<string, Caracter>;
  /** décadas en las que los árboles caducos del lugar tienen hoja (puede cruzar el año nuevo) */
  caducos: { conHojasDesde: number; hasta: number };
  /** cómo se nombra el lugar en las frases: "fuera de época en el GBA", "tu patio en el conurbano" */
  textos: { enElLugar: string; elLugar: string };
  /** siembra y trasplante por especie, en décadas */
  calendario: Record<string, Decadas>;
}

const DOCE = (xs: number[]): boolean => xs.length === 12 && xs.every((x) => Number.isFinite(x));
const enAnio = (d: number): boolean => d >= 1 && d <= 365;
const enDecadas = (d: number): boolean => Number.isInteger(d) && d >= 1 && d <= 36;

function erroresDeClima(r: Region): string[] {
  const e: string[] = [];
  for (const k of ['media', 'maxima', 'minima', 'lluvia'] as const)
    if (!DOCE(r.clima[k])) e.push(`clima.${k} tiene que tener 12 números`);
  if (r.clima.media.some((m, i) => m > r.clima.maxima[i] || m < r.clima.minima[i]))
    e.push('clima: la media de algún mes no está entre la mínima y la máxima');
  if (r.clima.lluvia.some((l) => l < 0)) e.push('clima.lluvia no puede ser negativa');
  return e;
}

function erroresDeHeladas(r: Region): string[] {
  const e: string[] = [];
  const h = r.heladas;
  if (!enAnio(h.primera) || !enAnio(h.ultima)) e.push('heladas: primera y última son días del año, 1..365');
  if (!(h.desvioPrimera > 0 && h.desvioUltima > 0)) e.push('heladas: los desvíos tienen que ser positivos');
  if (!h.tardias.every(enDecadas)) e.push('heladas.tardias son décadas, 1..36');
  // en el sur la temporada de heladas es a mitad de año; en el norte cruza el año nuevo
  if ((r.hemisferio === 'S') !== h.primera < h.ultima)
    e.push('heladas: la temporada no corresponde al hemisferio (en el sur la primera helada va antes que la última)');
  return e;
}

/** Errores de armado de una región. Lista vacía = región válida. Lo corren los tests sobre todas las regiones. */
export function validarRegion(r: Region): string[] {
  const e = [...erroresDeClima(r), ...erroresDeHeladas(r)];
  if (!(Math.abs(r.latitud) <= 66)) e.push('latitud fuera de rango (más allá de los círculos polares no hay huerta)');
  if ((r.hemisferio === 'S') !== r.latitud < 0) e.push('la latitud no corresponde al hemisferio');
  const caracteres = Object.keys(r.caracteres);
  if (caracteres[0] !== 'normal') e.push('el primer carácter del año tiene que ser el normal');
  if (!enDecadas(r.caducos.conHojasDesde) || !enDecadas(r.caducos.hasta)) e.push('caducos: son décadas, 1..36');
  for (const [slug, d] of Object.entries(r.calendario))
    for (const [k, v] of Object.entries(d))
      if (!(v as number[]).every(enDecadas)) e.push(`calendario.${slug}.${k} tiene décadas fuera de 1..36`);
  return e;
}
