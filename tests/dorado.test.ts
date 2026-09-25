/**
 * Test dorado: el bot juega un año entero con 8 semillas en cada patio y el resultado tiene que ser
 * EXACTAMENTE el de la foto guardada (`tests/fixtures/dorado.json`): el balance y una huella del
 * estado final. Mientras esté verde, mover código es seguro. Cuando una regla cambia a propósito, la
 * foto se regenera con `npm run dorado -- --guardar` y el diff (qué partidas cambiaron y cuánto) va
 * en el PR, con el cambio anotado en el CHANGELOG.
 *
 * Hasta la 0.9 el dorado comparaba contra el motor del prototipo v0.4; se jubiló en la 0.10 (#68),
 * cuando el compost, los eventos y los pedidos cambiaron reglas a propósito.
 */
import { describe, expect, it } from 'vitest';
import * as M from '../src/dominio';
import { canon, foto, guardada, SEMILLAS } from '../tools/dorado';
import { jugarUnAnio } from '../tools/jugador';

describe('el dominio juega como en la foto dorada', () => {
  for (const f of guardada())
    it(`${f.patio}, semilla ${f.semilla}`, () => {
      expect(foto(f.patio, f.semilla)).toEqual(f);
    });
  it('la foto cubre todos los patios con todas las semillas: sumar un patio obliga a regenerarla', () => {
    const tiene = guardada()
      .map((f) => f.patio + ':' + f.semilla)
      .sort();
    const deberia = Object.keys(M.PLANTILLAS)
      .flatMap((p) => SEMILLAS.map((s) => p + ':' + s))
      .sort();
    expect(tiene).toEqual(deberia);
  });
  it('es determinista: misma semilla, misma partida', () => {
    expect(canon(jugarUnAnio(M, 5))).toBe(canon(jugarUnAnio(M, 5)));
  });
  it('el estado es JSON puro', () => {
    const E = jugarUnAnio(M, 3);
    expect(canon(JSON.parse(JSON.stringify(E)))).toBe(canon(E));
  });
});
