/** Tipos del estado de una partida. Todo es JSON serializable: eso da guardado, tests y bot gratis. */
import type { Especie } from '../../datos/juego/especies';
import type { Patio } from '../../datos/juego/patio';

import type { CaracterId, CeldaId, Etapa, NivelRiego, Plaga, TipoEvento, ZonaId } from './vocabulario';

export type { Especie };
export type { Patio, ZonaDePatio } from '../../datos/juego/patio';
export type { CaracterId, CeldaId, Etapa, NivelRiego, Plaga, TipoEvento, Ventana, ZonaId } from './vocabulario';

export interface Planta {
  id: string;
  slug: string;
  celda: CeldaId;
  etapa: Etapa;
  /** si ocupa más de una celda, todas las que ocupa: la primera es `celda`, el ancla. Falta cuando ocupa una sola */
  celdas?: CeldaId[];
  /** días desde la siembra */ edad: number;
  /** días efectivos de crecimiento */ prog: number;
  /** días efectivos de germinación acumulados */ germ: number;
  salud: number;
  vigor: number;
  gen: number;
  cosechas: number;
  listoHace: number;
  plaga: Plaga | null;
  tutor: boolean;
  shock: number;
  dulce: boolean;
  semillar: number;
  /** ajuste de la maceta a lo que pide la especie, 0..1 */ pote: number;
  reserva: number;
  /** plantines vivos en esta siembra */ n: number;
  /** semillas que se pusieron */ semillas: number;
  avisoRaleo?: boolean;
  avisoPasado?: boolean;
  avisoListo?: boolean;
  /** diario de esta planta: lo que le fue pasando, década por década. Lo más nuevo al final; se guardan las últimas 16 entradas */
  hist?: Registro[];
}
/** Una entrada del diario de una planta. `s` es la salud con la que cerró; `n`, lo que le pasó: [tipo, texto]. */
export interface Registro {
  dec: number;
  turno: number;
  s: number;
  /** [tipo, texto, código de la frase] */
  n: [TipoEvento, string, string?][];
}
export interface Celda {
  zona: ZonaId;
  mo: number;
  mulch: boolean;
  fam: string | null;
  planta: string | null;
}
export interface Tiempo {
  dec: number;
  tmed: number;
  tmax: number;
  tmin: number;
  lluvia: number;
  helada: boolean;
  ola: boolean;
  estacion: string;
}
export interface Pronostico {
  tmin: number;
  tmax: number;
  pHelada: number;
  lluvia: 'seca' | 'normal' | 'llovedora';
}
export interface Evento {
  turno: number;
  dec: number;
  tipo: TipoEvento;
  texto: string;
  celda: CeldaId | null;
  /** qué pasó, estable (ver `textos/frase.ts`); falta en las partidas guardadas antes de la 0.9 */
  codigo?: string;
}

/** De qué está hecha una partida, más allá de lo que se juega: formato, azar, lugar. */
export interface Meta {
  /** versión del formato de guardado; subirla obliga a escribir una migración en `migraciones.ts` */
  v: 5;
  semilla: number;
  rng: number;
  /** la región del clima y el calendario (`datos/juego/regiones`) */
  region: string;
  /** de qué plantilla de patio salió (`datos/juego/patios`); el patio en sí vive en `mundo.patio` */
  plantilla: string;
  /** marca de tiempo del último guardado; la pone la interfaz, el motor no la mira */
  guardado?: number;
}

/**
 * Cómo quedó armada una tanda: con la receta de secos y verdes (`pareja`), con pocos secos (`humeda`:
 * se pudre, huele y tarda) o con muchos (`seca`: no pasa nada, tarda).
 */
export type Mezcla = 'pareja' | 'humeda' | 'seca';
export interface Tanda {
  avance: number;
  mezcla: Mezcla;
}
/**
 * Una compostera: lo que se le echa va a la tanda abierta, verdes por un lado y secos por el otro.
 * Cuando junta bastantes verdes, la tanda se cierra y madura en dosis de compost.
 */
export interface Compostera {
  tipo: 'compostera';
  en: CeldaId;
  /** verdes y secos de la tanda abierta, en carga */
  verdes: number;
  secos: number;
  tandas: Tanda[];
  /** dosis de compost listas para usar */
  dosis: number;
}
/** Lo que se construye en el patio y no es una zona de cultivo. Hoy, solo la compostera. */
export type Estructura = Compostera;

/** Lo que el patio va dando para juntar, en carga: pasto crecido, hojas caídas, ramas para podar. */
export interface Jardin {
  pasto: number;
  hojas: number;
  poda: number;
}

