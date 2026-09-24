/**
 * El fondo del patio para las cámaras que lo miran entero: piso, paredón o baranda, la casa, los
 * canteros con su tierra, la compostera y la sombra del paredón. Se pinta una vez por foto.
 */
import { pincel, mezcla, type Pincel } from '../../arte';
import type { CeldaDeEscena, Escena } from '../contrato';
import type { GeometriaPlana } from './camaras/plano';
import type { CeldaEnPantalla } from './geometria';
import { xyDe } from './geometria';
import { C, T, cielo, ruido, tierra } from './paleta';

type R = Pincel['r'];

/** una baldosa de piso: pasto con florcitas, o sendero */
function baldosa(r: R, x: number, y: number, Y: number, h: number, send: boolean): void {
  const X = x * T;
  r(X, Y, T, h, send ? C.sendero : C.pasto);
  for (let i = 0; i < 12; i++) {
    const nx = Math.floor(ruido(x * 7 + i, y * 3) * 30),
      ny = Math.floor(ruido(x + i * 5, y * 11) * (h - 2));
    if (send) r(X + nx, Y + ny, i % 3 ? 2 : 3, 1, i % 2 ? C.sendero2 : C.sendero3);
    else {
      r(X + nx, Y + ny, 1, 3, i % 2 ? C.pasto2 : C.pasto3);
      if (i % 5 === 0) r(X + nx + 1, Y + ny + 1, 1, 2, C.pasto2);
    }
  }
  if (!send && ruido(x * 3, y * 9) > 0.72) {
    r(X + 9, Y + Math.round(h / 2), 2, 2, '#fff6e0');
    r(X + 22, Y + 5, 2, 2, '#ffd23f');
  }
}

function piso(r: R, es: Escena, G: GeometriaPlana): void {
  for (let y = 0; y < es.alto; y++)
    for (let x = 0; x < es.ancho; x++) {
      const ch = es.plano[y][x];
      if (ch === 'P' || ch === 'H') continue;
      baldosa(r, x, y, G.fy(y), G.fh(y), ch === ':' || (es.piso === 'baldosa' && ch !== 'T'));
    }
}

/** baranda de barrotes: se ve el cielo y los techos de enfrente */
function baranda(r: R, G: GeometriaPlana, m: number, y0: number, [arriba, horizonte]: [string, string]): void {
  r(0, y0, G.W, m - y0, arriba);
  r(0, y0 + Math.round((m - y0) * 0.45), G.W, m - y0 - Math.round((m - y0) * 0.45), horizonte);
  for (let i = 0; i < 7; i++) {
    const ex = Math.floor(ruido(i, 21) * (G.W - 30)),
      eh = 5 + Math.floor(ruido(i, 23) * (m * 0.35));
    r(ex, m - eh - 3, 22 + Math.floor(ruido(i, 25) * 16), eh, i % 2 ? '#8f86c8' : '#a59ad6');
  }
  for (let x = 3; x < G.W; x += 8) r(x, y0 + 4, 2, m - y0 - 4, '#2a2869');
  r(0, y0 + 2, G.W, 3, '#1d1b4b');
  r(0, y0 + 2, G.W, 1, '#4a48a0');
  r(0, m - 3, G.W, 3, '#1d1b4b');
}

