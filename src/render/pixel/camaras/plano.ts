/**
 * Lo que comparten las dos cámaras que miran el patio entero: desde arriba (cenital) y desde la
 * galería mirando al norte (oblicua), que achata las filas y levanta el paredón.
 */
import type { CeldaDeEscena, Escena } from '../../contrato';
import type { CeldaEnPantalla, ComoSeVenLasPlantas, Geometria } from '../geometria';
import { xyDe } from '../geometria';
import { T } from '../paleta';

export interface GeometriaPlana extends Geometria {
  obl: boolean;
  /** alto de una fila */
  TH: number;
  /** alto del paredón norte */
  muro: number;
  /** dónde empieza y cuánto mide cada fila */
  fy(y: number): number;
  fh(y: number): number;
}

function plantas(obl: boolean): ComoSeVenLasPlantas {
  return {
    sombra: true,
    avisoDePlaga: true,
    alturaDeFlecha: 1,
    bandeja: { paso: 5, escala: 0.7 },
    numeroAbajo: false,
    apoyo(c: CeldaDeEscena, q: CeldaEnPantalla) {
      if (c.tipo !== 'macetas') return q.by;
      return obl ? q.by - 1 : q.by - 9;
    },
    chica: (c) => c.tipo === 'almaciguera',
    bruma: false,
  };
}

export function geometriaPlana(es: Escena, obl: boolean): GeometriaPlana {
  const TH = obl ? 22 : T,
    muro = obl ? 60 : T,
    pie = obl ? 26 : T;
  const fy = (y: number): number => (y === 0 ? 0 : muro + (y - 1) * TH);
  function fh(y: number): number {
    if (y === 0) return muro;
    return y === es.alto - 1 ? pie : TH;
  }
  return {
    cam: obl ? 'oblicua' : 'cenital',
    W: es.ancho * T,
    H: muro + (es.alto - 2) * TH + pie,
    obl,
    TH,
    muro,
    fy,
    fh,
    celda(k) {
      const [x, y] = xyDe(k);
      return { x: x * T, y: fy(y), w: T, h: fh(y), bx: x * T + T / 2, by: fy(y) + fh(y) - (obl ? 4 : 3), s: 1 };
    },
    hit(px, py) {
      const x = Math.floor(px / T);
      for (let y = 0; y < es.alto; y++) if (py >= fy(y) && py < fy(y) + fh(y)) return x + ',' + y;
      return null;
    },
    marco: (q) => ({ x: q.x, y: q.y, w: q.w, h: q.h }),
    plantas: plantas(obl),
    humo: true,
  };
}
