/**
 * Paso 3 de los cimientos: cada planta ocupa lo que ocupa.
 *
 * Las reglas de espacio están apagadas mientras viva el test dorado (ver `src/dominio/espacio.ts`):
 * acá se prenden a propósito con `conEspacioReal` para probarlas, y el primer describe vigila que
 * apagadas el juego siga jugando como antes.
 */
import { describe, expect, it } from 'vitest';
import * as M from '../src/dominio';
import { jugarUnAnio } from '../tools/jugador';
import type { Estado, Planta } from '../src/dominio';

const CELDA_SUELO = '0,1',
  CRIA = '0,7';
const plantaDe = (E: Estado, celda: string): Planta => E.plantas[E.celdas[celda].planta!];
function partida(sobres: Record<string, number> = {}): Estado {
  const E = M.crearPartida(5);
  for (const s in sobres) E.sobres[s] = sobres[s];
  E.ratosGastados = 0;
  return E;
}

describe('el marco de plantación de cada especie', () => {
  it('sale de la distancia entre plantas: 9 rabanitos o 4 lechugas por celda, un tomate, un zapallo cada 4 celdas', () => {
    expect(M.ESPECIES.rabanito.marco).toMatchObject({ huella: 1, porCelda: 9 });
    expect(M.ESPECIES.lechuga.marco).toMatchObject({ huella: 1, porCelda: 4 });
    expect(M.ESPECIES.tomate.marco).toMatchObject({ huella: 1, porCelda: 1 });
    expect(M.ESPECIES.zapallo.marco.huella).toBe(4);
    expect(M.ESPECIES['zapallito-de-tronco'].marco.huella).toBe(2);
  });
  it('todas las especies tienen un marco que se puede jugar', () => {
    for (const slug in M.ESPECIES) {
      const m = M.ESPECIES[slug].marco;
      expect([1, 2, 4], slug).toContain(m.huella);
      expect(m.porCelda, slug).toBeGreaterThanOrEqual(1);
      expect(m.porCelda, slug).toBeLessThanOrEqual(9);
      expect(m.alto, slug).toBeGreaterThan(0);
      if (m.huella > 1) expect(m.porCelda, slug).toBe(1);
    }
  });
  it('el choclo es de los que levantan y el rabanito de los que no', () => {
    expect(M.ESPECIES.choclo.marco.alto).toBeGreaterThan(M.ESPECIES.rabanito.marco.alto * 5);
  });
});

describe('con las reglas de espacio apagadas (como juega hoy)', () => {
  it('un zapallo ocupa una sola celda y el raleo deja una', () => {
    const E = partida({ zapallo: 2 });
    expect(M.despachar(E, { tipo: 'sembrar', slug: 'zapallo', celda: CELDA_SUELO }).ok).toBe(true);
    const pl = plantaDe(E, CELDA_SUELO);
    expect(pl.celdas).toBeUndefined();
    expect(E.celdas['1,1'].planta).toBeNull();
    pl.n = 4;
    pl.etapa = 'creciendo';
    expect(M.despachar(E, { tipo: 'ralear', planta: pl.id }).ok).toBe(true);
    expect(pl.n).toBe(1);
  });
});