function paredon(r: R, G: GeometriaPlana, m: number, y0: number): void {
  r(0, y0, G.W, m - y0, C.ladrillo);
  for (let f = 0; y0 + f * 6 < m; f++) {
    const yy = y0 + f * 6;
    r(0, yy + 5, G.W, 1, C.junta);
    for (let x = (f % 2) * 8; x < G.W; x += 16) {
      r(x, yy, 1, 5, C.junta);
      if (ruido(x, f) > 0.7) r(x + 2, yy + 1, 12, 3, C.ladrillo3);
      if (ruido(x + 1, f * 3) > 0.8) r(x + 2, yy + 1, 12, 3, C.ladrillo2);
    }
  }
  r(0, y0, G.W, 3, C.casa2);
  r(0, y0 + 3, G.W, 1, C.ladrillo2);
  for (let i = 0; i < 9; i++) {
    const vx = Math.floor(ruido(i, 4) * (G.W - 60)),
      vl = 4 + Math.floor(ruido(i, 8) * (m * 0.4));
    r(vx, m - vl, 2, vl, C.copa3);
    r(vx - 2, m - vl + 2, 3, 2, C.copa);
    r(vx + 1, m - Math.round(vl / 2), 3, 2, C.copa2);
  }
  r(0, m - 2, G.W, 2, 'rgba(0,0,0,0.25)');
}

/** el lado norte: paredón de ladrillo o baranda de balcón, con cielo arriba si se mira desde la galería */
function norte(r: R, es: Escena, G: GeometriaPlana): void {
  const m = G.muro,
    colores = cielo(es.estacion);
  if (G.obl) {
    r(0, 0, G.W, 10, colores[0]);
    r(0, 6, G.W, 4, colores[1]);
  }
  const y0 = G.obl ? 10 : 0;
  if (es.norte === 'baranda') baranda(r, G, m, y0, colores);
  else paredon(r, G, m, y0);
}

/** la casa desde arriba, o las baldosas de la galería desde la galería */
function casa(r: R, es: Escena, G: GeometriaPlana): void {
  const yc = G.fy(es.alto - 1),
    hc = G.fh(es.alto - 1);
  if (G.obl) {
    for (let x = 0; x < G.W; x += 16)
      for (let i = 0; i < 2; i++) r(x, yc + i * 13, 16, 13, (x / 16 + i) % 2 ? '#d9704a' : '#f0d8a8');
    r(0, yc, G.W, 2, C.casa2);
    r(0, yc + hc - 5, G.W, 5, C.techo2);
    r(0, yc + hc - 5, G.W, 1, C.techo3);
    return;
  }
  r(0, yc, G.W, hc, C.casa);
  r(0, yc, G.W, 11, C.techo);
  r(0, yc + 11, G.W, 2, C.techo2);
  for (let x = 0; x < G.W; x += 8) {
    r(x, yc + 2, 5, 7, C.techo2);
    r(x, yc + 2, 5, 2, C.techo3);
  }
  const px = G.W - 56,
    vx2 = G.W - 88;
  r(px, yc + 14, 16, 18, C.puerta);
  r(px, yc + 14, 16, 2, '#a8341d');
  r(px + 11, yc + 23, 2, 2, C.paja);
  r(vx2, yc + 16, 20, 12, '#7fd6e0');
  r(vx2 + 9, yc + 16, 2, 12, C.casa2);
  r(vx2, yc + 21, 20, 2, C.casa2);
  r(vx2 + 2, yc + 17, 5, 3, '#c8f4f8');
}

interface Tierras {
  t: string;
  t2: string;
  t3: string;
}

function maceta(
  g: CanvasRenderingContext2D,
  B: Pincel,
  c: CeldaDeEscena,
  q: CeldaEnPantalla,
  obl: boolean,
  { t, t2, t3 }: Tierras,
): void {
  const r = B.r,
    litros = c.maceta!.litros;
  let R = 8;
  if (litros >= 20) R = 14;
  else if (litros >= 8) R = 11;
  if (obl) {
    const ry = Math.round(R * 0.42),
      py = q.by - 1,
      alto = Math.round(R * 0.95);
    g.fillStyle = 'rgba(0,0,0,0.2)';
    g.beginPath();
    g.ellipse(q.bx + 3, py + alto, R, ry, 0, 0, 6.3);
    g.fill();
    for (let i = 0; i < alto; i++) {
      const w = Math.round(R - i * 0.28);
      r(q.bx - w, py + i, w * 2, 1, i < 3 ? C.terracota3 : C.terracota);
      r(q.bx + Math.round(w * 0.4), py + i, Math.round(w * 0.6), 1, C.terracota2);
    }
    B.elipse(q.bx, py, R, ry, C.terracota3);
    B.elipse(q.bx, py, R - 2, ry - 1, t);
    return;
  }
  const Y = q.y;
  B.disco(q.bx + 1, Y + 17, R, 'rgba(0,0,0,0.22)');
  B.disco(q.bx, Y + 16, R, C.terracota2);
  B.disco(q.bx, Y + 15, R, C.terracota);
  B.disco(q.bx - 1, Y + 14, R - 1, C.terracota3);
  B.disco(q.bx, Y + 15, R - 3, t2);
  B.disco(q.bx, Y + 16, R - 4, t);
  r(q.bx - 3, Y + 12, 3, 1, t3);
}

