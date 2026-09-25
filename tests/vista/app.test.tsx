// @vitest-environment happy-dom
/** La carcasa de la interfaz: se monta con una partida y responde a los botones principales. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { render as montar } from 'preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as M from '../../src/dominio';
import { App } from '../../src/vista/App';
import { arrancar } from '../../src/vista/arrancar';
import { interaccion, partida, renderer, tocada } from '../../src/vista/estado';
import { almacenes } from '../../src/vista/persistencia';

beforeEach(() => {
  renderer.value = 1; // el renderer de texto: happy-dom no tiene canvas
  partida.value = M.crearPartida(3);
  interaccion.value = { modo: { modo: 'inicio' }, sel: null };
  tocada();
});
afterEach(cleanup);

describe('la carcasa', () => {
  it('muestra la fecha, los ratos y el pronóstico de la partida', () => {
    render(<App />);
    expect(screen.getByText(/año 1/)).toBeTruthy();
    expect(document.querySelectorAll('.hz-pips i').length).toBe(M.RATOS);
    expect(screen.getByText(/Pronóstico de la década/)).toBeTruthy();
  });
  it('dibuja el patio con el renderer elegido: una celda por celda de la partida', () => {
    render(<App />);
    expect(document.querySelectorAll('.hz-tcelda.z-suelo').length).toBe(M.celdasDe(partida.value, 'suelo').length);
  });
  it('el renderer de texto muestra la compostera donde está', () => {
    render(<App />);
    const { x, y } = M.xy(M.compostera(partida.value)!.en);
    const i = y * partida.value.mundo.patio.plano[0].length + x;
    expect(document.querySelectorAll('.hz-texto > *')[i].textContent).toBe('♻️');
  });
  it('los botones de la barra cambian de panel y marcan el que está abierto', () => {
    render(<App />);
    fireEvent.click(document.querySelector('[data-modo="riego"]')!);
    expect(interaccion.value.modo.modo).toBe('riego');
    expect(document.querySelector('[data-modo="riego"]')!.className).toBe('on');
  });
  it('pasar 10 días avanza la partida y muestra lo que pasó', () => {
    render(<App />);
    const antes = partida.value.tiempo.turno;
    fireEvent.click(document.getElementById('hz-pasar')!);
    expect(partida.value.tiempo.turno).toBe(antes + 1);
    expect(interaccion.value.modo.modo).toBe('resumen');
  });
  it('tocar una celda en el patio la elige', () => {
    render(<App />);
    fireEvent.click(document.querySelectorAll('.hz-tcelda.z-suelo')[0]);
    expect(interaccion.value.modo.modo).toBe('celda');
    expect(interaccion.value.sel).toBe(M.celdasDe(partida.value, 'suelo')[0]);
  });
});

describe('el arranque', () => {
  it('sin partida guardada, la nueva queda guardada en el dispositivo desde el primer momento', async () => {
    localStorage.clear();
    const raiz = document.createElement('div');
    document.body.appendChild(raiz);
    arrancar(raiz);
    await waitFor(async () => expect(await almacenes.local.cargar()).not.toBeNull());
    const guardada = (await almacenes.local.cargar())!;
    expect(guardada.meta.semilla).toBe(partida.value.meta.semilla);
    expect(guardada.tiempo.turno).toBe(0);
    montar(null, raiz);
    raiz.remove();
  });
});
