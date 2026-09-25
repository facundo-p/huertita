/**
 * Contrato entre huertapp y el juego.
 *
 * Dice qué campos de `huerta_gba_enriquecido.json` necesita el juego, con qué forma,
 * y cómo se derivan al catálogo compacto. Todo lo que sale de acá es dato del repo:
 * ningún supuesto del juego vive en este archivo (esos están en `datos/juego/`).
 *
 * Si huertapp cambia la forma de un campo, `validarFuente` lo dice con nombre y
 * apellido antes de que el motor se entere.
 */

export type CategoriaSuelo =
  'ARENOSO_DRENANTE' | 'FRANCO_FERTIL' | 'HUMEDO_RICO' | 'PROFUNDO_SUELTO' | 'RUSTICO_TOLERANTE';
export type CategoriaLuz = 'PLENO_SOL' | 'SOL_PARCIAL' | 'MEDIA_SOMBRA' | 'TOLERA_SOMBRA';
export type RegimenRiego = 'escaso' | 'espaciado' | 'parejo' | 'constante';
export type Helada = 'muere' | 'sensible' | 'tolera' | 'mejora';
export interface Rango {
  min: number;
  max: number;
}
/** En huertapp cualquiera de estos extremos puede faltar (null): el juego los completa como supuesto en `datos/juego`. */
export interface TempGerminacion<N = number | null> {
  min: N;
  ideal_min: N;
  ideal_max: N;
  max: N;
}
export interface TempCrecimiento<N = number | null> {
  ideal_min: N;
  ideal_max: N;
  tolera_min: N;
  tolera_max: N;
}
export interface Decadas {
  siembra_ideal?: number[];
  siembra_posible?: number[];
  trasplante_ideal?: number[];
  trasplante_posible?: number[];
}
export interface MedidasMaceta {
  profundidad_min_cm: number | null;
  litros_min: number | null;
  plantas_por_contenedor: number | null;
}

/** Una especie tal como la conoce huertapp, compactada. Los `null` son "el catálogo no lo trae". */
export interface EspecieRepo {
  nombre: string;
  cient: string | null;
  grupo: string;
  suelo: CategoriaSuelo;
  luz: CategoriaLuz;
  hmin: number | null;
  hideal: number | null;
  riego: RegimenRiego | null;
  maceta: MedidasMaceta | null;
  metodo: Record<string, string>;
  dec: Decadas;
  dg: Rango | null;
  dc: Rango | null;
  dt: Rango | null;
  buenas: string[];
  malas: string[];
  confB: number;
  confM: number;
  tg: TempGerminacion | null;
  tc: TempCrecimiento | null;
  helada: Helada | null;
  nota: string;
  listo: string;
  luzNo: string;
  sueloNo: string;
  truco: string;
  plagas: string;
  riesgos: string;
  vida: string;
  siembra: string;
  cuidados: string[];
  conf: { luz: number | null; suelo: number | null; temp: number | null; cal: number | null; asoc: number | null };
}
export interface Catalogo {
  meta: {
    fuente: string;
    generado: string | null;
    n: number;
    suelos: Record<string, { emoji: string; nombre: string; desc: string }>;
    luces: Record<string, { emoji: string; nombre: string; desc: string }>;
  };
  especies: Record<string, EspecieRepo>;
}

/** Qué sistema del juego se mueve cuando cambia cada campo. Lo usa el reporte de `datos:sync`. */
export const CAMPOS_Y_SISTEMAS: Record<string, string> = {
  dec: 'almanaque y vigor de siembra',
  metodo: 'siembra directa o almácigo',
  dg: 'germinación',
  dt: 'trasplante',
  dc: 'cosecha',
  tg: 'germinación',
  tc: 'crecimiento y estrés térmico',
  helada: 'heladas',
  hmin: 'luz',
  hideal: 'luz',
  luz: 'luz',
  suelo: 'suelo',
  riego: 'agua',
  maceta: 'macetas',
  buenas: 'asociaciones',
  malas: 'asociaciones',
  confB: 'peso de asociaciones',
  confM: 'peso de asociaciones',
  cuidados: 'tutorado y cuidados',
  grupo: 'tipo de cosecha y plagas',
};

