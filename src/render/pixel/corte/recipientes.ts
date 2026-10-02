/**
 * Lo que contiene la tierra en el corte, cuando no es un cantero: las macetas partidas al medio, la
 * bandeja de la almaciguera, y lo que se le pone encima a la cama (el microtúnel y la manta). También las
 * raíces de cada planta, que se pintan sobre la tierra, y las flechas que avisan que hay más columnas.
 */
import { mezcla, pincel, raiz, rampaDe } from '../../../arte';
import type { CeldaDeEscena, Escena } from '../../contrato';
import { tablaDeTierra, tablon } from '../bancales';
import type { CeldaEnPantalla } from '../geometria';
import { anchoDeLetras, letras } from '../letras';
import { C, tierra } from '../paleta';
import { baldosas } from '../piso';
import { hash, Superficie } from '../superficie';
import { CORTE, gota, px, rellenarDeTierra, tablasDelPerfil, tierraEnCapas, zonaU, type DatosDelCorte } from './comun';

/** Las raíces de lo que hay plantado en el frente de la cama, bajo la tierra. */
export function raicesDeLaCama(s: Superficie, es: Escena, D: DatosDelCorte, hondo: number): void {
  const prof = Math.floor((hondo * CORTE.porCm) / 2) + (D.tipo === 'cajon' ? 14 : 0);
  for (const cx of D.cols)
    for (const fy of D.filas) {
      const k = cx + ',' + fy,
        c = es.celdas[k],
        q = D.celda(k);
      if (c?.planta && q?.frente) raiz(pincel(s, q.bx, CORTE.yCorte + 1, 2), c.planta, prof);
    }
}

/** El piso del corte y su sombra, para los recipientes que están sobre él. */
function suelo(s: Superficie, y: number): void {
  baldosas(s, zonaU(0, y, CORTE.ancho, CORTE.ancho - y));
  s.rectPx(0, px(y), s.w, 3, 'rgba(24,20,70,0.3)');
}

/** La marca roja de una raíz que ya no tiene lugar: se apoya contra la maceta. */
function marcaDeTope(s: Superficie, x: number, y: number): void {
  const B = pincel(s, 0, 0, 1);
  B.volumen(B.mascara().elipse(x + 3, y + 3, 3.4, 3.4), rampaDe('#e0502f'));
  B.r(x + 2.5, y + 1.2, 1, 2.2, C.blanco);
  B.r(x + 2.5, y + 4.4, 1, 1, C.blanco);
}

/** La maceta de atrás, entera: se ve el cuerpo y la tierra asomando por arriba. */
function macetaDeAtras(s: Superficie, c: CeldaDeEscena, q: CeldaEnPantalla): void {
  const m = c.maceta!,
    prof = Math.round(m.prof / 0.75),
    R = Math.round(10 + m.litros * 0.75),
    alto = Math.round(prof * 0.6),
    r0 = Math.round(R * 0.8),
    { by: top, bx } = q,
    B = pincel(s, 0, 0, 1);
  s.sombraEn(px(bx + 3), px(top + alto + 1), px(r0), px(2.4), 'rgba(24,20,70,0.22)', 3);
  B.volumen(
    B.mascara().poligono([
      [bx - r0, top],
      [bx + r0, top],
      [bx + r0 - alto * 0.18, top + alto],
      [bx - r0 + alto * 0.18, top + alto],
    ]),
    rampaDe(C.terracota),
  );
  B.volumen(B.mascara().elipse(bx, top, r0, 3), rampaDe(C.terracota3));
  B.volumen(B.mascara().elipse(bx, top + 0.2, r0 - 1.5, 2.2), rampaDe(tierra(c.humedo)));
}

/** La maceta de adelante, partida al medio: su tierra en capas, el labio, el agua, los litros y las raíces. */
function macetaEnCorte(s: Superficie, c: CeldaDeEscena, q: CeldaEnPantalla): void {
  if (!q.frente) return macetaDeAtras(s, c, q);
  const m = c.maceta!,
    prof = Math.round(m.prof / 0.75),
    R = Math.round(10 + m.litros * 0.75),
    top = q.by,
    bx = q.bx,
    tt = tierra(c.humedo),
    B = pincel(s, 0, 0, 1),
    rampa = rampaDe(C.terracota),
    borde = rampaDe(C.terracota3);
  s.sombraEn(px(bx + 3), px(top + prof + 1), px(R), px(2.6), 'rgba(24,20,70,0.3)', 3);
  B.volumen(
    B.mascara().poligono([
      [bx - R, top],
      [bx + R, top],
      [bx + R - prof * 0.18, top + prof],
      [bx - R + prof * 0.18, top + prof],
    ]),
    rampa,
  );
  // la tierra, por dentro, en capas
  const tablas = tablasDelPerfil(tt),
    lim = px(top) + px(4 + (c.mo / 100) * prof * 0.5);
  for (let j = px(top); j < px(top + prof); j++) {
    const mitad = R - (j / px(1) - top) * 0.18 - 3;
    tierraEnCapas(s, [px(bx - mitad), px(bx + mitad), j, j + 1], tablas, lim, bx);
  }
  // el labio, y la tierra que asoma por arriba
  B.volumen(
    B.mascara().poligono([
      [bx - R - 2, top - 3],
      [bx + R + 2, top - 3],
      [bx + R + 2, top + 1],
      [bx - R - 2, top + 1],
    ]),
    borde,
  );
  rellenarDeTierra(s, [px(bx - R + 1), px(bx + R - 1), px(top - 1.5), px(top + 0.5)], tablaDeTierra(tt));
  for (let n = 0; n < c.humedo * 2; n++)
    gota(
      s,
      px(bx - R + 8) + Math.floor(hash(n, bx, 100) * px(R * 2 - 16)),
      px(top + 6) + Math.floor(hash(n, top, 101) * px(Math.max(2, prof - 10))),
    );
  const texto = m.litros + 'L';
  letras(s, bx - anchoDeLetras(texto) / 2 + 0.5, top + prof + 5.5, texto, C.blanco, 1);
  letras(s, bx - anchoDeLetras(texto) / 2, top + prof + 5, texto, C.anil, 1);
  if (!c.planta) return;
  const inf = raiz(pincel(s, bx, top + 1, 2), c.planta, Math.floor((prof - 2) / 2));
  if (inf.tope) marcaDeTope(s, bx + R + 1, top + prof - 9);
}

