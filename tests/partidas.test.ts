/**
 * Guardar y cargar pasa por un puerto (src/aplicacion/partidas.ts) con adaptadores en src/infra.
 * Acá se prueban con un localStorage falso y una nube falsa: sin navegador y sin red.
 */
import { describe, expect, it } from 'vitest';
import { aCodigo, deCodigo, guardar, nombreDeArchivo, nueva, resumenDe } from '../src/aplicacion/partidas';
import * as M from '../src/dominio';
import { autoguardado, ranura } from '../src/infra/dispositivo';
import { conectarNube, type RuntimeDeClaude } from '../src/infra/nube';
import v1 from './fixtures/partida-v1.json';

function storageFalso(lleno = false): () => Storage {
  const datos = new Map<string, string>();
  const s = {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (lleno) throw new Error('QuotaExceededError');
      datos.set(k, v);
    },
    removeItem: (k: string) => datos.delete(k),
    clear: () => datos.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
  return () => s;
}
const reloj = { ahora: () => 1_789_000_000_000 };

describe('en el dispositivo', () => {
  it('el autoguardado guarda, anota la hora y devuelve la misma partida', async () => {
    const E = M.crearPartida(3),
      donde = autoguardado(storageFalso());
    expect(await guardar(E, donde, reloj)).toBe(true);
    expect(E.meta.guardado).toBe(reloj.ahora());
    expect(await donde.cargar()).toEqual(E);
    expect((await donde.mirar())!.t).toBe(reloj.ahora());
  });
  it('cada ranura es independiente, y una vacía no tiene nada', async () => {
    const st = storageFalso(),
      E = M.crearPartida(3);
    await guardar(E, ranura(2, st), reloj);
    expect(await ranura(1, st).cargar()).toBeNull();
    expect((await ranura(2, st).cargar())!.meta.semilla).toBe(3);
    expect(resumenDe((await ranura(2, st).mirar())!)).toMatch(/año 1/);
  });
  it('sin lugar para guardar no rompe nada: avisa que no pudo', async () => {
    expect(await guardar(M.crearPartida(3), autoguardado(storageFalso(true)), reloj)).toBe(false);
  });
  it('una partida vieja guardada se migra al cargarla', async () => {
    const st = storageFalso();
    st().setItem('huertita-v1', JSON.stringify(v1));
    const E = (await autoguardado(st).cargar())!;
    expect(E.meta.v).toBe(M.VERSION);
    expect(E.meta.plantilla).toBe('fondo');
  });
});

describe('el código para llevar la partida a otro lado', () => {
  it('ida y vuelta da la misma partida (con el cuaderno recortado)', () => {
    const E = M.crearPartida(5);
    M.despachar(E, { tipo: 'sembrar', slug: 'lechuga', celda: M.idCelda(0, 4) });
    const vuelta = deCodigo(aCodigo(E))!;
    expect(vuelta).toEqual({ ...E, progreso: { ...E.progreso, cuaderno: E.progreso.cuaderno.slice(-40) } });
  });
  it('acepta también el contenido de un archivo, y rechaza lo que no es una partida', () => {
    const E = M.crearPartida(5);
    expect(deCodigo(JSON.stringify(E))).toEqual(E);
    expect(deCodigo('HUERTITA1:basura')).toBeNull();
    expect(deCodigo('hola')).toBeNull();
    expect(deCodigo('')).toBeNull();
  });
  it('lee los códigos con tildes que armaba la versión anterior', () => {
    const E = M.crearPartida(5);
    const viejo = 'HUERTITA1:' + btoa(unescape(encodeURIComponent(JSON.stringify(E))));
    expect(deCodigo(viejo)).toEqual(E);
  });
  it('el archivo se llama por el año y la fecha del juego', () => {
    expect(nombreDeArchivo(M.crearPartida(5))).toBe('huertita-año1-principios-de-agosto.json');
  });
  it('una partida nueva toma la semilla del reloj', () => {
    expect(nueva('balcon', reloj).meta.plantilla).toBe('balcon');
    expect(nueva('fondo', reloj).meta.semilla).toBe(nueva('fondo', reloj).meta.semilla);
  });
});

describe('en la nube', () => {
  function runtimeFalso(conUsuario = true): RuntimeDeClaude {
    let guardado: { t: number; resumen: string; json: string } | null = null;
    const doc = {
      get: async () => ({ exists: !!guardado, data: () => guardado! }),
      set: async (d: typeof guardado) => void (guardado = d),
    };
    const capacidades: Record<string, unknown> = {
      db: { doc: () => doc },
      user: { id: async () => (conUsuario ? 'u1' : null) },
    };
    return { use: (async (c: string) => capacidades[c] ?? null) as RuntimeDeClaude['use'] };
  }
  it('sin runtime o sin persona, no hay nube', async () => {
    expect(await conectarNube(null)).toBeNull();
    expect(await conectarNube(runtimeFalso(false))).toBeNull();
  });
  it('guarda con su resumen y la trae migrada', async () => {
    const nube = (await conectarNube(runtimeFalso()))!,
      E = M.crearPartida(7);
    expect(await nube.mirar()).toBeNull();
    await guardar(E, nube, reloj);
    expect((await nube.mirar())!.resumen).toMatch(/año 1/);
    expect(await nube.cargar()).toEqual(E);
  });
});