/** Lo que hay en el patio: el patio mismo (una copia de su plantilla), la tierra, las plantas y lo construido. */
export interface Mundo {
  patio: Patio;
  celdas: Record<CeldaId, Celda>;
  plantas: Record<string, Planta>;
  estructuras: Estructura[];
  jardin: Jardin;
}

/** Un evento sorpresa anunciado (`datos/juego/sorpresas.ts`) y el turno en que va a pasar. */
export interface Anuncio {
  id: string;
  turno: number;
}

/** Dónde está la partida en el calendario y qué tiempo hace. */
export interface Momento {
  /** década del año, 1..36 */
  dec: number;
  turno: number;
  anio: number;
  caracter: CaracterId;
  /** el tiempo que va a hacer esta década */
  clima: Tiempo;
  /** lo que se pronosticó para esta década */
  pronostico: Pronostico;
  /** una amenaza anunciada (un evento sorpresa malo): pasa en el turno que dice, si nadie la previene */
  anunciada: Anuncio | null;
  terminado: boolean;
}

/** Lo que se gasta y se reparte: el tiempo del jugador, el agua, los abrigos y las semillas. */
export interface Recursos {
  ratosGastados: number;
  riego: Record<ZonaId, NivelRiego>;
  /** zonas con el microtúnel armado */
  tunel: Partial<Record<ZonaId, boolean>>;
  manta: Partial<Record<ZonaId, boolean>>;
  goteo: boolean;
  sobres: Record<string, number>;
  /** generaciones de semilla propia, por especie */
  gen: Record<string, number>;
  /** la bolsa de secos (hojas, pasto seco, poda picada), en carga: tapan el compost y hacen mulch */
  secos: number;
}

/** Un pedido de un vecino (`datos/juego/pedidos.ts`) que todavía no se cumplió ni venció. */
export interface PedidoAbierto {
  id: string;
  /** el turno en que llegó */
  desde: number;
  /** el turno de la fecha: lo cosechado hasta ese turno inclusive cuenta */
  vence: number;
  /** lo que ya se había cosechado de la especie cuando llegó: cuenta lo que se coseche después */
  base: number;
  /** el turno de la primera siembra de la especie después de que llegó, si hubo */
  sembrado: number | null;
  /** la última siembra que llegaba a la fecha, contada cuando llegó: lo que dice el cuaderno si vence */
  limite: number;
}
export interface PedidosDeLaPartida {
  abiertos: PedidoAbierto[];
  /** el último turno en que se cerró cada pedido, cumplido o vencido */
  cerrados: Record<string, number>;
  cumplidos: number;
}

/** Lo que va quedando de la partida: cosechas, logros y el cuaderno. */
export interface Progreso {
  cosechado: Record<string, number>;
  porciones: number;
  semillasGuardadas: number;
  visitas: number;
  moInicial: number;
  misiones: Record<string, number>;
  /** el último turno en que pasó cada evento sorpresa */
  sorpresas: Record<string, number>;
  pedidos: PedidosDeLaPartida;
  cuaderno: Evento[];
  /** el número de la próxima planta */
  nextId: number;
}

export interface Estado {
  meta: Meta;
  mundo: Mundo;
  tiempo: Momento;
  recursos: Recursos;
  progreso: Progreso;
}

export type Accion =
  | { tipo: 'sembrar'; slug: string; celda: CeldaId }
  | { tipo: 'trasplantar'; planta: string; celda: CeldaId }
  | { tipo: 'cosechar'; planta: string }
  | { tipo: 'semillar'; planta: string }
  | { tipo: 'ralear'; planta: string }
  | { tipo: 'arrancar'; planta: string }
  | { tipo: 'tutorar'; planta: string }
  | { tipo: 'tratar'; planta: string }
  | { tipo: 'mulch'; celda: CeldaId }
  | { tipo: 'compost'; celda: CeldaId }
  | {
      tipo: 'cortarPasto';
      /** 'compost': va verde a la compostera; 'secar': se seca y va a la bolsa */ destino: 'compost' | 'secar';
    }
  | { tipo: 'juntarHojas' }
  | { tipo: 'podar' }
  | { tipo: 'revolver' }
  | { tipo: 'riego'; zona: ZonaId; nivel: number }
  | { tipo: 'manta'; zona: ZonaId }
  | { tipo: 'tunel'; /** si falta, la primera zona del patio que lo admite */ zona?: ZonaId }
  | { tipo: 'seguir' };
export type Resultado = { ok: true; eventos: Evento[] } | { ok: false; error: string };
