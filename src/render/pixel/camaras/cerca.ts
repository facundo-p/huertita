/**
 * Cámara de cerca: un cantero de frente, con el suelo cortado para ver las raíces. Muestra hasta
 * cuatro columnas de la zona elegida (`escena.cerca`) y, si la zona tiene más de una hilera, la de
 * atrás más arriba y la del frente con su corte.
 */
import { mezcla, pincel, raiz, type Pincel } from '../../../arte';
import type { CeldaDeEscena, Escena } from '../../contrato';
import type { CeldaEnPantalla, Geometria } from '../geometria';
import { xyDe } from '../geometria';
import { letras } from '../letras';
import { C, T, cielo, ruido, tierra } from '../paleta';
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

const ANCHO = 256,
  COLUMNA = 60,
  /** donde apoyan las plantas del frente y las de atrás */
  Y_FRENTE = 170,
  Y_ATRAS = 132,
  /** escala del corte de suelo */
  PX_POR_CM = 1 / 0.75;

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
    W: es.ancho * T,
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

type R = Pincel['r'];

function cieloYSol(B: Pincel, es: Escena): void {
  const r = B.r,
    [arriba, horizonte] = cielo(es.estacion);
  r(0, 0, ANCHO, 60, arriba);
  r(0, 44, ANCHO, 30, horizonte);
  const inv = (es.sombraPared - 0.35) / 1.9,
    sy = Math.round(14 + inv * 26);
  B.disco(206, sy, 9, '#fff3b0');
  B.disco(206, sy, 7, '#ffd23f');
  for (const [x, y] of [
    [30, 18],
    [120, 30],
  ]) {
    B.elipse(x, y, 16, 4, '#ffffff');
    B.elipse(x + 8, y - 4, 9, 4, '#ffffff');
  }
}

/** detrás del cantero: la pared de ladrillo (canteros de tierra) o un cerco verde */
function detras(g: CanvasRenderingContext2D, B: Pincel, z: string): void {
  const r = B.r;
  if (z === 'suelo' || z === 'cajon') {
    r(0, 58, ANCHO, 50, C.ladrillo);
    for (let f = 0; f < 9; f++) {
      r(0, 58 + f * 6 + 5, ANCHO, 1, C.junta);
      for (let x = (f % 2) * 10; x < ANCHO; x += 20) r(x, 58 + f * 6, 1, 5, C.junta);
    }
    r(0, 58, ANCHO, 3, C.casa2);
    if (z === 'suelo') {
      g.fillStyle = C.sombra;
      g.fillRect(0, 61, ANCHO, 47);
    }
    return;
  }
  r(0, 70, ANCHO, 40, C.copa3);
  for (let i = 0; i < 40; i++)
    B.disco(Math.floor(ruido(i, 3) * ANCHO), 72 + Math.floor(ruido(i, 5) * 10), 5, i % 2 ? C.copa : C.copa2);
}

function piso(g: CanvasRenderingContext2D, r: R, es: Escena, z: string): void {
  if (es.piso === 'baldosa') {
    r(0, 108, ANCHO, 148, '#d9b779');
    for (let i = 0; i < ANCHO; i += 32) r(i, 108, 1, 148, C.sendero2);
    for (let i = 108; i < ANCHO; i += 24) r(0, i, ANCHO, 1, C.sendero2);
  } else {
    r(0, 108, ANCHO, 148, C.pasto);
    for (let i = 0; i < 90; i++)
      r(Math.floor(ruido(i, 1) * ANCHO), 110 + Math.floor(ruido(i, 2) * 60), 1, 3, i % 2 ? C.pasto2 : C.pasto3);
  }
  if (z === 'suelo' && es.sombraPared > 1) {
    g.fillStyle = C.sombra;
    g.fillRect(0, 108, ANCHO, Math.round(30 * (es.sombraPared - 1)));
  }
}

