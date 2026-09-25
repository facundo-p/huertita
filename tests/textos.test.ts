/**
 * Los textos viven fuera de las reglas (src/dominio/textos): cada cosa que el juego anota lleva un
 * código estable que dice qué pasó, así los tests y la interfaz no dependen de la prosa.
 */
import { describe, expect, it } from 'vitest';
import * as M from '../src/dominio';
import { jugarUnAnio } from '../tools/jugador';
import type { Estado } from '../src/dominio';
import * as TC from '../src/dominio/textos/crecimiento';
import * as TG from '../src/dominio/textos/germinacion';
import * as TH from '../src/dominio/textos/heladas';

const CODIGO = /^[a-z]+(\.[a-z-]+)?$/;

describe('todo lo que se anota tiene código', () => {
  for (const patio of Object.keys(M.PLANTILLAS))
    it(`${patio}: el cuaderno y los diarios de un año del bot`, () => {
      const E = jugarUnAnio(M, 3, undefined, { patio }) as Estado;
      const sinCodigo = E.progreso.cuaderno.filter((e) => !e.codigo || !CODIGO.test(e.codigo)).map((e) => e.texto);
      expect(sinCodigo).toEqual([]);
      const diarios = Object.values(E.mundo.plantas).flatMap((pl) => (pl.hist || []).flatMap((r) => r.n));
      expect(diarios.length).toBeGreaterThan(0);
      expect(diarios.filter((x) => !x[2] || !CODIGO.test(x[2]))).toEqual([]);
    });
  it('los avisos repetidos se juntan en uno y conservan el código', () => {
    const E = M.crearPartida(2);
    for (let i = 0; i < 6; i++) E.recursos.sobres.rabanito = 9;
    for (const c of ['0,1', '1,1', '2,1']) M.despachar(E, { tipo: 'sembrar', slug: 'rabanito', celda: c });
    E.recursos.riego.suelo = 0;
    E.tiempo.clima = { ...E.tiempo.clima, lluvia: 0, tmax: 30, tmin: 15, tmed: 22, helada: false, ola: false };
    const evs = M.pasarDecada(E);
    const secas = evs.filter((e) => e.codigo === 'germinacion.tierra-seca');
    expect(secas.length).toBe(1);
    expect(secas[0].texto).toMatch(/\(×3\)$/);
  });
});

describe('la interfaz reconoce las pérdidas por el código, no por la prosa', () => {
  const sp = M.ESPECIES.tomate;
  it('una planta que murió o una semilla que se perdió es una pérdida', () => {
    expect(M.esPerdida(TC.murio(sp).codigo)).toBe(true);
    expect(M.esPerdida(TH.murio(sp, -2, '').codigo)).toBe(true);
    expect(M.esPerdida(TG.semillaPerdida(sp, 30).codigo)).toBe(true);
  });
  it('lo demás no, aunque hable de secarse', () => {
    expect(M.esPerdida(TC.pasadaSeSeco(sp).codigo)).toBe(false);
    expect(M.esPerdida('germinacion.tierra-seca')).toBe(false);
    expect(M.esPerdida(undefined)).toBe(false);
  });
});
