/** Las transiciones de la interfaz son una función pura: se prueban sin navegador. */
import { describe, expect, it } from 'vitest';
import { type Interaccion, normalizar, transicion } from '../../src/vista/modos';

const OCUPADA = '0,1',
  LIBRE = '1,1',
  CRIA = '0,7';
const P = { existe: (k: string) => [OCUPADA, LIBRE, CRIA].includes(k), libre: (k: string) => k !== OCUPADA };
const en = (modo: Interaccion['modo'], sel: string | null = null): Interaccion => ({ modo, sel });

describe('tocar una celda', () => {
  it('sin nada elegido, abre la ficha de la celda', () => {
    expect(transicion(en({ modo: 'inicio' }), { tipo: 'tocar', celda: LIBRE }, P)).toEqual({
      i: en({ modo: 'celda' }, LIBRE),
    });
  });
  it('con un sobre: el primer toque elige la celda, el segundo siembra', () => {
    const semillas = en({ modo: 'semillas', sobre: 'lechuga' });
    const uno = transicion(semillas, { tipo: 'tocar', celda: LIBRE }, P);
    expect(uno).toEqual({ i: { ...semillas, sel: LIBRE } });
    const dos = transicion(uno.i, { tipo: 'tocar', celda: LIBRE }, P);
    expect(dos.accion).toEqual({ tipo: 'sembrar', slug: 'lechuga', celda: LIBRE });
    expect(dos.i.sel).toBeNull();
  });
  it('con un sobre, una celda ocupada abre su ficha: ahí no se siembra', () => {
    expect(transicion(en({ modo: 'semillas', sobre: 'lechuga' }), { tipo: 'tocar', celda: OCUPADA }, P).i).toEqual(
      en({ modo: 'celda' }, OCUPADA),
    );
  });
  it('trasplantando, el toque es el destino; si no se puede, sigue trasplantando', () => {
    const moviendo = en({ modo: 'moviendo', planta: 'p3', desde: CRIA }, CRIA);
    const t = transicion(moviendo, { tipo: 'tocar', celda: LIBRE }, P);
    expect(t.accion).toEqual({ tipo: 'trasplantar', planta: 'p3', celda: LIBRE });
    expect(t.i).toEqual(en({ modo: 'celda' }, LIBRE));
    expect(t.siFalla).toEqual(moviendo);
  });
  it('fuera del patio, suelta la selección', () => {
    expect(transicion(en({ modo: 'celda' }, LIBRE), { tipo: 'tocar', celda: '9,9' }, P).i).toEqual(
      en({ modo: 'inicio' }),
    );
  });
});

describe('los demás eventos', () => {
  it('elegir el mismo sobre dos veces lo suelta; una celda ocupada deja de estar elegida', () => {
    const i = transicion(en({ modo: 'semillas', sobre: 'lechuga' }, OCUPADA), { tipo: 'sobre', slug: 'lechuga' }, P).i;
    expect(i).toEqual(en({ modo: 'semillas', sobre: null }));
  });
  it('ir a otro modo suelta el sobre, pero volver a la siembra no', () => {
    const s = en({ modo: 'semillas', sobre: 'tomate' });
    expect(transicion(s, { tipo: 'ir', modo: 'semillas' }, P).i).toBe(s);
    expect(transicion(s, { tipo: 'ir', modo: 'riego' }, P).i.modo).toEqual({ modo: 'riego' });
  });
  it('mover y cancelar vuelven a la celda de origen', () => {
    const m = transicion(en({ modo: 'celda' }, CRIA), { tipo: 'mover', planta: 'p1' }, P).i;
    expect(m.modo).toEqual({ modo: 'moviendo', planta: 'p1', desde: CRIA });
    expect(transicion(m, { tipo: 'cancelar' }, P).i).toEqual(en({ modo: 'celda' }, CRIA));
  });
  it('al pasar la década se ve el resumen, o el balance si terminó el año', () => {
    expect(transicion(en({ modo: 'celda' }, LIBRE), { tipo: 'decadaPasada', terminado: false }, P).i).toEqual(
      en({ modo: 'resumen' }, LIBRE),
    );
    expect(transicion(en({ modo: 'celda' }, '9,9'), { tipo: 'decadaPasada', terminado: true }, P).i).toEqual(
      en({ modo: 'fin' }),
    );
  });
  it('una partida cargada abre el guardado; una nueva, el inicio', () => {
    expect(transicion(en({ modo: 'riego' }), { tipo: 'partidaCargada', terminada: false }, P).i.modo.modo).toBe(
      'partidas',
    );
    expect(transicion(en({ modo: 'riego' }), { tipo: 'partidaNueva', terminada: false }, P).i.modo.modo).toBe('inicio');
  });
});

describe('normalizar después de una acción', () => {
  it('suelta el sobre que se quedó sin semillas y el trasplante de una planta que ya no está', () => {
    expect(normalizar(en({ modo: 'semillas', sobre: 'ajo' }), { ajo: 0 }, () => true).modo).toEqual({
      modo: 'semillas',
      sobre: null,
    });
    expect(normalizar(en({ modo: 'moviendo', planta: 'p1', desde: CRIA }, CRIA), {}, () => false).modo).toEqual({
      modo: 'celda',
    });
  });
});
