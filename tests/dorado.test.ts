/**
 * Test dorado: el motor nuevo (TypeScript, en módulos) tiene que jugar EXACTAMENTE igual que
 * el motor del prototipo v0.4, acción por acción y decimal por decimal. Mientras esté verde,
 * refactorizar es seguro. Cuando una regla cambie a propósito, este test se jubila o se
 * regenera, y el cambio queda escrito en CHANGELOG.
 */
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import * as Nuevo from '../src/dominio';
import { jugarUnAnio, type MotorJugable } from '../tools/jugador';

(globalThis as any).Huertita = { DATOS: { meta: Nuevo.META, especies: Nuevo.ESPECIES } }; // mismos datos para los dos
const Viejo = createRequire(import.meta.url)('./legado/motor-v04.cjs') as MotorJugable;

const canon = (v: unknown): string =>
  JSON.stringify(v, (_k, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1)))
      : x,
  );

/**
 * El estado nuevo tiene otra forma: desde la 0.6 guarda el patio y el microtúnel por zona, desde la 0.7
 * cada planta lleva su diario, desde la 0.9 cada frase su código y el estado va en cinco partes (v4),
 * con el patio copiado adentro y la compostera como estructura. El prototipo tenía un solo patio, un
 * solo túnel y todo suelto: para comparar, se lleva el estado nuevo a la forma vieja. Todo lo demás
 * (plantas, suelo, cuaderno, azar) se compara tal cual.
 */
function aFormaV04(E: any): any {
  const { meta, mundo, tiempo, recursos, progreso } = E;
  expect(meta.plantilla).toBe('fondo');
  expect(mundo.estructuras).toHaveLength(1);
  const { carga, tandas, dosis } = mundo.estructuras[0];
  const plantas = Object.fromEntries(Object.entries<any>(mundo.plantas).map(([id, { hist, ...pl }]) => [id, pl])); // el diario por planta es nuevo (0.7) y no cambia ninguna regla
  const cuaderno = progreso.cuaderno.map(({ codigo, ...e }: any) => e); // el código de cada frase es nuevo (0.9) y no cambia ninguna regla
  const { clima, pronostico, ...reloj } = tiempo;
  return {
    v: 1,
    semilla: meta.semilla,
    rng: meta.rng,
    ...reloj,
    ...recursos,
    tunel: !!recursos.tunel.elevado,
    ...progreso,
    cuaderno,
    celdas: mundo.celdas,
    plantas,
    compost: { dosis, carga, tandas },
    prox: { real: clima, pron: pronostico },
  };
}

describe('el motor en TypeScript juega igual que el prototipo', () => {
  for (const semilla of [1, 2, 3, 4, 5, 6, 7, 8]) {
    it(`semilla ${semilla}: un año entero, estado final idéntico`, () => {
      const a = jugarUnAnio(Viejo, semilla),
        b = aFormaV04(jugarUnAnio(Nuevo, semilla));
      expect(b.cuaderno.map((e: any) => e.texto)).toEqual(a.cuaderno.map((e: any) => e.texto));
      expect(canon(b)).toBe(canon(a));
    });
  }
  it('es determinista: misma semilla, misma partida', () => {
    expect(canon(jugarUnAnio(Nuevo, 5))).toBe(canon(jugarUnAnio(Nuevo, 5)));
  });
  it('el estado es JSON puro', () => {
    const E = jugarUnAnio(Nuevo, 3);
    expect(canon(JSON.parse(JSON.stringify(E)))).toBe(canon(E));
  });
});
