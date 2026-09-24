/**
 * El espacio que ocupa cada planta: su huella en celdas, cuántas entran en una celda y qué sombra
 * le hace a lo que tiene al sur.
 *
 * OJO, esto está APAGADO mientras viva el test dorado. El juego corre hoy con la regla vieja —una
 * planta, una celda, sin sombra entre plantas—, que es exactamente como venía jugando el prototipo.
 * Los marcos reales de cada especie ya están cargados en `datos/juego/especies.ts` y el motor entero
 * los sabe usar: se prenden en el paso 4 de los cimientos (#28), cuando el dorado se jubila y se
 * rebalancea todo de una vez. `tests/espacio.test.ts` los prende para probar las reglas.
 */
import type { Marco } from '../../datos/juego/especies';
import type { Obstaculo } from '../../datos/juego/patio';
import { REGLAS } from '../../datos/juego/reglas';
import { objetivoCosecha } from './catalogo';
import type { CeldaId, Especie, Estado, Planta } from './tipos';
import { clamp } from './util';
import { idCelda, xy } from './vocabulario';
import { especieDe } from './planta';

/** Cómo se juega mientras el espacio real está apagado: cada planta en su celda y nada más. */
const SIN_ESPACIO: Marco = { cm: 50, huella: 1, porCelda: 1, alto: 0 };
let real = false;

export const espacioReal = (): boolean => real;
/** Corre `f` con las reglas de espacio prendidas y las deja como estaban. Para los tests y para el día que se prendan de verdad. */
export function conEspacioReal<T>(f: () => T): T {
  const antes = real;
  real = true;
  try {
    return f();
  } finally {
    real = antes;
  }
}
/** El marco que vale ahora mismo para una especie. */
export const marco = (sp: Especie): Marco => (real ? sp.marco : SIN_ESPACIO);
/** Cuántas plantas de esa especie pueden quedar en una celda. */
export const porCelda = (sp: Especie): number => marco(sp).porCelda;

/** Todas las celdas que ocupa una planta. La primera es el ancla, que es donde está `pl.celda`. */
export const celdasDePlanta = (pl: Pick<Planta, 'celda' | 'celdas'>): CeldaId[] => pl.celdas ?? [pl.celda];

/**
 * El bloque de celdas que ocuparía una planta de esta especie anclada en `ancla`: la propia celda y,
 * si la huella es más grande, las de al lado hacia el este y el sur. Devuelve null si el bloque se
 * sale del cantero o cae en otra zona. En una zona de cría siempre es una celda: en la bandeja el
 * plantín todavía no ocupa su marco.
 */
export function bloqueDe(E: Pick<Estado, 'celdas'>, sp: Especie, ancla: CeldaId, cria: boolean): CeldaId[] | null {
  const { huella } = marco(sp),
    base = E.celdas[ancla];
  if (!base) return null;
  if (huella === 1 || cria) return [ancla];
  const { x, y } = xy(ancla),
    largo = huella === 4 ? 2 : 1,
    bloque: CeldaId[] = [];
  for (let dy = 0; dy < largo; dy++)
    for (let dx = 0; dx < 2; dx++) {
      const k = idCelda(x + dx, y + dy),
        c = E.celdas[k];
      if (!c || c.zona !== base.zona) return null;
      bloque.push(k);
    }
  return bloque;
}
/** La primera celda del bloque que ya está ocupada por otra planta, o null si entra. */
export function ocupadaEn(E: Pick<Estado, 'celdas'>, bloque: CeldaId[], salvo?: string): CeldaId | null {
  for (const k of bloque) {
    const p = E.celdas[k].planta;
    if (p && p !== salvo) return k;
  }
  return null;
}
/** Cuántas celdas juntas pide una especie, para contarlo en un aviso. */
export const pideCeldas = (sp: Especie): number => marco(sp).huella;

/** [SUPUESTO] cuántas semillas van por siembra: la bandeja entera en la almaciguera, el marco (con algo de más para ralear) en directa. */
export function semillasDeSiembra(
  sp: Especie,
  zona: { cria?: boolean; capacidad?: number },
  porDefecto: number,
): number {
  if (!real) return porDefecto;
  if (zona.cria) return zona.capacidad ?? porDefecto;
  const pc = porCelda(sp);
  return pc <= 1 ? porDefecto : pc + Math.ceil(pc / REGLAS.espacio.extraParaRalear);
}

/** [SUPUESTO] cuánto levanta una planta ahora: su alto de grande, según lo que lleva crecido. */
export function altoDe(pl: Planta, sp: Especie = especieDe(pl)): number {
  const alto = marco(sp).alto;
  if (!alto || pl.etapa === 'semilla') return 0;
  return alto * clamp(pl.prog / objetivoCosecha(sp), REGLAS.espacio.altoInicial, 1);
}
/**
 * Las plantas altas del patio, como obstáculos temporales para el cálculo de sol. Se saltea la
 * planta que está en la celda que se está midiendo: una planta no se hace sombra a sí misma.
 * [SUPUESTO] cada planta es un cilindro del ancho de su huella, sin tronco.
 */
export function plantasQueSombrean(E: Pick<Estado, 'celdas' | 'plantas'>, salvo: CeldaId): Obstaculo[] {
  if (!real) return [];
  const out: Obstaculo[] = [];
  for (const id in E.plantas) {
    const pl = E.plantas[id],
      sp = especieDe(pl),
      alto = altoDe(pl, sp);
    if (alto < REGLAS.espacio.sombreaDesde) continue;
    const celdas = celdasDePlanta(pl);
    if (celdas.includes(salvo)) continue;
    let sx = 0,
      sy = 0;
    for (const k of celdas) {
      const q = xy(k);
      sx += q.x + 0.5;
      sy += q.y + 0.5;
    }
    out.push({
      tipo: 'arbol',
      nombre: sp.nombre,
      en: [sx / celdas.length, sy / celdas.length],
      alto,
      copa: Math.sqrt(marco(sp).huella) / 2,
      fuste: 0,
      caduco: false,
    });
  }
  return out;
}