function almaciguera(r: R, q: CeldaEnPantalla, obl: boolean, { t, t2 }: Tierras): void {
  const { x: X, y: Y, h } = q;
  r(X, Y + 2, T, h - 3, '#2a2869');
  r(X, Y + 2, T, 1, '#4a48a0');
  const ph = Math.floor((h - 7) / 2);
  for (let a = 0; a < 3; a++)
    for (let b2 = 0; b2 < 2; b2++) {
      r(X + 2 + a * 10, Y + 4 + b2 * (ph + 1), 8, ph, t2);
      r(X + 2 + a * 10, Y + 5 + b2 * (ph + 1), 8, ph - 1, t);
    }
  if (obl) r(X, Y + h - 1, T, 4, '#1d1b4b');
}

function grumos(r: R, c: CeldaDeEscena, k: string, q: CeldaEnPantalla, { t2, t3 }: Tierras): void {
  const [cx, cy] = xyDe(k),
    { x: x0, y: y0, w, h: hh } = q;
  for (let j = 0; j < 14; j++) {
    const gx = x0 + Math.floor(ruido(cx * 5 + j, cy * 7) * (w - 3)),
      gy = y0 + Math.floor(ruido(cx + j * 3, cy * 13 + j) * (hh - 2));
    r(gx, gy, j % 3 ? 2 : 3, 1, j % 2 ? t2 : t3);
  }
  if (c.humedo >= 3) for (let j = 0; j < 3; j++) r(x0 + 4 + j * 9, y0 + 3 + ((j * 7) % (hh - 5)), 2, 1, '#7fc8e8');
}

function bordeDeCajon(r: R, c: CeldaDeEscena, q: CeldaEnPantalla, obl: boolean): void {
  const { x: X, y: Y, h } = q;
  if (c.borde.n) {
    r(X, Y, T, 3, C.madera2);
    r(X, Y, T, 1, C.madera3);
  }
  if (c.borde.o) {
    r(X, Y, 3, h, C.madera);
    r(X, Y, 1, h, C.madera3);
  }
  if (c.borde.e) r(X + T - 3, Y, 3, h, C.madera2);
  if (!c.borde.s) return;
  const fa = obl ? 9 : 4;
  r(X, Y + h - 2, T, fa, C.madera);
  r(X, Y + h - 2, T, 1, C.madera3);
  r(X, Y + h + fa - 4, T, 2, C.madera2);
  if (obl) {
    r(X + 15, Y + h - 1, 1, fa - 1, C.madera2);
    r(X, Y + h + fa - 2, T, 2, 'rgba(0,0,0,0.2)');
  }
}

function bordeDeTierra(r: R, c: CeldaDeEscena, q: CeldaEnPantalla, t2: string): void {
  const { x: X, y: Y, h } = q;
  if (c.borde.n) r(X, Y, T, 1, t2);
  if (c.borde.s) r(X, Y + h - 1, T, 1, t2);
  if (c.borde.o) r(X, Y, 1, h, t2);
  if (c.borde.e) r(X + T - 1, Y, 1, h, t2);
}