function fondo(g: CanvasRenderingContext2D, es: Escena, G: GeometriaCerca): void {
  const B = pincel(g, 0, 0, 1),
    r = B.r,
    z = G.tipo,
    n = G.cols.length,
    x0 = G.x0,
    x1 = x0 + n * G.cw;
  cieloYSol(B, es);
  detras(g, B, z);
  piso(g, r, es, z);
  const c0 = es.celdas[G.cols[0] + ',' + G.filas[G.filas.length - 1]],
    t = tierra(c0.humedo);
  if (z === 'macetas') {
    r(0, 172, ANCHO, 84, '#d9b779');
    for (let i = 0; i < ANCHO; i += 32) r(i, 172, 1, 84, C.sendero2);
    r(0, 172, ANCHO, 2, C.sendero2);
    return;
  }
  if (z === 'almaciguera') {
    r(x0 - 8, 146, n * G.cw + 16, 8, C.madera);
    r(x0 - 8, 146, n * G.cw + 16, 2, C.madera3);
    r(x0 - 2, 154, 6, 102, C.madera2);
    r(x1 - 4, 154, 6, 102, C.madera2);
    r(0, 236, ANCHO, 20, '#d9704a');
    for (let i = 0; i < ANCHO; i += 32) r(i, 236, 1, 20, '#b85a38');
    return;
  }
  // cama de tierra: cara de arriba (dos hileras) y corte al frente
  const xa = z === 'cajon' ? x0 - 6 : 0,
    xb = z === 'cajon' ? x1 + 6 : ANCHO;
  r(xa, 114, xb - xa, 58, mezcla(t, '#000000', 0.12));
  r(xa, 118, xb - xa, 54, t);
  for (let i = 0; i < 120; i++)
    r(
      xa + Math.floor(ruido(i, 7) * (xb - xa - 3)),
      119 + Math.floor(ruido(i, 9) * 50),
      3,
      1,
      i % 2 ? mezcla(t, '#000000', 0.2) : mezcla(t, '#ffffff', 0.12),
    );
  r(xa, 138, xb - xa, 2, mezcla(t, '#000000', 0.25));
  perfil(g, es, G, xa, xb, 172, Math.round(es.cerca.hondo * PX_POR_CM), z);
}

/** lo que hay debajo del cantero: baldosa del balcón, tierra del patio o el piso del cajón */
function debajoDelCantero(r: R, es: Escena, y0: number, prof: number, z: string): void {
  if (z === 'cajon' && es.piso === 'baldosa') {
    r(0, y0 + prof, ANCHO, ANCHO - y0 - prof, '#c9a25f');
    for (let i = 0; i < ANCHO; i += 32) r(i, y0 + prof, 1, ANCHO - y0 - prof, C.sendero2);
    r(0, y0 + prof, ANCHO, 2, C.sendero2);
  } else if (z === 'cajon') {
    r(0, y0 + prof, ANCHO, ANCHO - y0 - prof, '#6b4a30');
    for (let i = 0; i < 40; i++)
      r(Math.floor(ruido(i, 31) * 250), y0 + prof + 3 + Math.floor(ruido(i, 33) * 36), 4, 2, '#5a3c26');
    r(0, y0 + prof, ANCHO, 1, C.pasto3);
  }
}

/** una columna del corte: materia orgánica arriba, grumos, humedad y mulch */
function columnaDelCorte(r: R, c: CeldaDeEscena, cx: number, X: number, cw: number, y0: number, prof: number): void {
  const t = tierra(c.humedo),
    capa = Math.round(4 + (c.mo / 100) * prof * 0.55),
    osc = mezcla(t, '#1e0f08', 0.55);
  r(X, y0, cw, prof, mezcla(t, '#c9a070', 0.35));
  r(X, y0, cw, capa, osc);
  for (let i = 0; i < 6; i++) r(X + i * 10, y0 + capa - 1 + (i % 2), 10, 2, osc);
  for (let i = 0; i < 26; i++) {
    const px = X + Math.floor(ruido(i + cx, 11) * (cw - 3)),
      py = y0 + 2 + Math.floor(ruido(i, 13 + cx) * (prof - 4));
    r(px, py, i % 4 ? 2 : 3, i % 3 ? 1 : 2, py < y0 + capa ? mezcla(osc, '#000000', 0.3) : mezcla(t, '#ffffff', 0.25));
  }
  for (let i = 0; i < c.humedo * 3; i++) {
    const wx = X + 4 + Math.floor(ruido(i, 17 + cx) * (cw - 8)),
      wy = y0 + 4 + Math.floor(ruido(i + cx, 19) * (prof - 8));
    r(wx, wy, 2, 3, '#6fc0e8');
    r(wx, wy, 1, 1, '#c8f0ff');
  }
  if (c.mulch) for (let i = 0; i < 12; i++) r(X + i * 5, y0 - 3 + (i % 2), 6, 2, i % 2 ? C.paja : C.paja2);
  r(X + cw - 1, y0, 1, prof, 'rgba(0,0,0,0.15)');
}

