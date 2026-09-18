/**
 * Contrato entre la interfaz y cualquier renderer. Es TODO lo que la interfaz sabe de la gráfica:
 * para sumar otra (isométrica, 3D, nativa) alcanza con implementar `Renderer`.
 * El renderer no importa el motor ni lee el estado: solo recibe una `Escena` plana.
 */
import type { TipoZona } from '../../datos/juego/patio';
import type { CeldaId, Etapa, Plaga, ZonaId } from '../motor';

export interface PlantaDeEscena { slug: string; nombre: string; emoji: string; grupo: string; familia: string; etapa: Etapa; n: number; salud: number; plaga: Plaga | null; tutor: boolean; flor: boolean; dulce: boolean; /** plantín en su punto de trasplante, o ya pasándose */ trasplante: 'listo' | 'pasado' | null; /** 0..1 hacia la cosecha (o hacia el trasplante, si es plantín) */ avance: number }
export interface CeldaDeEscena { /** id de la zona: sirve para agrupar, nunca para decidir cómo se dibuja */ zona: ZonaId; /** cómo se dibuja */ tipo: TipoZona; nombreZona: string; mo: number; mulch: boolean; humedo: number; maceta: { litros: number; prof: number } | null; sol: number; planta: PlantaDeEscena | null; /** false si la planta de esta celda está anclada en otra: una planta grande tapa varias celdas y se dibuja una sola vez */ ancla: boolean; tinte: 'bien' | 'regular' | 'mal' | null; seleccion: boolean; borde: { n: boolean; s: boolean; e: boolean; o: boolean } }
export interface Escena {
  camara: string;
  /** la zona que muestra la cámara de cerca; `hondo` en cm de tierra útil */
  cerca: { zona: ZonaId; tipo: TipoZona; hondo: number; col: number | null };
  ancho: number; alto: number;
  /** filas de norte a sur: P pared, H casa, T árbol, C compostera, '.' pasto, ':' sendero; cualquier otra letra es una celda de cultivo */
  plano: string[];
  piso: 'pasto' | 'baldosa'; norte: 'paredon' | 'baranda';
  celdas: Record<CeldaId, CeldaDeEscena>;
  /** x en celdas (con decimales); `base` es la fila donde apoya el tronco */
  arboles: { x: number; base: number; caduco: boolean }[];
  compostera: CeldaId | null;
  dec: number; estacion: string; arbolConHojas: boolean;
  /** largo de la sombra del paredón norte, en filas; 0 si no se dibuja */
  sombraPared: number;
  /** zonas con el microtúnel armado */
  tuneles: ZonaId[];
  mantas: Partial<Record<ZonaId, boolean>>;
  capa: 'sol' | null; animar: 'lluvia' | 'helada' | 'calor' | null; compost: { carga: number; tandas: number; dosis: number };
}
export type Efecto = 'sembrar' | 'brote' | 'cosechar' | 'trasplantar' | 'polvo' | 'morir' | 'tratar' | 'mulch' | 'compost' | 'tutorar' | 'regar' | 'logro';
export interface Renderer {
  nombre: string;
  montar(elemento: HTMLElement): void;
  dibujar(escena: Escena): void;
  alTocar(callback: (celda: CeldaId) => void): void;
  desmontar(): void;
  /** opcional: cámaras que ofrece, como pares [id, etiqueta]; la elegida llega en `escena.camara` */
  camaras?: [string, string][];
  /** opcional: animación puntual disparada por una acción del jugador */
  efecto?(tipo: Efecto, datos: Record<string, unknown>): void;
}
