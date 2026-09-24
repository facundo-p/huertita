/** El diario de cada planta tiene que explicar, con verdad, por qué tiene la salud que tiene. */
import { describe, expect, it } from 'vitest';
import * as M from '../src/dominio';
import { jugarUnAnio } from '../tools/jugador';
import type { Estado, Planta } from '../src/dominio';

const textos = (pl: Planta): string => (pl.hist || []).flatMap((r) => r.n.map((x) => x[1])).join(' | ');
function sembrada(slug: string, celda: string): { E: Estado; pl: Planta } {
  const E = M.crearPartida(4, { decInicio: 30 });
  E.sobres[slug] = 5;
  expect(M.despachar(E, { tipo: 'sembrar', slug, celda }).ok).toBe(true);
  return { E, pl: M.plantaEn(E, celda)! };
}
function crecida(slug: string, celda: string): { E: Estado; pl: Planta } {
  const r = sembrada(slug, celda);
  Object.assign(r.pl, { etapa: 'creciendo', n: 1, prog: 30, edad: 30 });
  return r;
}

describe('diario por planta', () => {
  it('arranca con la siembra', () => {
    const { pl } = sembrada('lechuga', '0,4');
    expect(textos(pl)).toMatch(/Sembraste lechuga/);
    expect(pl.hist![0].s).toBe(100);
  });
  it('si pierde salud por sed sin que haya aviso general, el diario igual lo dice', () => {
    const { E, pl } = crecida('lechuga', '0,4');
    E.riego.elevado = 1;
    E.prox.real = { ...E.prox.real, lluvia: 0, tmax: 26, tmin: 14, tmed: 20, helada: false, ola: false };
    const antes = pl.salud;
    M.pasarDecada(E);
    expect(pl.salud).toBeLessThan(antes);
    expect(textos(pl)).toMatch(/faltó agua|pasa sed/);
    expect(pl.hist![pl.hist!.length - 1].s).toBe(Math.round(pl.salud));
  });
  it('una plaga sin tratar queda anotada cada década, y tratarla también', () => {
    const { E, pl } = crecida('lechuga', '0,4');
    pl.plaga = 'pulgon';
    E.riego.elevado = 2;
    M.pasarDecada(E);
    expect(textos(pl)).toMatch(/Sigue con pulgones/);
    E.ratosGastados = 0;
    expect(M.despachar(E, { tipo: 'tratar', planta: pl.id }).ok).toBe(true);
    expect(pl.hist![pl.hist!.length - 1].n.some((x) => x[0] === 'bien')).toBe(true);
  });
  it('toda baja de salud de un año entero tiene una explicación en el diario de esa planta', () => {
    const E = M.crearPartida(6),
      sinExplicar: string[] = [];
    const salud: Record<string, number> = {};
    for (let t = 0; t < 36; t++) {
      for (const pl of Object.values(E.plantas)) salud[pl.id] = pl.salud;
      M.pasarDecada(E);
      for (const pl of Object.values(E.plantas)) {
        if (salud[pl.id] == null || pl.salud >= salud[pl.id] - 0.5) continue;
        const r = pl.hist?.[pl.hist.length - 1];
        if (!r || (r.turno !== E.turno - 1 && r.turno !== E.turno) || !r.n.some((x) => x[0] === 'mal'))
          sinExplicar.push(`${pl.slug} década ${E.dec}: ${salud[pl.id]} → ${pl.salud}`);
      }
      // siembra algo cada tanto para que haya plantas
      if (t % 3 === 0)
        for (const slug of ['lechuga', 'rabanito', 'acelga', 'tomate'])
          for (const c of Object.keys(E.celdas))
            if (!E.celdas[c].planta && E.sobres[slug] > 0 && M.ratosLibres(E) > 0) {
              M.despachar(E, { tipo: 'sembrar', slug, celda: c });
              break;
            }
    }
    expect(sinExplicar).toEqual([]);
  });
  it('el plantín repicado se lleva la historia del almácigo', () => {
    const E = jugarUnAnio(M, 3) as Estado;
    const trasplantadas = Object.values(E.plantas).filter((pl) => /Trasplantaste/.test(textos(pl)));
    expect(trasplantadas.length).toBeGreaterThan(0);
    for (const pl of trasplantadas) if ((pl.hist || []).length < 16) expect(textos(pl)).toMatch(/Sembraste/);
  });
  it('no crece sin límite y sigue siendo JSON', () => {
    const E = jugarUnAnio(M, 2) as Estado;
    for (const pl of Object.values(E.plantas)) expect((pl.hist || []).length).toBeLessThanOrEqual(16);
    expect(JSON.parse(JSON.stringify(E))).toEqual(E);
  });
});

describe('punto de trasplante', () => {
  it('chico → listo → pasado según los días de crecimiento que pide la especie', () => {
    const { pl } = sembrada('tomate', '0,7');
    const dt = M.ESPECIES.tomate.dt!;
    expect(M.puntoDeTrasplante(pl)).toBeNull(); // todavía es semilla
    Object.assign(pl, { etapa: 'plantin', n: 3, prog: dt.min - 5 });
    expect(M.puntoDeTrasplante(pl)).toMatchObject({ punto: 'chico', faltan: 5 });
    pl.prog = dt.min;
    expect(M.puntoDeTrasplante(pl)!.punto).toBe('listo');
    pl.prog = dt.max;
    expect(M.puntoDeTrasplante(pl)!.punto).toBe('pasado');
  });
});