function mulch(r: R, k: string, q: CeldaEnPantalla): void {
  const [cx, cy] = xyDe(k);
  for (let i = 0; i < 16; i++) {
    const mx = q.x + 2 + Math.floor(ruido(i, cx + cy * 9) * 26),
      my = q.y + 3 + Math.floor(ruido(cy + i * 3, cx) * (q.h - 8));
    r(mx, my, 4, 1, i % 2 ? C.paja : C.paja2);
    if (i % 4 === 0) r(mx + 1, my + 1, 3, 1, C.paja2);
  }
}

function cantero(g: CanvasRenderingContext2D, B: Pincel, es: Escena, G: GeometriaPlana, k: string): void {
  const r = B.r,
    c = es.celdas[k],
    q = G.celda(k)!;
  const base = tierra(c.humedo),
    t = c.mo >= 75 ? mezcla(base, '#2a160c', 0.45) : base,
    tierras = { t, t2: mezcla(t, '#000000', 0.22), t3: mezcla(t, '#ffffff', 0.12) };
  if (c.tipo === 'macetas') maceta(g, B, c, q, G.obl, tierras);
  else if (c.tipo === 'almaciguera') almaciguera(r, q, G.obl, tierras);
  else {
    r(q.x, q.y, T, q.h, t);
    grumos(r, c, k, q, tierras);
    for (let i = 6; i < T; i += 10) r(q.x + i, q.y + 1, 1, q.h - 2, 'rgba(0,0,0,0.10)');
    if (c.tipo === 'cajon') bordeDeCajon(r, c, q, G.obl);
    else bordeDeTierra(r, c, q, tierras.t2);
  }
  if (c.mulch) mulch(r, k, q);
}

function compostera(r: R, es: Escena, G: GeometriaPlana): void {
  if (!es.compostera) return;
  const qc = G.celda(es.compostera)!,
    cp = es.compost,
    ch2 = G.obl ? 24 : 26,
    cyy = qc.y + qc.h - ch2 - 2;
  r(qc.x + 3, cyy, 26, ch2, C.madera2);
  r(qc.x + 5, cyy + 2, 22, ch2 - 3, '#2f1c10');
  const niv = Math.min(ch2 - 6, Math.round(cp.carga * 2.5) + cp.tandas * 5);
  r(qc.x + 5, cyy + ch2 - 1 - niv, 22, niv, '#6b4a2a');
  for (let i = 0; i < 5; i++) r(qc.x + 7 + i * 4, cyy + ch2 - niv + (i % 2), 2, 1, i % 2 ? '#8fb04a' : '#c9803a');
  for (let i = 0; i < 4; i++) {
    r(qc.x + 3, cyy + 3 + i * 6, 26, 2, C.madera);
    r(qc.x + 3, cyy + 3 + i * 6, 26, 1, C.madera3);
  }
  r(qc.x + 3, cyy, 2, ch2, C.madera3);
  r(qc.x + 27, cyy, 2, ch2, C.madera2);
  for (let i = 0; i < Math.min(5, cp.dosis); i++) {
    r(qc.x + 2 + i * 6, qc.y + qc.h - 5, 5, 4, '#3d2617');
    r(qc.x + 3 + i * 6, qc.y + qc.h - 6, 3, 1, '#5e3a22');
  }
}

export function fondoDelPatio(g: CanvasRenderingContext2D, es: Escena, G: GeometriaPlana): void {
  const B = pincel(g, 0, 0, 1),
    r = B.r;
  piso(r, es, G);
  norte(r, es, G);
  casa(r, es, G);
  Object.keys(es.celdas).forEach((k) => cantero(g, B, es, G, k));
  compostera(r, es, G);
  // sombra del paredón: se alarga en invierno
  if (es.sombraPared > 0) {
    g.fillStyle = C.sombra;
    g.fillRect(0, G.muro, G.W, Math.round(es.sombraPared * G.TH));
  }
}
