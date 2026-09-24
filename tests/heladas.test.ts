import { describe, expect, it } from 'vitest';
import { crearPartida, despachar, pasarDecada, type Estado, type ZonaId } from '../src/dominio';

function noche(zona: ZonaId, celda: string, slug: string, tmin: number, prep?: (E: Estado) => void) {
  const E = crearPartida(1, { decInicio: 30 });
  E.sobres[slug] = 5;
  despachar(E, { tipo: 'sembrar', slug, celda });
  const pl = Object.values(E.plantas)[0];
  pl.etapa = zona === 'almacigo' ? 'plantin' : 'creciendo';
  pl.n = 1;
  pl.prog = 30;
  prep?.(E);
  E.prox.real = {
    dec: E.dec,
    tmed: 12,
    tmax: 18,
    tmin,
    lluvia: 10,
    helada: tmin <= 3,
    ola: false,
    estacion: 'primavera',
  };
  const evs = pasarDecada(E);
  return {
    viva: Object.keys(E.plantas).length === 1,
    texto: evs.map((e) => e.texto).join(' | '),
    codigos: evs.map((e) => e.codigo),
    E,
  };
}
const manta = (z: ZonaId) => (E: Estado) => {
  despachar(E, { tipo: 'manta', zona: z });
};

describe('protección contra heladas (el tomate muere con helada)', () => {
  it('sin manta y mín 1 °C muere, y el cuaderno dice que la manta alcanzaba', () => {
    const r = noche('suelo', '0,2', 'tomate', 1);
    expect(r.viva).toBe(false);
    expect(r.texto).toMatch(/Una manta antihelada/);
    expect(r.codigos).toContain('helada.murio');
  });
  it('con manta y mín 1 °C vive, y el cuaderno lo cuenta', () => {
    const r = noche('suelo', '0,2', 'tomate', 1, manta('suelo'));
    expect(r.viva).toBe(true);
    expect(r.texto).toMatch(/se salvaron tomate/);
    expect(r.codigos).toContain('helada.salvadas');
  });
  it('la manta aguanta hasta −1 °C', () => {
    expect(noche('suelo', '0,2', 'tomate', -0.9, manta('suelo')).viva).toBe(true);
  });
  it('con manta y mín −2,5 °C muere, y NO dice que una manta la habría salvado', () => {
    const r = noche('suelo', '0,2', 'tomate', -2.5, manta('suelo'));
    expect(r.viva).toBe(false);
    expect(r.texto).toMatch(/Estaba con manta/);
    expect(r.texto).not.toMatch(/la habría salvado/);
  });
  it('manta + microtúnel aguantan −2,5 °C', () => {
    expect(
      noche('elevado', '0,4', 'tomate', -2.5, (E) => {
        despachar(E, { tipo: 'manta', zona: 'elevado' });
        despachar(E, { tipo: 'tunel' });
      }).viva,
    ).toBe(true);
  });
  it('el microtúnel solo aguanta −1,5 °C', () => {
    expect(
      noche('elevado', '0,4', 'tomate', -1.5, (E) => {
        despachar(E, { tipo: 'tunel' });
      }).viva,
    ).toBe(true);
  });
  it('la almaciguera bajo alero aguanta −1,5 °C pero no −3 °C, salvo con manta', () => {
    expect(noche('almacigo', '0,7', 'tomate', -1.5).viva).toBe(true);
    expect(noche('almacigo', '0,7', 'tomate', -3).viva).toBe(false);
    expect(noche('almacigo', '0,7', 'tomate', -3, manta('almacigo')).viva).toBe(true);
  });
  it('la manta de otro cantero no protege', () => {
    expect(noche('macetas', '6,5', 'tomate', 1, manta('suelo')).viva).toBe(false);
  });
  it('la lechuga tolera la helada sin abrigo', () => {
    expect(noche('suelo', '0,2', 'lechuga', -3).viva).toBe(true);
  });
  it('la manta dura una sola década', () => {
    const E = crearPartida(1, { decInicio: 30 });
    despachar(E, { tipo: 'manta', zona: 'suelo' });
    pasarDecada(E);
    expect(E.manta.suelo).toBeUndefined();
  });
});
