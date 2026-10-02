/**
 * Cámara de cerca: un cantero de frente, con el suelo cortado para ver las raíces. Muestra hasta
 * cuatro columnas de la zona elegida (`escena.cerca`) y, si la zona tiene más de una hilera, la de
 * atrás más arriba y la del frente con su corte.
 */
import { pincel } from '../../../arte';
import type { CeldaDeEscena, Escena } from '../../contrato';
import { CORTE, fondoDelCorte } from '../corte';
import type { CeldaEnPantalla, Geometria } from '../geometria';
import { xyDe } from '../geometria';
import type { Camara } from './tipos';

export interface GeometriaCerca extends Geometria {
  cols: number[];
  filas: number[];
  /** ancho de una columna */
  cw: number;
  x0: number;
  zona: string;
  tipo: string;
  /** hay más columnas a un lado, fuera de la vista */
  masIzq: boolean;
  masDer: boolean;
}

const ANCHO = CORTE.ancho,
  COLUMNA = 60,
  Y_FRENTE = CORTE.yFrente,
  Y_ATRAS = CORTE.yAtras;

/** Las columnas y filas de la zona, ordenadas. */
function grilla(es: Escena): { xs: number[]; ys: number[] } {
  const xs: number[] = [],
    ys: number[] = [];
  Object.keys(es.celdas)
    .filter((k) => es.celdas[k].zona === es.cerca.zona)
    .forEach((k) => {
      const [x, y] = xyDe(k);
      if (xs.indexOf(x) < 0) xs.push(x);
      if (ys.indexOf(y) < 0) ys.push(y);
    });
  xs.sort((a, b) => a - b);
  ys.sort((a, b) => a - b);
  return { xs, ys };
}

/** Dónde apoya la planta: la almaciguera y las macetas la sostienen en su contenedor. */
function apoyoEnContenedor(tipo: string, frente: boolean): number {
  if (tipo === 'almaciguera') return 137;
  if (tipo === 'macetas') return frente ? 168 : 126;
  return frente ? Y_FRENTE : Y_ATRAS;
}

function geometria(es: Escena): GeometriaCerca {
  const { xs, ys } = grilla(es),
    col = es.cerca.col;
  let i0 = Math.max(0, Math.min(xs.length - 4, xs.indexOf(col ?? NaN) - 1));
  if (col == null || xs.indexOf(col) < 0) i0 = 0;
  const cols = xs.slice(i0, i0 + 4),
    x0 = Math.round((ANCHO - cols.length * COLUMNA) / 2),
    zona = es.cerca.zona,
    tipo = es.cerca.tipo;
  return {
    cam: 'cerca',
    /** la vista es una ventana de 4 columnas de ancho fijo, venga el patio que venga */
    W: ANCHO,
    H: ANCHO,
    cols,
    filas: ys,
    cw: COLUMNA,
    x0,
    zona,
    tipo,
    masIzq: i0 > 0,
    masDer: i0 + 4 < xs.length,
    celda(k) {
      const [x, y] = xyDe(k),
        ci = cols.indexOf(x),
        fi = ys.indexOf(y);
      if (ci < 0 || fi < 0 || es.celdas[k].zona !== zona) return null;
      const frente = fi === ys.length - 1;
      // en el corte no hay recuadro de celda: y y h no se usan
      return {
        x: x0 + ci * COLUMNA,
        y: 0,
        w: COLUMNA,
        h: 0,
        bx: x0 + ci * COLUMNA + COLUMNA / 2,
        by: apoyoEnContenedor(tipo, frente),
        frente,
        s: 2,
      };
    },
    hit(px, py) {
      const ci = Math.floor((px - x0) / COLUMNA);
      if (ci < 0 || ci >= cols.length) return null;
      const fi = ys.length > 1 && py < 140 ? 0 : ys.length - 1;
      return cols[ci] + ',' + ys[fi];
    },
    marco: (q) => ({ x: q.x, y: q.frente ? q.by - 52 : q.by - 50, w: q.w, h: 54 }),
    plantas: {
      sombra: false,
      avisoDePlaga: false,
      alturaDeFlecha: 1.6,
      bandeja: { paso: 9, escala: 1.4 },
      numeroAbajo: true,
      apoyo: (_c: CeldaDeEscena, q: CeldaEnPantalla) => q.by,
      chica: () => false,
      bruma: ys.length > 1,
    },
    humo: false,
  };
}

/** El fondo es el corte de suelo ya pintado (con las raíces y los recipientes); no depende del tiempo. */
function fondo(g: CanvasRenderingContext2D, es: Escena, G: GeometriaCerca): void {
  fondoDelCorte(g, es, G);
}

/** La lombriz que se asoma en las columnas con buena materia orgánica: lo único del corte que se mueve. */
function lombriz(g: CanvasRenderingContext2D, q: CeldaEnPantalla, cx: number, t: number): void {
  const B = pincel(g, 0, 0, 1),
    lx = q.x + 12 + Math.round(Math.sin(t * 0.2 + cx) * 6),
    ly = 180 + ((cx * 7) % 14);
  for (let j = 0; j < 8; j++) {
    const x = lx + j * 1.75,
      y = ly + Math.sin(t * 0.6 + j * 0.9) * 1.5;
    B.volumen(B.mascara().elipse(x, y + 1, 1.5, 1.3), [
      '#7a2a40',
      '#a84460',
      '#d06a80',
      '#e08aa0',
      '#f0a4b6',
      '#f8c0cc',
      '#fde0e6',
    ]);
    if (j % 3 === 2) B.r(x - 0.75, y + 0.25, 0.25, 1.5, 'rgba(120,40,64,0.5)');
  }
}

/** Lo que se mueve en el corte, antes de las plantas. */
function debajo(g: CanvasRenderingContext2D, es: Escena, G: GeometriaCerca, t: number): void {
  if (G.tipo === 'macetas' || G.tipo === 'almaciguera') return;
  for (const cx of G.cols)
    for (const fy of G.filas) {
      const c = es.celdas[cx + ',' + fy],
        q = G.celda(cx + ',' + fy);
      if (c && q?.frente && c.mo >= 58) lombriz(g, q, cx, t);
    }
}

export const cerca: Camara<GeometriaCerca> = { id: 'cerca', etiqueta: 'Cantero de cerca', geometria, fondo, debajo };
