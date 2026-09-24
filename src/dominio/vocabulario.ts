/**
 * El vocabulario del juego, en un solo lugar: cada palabra que el dominio usa para decidir
 * (etapas, plagas, tipos de evento, ventanas…) está listada acá una vez, y su tipo sale de la lista.
 * Y las celdas: `idCelda(x, y)` y `xy(celda)` son las únicas que conocen el formato `"x,y"`.
 */

/** Cómo va una planta, de la siembra al final. */
export const ETAPAS = ['semilla', 'plantin', 'creciendo', 'cosechable', 'pasada', 'semillando'] as const;
export type Etapa = (typeof ETAPAS)[number];

export const PLAGAS = ['pulgon', 'oruga', 'babosa'] as const;
export type Plaga = (typeof PLAGAS)[number];

/** Qué clase de anotación es cada línea del cuaderno y del diario. */
export const TIPOS_DE_EVENTO = ['info', 'bien', 'mal', 'clima', 'logro'] as const;
export type TipoEvento = (typeof TIPOS_DE_EVENTO)[number];

/** Nada, espaciado, parejo, constante. */
export const NIVELES_DE_RIEGO = [0, 1, 2, 3] as const;
export type NivelRiego = (typeof NIVELES_DE_RIEGO)[number];

/** Qué tan buena es la fecha para sembrar o trasplantar una especie, según el almanaque. */
export const VENTANAS = ['ideal', 'posible', 'fuera'] as const;
export type Ventana = (typeof VENTANAS)[number];

/** El carácter del año: cómo viene el clima. */
export const CARACTERES_DEL_ANIO = ['normal', 'nina', 'nino', 'tardia'] as const;
export type CaracterId = (typeof CARACTERES_DEL_ANIO)[number];

/** id de una zona del patio de la partida (ver `datos/juego/patio.ts`) */
export type ZonaId = string;
/** una celda del plano, como `"x,y"`: x crece hacia el este, y hacia el sur */
export type CeldaId = string;

export const idCelda = (x: number, y: number): CeldaId => x + ',' + y;
export function xy(c: CeldaId): { x: number; y: number } {
  const [x, y] = c.split(',');
  return { x: +x, y: +y };
}
