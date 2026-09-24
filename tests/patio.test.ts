/** El patio como dato: todos los patios son válidos y jugables, y las partidas viejas se migran. */
import { describe, expect, it } from 'vitest';
import { validarPatio } from '../datos/juego/patio';
import * as M from '../src/dominio';
import { jugarUnAnio } from '../tools/jugador';
import type { Estado } from '../src/dominio';

const ids = Object.keys(M.PATIOS);

describe('todos los patios', () => {
  it('el patio inicial existe', () => {
    expect(M.PATIOS[M.PATIO_INICIAL]).toBeTruthy();
  });
  for (const id of ids) {
    const p = M.PATIOS[id];
    it(`${id}: está bien armado`, () => {
      expect(validarPatio(p)).toEqual([]);
      expect(p.id).toBe(id);
    });
    it(`${id}: la partida arranca con todas sus celdas, regadas y dentro del plano`, () => {
      const E = M.crearPartida(1, { patio: id });
      expect(E.patio).toBe(id);
      expect(Object.keys(E.riego).sort()).toEqual(p.zonas.map((z) => z.id).sort());
      const total = p.zonas.reduce((n, z) => n + M.celdasDe(E, z.id).length, 0);
      expect(Object.keys(E.celdas).length).toBe(total);
      for (const c in E.celdas) {
        expect(M.zonaDeCelda(E, c)).toBe(E.celdas[c].zona);
        const h = M.horasSol(E, c);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(12);
      }
    });
    it(`${id}: el bot juega un año entero, cosecha algo y el estado sigue siendo JSON`, () => {
      const E = jugarUnAnio(M, 7, undefined, { patio: id }) as Estado;
      expect(E.terminado).toBe(true);
      expect(E.porciones).toBeGreaterThan(0);
      expect(JSON.parse(JSON.stringify(E))).toEqual(E);
      for (const pl of Object.values(E.plantas)) expect(E.celdas[pl.celda].planta).toBe(pl.id);
    });
    it(`${id}: es determinista`, () => {
      expect(jugarUnAnio(M, 11, undefined, { patio: id })).toEqual(jugarUnAnio(M, 11, undefined, { patio: id }));
    });
  }
  it('un patio que no existe no arranca', () => {
    expect(() => M.crearPartida(1, { patio: 'terraza-que-no-hay' })).toThrow();
  });
});

describe('el microtúnel va por zona', () => {
  it('solo se arma donde el patio lo admite', () => {
    const E = M.crearPartida(1);
    expect(M.despachar(E, { tipo: 'tunel', zona: 'suelo' }).ok).toBe(false);
    expect(M.despachar(E, { tipo: 'tunel', zona: 'no-existe' }).ok).toBe(false);
    expect(M.despachar(E, { tipo: 'tunel' }).ok).toBe(true);
    expect(E.tunel).toEqual({ elevado: true });
    expect(M.bajoTunel(E, '0,4')).toBe(true);
    expect(M.bajoTunel(E, '0,1')).toBe(false);
    expect(M.abrigo(E, 'elevado').partes).toEqual(['microtúnel']);
    E.ratosGastados = 0;
    expect(M.despachar(E, { tipo: 'tunel', zona: 'elevado' }).ok).toBe(true);
    expect(E.tunel).toEqual({});
  });
  it('el reparo fijo de cada zona sale de los datos del patio', () => {
    const E = M.crearPartida(1);
    expect(M.abrigo(E, 'almacigo')).toMatchObject({ grados: 5, partes: ['alero y pared'] });
    expect(M.abrigo(E, 'suelo').grados).toBe(0);
    const B = M.crearPartida(1, { patio: 'balcon' });
    expect(M.abrigo(B, 'cajon').grados).toBe(2);
  });
});

describe('migración de partidas guardadas', () => {
  const vieja = (tunel: boolean): any => {
    const E: any = JSON.parse(JSON.stringify(M.crearPartida(3)));
    delete E.patio;
    E.v = 1;
    E.tunel = tunel;
    return E;
  };
  it('una partida v1 pasa a v2 en el fondo, y sigue jugando', () => {
    const E = M.migrar(vieja(true))!;
    expect(E).toBeTruthy();
    expect(E.v).toBe(M.VERSION);
    expect(E.patio).toBe('fondo');
    expect(E.tunel).toEqual({ elevado: true });
    expect(M.despachar(E, { tipo: 'sembrar', slug: 'rabanito', celda: '0,4' }).ok).toBe(true);
    expect(() => M.pasarDecada(E)).not.toThrow();
  });
  it('sin túnel queda sin túnel', () => {
    expect(M.migrar(vieja(false))!.tunel).toEqual({});
  });
  it('una partida v2 pasa a v3: sus plantas ocupan una celda, que es como se jugaron', () => {
    const E: any = JSON.parse(JSON.stringify(M.crearPartida(3)));
    E.v = 2;
    M.despachar(E, { tipo: 'sembrar', slug: 'rabanito', celda: '0,4' });
    const V = M.migrar(E)!;
    expect(V.v).toBe(M.VERSION);
    for (const pl of Object.values(V.plantas)) expect(M.celdasDePlanta(pl)).toEqual([pl.celda]);
    expect(() => M.pasarDecada(V)).not.toThrow();
  });
  it('lo que no es una partida, o es de un patio que ya no existe, no se carga', () => {
    expect(M.migrar(null)).toBeNull();
    expect(M.migrar({ v: 1 })).toBeNull();
    expect(M.migrar('hola')).toBeNull();
    const E: any = JSON.parse(JSON.stringify(M.crearPartida(3)));
    E.patio = 'demolido';
    expect(M.migrar(E)).toBeNull();
    const F: any = JSON.parse(JSON.stringify(M.crearPartida(3)));
    F.v = 99;
    expect(M.migrar(F)).toBeNull();
  });
});

describe('nadie fuera de los datos conoce un patio en particular', () => {
  it('ni el dominio, ni los renderers, ni la interfaz nombran zonas del fondo', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const culpables: string[] = [];
    const dir = 'src';
    for (const f of readdirSync(dir, { recursive: true }) as string[]) {
      if (!/\.tsx?$/.test(f) || f.endsWith('migraciones.ts')) continue; // las migraciones sí saben cómo era la v1
      readFileSync(`${dir}/${f}`, 'utf8')
        .split('\n')
        .forEach((l, i) => {
          if (/['"](almacigo|elevado)['"]|['"]\d+,\d+['"]/.test(l) && !/^\s*(\/\/|\*)/.test(l))
            culpables.push(`${dir}/${f}:${i + 1}`);
        });
    }
    expect(culpables).toEqual([]);
  });
});
