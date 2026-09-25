// @vitest-environment happy-dom
/**
 * La escena se arma una sola vez por cambio: la leen el lienzo, los botones de las zonas, la tira de
 * la planta y las animaciones, pero todos de la misma señal (#65).
 */
import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as M from '../../src/dominio';
import { App } from '../../src/vista/App';
import { aviso, interaccion, partida, renderer, tocada } from '../../src/vista/estado';
import { hacer } from '../../src/vista/mensajes';

const armadas = vi.hoisted(() => ({ n: 0 }));
vi.mock('../../src/aplicacion/consultas/escena', async (original) => {
  const m = await original<typeof import('../../src/aplicacion/consultas/escena')>();
  return {
    ...m,
    escena: (...args: Parameters<typeof m.escena>) => {
      armadas.n++;
      return m.escena(...args);
    },
  };
});

beforeEach(() => (renderer.value = 1));
afterEach(cleanup);

describe('una sola escena por cambio', () => {
  it('tocar una celda en modo siembra arma la escena una vez', () => {
    const E = M.crearPartida(2);
    E.recursos.sobres.rabanito = 3;
    partida.value = E;
    interaccion.value = { modo: { modo: 'inicio' }, sel: null };
    aviso.value = '';
    tocada();
    render(<App />);
    act(() => void hacer({ tipo: 'ir', modo: 'semillas' }));
    act(() => void hacer({ tipo: 'sobre', slug: 'rabanito' }));
    const celda = M.idCelda(0, 4);
    armadas.n = 0;
    act(() => void hacer({ tipo: 'tocar', celda }));
    expect(interaccion.value.sel).toBe(celda);
    expect(document.querySelector('.hz-eval')).toBeTruthy();
    expect(armadas.n).toBe(1);
  });
  it('sembrar, con la partida y el modo cambiando juntos, también', () => {
    const E = M.crearPartida(2),
      celda = M.idCelda(0, 4);
    E.recursos.sobres.rabanito = 3;
    partida.value = E;
    interaccion.value = { modo: { modo: 'semillas', sobre: 'rabanito' }, sel: celda };
    tocada();
    render(<App />);
    armadas.n = 0;
    act(() => void fireEvent.click(document.querySelector('[data-acc="sembrar"]')!));
    expect(M.plantaEn(E, celda)?.slug).toBe('rabanito');
    expect(armadas.n).toBe(1);
  });
});