/** corte de suelo: materia orgánica arriba, humedad, lombrices, regla de profundidad */
function perfil(
  g: CanvasRenderingContext2D,
  es: Escena,
  G: GeometriaCerca,
  xa: number,
  xb: number,
  y0: number,
  prof: number,
  z: string,
): void {
  const r = pincel(g, 0, 0, 1).r;
  debajoDelCantero(r, es, y0, prof, z);
  G.cols.forEach((cx, ci) =>
    columnaDelCorte(r, es.celdas[cx + ',' + G.filas[G.filas.length - 1]], cx, G.x0 + ci * G.cw, G.cw, y0, prof),
  );
  if (z === 'cajon') {
    r(xa, 112, 6, prof + 60, C.madera);
    r(xa, 112, 2, prof + 60, C.madera3);
    r(xb - 6, 112, 6, prof + 60, C.madera2);
    r(xa, y0 + prof - 2, xb - xa, 4, C.madera2);
    for (let i = 0; i < 3; i++) r(xa, y0 + 10 + i * 14, 6, 1, C.madera2);
  } else {
    r(0, y0 + prof, ANCHO, ANCHO - y0 - prof, '#a8794e');
    for (let i = 0; i < 30; i++)
      r(Math.floor(ruido(i, 41) * 250), y0 + prof + 1 + Math.floor(ruido(i, 43) * 5), 5, 2, '#c9a070');
  }
  r(xa, y0, xb - xa, 2, 'rgba(0,0,0,0.3)');
  // regla: una marca cada 15 cm
  for (let i = 1; i * 20 <= prof; i++) {
    r(xb - 12, y0 + i * 20, 12, 1, C.blanco);
    letras(g, xb - 12, y0 + i * 20 - 7, String(i * 15), C.blanco, 1);
  }
}

/** maceta en corte (frente) o entera (fondo), con la raíz adentro */
function macetaEnCorte(
  g: CanvasRenderingContext2D,
  B: Pincel,
  c: CeldaDeEscena,
  q: CeldaEnPantalla,
  cx: number,
  fy: number,
): void {
  const r = B.r,
    m = c.maceta!,
    prof = Math.round(m.prof / 0.75),
    R = Math.round(10 + m.litros * 0.75),
    top = q.by,
    tt = tierra(c.humedo);
  if (!q.frente) {
    for (let i = 0; i < Math.round(prof * 0.6); i++) {
      const w0 = Math.round((R - i * 0.22) * 0.8);
      r(q.bx - w0, top + i, w0 * 2, 1, i < 3 ? C.terracota3 : C.terracota);
      r(q.bx + Math.round(w0 * 0.4), top + i, Math.round(w0 * 0.6), 1, C.terracota2);
    }
    B.elipse(q.bx, top, Math.round(R * 0.8), 3, tt);
    return;
  }
  for (let i = 0; i < prof; i++) {
    const w = Math.round(R - i * 0.18);
    r(q.bx - w, top + i, w * 2, 1, C.terracota2);
    r(
      q.bx - w + 3,
      top + i,
      w * 2 - 6,
      1,
      i < 4 + (c.mo / 100) * prof * 0.5 ? mezcla(tt, '#1e0f08', 0.55) : mezcla(tt, '#c9a070', 0.3),
    );
    r(q.bx - w, top + i, 1, 1, C.terracota3);
  }
  r(q.bx - Math.round(R - prof * 0.18), top + prof, Math.round(R - prof * 0.18) * 2, 3, C.terracota2);
  r(q.bx - R - 2, top - 3, R * 2 + 4, 4, C.terracota3);
  r(q.bx - R + 1, top - 1, R * 2 - 2, 2, tt);
  for (let i = 0; i < c.humedo * 2; i++)
    r(
      q.bx - R + 8 + Math.floor(ruido(i, cx) * (R * 2 - 16)),
      top + 6 + Math.floor(ruido(i, fy) * (prof - 10)),
      2,
      3,
      '#6fc0e8',
    );
  letras(g, q.bx - 8, top + prof + 6, m.litros + 'L', C.anil, 1);
  if (!c.planta) return;
  const inf = raiz(pincel(g, q.bx, top + 1, 2), c.planta, Math.floor((prof - 2) / 2));
  if (inf.tope) {
    r(q.bx + R + 1, top + prof - 9, 7, 7, '#e0502f');
    r(q.bx + R + 4, top + prof - 8, 1, 3, C.blanco);
    r(q.bx + R + 4, top + prof - 4, 1, 1, C.blanco);
  }
}

