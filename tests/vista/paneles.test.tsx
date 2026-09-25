// @vitest-environment happy-dom
/**
 * Los paneles del loop principal. Lo más importante: los botones que se ven son exactamente los que
 * el dominio permite (`puede`), y tocarlos hace lo que dicen.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as M from '../../src/dominio';
import type { Estado } from '../../src/dominio';
import { App } from '../../src/vista/App';
import { Confirmar } from '../../src/vista/paneles/Confirmar';
import { aviso, interaccion, partida, renderer, tocada } from '../../src/vista/estado';
import { hacer as hacerYa } from '../../src/vista/mensajes';
import type { EventoUI } from '../../src/vista/modos';

/** Un evento de la interfaz, esperando a que se vuelva a dibujar. */
const hacer = (ev: EventoUI): void => void act(() => void hacerYa(ev));
import { jugarUnAnio } from '../../tools/jugador';

function con(E: Estado) {
  partida.value = E;
  interaccion.value = { modo: { modo: 'inicio' }, sel: null };
  aviso.value = '';
  tocada();
  render(<App />);
}
const botones = () => [...document.querySelectorAll('#hz-panel [data-acc]')].map((b) => b.getAttribute('data-acc'));

beforeEach(() => (renderer.value = 1));
afterEach(cleanup);

describe('la ficha de una celda', () => {
  it('muestra, para cada planta, los botones que el dominio permite y ninguno más', () => {
    const E = jugarUnAnio(M, 4, undefined, { decadas: 12 }) as Estado;
    con(E);
    for (const pl of Object.values(E.mundo.plantas)) {
      hacer({ tipo: 'irACelda', celda: pl.celda });
      const hay = botones();
      for (const a of ['cosechar', 'semillar', 'ralear', 'tutorar', 'tratar'] as const)
        expect(hay.includes(a), `${pl.slug} ${pl.etapa}: ${a}`).toBe(
          M.puede(E, { tipo: a, planta: pl.id }, { sinMirarRatos: true }) === null,
        );
      expect(hay.includes('mover'), `${pl.slug} mover`).toBe(M.puedeMoverse(E, pl) === null);
      expect(hay).toContain('arrancar');
    }
  });
  it('una celda libre invita a sembrar y dice qué hubo antes', () => {
    const E = M.crearPartida(2);
    E.mundo.celdas[M.idCelda(0, 1)].fam = 'solanacea';
    con(E);
    hacer({ tipo: 'irACelda', celda: M.idCelda(0, 1) });
    expect(screen.getByText('Celda libre')).toBeTruthy();
    expect(screen.getByText(/Lo último que hubo acá fue una solanacea/)).toBeTruthy();
  });
  it('cosechar desde el botón cosecha de verdad', () => {
    const E = M.crearPartida(2);
    E.recursos.sobres.rabanito = 3;
    M.despachar(E, { tipo: 'sembrar', slug: 'rabanito', celda: M.idCelda(0, 4) });
    Object.assign(Object.values(E.mundo.plantas)[0], { etapa: 'cosechable', n: 1, prog: 40 });
    con(E);
    hacer({ tipo: 'irACelda', celda: M.idCelda(0, 4) });
    fireEvent.click(document.querySelector('#hz-panel [data-acc="cosechar"]')!);
    expect(E.progreso.porciones).toBeGreaterThan(0);
  });
});

describe('sembrar', () => {
  it('elegir un sobre muestra su ficha; la celda elegida, cómo le iría; el botón siembra', () => {
    const E = M.crearPartida(2);
    con(E);
    hacer({ tipo: 'ir', modo: 'semillas' });
    fireEvent.click(document.querySelector('.hz-sobre[data-slug="rabanito"]')!);
    expect(screen.getByText(/Ahora conviene/)).toBeTruthy();
    hacer({ tipo: 'tocar', celda: M.idCelda(0, 4) });
    expect(document.querySelector('.hz-eval')).toBeTruthy();
    fireEvent.click(document.querySelector('[data-acc="sembrar"]')!);
    expect(M.plantaEn(E, M.idCelda(0, 4))?.slug).toBe('rabanito');
  });
});

describe('riego y protección', () => {
  it('cambiar el riego de una zona lo cambia en la partida', () => {
    const E = M.crearPartida(2);
    con(E);
    hacer({ tipo: 'ir', modo: 'riego' });
    fireEvent.click(document.querySelector('[data-zona="suelo"][data-nivel="3"]')!);
    expect(E.recursos.riego.suelo).toBe(3);
  });
  it('la manta se pone y el botón lo dice; el microtúnel se arma donde se puede', () => {
    const E = M.crearPartida(2);
    con(E);
    hacer({ tipo: 'ir', modo: 'proteger' });
    fireEvent.click(screen.getAllByText('Manta · 1')[0]);
    expect(screen.getByText('Manta puesta')).toBeTruthy();
    fireEvent.click(document.querySelector('[data-acc="tunel"]')!);
    expect(E.recursos.tunel).toEqual({ [M.zonaDeTunel(E)!]: true });
  });
  it('si no alcanzan los ratos, el aviso lo explica', () => {
    const E = M.crearPartida(2);
    E.recursos.ratosGastados = M.RATOS;
    con(E);
    hacer({ tipo: 'ir', modo: 'proteger' });
    fireEvent.click(screen.getAllByText('Manta · 1')[0]);
    expect(screen.getByRole('alert').textContent).toBe('No te quedan ratos esta década.');
  });
});

describe('los botones que piden confirmación', () => {
  it('después de confirmar, vuelven a preguntar', () => {
    let veces = 0;
    render(
      <Confirmar pregunta="¿Seguro?" alConfirmar={() => veces++}>
        Cargar
      </Confirmar>,
    );
    const boton = screen.getByRole('button');
    fireEvent.click(boton);
    expect(boton.textContent).toBe('¿Seguro?');
    expect(veces).toBe(0);
    fireEvent.click(boton);
    expect(veces).toBe(1);
    expect(boton.textContent).toBe('Cargar');
    fireEvent.click(boton);
    expect(veces).toBe(1);
  });
});