const SUELOS = ['ARENOSO_DRENANTE', 'FRANCO_FERTIL', 'HUMEDO_RICO', 'PROFUNDO_SUELTO', 'RUSTICO_TOLERANTE'];
const LUCES = ['PLENO_SOL', 'SOL_PARCIAL', 'MEDIA_SOMBRA', 'TOLERA_SOMBRA'];
const RIEGOS = ['escaso', 'espaciado', 'parejo', 'constante'];
const HELADAS = ['muere', 'sensible', 'tolera', 'mejora'];

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const obj = (v: unknown): Obj => (esObj(v) ? v : {});
const esNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const esRango = (v: unknown): v is Rango => esObj(v) && esNum(v.min) && esNum(v.max);

export function validarFuente(fuente: unknown): { errores: string[]; avisos: string[] } {
  const errores: string[] = [],
    avisos: string[] = [];
  if (!esObj(fuente) || !Array.isArray(fuente.especies)) return { errores: ['La raíz no tiene `especies[]`.'], avisos };
  const slugs = new Set<string>();
  for (const bruta of fuente.especies as unknown[]) {
    const e = obj(bruta),
      s = String(e.slug ?? '¿sin slug?');
    const mal = (que: string) => errores.push(`${s}: ${que}`);
    if (typeof e.slug !== 'string') mal('falta `slug`');
    if (typeof e.nombre_comun !== 'string') mal('falta `nombre_comun`');
    if (typeof e.grupo !== 'string') mal('falta `grupo`');
    if (e.variedad_de) continue; // las variedades todavía no entran al juego
    slugs.add(s);
    if (!SUELOS.includes(String(obj(e.suelo).categoria_suelo)))
      mal(`suelo.categoria_suelo desconocida: ${String(obj(e.suelo).categoria_suelo)}`);
    if (!LUCES.includes(String(obj(e.luz).categoria_luz)))
      mal(`luz.categoria_luz desconocida: ${String(obj(e.luz).categoria_luz)}`);
    const reg = obj(e.riego).regimen;
    if (reg != null && !RIEGOS.includes(String(reg))) mal(`riego.regimen desconocido: ${String(reg)}`);
    const t = obj(e.temperaturas);
    if (t.helada != null && !HELADAS.includes(String(t.helada)))
      mal(`temperaturas.helada desconocida: ${String(t.helada)}`);
    for (const k of ['dias_germinacion', 'dias_a_cosecha', 'dias_a_trasplante']) {
      const r = e[k];
      if (r != null && !esRango(r)) mal(`${k} no es {min,max}`);
      else if (esRango(r) && r.min > r.max) mal(`${k}: min > max`);
    }
    const dec = obj(obj(obj(e.calendario).decadas).conurbano);
    if (!Object.keys(dec).length) mal('falta calendario.decadas.conurbano');
    for (const [k, v] of Object.entries(dec))
      if (!Array.isArray(v) || v.some((d) => !Number.isInteger(d) || d < 1 || d > 36))
        mal(`calendario.decadas.conurbano.${k} tiene décadas fuera de 1..36`);
    for (const [clave, campos] of [
      ['crecimiento', ['ideal_min', 'ideal_max', 'tolera_min', 'tolera_max']],
      ['germinacion', ['min', 'ideal_min', 'ideal_max', 'max']],
    ] as const) {
      const v = t[clave];
      if (v == null) {
        avisos.push(`${s}: sin temperaturas.${clave} (el juego supone valores templados)`);
        continue;
      }
      if (!esObj(v)) {
        mal(`temperaturas.${clave} no es un objeto`);
        continue;
      }
      for (const k of campos) {
        if (v[k] != null && !esNum(v[k])) mal(`temperaturas.${clave}.${k} no es número`);
        if (v[k] == null) avisos.push(`${s}: temperaturas.${clave}.${k} vacío (el juego lo supone)`);
      }
    }
    const as = obj(e.asociaciones);
    if (!Array.isArray(as.buenas) || !Array.isArray(as.malas)) mal('asociaciones.buenas/malas no son listas');
    if (e.dias_germinacion == null) avisos.push(`${s}: sin dias_germinacion (el juego supone 7–14)`);
    if (e.dias_a_cosecha == null) avisos.push(`${s}: sin dias_a_cosecha (el juego supone según el grupo)`);
    if (reg == null) avisos.push(`${s}: sin riego.regimen (el juego supone "parejo")`);
  }
  // asociaciones que apuntan a especies que no existen
  for (const bruta of fuente.especies as unknown[]) {
    const e = obj(bruta);
    if (e.variedad_de) continue;
    const as = obj(e.asociaciones);
    for (const lado of ['buenas', 'malas'])
      for (const a of (Array.isArray(as[lado]) ? as[lado] : []) as Obj[])
        if (!a.externa && typeof a.slug === 'string' && !slugs.has(a.slug))
          avisos.push(`${String(e.slug)}: asociación ${lado} con "${a.slug}", que no es una especie base`);
  }
  return { errores, avisos };
}

