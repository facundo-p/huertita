/** Tipos del estado de una partida. Todo es JSON serializable: eso da guardado, tests y bot gratis. */
import type { Especie } from '../../datos/juego/especies';

export type { Especie };
/** id de una zona del patio de la partida (ver `datos/juego/patio.ts`) */
export type ZonaId = string;
export type CeldaId = string; // "x,y"
export type Etapa = 'semilla' | 'plantin' | 'creciendo' | 'cosechable' | 'pasada' | 'semillando';
export type Plaga = 'pulgon' | 'oruga' | 'babosa';
export type NivelRiego = 0 | 1 | 2 | 3;
export type CaracterId = 'normal' | 'nina' | 'nino' | 'tardia';
export type TipoEvento = 'info' | 'bien' | 'mal' | 'clima' | 'logro';

export interface Planta {
  id: string; slug: string; celda: CeldaId; etapa: Etapa;
  /** días desde la siembra */ edad: number;
  /** días efectivos de crecimiento */ prog: number;
  /** días efectivos de germinación acumulados */ germ: number;
  salud: number; vigor: number; gen: number; cosechas: number; listoHace: number;
  plaga: Plaga | null; tutor: boolean; shock: number; dulce: boolean; semillar: number;
  /** ajuste de la maceta a lo que pide la especie, 0..1 */ pote: number;
  reserva: number;
  /** plantines vivos en esta siembra */ n: number;
  /** semillas que se pusieron */ semillas: number;
  avisoRaleo?: boolean; avisoPasado?: boolean; avisoListo?: boolean;
}
export interface Celda { zona: ZonaId; mo: number; mulch: boolean; fam: string | null; planta: string | null }
export interface Tiempo { dec: number; tmed: number; tmax: number; tmin: number; lluvia: number; helada: boolean; ola: boolean; estacion: string }
export interface Pronostico { tmin: number; tmax: number; pHelada: number; lluvia: 'seca' | 'normal' | 'llovedora' }
export interface Evento { turno: number; dec: number; tipo: TipoEvento; texto: string; celda: CeldaId | null }

export interface Estado {
  /** versión del formato de guardado; subirla obliga a escribir una migración en `migraciones.ts` */
  v: 2;
  /** id del patio en el que se juega (`datos/juego/patios`) */
  patio: string;
  semilla: number; rng: number; dec: number; turno: number; anio: number; caracter: CaracterId;
  ratosGastados: number; riego: Record<ZonaId, NivelRiego>; /** zonas con el microtúnel armado */ tunel: Partial<Record<ZonaId, boolean>>; manta: Partial<Record<ZonaId, boolean>>; goteo: boolean;
  celdas: Record<CeldaId, Celda>; plantas: Record<string, Planta>; nextId: number;
  sobres: Record<string, number>; gen: Record<string, number>;
  compost: { dosis: number; carga: number; tandas: { avance: number }[] };
  cosechado: Record<string, number>; porciones: number; semillasGuardadas: number; visitas: number; moInicial: number;
  misiones: Record<string, number>; cuaderno: Evento[]; prox: { real: Tiempo; pron: Pronostico }; terminado: boolean;
  /** marca de tiempo del último guardado; la pone la interfaz, el motor no la mira */ guardado?: number;
}

export type Accion =
  | { tipo: 'sembrar'; slug: string; celda: CeldaId }
  | { tipo: 'trasplantar'; planta: string; celda: CeldaId }
  | { tipo: 'cosechar'; planta: string } | { tipo: 'semillar'; planta: string } | { tipo: 'ralear'; planta: string }
  | { tipo: 'arrancar'; planta: string } | { tipo: 'tutorar'; planta: string } | { tipo: 'tratar'; planta: string }
  | { tipo: 'mulch'; celda: CeldaId } | { tipo: 'compost'; celda: CeldaId }
  | { tipo: 'riego'; zona: ZonaId; nivel: number }
  | { tipo: 'manta'; zona: ZonaId }
  | { tipo: 'tunel'; /** si falta, la primera zona del patio que lo admite */ zona?: ZonaId }
  | { tipo: 'seguir' };
export type Resultado = { ok: true; eventos: Evento[] } | { ok: false; error: string };
