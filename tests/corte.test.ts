/**
 * El corte de suelo de la cámara de cerca: se pinta entero (ningún píxel queda sin color) en todas las
 * zonas de todos los patios, y su clave cambia con lo que cambia el dibujo y con nada más.
 */
import { describe, expect, it } from 'vitest';
import { escena } from '../src/aplicacion/consultas/escena';
import * as M from '../src/dominio';
import { cerca } from '../src/render/pixel/camaras/cerca';
import { claveDelCorte, superficieDelCorte } from '../src/render/pixel/corte';
import { anchoDeLetras } from '../src/render/pixel/letras';
import { Superficie } from '../src/render/pixel/superficie';

const vista = (zonaCerca: string) => ({
  fantasma: null,
  trasplantando: false,
  seleccion: null,
  zonaCerca,
  camara: 'cerca',
  capa: null,
  animar: null,
});

describe('el corte de suelo', () => {
  for (const patio of ['fondo', 'balcon'])
    it(`se pinta entero en cada zona del patio ${patio}`, () => {
      const E = M.crearPartida(3, { patio });
      for (const z of M.zonasDe(E)) {
        const es = escena(E, vista(z.id)),
          s = superficieDelCorte(es, cerca.geometria(es));
        expect(
          s.datos.every((p) => p >>> 24 === 255),
          `${patio}/${z.id}`,
        ).toBe(true);
      }
    });

  it('la clave cambia con la humedad y con el mantillo, y no con el resto', () => {
    const E = M.crearPartida(3),
      z = M.zonasDe(E).find((x) => x.tipo === 'cajon') ?? M.zonasDe(E)[0],
      es = escena(E, vista(z.id)),
      G = cerca.geometria(es),
      k0 = claveDelCorte(es, G),
      celda = Object.keys(es.celdas).find((k) => G.celda(k))!;
    expect(claveDelCorte(JSON.parse(JSON.stringify(es)), G)).toBe(k0);
    const seca = JSON.parse(JSON.stringify(es));
    seca.celdas[celda].humedo = (es.celdas[celda].humedo + 1) % 4;
    expect(claveDelCorte(seca, G)).not.toBe(k0);
    const conMantillo = JSON.parse(JSON.stringify(es));
    conMantillo.celdas[celda].mulch = !es.celdas[celda].mulch;
    expect(claveDelCorte(conMantillo, G)).not.toBe(k0);
    const otraSeleccion = JSON.parse(JSON.stringify(es));
    otraSeleccion.celdas[celda].seleccion = !es.celdas[celda].seleccion;
    expect(claveDelCorte(otraSeleccion, G)).toBe(k0);
  });
});

describe('la superficie de píxeles', () => {
  it('mezcla un color transparente con lo que hay y escribe los opacos', () => {
    const s = new Superficie(2, 2);
    s.px(1, 1, '#ff0000');
    expect(s.leer(1, 1)).toBe('#ff0000');
    s.px(1, 1, 'rgba(0,0,255,0.5)');
    expect(s.leer(1, 1)).toBe('#800080');
  });
  it('el ancho de un texto crece con las letras', () => {
    expect(anchoDeLetras('15')).toBeGreaterThan(anchoDeLetras('1'));
    expect(anchoDeLetras('')).toBe(0);
  });
});
