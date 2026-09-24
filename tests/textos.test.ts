/**
 * Los textos viven fuera de las reglas (src/dominio/textos): cada cosa que el juego anota lleva un
 * código estable que dice qué pasó, así los tests y la interfaz no dependen de la prosa.
 */
import { describe, expect, it } from 'vitest';
import * as M from '../src/dominio';
import { jugarUnAnio } from '../tools/jugador';
import type { Estado } from '../src/dominio';

const CODIGO = /^[a-z]+(\.[a-z-]+)?$/;

describe('todo lo que se anota tiene código', () => {
  for (const patio of Object.keys(M.PATIOS))
    it(`${patio}: el cuaderno y los diarios de un año del bot`, () => {
      const E = jugarUnAnio(M, 3, undefined, { patio }) as Estado;
      const sinCodigo = E.cuaderno.filter((e) => !e.codigo || !CODIGO.test(e.codigo)).map((e) => e.texto);
      expect(sinCodigo).toEqual([]);
      const diarios = Object.values(E.plantas).flatMap((pl) => (pl.hist || []).flatMap((r) => r.n));
      expect(diarios.length).toBeGreaterThan(0);
      expect(diarios.filter((x) => !x[2] || !CODIGO.test(x[2]))).toEqual([]);
    });
  it('los avisos repetidos se juntan en uno y conservan el código', () => {
    const E = M.crearPartida(2);
    for (let i = 0; i < 6; i++) E.sobres.rabanito = 9;
    for (const c of ['0,1', '1,1', '2,1']) M.despachar(E, { tipo: 'sembrar', slug: 'rabanito', celda: c });
    E.riego.suelo = 0;
    E.prox.real = { ...E.prox.real, lluvia: 0, tmax: 30, tmin: 15, tmed: 22, helada: false, ola: false };
    const evs = M.pasarDecada(E);
    const secas = evs.filter((e) => e.codigo === 'germinacion.tierra-seca');
    expect(secas.length).toBe(1);
    expect(secas[0].texto).toMatch(/\(×3\)$/);
  });
});
