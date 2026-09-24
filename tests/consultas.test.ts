/**
 * Las consultas (src/aplicacion/consultas) son lo único que la vista lee de la partida. Deben
 * describirla con verdad y decidir lo mismo que el dominio.
 */
import { describe, expect, it } from 'vitest';
import * as C from '../src/aplicacion/consultas';
import * as M from '../src/dominio';
import type { Estado } from '../src/dominio';
import { jugarUnAnio } from '../tools/jugador';

const VISTA: C.VistaDeEscena = {
  fantasma: null,
  trasplantando: false,
  seleccion: null,
  zonaCerca: 'suelo',
  camara: 'cenital',
  capa: null,
  animar: null,
};
const partida = (patio = 'fondo'): Estado => jugarUnAnio(M, 4, undefined, { patio, decadas: 12 }) as Estado;

describe('la escena', () => {
  it('tiene todas las celdas, y cada planta se dibuja una vez, en su ancla', () => {
    const E = partida(),
      es = C.escena(E, VISTA);
    expect(Object.keys(es.celdas).sort()).toEqual(Object.keys(E.celdas).sort());
    for (const pl of Object.values(E.plantas))
      for (const k of M.celdasDePlanta(pl)) {
        expect(es.celdas[k].planta!.slug).toBe(pl.slug);
        expect(es.celdas[k].ancla).toBe(k === pl.celda);
      }
  });
  it('el fantasma pinta las celdas libres, salvo la almaciguera cuando se trasplanta', () => {
    const E = partida();
    const conSobre = C.escena(E, { ...VISTA, fantasma: 'lechuga' }),
      trasplantando = C.escena(E, { ...VISTA, fantasma: 'tomate', trasplantando: true });
    for (const k of Object.keys(E.celdas)) {
      const libre = !E.celdas[k].planta,
        cria = !!M.zonaDe(E, k).cria;
      expect(conSobre.celdas[k].tinte !== null).toBe(libre);
      expect(trasplantando.celdas[k].tinte !== null).toBe(libre && !cria);
    }
  });
  it('la cámara de cerca mira la zona de la celda elegida', () => {
    const E = partida(),
      k = M.celdasDe(E, 'elevado')[1];
    expect(C.zonaCerca(E, k, 'suelo')).toBe('elevado');
    expect(C.zonaCerca(E, null, 'suelo')).toBe('suelo');
    expect(C.zonaCerca(E, null, 'no-existe')).toBe(M.zonaDeTunel(E));
    expect(C.escena(E, { ...VISTA, seleccion: k, zonaCerca: 'elevado' }).cerca.col).toBe(M.xy(k).x);
  });
  it('las horas de sol se calculan una vez por década, no en cada pintado', () => {
    const E = partida('balcon'),
      a = C.horasDeSol(E);
    expect(C.horasDeSol(E)).toBe(a);
    M.pasarDecada(E);
    expect(C.horasDeSol(E)).not.toBe(a);
    for (const k of Object.keys(E.celdas)) expect(C.horasDeSol(E)[k]).toBe(M.horasSol(E, k));
  });
});

describe('el HUD y las listas', () => {
  it('un rato por pip, y los libres son los que dice el dominio', () => {
    const E = partida(),
      h = C.hud(E);
    expect(h.ratos.length).toBe(M.RATOS);
    expect(h.ratos.filter((r) => r === 'libre').length).toBe(Math.max(0, M.ratosLibres(E)));
  });
  it('los sobres y el almanaque ponen primero lo que conviene sembrar ahora', () => {
    const E = partida(),
      orden = { ideal: 0, posible: 1, fuera: 2 };
    for (const lista of [C.sobresDisponibles(E), C.almanaque(E, true)])
      for (let i = 1; i < lista.length; i++)
        expect(orden[lista[i].ventana]).toBeGreaterThanOrEqual(orden[lista[i - 1].ventana]);
    expect(C.almanaque(E, true).length).toBe(Object.keys(M.ESPECIES).length);
    expect(C.sobresDisponibles(E).every((x) => x.sobres > 0)).toBe(true);
  });
});

describe('la ficha de una celda decide lo mismo que el dominio', () => {
  it('cada botón que ofrece, el dominio lo permite; y ninguno que el dominio permite falta', () => {
    const E = partida();
    for (const pl of Object.values(E.plantas)) {
      const f = C.fichaDeCelda(E, pl.celda)!.planta!;
      for (const a of ['cosechar', 'semillar', 'ralear', 'tutorar', 'tratar'] as const)
        expect(f.acciones.includes(a), `${pl.slug} ${a}`).toBe(
          M.puede(E, { tipo: a, planta: pl.id }, { sinMirarRatos: true }) === null,
        );
      expect(f.acciones.includes('mover')).toBe(M.puedeMoverse(E, pl) === null);
    }
  });
  it('una celda que no existe no tiene ficha', () => {
    expect(C.fichaDeCelda(partida(), '99,99')).toBeNull();
  });
});
