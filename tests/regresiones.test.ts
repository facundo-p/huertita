/** Bugs del prototipo que el tipado estricto sacó a la luz. Cada uno queda clavado con un test. */
import { describe, expect, it } from 'vitest';
import { ESPECIES, crearPartida, despachar, factoresPlanta, pasarDecada } from '../src/dominio';

describe('huecos de temperatura en huertapp', () => {
  it('una especie sin máxima de germinación (girasol) igual puede germinar', () => {
    // en el prototipo, `t > null` era `t > 0`: nunca germinaba
    expect(ESPECIES.girasol.tg.max).toBeGreaterThan(25);
    expect(ESPECIES.girasol.sup).toContain('germinación: máxima');
  });
  it('una especie sin calor máximo tolerado (romero) no sufre calor a 20 °C', () => {
    const E = crearPartida(2, { decInicio: 30 });
    E.sobres.romero = 1;
    despachar(E, { tipo: 'sembrar', slug: 'romero', celda: '6,5' });
    const pl = Object.values(E.plantas)[0];
    pl.etapa = 'creciendo';
    pl.n = 1;
    pl.prog = 40;
    E.prox.real = { dec: 30, tmed: 16, tmax: 20, tmin: 9, lluvia: 5, helada: false, ola: false, estacion: 'primavera' };
    expect(
      pasarDecada(E)
        .map((e) => e.texto)
        .join(' '),
    ).not.toMatch(/sufrió el calor/);
  });
});
describe('exceso de riego', () => {
  it('regar "constante" un romero lo daña (en el prototipo nunca pasaba)', () => {
    const E = crearPartida(2, { decInicio: 30 });
    E.sobres.romero = 1;
    despachar(E, { tipo: 'sembrar', slug: 'romero', celda: '0,2' });
    const pl = Object.values(E.plantas)[0];
    pl.etapa = 'creciendo';
    pl.n = 1;
    pl.prog = 40;
    E.riego.suelo = 3;
    E.prox.real = {
      dec: 30,
      tmed: 16,
      tmax: 20,
      tmin: 9,
      lluvia: 60,
      helada: false,
      ola: false,
      estacion: 'primavera',
    };
    expect(factoresPlanta(E, pl).agua.estado).toBe('exceso');
    expect(
      pasarDecada(E)
        .map((e) => e.texto)
        .join(' '),
    ).toMatch(/exceso de agua/);
    expect(pl.salud).toBeLessThan(100);
  });
});
