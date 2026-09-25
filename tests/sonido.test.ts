/**
 * #9: el sonido. Lo que suena de fondo sale del clima de la década; con `prefers-reduced-motion` no
 * hay ambiente continuo; sin Web Audio no hace nada y no rompe.
 */
import { describe, expect, it } from 'vitest';
import { crearParlante, mezcla, SILENCIO } from '../src/sonido';

const decada = { lluvia: 20, estacion: 'primavera', helada: false, ola: false };

describe('la mezcla del ambiente', () => {
  it('con prefers-reduced-motion no hay ambiente continuo', () => {
    expect(mezcla({ ...decada, lluvia: 80, ola: true }, true)).toEqual(SILENCIO);
  });
  it('una década seca no suena a lluvia; una llovedora sí, y más cuanto más llueve', () => {
    expect(mezcla({ ...decada, lluvia: 2 }, false).lluvia).toBe(0);
    const poca = mezcla({ ...decada, lluvia: 20 }, false).lluvia,
      mucha = mezcla({ ...decada, lluvia: 60 }, false).lluvia;
    expect(poca).toBeGreaterThan(0);
    expect(mucha).toBeGreaterThan(poca);
    expect(mezcla({ ...decada, lluvia: 500 }, false).lluvia).toBe(1);
  });
  it('los pájaros cantan más en primavera que en invierno, y se callan con lluvia fuerte o helada', () => {
    const prim = mezcla(decada, false).pajaros!,
      inv = mezcla({ ...decada, estacion: 'invierno' }, false).pajaros!;
    expect(prim).toBeLessThan(inv);
    expect(mezcla({ ...decada, lluvia: 45 }, false).pajaros).toBeNull();
    expect(mezcla({ ...decada, helada: true }, false).pajaros).toBeNull();
  });
  it('las chicharras suenan en la ola de calor, si no llueve', () => {
    expect(mezcla({ ...decada, lluvia: 0, ola: true, estacion: 'verano' }, false).chicharras).toBe(true);
    expect(mezcla({ ...decada, lluvia: 40, ola: true }, false).chicharras).toBe(false);
    expect(mezcla(decada, false).chicharras).toBe(false);
  });
});

describe('el parlante', () => {
  it('sin Web Audio no hace nada y no rompe', () => {
    const p = crearParlante({});
    expect(() => {
      p.prender(true);
      p.sonar('pop');
      p.ambiente(mezcla(decada, false));
      p.prender(false);
    }).not.toThrow();
  });
  it('apagado no abre el audio: el navegador no deja sonar antes de un gesto', () => {
    let abiertos = 0;
    class Contexto {
      constructor() {
        abiertos++;
      }
    }
    const p = crearParlante({ AudioContext: Contexto as unknown as new () => AudioContext });
    p.ambiente(mezcla(decada, false));
    p.sonar('pop');
    expect(abiertos).toBe(0);
  });
});