describe('con las reglas de espacio prendidas', () => {
  it('un zapallo se lleva cuatro celdas y al sacarlo las devuelve', () =>
    M.conEspacioReal(() => {
      const E = partida({ zapallo: 2 });
      expect(M.despachar(E, { tipo: 'sembrar', slug: 'zapallo', celda: CELDA_SUELO }).ok).toBe(true);
      const pl = plantaDe(E, CELDA_SUELO);
      expect(pl.celdas).toEqual(['0,1', '1,1', '0,2', '1,2']);
      for (const k of pl.celdas!) expect(E.celdas[k].planta).toBe(pl.id);
      expect(M.despachar(E, { tipo: 'arrancar', planta: pl.id }).ok).toBe(true);
      for (const k of ['0,1', '1,1', '0,2', '1,2']) expect(E.celdas[k].planta).toBeNull();
    }));

  it('no se siembra un zapallo donde no entra: ni contra el borde del cantero ni al lado de otra planta', () =>
    M.conEspacioReal(() => {
      const E = partida({ zapallo: 4, lechuga: 4 });
      const alBorde = M.despachar(E, { tipo: 'sembrar', slug: 'zapallo', celda: '5,1' });
      expect(alBorde.ok).toBe(false);
      if (!alBorde.ok) expect(alBorde.error).toMatch(/4 celdas/);
      expect(M.despachar(E, { tipo: 'sembrar', slug: 'lechuga', celda: '3,2' }).ok).toBe(true);
      const tapado = M.despachar(E, { tipo: 'sembrar', slug: 'zapallo', celda: '2,1' });
      expect(tapado.ok).toBe(false);
      if (!tapado.ok) expect(tapado.error).toMatch(/al lado/);
      expect(M.despachar(E, { tipo: 'sembrar', slug: 'zapallo', celda: CELDA_SUELO }).ok).toBe(true);
    }));

  it('en la almaciguera el plantín ocupa una celda: ahí el zapallo entra igual', () =>
    M.conEspacioReal(() => {
      const E = partida({ zapallo: 2 });
      expect(M.despachar(E, { tipo: 'sembrar', slug: 'zapallo', celda: CRIA }).ok).toBe(true);
      expect(plantaDe(E, CRIA).celdas).toBeUndefined();
    }));

  it('la almaciguera cría de a bandeja entera y en tierra se siembra el marco con algo de más', () =>
    M.conEspacioReal(() => {
      const E = partida({ tomate: 2, rabanito: 2 });
      M.despachar(E, { tipo: 'sembrar', slug: 'tomate', celda: CRIA });
      expect(plantaDe(E, CRIA).semillas).toBe(M.zona(E, E.celdas[CRIA].zona).capacidad);
      M.despachar(E, { tipo: 'sembrar', slug: 'rabanito', celda: CELDA_SUELO });
      expect(plantaDe(E, CELDA_SUELO).semillas).toBe(12); // 9 que entran + 3 para ralear
    }));

  it('el raleo deja las que entran en la celda, no una sola', () =>
    M.conEspacioReal(() => {
      const E = partida({ rabanito: 2 });
      M.despachar(E, { tipo: 'sembrar', slug: 'rabanito', celda: CELDA_SUELO });
      const pl = plantaDe(E, CELDA_SUELO);
      pl.n = 12;
      pl.etapa = 'creciendo';
      pl.prog = 20;
      const r = M.despachar(E, { tipo: 'ralear', planta: pl.id });
      expect(r.ok).toBe(true);
      expect(pl.n).toBe(9);
      if (r.ok) expect(r.eventos[0].texto).toMatch(/dejaste las 9 más fuertes y sacaste 3/);
      expect(M.despachar(E, { tipo: 'ralear', planta: pl.id }).ok).toBe(false); // ya entran todas
    }));

  it('una celda llena de rabanitos rinde como lo que hay en ella, y apretados rinden menos', () => {
    const cosechar = (n: number, real: boolean): number => {
      const hacer = (): number => {
        const E = partida({ rabanito: 2 });
        M.despachar(E, { tipo: 'sembrar', slug: 'rabanito', celda: CELDA_SUELO });
        const pl = plantaDe(E, CELDA_SUELO);
        Object.assign(pl, { etapa: 'cosechable', n, salud: 100, reserva: 1, prog: 30 });
        M.despachar(E, { tipo: 'cosechar', planta: pl.id });
        return E.porciones;
      };
      return real ? M.conEspacioReal(hacer) : hacer();
    };
    expect(cosechar(1, true)).toBe(2);
    expect(cosechar(9, true)).toBe(18);
    expect(cosechar(12, true)).toBeCloseTo(12.6, 5); // nueve de nueve, y todas apretadas
    expect(cosechar(9, false)).toBe(1.4); // apagado: una sola planta y penalización por no ralear
  });

  it('una planta alta le hace sombra a las celdas de al lado', () => {
    // En el balcón el sol del mediodía ya lo tapa la losa de arriba: lo que le queda a cada maceta
    // es el sol bajo de la mañana y de la tarde, y ahí un choclo hecho tapa a su vecina.
    // (La sombra clásica del choclo sobre lo que tiene al sur va a verse en el fondo el día que ese
    // patio pase a sol por geometría: hoy sigue con la fórmula del prototipo. Ver #31.)
    const E = M.crearPartida(1, { patio: 'balcon' });
    E.sobres.choclo = 2;
    E.ratosGastados = 0;
    M.conEspacioReal(() => {
      expect(M.despachar(E, { tipo: 'sembrar', slug: 'choclo', celda: '1,1' }).ok).toBe(true);
    });
    const pl = plantaDe(E, '1,1'),
      vecina = '0,1';
    Object.assign(pl, { etapa: 'creciendo', prog: M.objetivoCosecha(M.ESPECIES.choclo) });
    const sinChoclo = M.horasSol(E, vecina, 4),
      conChoclo = M.conEspacioReal(() => M.horasSol(E, vecina, 4));
    expect(sinChoclo).toBeGreaterThan(5);
    expect(conChoclo).toBeLessThan(sinChoclo / 2);
    // la sombra es la del choclo hecho: recién nacido casi no tapa
    pl.prog = 1;
    expect(M.conEspacioReal(() => M.horasSol(E, vecina, 4))).toBeGreaterThan(conChoclo);
    // y una planta no se hace sombra a sí misma
    pl.prog = M.objetivoCosecha(M.ESPECIES.choclo);
    expect(M.conEspacioReal(() => M.horasSol(E, '1,1', 4))).toBe(M.horasSol(E, '1,1', 4));
  });

  it('el bot juega un año entero con el espacio prendido y el estado sigue siendo JSON', () =>
    M.conEspacioReal(() => {
      const E = jugarUnAnio(M, 7) as Estado;
      expect(E.terminado).toBe(true);
      expect(E.porciones).toBeGreaterThan(0);
      expect(JSON.parse(JSON.stringify(E))).toEqual(E);
      for (const pl of Object.values(E.plantas))
        for (const k of M.celdasDePlanta(pl)) expect(E.celdas[k].planta).toBe(pl.id);
    }));

  it('es determinista', () => {
    const uno = M.conEspacioReal(() => jugarUnAnio(M, 11)),
      dos = M.conEspacioReal(() => jugarUnAnio(M, 11));
    expect(uno).toEqual(dos);
  });
});