function bandejaEnCorte(g: CanvasRenderingContext2D, r: R, c: CeldaDeEscena, q: CeldaEnPantalla): void {
  const X = q.x + 3,
    W = q.w - 6,
    t2 = tierra(c.humedo);
  r(X, 134, W, 14, '#2a2869');
  r(X, 134, W, 2, '#4a48a0');
  r(X + 2, 136, W - 4, 11, mezcla(t2, '#1e0f08', 0.4));
  if (c.planta) raiz(pincel(g, q.bx, 137, 1), c.planta, 9);
}

function lombriz(r: R, q: CeldaEnPantalla, cx: number, t: number): void {
  const lx = q.x + 12 + Math.round(Math.sin(t * 0.2 + cx) * 6),
    ly = 180 + ((cx * 7) % 14);
  for (let j = 0; j < 7; j++)
    r(lx + j * 2, ly + Math.round(Math.sin(t * 0.6 + j * 0.9) * 1.5), 2, 2, j % 3 ? '#f08aa0' : '#d06a80');
}

/** Las raíces y los contenedores, antes de las plantas. */
function debajo(g: CanvasRenderingContext2D, es: Escena, G: GeometriaCerca, t: number): void {
  const B0 = pincel(g, 0, 0, 1),
    r = B0.r,
    z = G.tipo;
  G.cols.forEach((cx) =>
    G.filas.forEach((fy) => {
      const k = cx + ',' + fy,
        c = es.celdas[k];
      if (!c) return;
      const q = G.celda(k)!;
      if (z === 'macetas') return macetaEnCorte(g, B0, c, q, cx, fy);
      if (z === 'almaciguera') return bandejaEnCorte(g, r, c, q);
      if (q.frente && c.planta)
        raiz(
          pincel(g, q.bx, 173, 2),
          c.planta,
          Math.floor((es.cerca.hondo * PX_POR_CM) / 2) + (z === 'cajon' ? 14 : 0),
        );
      if (q.frente && c.mo >= 58) lombriz(r, q, cx, t);
    }),
  );
  if (z === 'almaciguera') for (let ci = 0; ci < G.cols.length; ci++) r(G.x0 + ci * G.cw + 3, 134, 1, 14, '#4a48a0');
  if (G.masIzq) {
    r(2, 150, 6, 2, C.blanco);
    r(2, 148, 2, 6, C.blanco);
  }
  if (G.masDer) {
    r(248, 150, 6, 2, C.blanco);
    r(252, 148, 2, 6, C.blanco);
  }
  if (z === 'cajon' && es.tuneles.indexOf(G.zona) >= 0) {
    g.fillStyle = 'rgba(255,255,255,0.3)';
    g.beginPath();
    g.ellipse(128, 172, 126, 100, 0, 3.14, 6.29);
    g.fill();
    g.strokeStyle = C.blanco;
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(128, 172, 126, 100, 0, 3.14, 6.29);
    g.stroke();
  }
  if (es.mantas[G.zona]) {
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.fillRect(G.x0 - 4, 96, G.cols.length * G.cw + 8, 76);
  }
}

export const cerca: Camara<GeometriaCerca> = { id: 'cerca', etiqueta: 'Cantero de cerca', geometria, fondo, debajo };