/** Las macetas, de atrás hacia adelante, sobre el piso de baldosas. */
export function macetas(s: Superficie, es: Escena, D: DatosDelCorte): void {
  suelo(s, CORTE.yCorte);
  for (const fy of D.filas)
    for (const cx of D.cols) {
      const k = cx + ',' + fy,
        c = es.celdas[k],
        q = D.celda(k);
      if (c?.maceta && q) macetaEnCorte(s, c, q);
    }
}

/** La almaciguera: la mesa de tablones, la bandeja partida con sus celditas y las raicitas de los plantines. */
export function almaciguera(s: Superficie, es: Escena, D: DatosDelCorte): void {
  const x1 = D.x0 + D.cols.length * D.cw,
    B = pincel(s, 0, 0, 1);
  suelo(s, 236);
  tablon(s, zonaU(D.x0 - 2, 154, 6, 102), 11);
  tablon(s, zonaU(x1 - 4, 154, 6, 102), 12);
  tablon(s, zonaU(D.x0 - 8, 146, x1 - D.x0 + 16, 8), 13);
  s.damero(px(D.x0 - 8), px(154), px(x1 - D.x0 + 16), 6, 'rgba(24,20,70,0.3)', 'rgba(24,20,70,0.14)');
  for (const fy of D.filas)
    for (const cx of D.cols) {
      const k = cx + ',' + fy,
        c = es.celdas[k],
        q = D.celda(k);
      if (!c || !q) continue;
      const X = q.x + 3,
        W = q.w - 6,
        t = mezcla(tierra(c.humedo), '#1e0f08', 0.4);
      B.volumen(
        B.mascara().poligono([
          [X, 134],
          [X + W, 134],
          [X + W - 1, 148],
          [X + 1, 148],
        ]),
        rampaDe('#4a48a0'),
      );
      rellenarDeTierra(s, [px(X + 2), px(X + W - 2), px(136), px(147)], tablaDeTierra(t));
      if (c.planta) raiz(pincel(s, q.bx, 137, 1), c.planta, 9);
    }
  for (let ci = 0; ci < D.cols.length; ci++) {
    const i = px(D.x0 + ci * D.cw + 3);
    s.rectPx(i, px(134), 2, px(14), '#6a68c0');
    s.rectPx(i + 2, px(134), 1, px(14), '#2a2869');
  }
}

/** Las flechas de los costados: hay más columnas fuera de la vista. */
export function flechas(s: Superficie, D: DatosDelCorte): void {
  const B = pincel(s, 0, 0, 1),
    lado = (x: number, dir: number): void => {
      for (const [dx, dy, c] of [
        [0.6, 0.6, 'rgba(24,20,70,0.55)'],
        [0, 0, C.blanco],
      ] as const) {
        B.linea(x + dx - dir * 3, 145.5 + dy, x + dx + dir * 3, 151 + dy, c, 0.75);
        B.linea(x + dx + dir * 3, 151 + dy, x + dx - dir * 3, 156.5 + dy, c, 0.75);
      }
    };
  if (D.masIzq) lado(5, 1);
  if (D.masDer) lado(251, -1);
}

/** El microtúnel: una cúpula de plástico con su arco más marcado y un reflejo. */
export function tunel(s: Superficie): void {
  const cx = px(128),
    cy = px(CORTE.yCorte),
    rx = px(126),
    ry = px(100);
  for (let j = cy - ry; j < cy; j++) {
    const t = (j + 0.5 - cy) / ry,
      mitad = rx * Math.sqrt(1 - t * t);
    for (let i = Math.ceil(cx - mitad); i < cx + mitad; i++) {
      const d = ((i + 0.5 - cx) / rx) ** 2 + t * t,
        reflejo = Math.abs(i - cx + (cy - j) * 0.55 + rx * 0.35) < 14 && d < 0.9;
      if (d > 0.965) s.px(i, j, d > 0.985 ? 'rgba(255,255,255,0.95)' : 'rgba(210,225,245,0.8)');
      else s.px(i, j, reflejo ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)');
    }
  }
}

/** La manta de cultivo: una tela clara con sus pliegues y el dobladillo. */
export function manta(s: Superficie, D: DatosDelCorte): void {
  const x = D.x0 - 4,
    w = D.cols.length * D.cw + 8;
  s.rectPx(px(x), px(96), px(w), px(76), 'rgba(255,255,255,0.4)');
  for (let n = 0; n * 9 < w; n++) s.rectPx(px(x + n * 9 + 2), px(96), 1, px(76), 'rgba(255,255,255,0.22)');
  s.rectPx(px(x), px(96), px(w), 3, 'rgba(255,255,255,0.7)');
  s.rectPx(px(x), px(170), px(w), 3, 'rgba(210,215,230,0.7)');
}