function numero(x: unknown): number | null {
  if (x == null) return null;
  const m = String(x).match(/\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(',', '.')) : null;
}
function corto(t: unknown, n: number): string {
  const s = String(t ?? '').trim();
  if (s.length <= n) return s;
  const c = s.slice(0, n),
    p = Math.max(c.lastIndexOf('. '), c.lastIndexOf('; '));
  return p > n * 0.5 ? c.slice(0, p + 1) : c.slice(0, c.lastIndexOf(' ')) + '…';
}

export function derivarCatalogo(fuente: unknown): Catalogo {
  const f = obj(fuente),
    meta = obj(f.meta),
    especies: Record<string, EspecieRepo> = {};
  for (const bruta of f.especies as unknown[]) {
    const e = obj(bruta);
    if (e.variedad_de) continue;
    const cal = obj(e.calendario),
      t = obj(e.temperaturas),
      as = obj(e.asociaciones),
      luz = obj(e.luz),
      suelo = obj(e.suelo);
    const lista = (v: unknown) =>
      ((Array.isArray(v) ? v : []) as Obj[])
        .filter((a) => !a.externa && typeof a.slug === 'string')
        .map((a) => a.slug as string);
    const conf = (k: string) => {
      const c = obj(e[k]).confianza;
      return esNum(c) ? c : null;
    };
    especies[String(e.slug)] = {
      nombre: String(e.nombre_comun),
      cient: typeof e.nombre_cientifico === 'string' ? e.nombre_cientifico : null,
      grupo: String(e.grupo),
      suelo: suelo.categoria_suelo as CategoriaSuelo,
      luz: luz.categoria_luz as CategoriaLuz,
      hmin: numero(luz.horas_min),
      hideal: numero(luz.horas_ideal),
      riego: (obj(e.riego).regimen as RegimenRiego | undefined) ?? null,
      maceta: (obj(e.maceta).medidas as MedidasMaceta | undefined) ?? null,
      metodo: (cal.metodo_por_mes as Record<string, string> | undefined) ?? {},
      dec: (obj(cal.decadas).conurbano as Decadas | undefined) ?? {},
      dg: (e.dias_germinacion as Rango | null) ?? null,
      dc: (e.dias_a_cosecha as Rango | null) ?? null,
      dt: (e.dias_a_trasplante as Rango | null) ?? null,
      buenas: lista(as.buenas),
      malas: lista(as.malas),
      confB: conf('asociaciones_buenas') ?? 3,
      confM: conf('asociaciones_malas') ?? 3,
      tg: (t.germinacion as TempGerminacion | undefined) ?? null,
      tc: (t.crecimiento as TempCrecimiento | undefined) ?? null,
      helada: (t.helada as Helada | undefined) ?? null,
      nota: corto(t.nota, 220),
      listo: corto(obj(e.cosecha).indicadores_listo, 160),
      luzNo: corto(luz.que_pasa_si_no, 170),
      sueloNo: corto(suelo.que_pasa_si_no, 170),
      truco: corto(obj(e.trucos).valor, 200),
      plagas: corto(obj(e.plagas).valor, 240),
      riesgos: corto(obj(e.riesgos).valor, 220),
      vida: corto(obj(e.longevidad).valor, 170),
      siembra: corto(obj(e.forma_siembra).valor, 200),
      cuidados: [
        ...new Set(((Array.isArray(e.cuidados) ? e.cuidados : []) as Obj[]).map((c) => String(c.tipo))),
      ].sort(),
      conf: {
        luz: conf('luz'),
        suelo: conf('suelo'),
        temp: esNum(t.confianza) ? t.confianza : null,
        cal: esNum(cal.confianza) ? cal.confianza : null,
        asoc: conf('asociaciones_buenas'),
      },
    };
  }
  return {
    meta: {
      fuente: 'facundo-p/huertapp · data/huerta_gba_enriquecido.json',
      generado: typeof meta.fecha_generacion === 'string' ? meta.fecha_generacion : null,
      n: Object.keys(especies).length,
      suelos: f.categorias_suelo as Catalogo['meta']['suelos'],
      luces: f.categorias_luz as Catalogo['meta']['luces'],
    },
    especies,
  };
}
