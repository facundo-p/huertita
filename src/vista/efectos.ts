/**
 * La gráfica: qué renderer se usa, sus cámaras, y las animaciones puntuales que piden las acciones
 * (sembrar, cosechar, trasplantar…). Las animaciones se encolan y el lienzo las dispara después de
 * dibujar la escena nueva.
 */
import { signal } from '@preact/signals';
import type { DatosDeEfecto, Efecto, Renderer } from '../render/contrato';
import { RenderPixel } from '../render/pixel';
import { RenderTexto } from '../render/texto';

export const RENDERERS: (new () => Renderer)[] = [RenderPixel, RenderTexto];

/** el renderer montado ahora (lo pone el lienzo) */
export const activo = signal<Renderer | null>(null);

let cola: [Efecto, DatosDeEfecto][] = [];
export function efecto(tipo: Efecto, datos: DatosDeEfecto = {}): void {
  cola.push([tipo, datos]);
}
/** Dispara las animaciones encoladas en el renderer. */
export function dispararEfectos(r: Renderer): void {
  const pendientes = cola;
  cola = [];
  if (r.efecto) for (const [tipo, datos] of pendientes) r.efecto(tipo, datos);
}
