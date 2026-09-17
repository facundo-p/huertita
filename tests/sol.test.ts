/** Sol por geometría: tiene que portarse como el sol de verdad en el Gran Buenos Aires. */
import { describe, expect, it } from 'vitest';
import type { Patio } from '../datos/juego/patio';
import { horasSolGeometria, posicionSol } from '../src/motor';

const ZONA = { id: 'z', letra: 'z', tipo: 'suelo', nombre: 'Z', conArticulo: 'la z', desc: '', suelo: 'FRANCO_FERTIL', mo: 50, drenaje: 0, hondo: 40, riegoCosto: [0, 1, 2, 3] } as const;
let n = 0;
const patio = (obstaculos: Patio['obstaculos'], horizonte = 0): Patio => ({ id: 'prueba-' + (n++), nombre: '', desc: '', bienvenida: '', celdaM: 0.5, plano: Array(12).fill('zzzzzzzzzzzz'), zonas: [{ ...ZONA, riegoCosto: [0, 1, 2, 3] }], obstaculos, horizonte, sol: 'geometria' });
const VERANO = 36, INVIERNO = 18, EQUINOCCIO = 27; // fines de diciembre, fines de junio, fines de septiembre
const grados = (r: number) => r * 180 / Math.PI;

describe('posición del sol a 34,6° sur', () => {
  it('al mediodía está al norte, alto en verano y bajo en invierno', () => {
    const v = posicionSol(355, 12), i = posicionSol(172, 12);
    expect(v.norte).toBeGreaterThan(0); expect(i.norte).toBeGreaterThan(0); expect(Math.abs(v.este)).toBeLessThan(1e-9);
    expect(grados(Math.asin(v.arriba))).toBeCloseTo(90 - 34.6 + 23.44, 0);
    expect(grados(Math.asin(i.arriba))).toBeCloseTo(90 - 34.6 - 23.44, 0);
  });
  it('sale por el este y se pone por el oeste; en verano sale del lado sur', () => {
    expect(posicionSol(80, 8).este).toBeGreaterThan(0); expect(posicionSol(80, 16).este).toBeLessThan(0);
    expect(posicionSol(355, 5.5).norte).toBeLessThan(0); expect(posicionSol(172, 8).norte).toBeGreaterThan(0);
  });
});

describe('horas de sol', () => {
  it('a cielo abierto: unas 14 h en verano (tope 12), unas 10 en invierno, 12 en el equinoccio', () => {
    const p = patio([]);
    expect(horasSolGeometria(p, 5, 5, VERANO)).toBe(12);
    expect(horasSolGeometria(p, 5, 5, INVIERNO)).toBeGreaterThan(9.5); expect(horasSolGeometria(p, 5, 5, INVIERNO)).toBeLessThan(10.3);
    expect(horasSolGeometria(p, 5, 5, EQUINOCCIO)).toBeGreaterThan(11.5);
  });
  it('el horizonte de casas vecinas recorta más en invierno, que el sol anda bajo', () => {
    const libre = patio([]), barrio = patio([], 15);
    const dInv = horasSolGeometria(libre, 5, 5, INVIERNO) - horasSolGeometria(barrio, 5, 5, INVIERNO);
    expect(dInv).toBeGreaterThan(2.5); expect(horasSolGeometria(barrio, 5, 5, INVIERNO)).toBeGreaterThan(5);
  });
  it('un paredón al NORTE sombrea, y mucho más en invierno; uno al SUR casi nada', () => {
    const norte = patio([{ tipo: 'muro', nombre: 'n', desde: [-20, 0], hasta: [32, 0], alto: 2 }]), sur = patio([{ tipo: 'muro', nombre: 's', desde: [-20, 12], hasta: [32, 12], alto: 2 }]);
    expect(horasSolGeometria(norte, 5, 1, INVIERNO)).toBe(0);
    expect(horasSolGeometria(norte, 5, 1, VERANO)).toBeGreaterThan(6);
    expect(horasSolGeometria(norte, 5, 11, INVIERNO)).toBeGreaterThan(horasSolGeometria(norte, 5, 3, INVIERNO));
    expect(horasSolGeometria(sur, 5, 10, INVIERNO)).toBeGreaterThan(9.5);
  });
  it('la sombra de invierno de un muro de 2 m llega a ~2,9 m al mediodía: a 2 m hay sombra, a 5 m no', () => {
    const p = patio([{ tipo: 'muro', nombre: 'n', desde: [-40, 0], hasta: [52, 0], alto: 2 }]);
    expect(horasSolGeometria(p, 5, 3, INVIERNO)).toBe(0);   // centro a 1,75 m
    expect(horasSolGeometria(p, 5, 10, INVIERNO)).toBeGreaterThan(5); // centro a 5,25 m
  });
  it('un muro al este saca el sol de la mañana y uno al oeste el de la tarde, en espejo', () => {
    const este = patio([{ tipo: 'muro', nombre: 'e', desde: [12, -20], hasta: [12, 32], alto: 3 }]), oeste = patio([{ tipo: 'muro', nombre: 'o', desde: [0, -20], hasta: [0, 32], alto: 3 }]);
    expect(horasSolGeometria(este, 11, 5, EQUINOCCIO)).toBeLessThan(8);
    expect(horasSolGeometria(este, 11, 5, EQUINOCCIO)).toBeCloseTo(horasSolGeometria(oeste, 0, 5, EQUINOCCIO), 0);
  });
  it('un árbol caduco sombrea en verano y deja pasar casi todo en invierno', () => {
    const arbol = (caduco: boolean) => patio([{ tipo: 'arbol', nombre: 'a', en: [6, 3], alto: 7, copa: 6, fuste: 2, caduco }]);
    const caduco = arbol(true), perenne = arbol(false), libre = patio([]);
    expect(horasSolGeometria(caduco, 6, 4, VERANO)).toBeLessThan(horasSolGeometria(libre, 6, 4, VERANO) - 3); // justo al sur del tronco
    expect(horasSolGeometria(perenne, 5, 6, INVIERNO)).toBeLessThan(horasSolGeometria(caduco, 5, 6, INVIERNO));
    expect(horasSolGeometria(caduco, 5, 6, INVIERNO)).toBeGreaterThan(horasSolGeometria(libre, 5, 6, INVIERNO) * 0.65);
  });
  it('un techo (el balcón de arriba) tapa el sol alto del verano y deja entrar el bajo del invierno', () => {
    const p = patio([{ tipo: 'losa', nombre: 'l', desde: [-20, 0], hasta: [32, 12], alto: 2.6 }]);
    const fondoVerano = horasSolGeometria(p, 5, 4, VERANO), fondoInvierno = horasSolGeometria(p, 5, 4, INVIERNO);
    expect(fondoInvierno).toBeGreaterThan(fondoVerano);
    expect(horasSolGeometria(p, 5, 0, VERANO)).toBeGreaterThan(fondoVerano);
  });
  it('una baranda de barrotes sombrea menos que un muro ciego', () => {
    const ciego = patio([{ tipo: 'muro', nombre: 'm', desde: [-20, 0], hasta: [32, 0], alto: 1 }]), barrotes = patio([{ tipo: 'muro', nombre: 'b', desde: [-20, 0], hasta: [32, 0], alto: 1, opacidad: 0.4 }]);
    expect(horasSolGeometria(barrotes, 5, 0, INVIERNO)).toBeGreaterThan(horasSolGeometria(ciego, 5, 0, INVIERNO));
  });
});
