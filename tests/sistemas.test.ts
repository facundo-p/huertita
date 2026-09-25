/**
 * El paso del tiempo es una tubería de sistemas (src/dominio/sistemas). Su orden es contrato: cada
 * sistema que tira dados consume la secuencia de azar de la partida. Si alguien lo cambia, este test
 * lo dice antes que el dorado, y con nombre y apellido.
 */
import { describe, expect, it } from 'vitest';
import * as M from '../src/dominio';
import { DIAS_POR_TURNO, SISTEMAS_DEL_PATIO, SISTEMAS_POR_PLANTA } from '../src/dominio/sistemas';

describe('la tubería del tiempo', () => {
  it('cada planta pasa por los sistemas en este orden', () => {
    expect(SISTEMAS_POR_PLANTA.map((s) => s.name)).toEqual([
      'germinar',
      'helar',
      'semillarOSecarse',
      'medir',
      'crecer',
      'estresar',
      'plagas',
      'espigar',
      'madurar',
    ]);
  });
  it('después, el patio entero, en este orden', () => {
    expect(SISTEMAS_DEL_PATIO.map((s) => s.name)).toEqual([
      'avisarSalvadas',
      'anotarAvisos',
      'logroDeSocios',
      'suelosYCompost',
      'crecerElJardin',
      'llegaSorpresa',
      'vencerPedidos',
      'anotarAvisos',
      'cerrarTurno',
      'anotarAvisos',
      'pronosticar',
      'anunciarSorpresa',
      'llegaPedido',
      'anotarAvisos',
      'ajustarRiego',
    ]);
  });
  it('un turno son 10 días, y los días están en un solo lugar', () => {
    expect(DIAS_POR_TURNO).toBe(10);
    const E = M.crearPartida(3);
    E.recursos.sobres.rabanito = 3;
    M.despachar(E, { tipo: 'sembrar', slug: 'rabanito', celda: M.idCelda(0, 4) });
    const pl = Object.values(E.mundo.plantas)[0];
    M.pasarDecada(E);
    expect(pl.edad).toBe(DIAS_POR_TURNO);
  });
});
