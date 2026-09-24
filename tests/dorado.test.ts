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
 * Desde la 0.6 el estado guarda en qué patio se juega y el microtúnel por zona, y desde la 0.7 cada planta lleva su diario. El prototipo tenía un
 * solo patio y un solo túnel: para comparar, se lleva el estado nuevo a la forma vieja. Todo lo demás
 * (plantas, suelo, cuaderno, azar) se compara tal cual.
 */
function aFormaV04(E: any): any {
  const { patio, ...resto } = E;
  expect(patio).toBe('fondo');
  const plantas = Object.fromEntries(Object.entries<any>(E.plantas).map(([id, { hist, ...pl }]) => [id, pl])); // el diario por planta es nuevo (0.7) y no cambia ninguna regla
  return { ...resto, plantas, v: 1, tunel: !!E.tunel.elevado };
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
