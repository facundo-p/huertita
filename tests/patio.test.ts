/** El patio como dato: todos los patios son válidos y jugables, y las partidas viejas se migran. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validarPatio } from '../datos/juego/patio';
import { REGLAS } from '../datos/juego/reglas';
import * as M from '../src/dominio';
import { jugarUnAnio } from '../tools/jugador';
import type { Estado } from '../src/dominio';

const ids = Object.keys(M.PLANTILLAS);

describe('todos los patios', () => {
  it('el patio inicial existe', () => {
    expect(M.PLANTILLAS[M.PLANTILLA_INICIAL]).toBeTruthy();
  });
  for (const id of ids) {
    const p = M.PLANTILLAS[id];
    it(`${id}: está bien armado`, () => {
      expect(validarPatio(p)).toEqual([]);
      expect(p.id).toBe(id);
    });
    it(`${id}: la partida arranca con todas sus celdas, regadas y dentro del plano`, () => {
      const E = M.crearPartida(1, { patio: id });
      expect(E.meta.plantilla).toBe(id);
      expect(E.mundo.patio).toEqual(p);
      expect(E.mundo.patio).not.toBe(p);
      expect(Object.keys(E.recursos.riego).sort()).toEqual(p.zonas.map((z) => z.id).sort());
      const total = p.zonas.reduce((n, z) => n + M.celdasDe(E, z.id).length, 0);
      expect(Object.keys(E.mundo.celdas).length).toBe(total);
      for (const c in E.mundo.celdas) {
        expect(M.zonaDeCelda(E, c)).toBe(E.mundo.celdas[c].zona);
        const h = M.horasSol(E, c);
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(12);
      }
    });
    it(`${id}: el bot juega un año entero, cosecha algo y el estado sigue siendo JSON`, () => {
      const E = jugarUnAnio(M, 7, undefined, { patio: id }) as Estado;
      expect(E.tiempo.terminado).toBe(true);
      expect(E.progreso.porciones).toBeGreaterThan(0);
      expect(JSON.parse(JSON.stringify(E))).toEqual(E);
      for (const pl of Object.values(E.mundo.plantas)) expect(E.mundo.celdas[pl.celda].planta).toBe(pl.id);
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
    expect(E.recursos.tunel).toEqual({ elevado: true });
    expect(M.bajoTunel(E, '0,4')).toBe(true);
    expect(M.bajoTunel(E, '0,1')).toBe(false);
    expect(M.abrigo(E, 'elevado').partes).toEqual(['microtúnel']);
    E.recursos.ratosGastados = 0;
    expect(M.despachar(E, { tipo: 'tunel', zona: 'elevado' }).ok).toBe(true);
    expect(E.recursos.tunel).toEqual({});
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
  /** Partidas guardadas de verdad, con el motor de cada versión (ver tests/fixtures/). */
  const guardada = (nombre: string): any => JSON.parse(readFileSync(`tests/fixtures/${nombre}.json`, 'utf8'));
  it.each(['partida-v1', 'partida-v2-fondo', 'partida-v3-fondo', 'partida-v3-balcon'])(
    '%s migra a la versión de hoy y sigue jugando',
    (nombre) => {
      const vieja = guardada(nombre),
        E = M.migrar(guardada(nombre))!;
      expect(E).toBeTruthy();
      expect(E.meta.v).toBe(M.VERSION);
      expect(E.meta.plantilla).toBe(vieja.patio ?? 'fondo');
      expect(E.meta.semilla).toBe(vieja.semilla);
      expect(E.tiempo.dec).toBe(vieja.dec);
      expect(E.mundo.patio).toEqual(M.PLANTILLAS[E.meta.plantilla]);
      expect(Object.keys(E.mundo.plantas)).toEqual(Object.keys(vieja.plantas));
      // lo que había en la compostera se toma como bien tapado: dos secos por cada verde
      expect(M.compostera(E)).toMatchObject({
        dosis: vieja.compost.dosis,
        verdes: vieja.compost.carga,
        secos: vieja.compost.carga * 2,
      });
      expect(M.compostera(E)!.tandas).toEqual(vieja.compost.tandas.map((t: any) => ({ ...t, mezcla: 'pareja' })));
      for (let i = 0; i < 12; i++) M.pasarDecada(E);
      expect(M.esPartidaValida(JSON.parse(JSON.stringify(E)))).toBe(true);
    },
  );
  it('el microtúnel de la v1 era un sí o un no: pasa a la zona elevada', () => {
    const conTunel = { ...guardada('partida-v1'), tunel: true };
    expect(M.migrar(conTunel)!.recursos.tunel).toEqual({ elevado: true });
    expect(M.migrar(guardada('partida-v1'))!.recursos.tunel).toEqual({});
  });
  it('las plantas de la v2 ocupan una celda, que es como se jugaron', () => {
    const E = M.migrar(guardada('partida-v2-fondo'))!;
    for (const pl of Object.values(E.mundo.plantas)) expect(M.celdasDePlanta(pl)).toEqual([pl.celda]);
  });
  it.each(['partida-v4-fondo', 'partida-v4-balcon'])('%s gana jardín y bolsa de secos y sigue jugando', (nombre) => {
    const vieja = guardada(nombre),
      E = M.migrar(guardada(nombre))!;
    expect(E.meta.v).toBe(M.VERSION);
    expect(E.mundo.patio).toEqual(M.PLANTILLAS[E.meta.plantilla]);
    expect(Object.keys(E.mundo.plantas)).toEqual(Object.keys(vieja.mundo.plantas));
    const k = vieja.mundo.estructuras[0];
    expect(M.compostera(E)).toEqual({
      tipo: 'compostera',
      en: k.en,
      verdes: k.carga,
      secos: k.carga * 2,
      tandas: k.tandas.map((t: any) => ({ avance: t.avance, mezcla: 'pareja' })),
      dosis: k.dosis,
    });
    expect(E.recursos.secos).toBe(REGLAS.jardin.bolsaInicial);
    expect(E.mundo.jardin).toEqual(M.jardinInicial(E.mundo.patio, E.tiempo.dec));
    for (let i = 0; i < 12; i++) M.pasarDecada(E);
    expect(M.esPartidaValida(JSON.parse(JSON.stringify(E)))).toBe(true);
  });
  it('una partida de hoy pasa tal cual', () => {
    const E = M.crearPartida(3);
    expect(M.migrar(JSON.parse(JSON.stringify(E)))).toEqual(E);
  });
  it('lo que no es una partida, o es de un patio que ya no existe, no se carga', () => {
    expect(M.migrar(null)).toBeNull();
    expect(M.migrar({ v: 1 })).toBeNull();
    expect(M.migrar('hola')).toBeNull();
    expect(M.migrar({ ...guardada('partida-v3-fondo'), patio: 'demolido' })).toBeNull();
    expect(M.migrar({ ...guardada('partida-v3-fondo'), v: 99 })).toBeNull();
    const E: any = JSON.parse(JSON.stringify(M.crearPartida(3)));
    E.meta.v = 99;
    expect(M.migrar(E)).toBeNull();
    const F: any = JSON.parse(JSON.stringify(M.crearPartida(3)));
    F.mundo.patio.plano = [];
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
