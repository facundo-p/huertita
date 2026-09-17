/**
 * Contrato entre la interfaz y cualquier renderer. Es TODO lo que la interfaz sabe de la gráfica:
 * para sumar otra (isométrica, 3D, nativa) alcanza con implementar `Renderer`.
 * El renderer no importa el motor ni lee el estado: solo recibe una `Escena` plana.
 */
import type { CeldaId, Etapa, Plaga, ZonaId } from '../motor';

export interface PlantaDeEscena { slug: string; nombre: string; emoji: string; grupo: string; familia: string; etapa: Etapa; n: number; salud: number; plaga: Plaga | null; tutor: boolean; flor: boolean; dulce: boolean; /** 0..1 hacia la cosecha (o hacia el trasplante, si es plantín) */ avance: number }
export interface CeldaDeEscena { zona: ZonaId; mo: number; mulch: boolean; humedo: number; maceta: { litros: number; prof: number } | null; sol: number; planta: PlantaDeEscena | null; tinte: 'bien' | 'regular' | 'mal' | null; seleccion: boolean; borde: { n: boolean; s: boolean; e: boolean; o: boolean } }
export interface Escena {
  camara: string; cerca: { zona: ZonaId; col: number | null };
  ancho: number; alto: number; mapa: string[]; celdas: Record<CeldaId, CeldaDeEscena>;
  dec: number; estacion: string; arbolConHojas: boolean; sombraPared: number; tunel: boolean; mantas: Partial<Record<ZonaId, boolean>>;
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
