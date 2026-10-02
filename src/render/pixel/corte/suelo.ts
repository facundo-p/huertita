/**
 * El corte de suelo de la cámara de cerca, píxel a píxel: el cielo y el sol, la pared de ladrillo o el cerco
 * detrás del cantero, el piso, la cara de arriba de la cama, y el corte de la tierra con sus capas, sus
 * terrones, sus piedritas, el agua y la regla de profundidad.
 */
import { mezcla, pincel, rampaDe } from '../../../arte';
import type { CeldaDeEscena, Escena } from '../../contrato';
import { clavo, tablaDeTierra, terron, tablon, tierraDe } from '../bancales';
import { anchoDeLetras, letras } from '../letras';
import { cieloDeBanda, paredon } from '../muros';
import { C, cielo, tierra } from '../paleta';
import { baldosas, pasto } from '../piso';
import { hash, Superficie, empaquetar } from '../superficie';
import {
  CORTE,
  gota,
  pajas,
  px,
  rellenarDeTierra,
  tablasDelPerfil,
  tierraEnCapas,
  zonaU,
  type DatosDelCorte,
} from './comun';

const SOL = ['#c8741a', '#e89a20', '#f5b52a', '#ffc933', '#ffd84a', '#ffe680', '#fff3b0'];

/** El cielo con sus nubes y el sol, que sube y baja con la sombra que echa el paredón. */
export function cieloYSol(s: Superficie, es: Escena): void {
  cieloDeBanda(s, 0, px(70), cielo(es.estacion), true);
  const inv = (es.sombraPared - 0.35) / 1.9,
    sy = Math.round(14 + inv * 26),
    B = pincel(s, 0, 0, 1);
  s.elipsePx(px(206), px(sy), px(16), px(16), 'rgba(255,246,176,0.16)');
  s.elipsePx(px(206), px(sy), px(12.5), px(12.5), 'rgba(255,240,150,0.26)');
  B.volumen(B.mascara().elipse(206, sy, 9, 9), SOL);
}

/** Detrás del cantero: la pared de ladrillo (canteros de tierra) o un cerco verde. */
export function detras(s: Superficie, tipo: string): void {
  if (tipo === 'suelo' || tipo === 'cajon') {
    paredon(s, 58, CORTE.yPiso);
    if (tipo === 'suelo') s.rectPx(0, px(61), s.w, px(47), C.sombra);
    return;
  }
  const B = pincel(s, 0, 0, 1);
  s.rectPx(0, px(66), s.w, px(44), '#1a5a2c');
  for (let hilera = 0; hilera < 3; hilera++) {
    const rampa = rampaDe(['#1f7a35', '#2f9440', '#46b04f'][hilera]);
    for (let i = 0; i < 15; i++)
      B.volumen(
        B.mascara().elipse(
          i * 18 + hilera * 7 + hash(i, hilera, 81) * 6,
          72 + hilera * 11 + hash(i, hilera, 82) * 5,
          11 + hilera,
          7.5,
        ),
        rampa,
      );
  }
}

/** El piso detrás del cantero: pasto o baldosas, y la sombra del paredón sobre él. */
export function piso(s: Superficie, es: Escena, tipo: string): void {
  const z = zonaU(0, CORTE.yPiso, CORTE.ancho, 148);
  if (es.piso === 'baldosa') baldosas(s, z);
  else pasto(s, z);
  if (tipo === 'suelo' && es.sombraPared > 1) {
    const h = px(30 * (es.sombraPared - 1)),
      j = px(CORTE.yPiso);
    s.rectPx(0, j, s.w, Math.max(0, h - 8), C.sombra);
    for (let k = 0; k < 8; k++)
      s.damero(0, j + h - 8 + k, s.w, 1, `rgba(24,20,70,${(0.32 - k * 0.04).toFixed(2)})`, 'rgba(0,0,0,0)', k);
  }
}

/** La cara de arriba de la cama: la tierra de las dos hileras con su labio y los terrones. */
function caraDeArriba(s: Superficie, c: CeldaDeEscena, xa: number, xb: number): void {
  const t = tierraDe(c),
    tabla = tablaDeTierra(t),
    i0 = px(xa),
    i1 = px(xb),
    j0 = px(CORTE.caraDeArriba),
    j1 = px(CORTE.yCorte);
  rellenarDeTierra(s, [i0, i1, j0, j1], tabla);
  for (let n = 0; n < ((i1 - i0) * (j1 - j0)) / 2600; n++) {
    const rx = 2 + Math.floor(hash(n, 1, 88) * 3);
    terron(
      s,
      i0 + 4 + Math.floor(hash(n, 2, 88) * (i1 - i0 - 8)),
      j0 + 12 + Math.floor(hash(n, 3, 88) * (j1 - j0 - 16)),
      rx,
      Math.max(1.4, rx * 0.65),
      t,
    );
  }
  // el labio de atrás, más oscuro, y el surco entre las dos hileras
  s.rectPx(i0, j0, i1 - i0, 12, mezcla(t, '#1e0f08', 0.42));
  s.rectPx(i0, j0 + 12, i1 - i0, 1, mezcla(t, '#e0b886', 0.3));
  s.rectPx(i0, px(138) - 1, i1 - i0, 1, 'rgba(255,240,200,0.16)');
  s.rectPx(i0, px(138), i1 - i0, 4, 'rgba(24,12,4,0.28)');
}

/** Piedritas con luz y sombra y terrones sueltos en una columna del corte. */
function granosDelCorte(s: Superficie, cx: number, [i0, i1, j0, j1]: number[], lim: number, t: string): void {
  const osc = mezcla(t, '#1e0f08', 0.55),
    sub = mezcla(t, '#c9a070', 0.35),
    ancho = i1 - i0;
  for (let n = 0; n < 16; n++) {
    const x = i0 + 5 + Math.floor(hash(n, cx, 89) * (ancho - 10)),
      arriba = n < 7,
      y = arriba
        ? j0 + 5 + Math.floor(hash(n, cx, 90) * Math.max(1, lim - j0 - 8))
        : lim + 6 + Math.floor(hash(n, cx, 91) * Math.max(1, j1 - lim - 12)),
      rx = 1.5 + hash(n, cx, 92) * 2;
    terron(s, x, y, rx, Math.max(1.2, rx * 0.65), arriba ? osc : sub);
  }
  for (let n = 0; n < 3; n++)
    terron(
      s,
      i0 + 6 + Math.floor(hash(n, cx, 93) * (ancho - 12)),
      lim + 8 + Math.floor(hash(n, cx, 94) * Math.max(1, j1 - lim - 16)),
      2.5 + hash(n, cx, 95),
      2,
      ['#a89880', '#8a7a68', '#b8a890'][n],
    );
}

/** Una columna del corte: materia orgánica arriba, grumos, piedritas, humedad y mantillo. */
function columnaDelCorte(s: Superficie, c: CeldaDeEscena, cx: number, X: number, cw: number, y0: number, prof: number) {
  const t = tierra(c.humedo),
    capa = Math.round(4 + (c.mo / 100) * prof * 0.55),
    caja: [number, number, number, number] = [px(X), px(X + cw), px(y0), px(y0 + prof)],
    lim = caja[2] + px(capa);
  tierraEnCapas(s, caja, tablasDelPerfil(t), lim, cx);
  granosDelCorte(s, cx, [caja[0], caja[1], caja[2], caja[3]], lim, t);
  for (let n = 0; n < c.humedo * 3; n++)
    gota(
      s,
      caja[0] + 12 + Math.floor(hash(n, cx, 96) * (caja[1] - caja[0] - 24)),
      caja[2] + 14 + Math.floor(hash(n + cx, 5, 97) * (caja[3] - caja[2] - 28)),
    );
  s.rectPx(caja[1] - 1, caja[2], 1, caja[3] - caja[2], 'rgba(0,0,0,0.15)');
  if (c.mulch) pajas(s, caja[0] - 2, caja[1] + 2, caja[2], cx);
}

/** Lo que hay debajo del cantero: baldosa del balcón, tierra del patio o el piso del cajón. */
function debajoDelCantero(s: Superficie, es: Escena, y0: number, prof: number, tipo: string): void {
  const z = zonaU(0, y0 + prof, CORTE.ancho, CORTE.ancho - y0 - prof);
  if (tipo === 'cajon' && es.piso === 'baldosa') {
    baldosas(s, z);
    return;
  }
  const tabla = tablaDeTierra(tipo === 'cajon' ? '#6b4a30' : '#a8794e');
  rellenarDeTierra(s, [z.i, z.i + z.w, z.j, z.j + z.h], tabla);
  const roca = tipo === 'cajon' ? '#8a6a50' : '#c9a070';
  for (let n = 0; n < 26; n++)
    terron(
      s,
      Math.floor(hash(n, 1, 98) * z.w),
      z.j + 8 + Math.floor(hash(n, 2, 98) * Math.max(1, z.h - 16)),
      2 + hash(n, 3, 98) * 2.5,
      1.6,
      roca,
    );
  if (tipo === 'cajon') {
    const pas = [empaquetar(C.pasto3), empaquetar(C.pasto), empaquetar(C.pasto2)];
    for (let i = 0; i < z.w; i++) {
      const alto = 1 + Math.floor(hash(i >> 1, 9, 99) * 3);
      for (let k = 0; k < alto; k++) s.set(i, z.j - 1 + k, pas[Math.min(2, k + (i % 3 === 0 ? 1 : 0))]);
    }
  }
}

/** El marco de madera del cajón, a los lados del corte, con su tabla de abajo. */
function marcoDelCorte(s: Superficie, xa: number, xb: number, y0: number, prof: number): void {
  const alto = 172 + prof - 112;
  tablon(s, zonaU(xa, 112, 6, alto), 7);
  tablon(s, zonaU(xb - 6, 112, 6, alto), 8);
  tablon(s, zonaU(xa, y0 + prof - 2, xb - xa, 4), 9);
  for (let n = 0; n < 3; n++) {
    clavo(s, px(xa + 3), px(y0 + 10 + n * 14));
    clavo(s, px(xb - 3), px(y0 + 10 + n * 14));
  }
}

/** La regla de profundidad: una marca cada 15 cm, con el número, y una media marca entre medio. */
function regla(s: Superficie, xb: number, y0: number, prof: number): void {
  for (let i = 1; i * 20 - 10 <= prof; i++) {
    const j = px(y0 + i * 20 - 10);
    s.rectPx(px(xb - 6), j + 1, px(6), 1, 'rgba(24,20,70,0.5)');
    s.rectPx(px(xb - 6), j, px(6), 1, C.blanco);
  }
  for (let i = 1; i * 20 <= prof; i++) {
    const j = px(y0 + i * 20),
      texto = String(i * 15),
      x = xb - 1.5 - anchoDeLetras(texto);
    s.rectPx(px(xb - 12), j + 2, px(12), 2, 'rgba(24,20,70,0.5)');
    s.rectPx(px(xb - 12), j, px(12), 2, C.blanco);
    letras(s, x + 0.5, y0 + i * 20 - 7 + 0.5, texto, C.anil, 1);
    letras(s, x, y0 + i * 20 - 7, texto, C.blanco, 1);
  }
}

/** La cama de tierra: su cara de arriba y el corte al frente, con el marco si es un cajón. */
export function cama(s: Superficie, es: Escena, D: DatosDelCorte, hondo: number): void {
  const xa = D.tipo === 'cajon' ? D.x0 - 6 : 0,
    xb = D.tipo === 'cajon' ? D.x0 + D.cols.length * D.cw + 6 : CORTE.ancho,
    y0 = CORTE.yCorte,
    prof = Math.round(hondo * CORTE.porCm),
    frente = D.filas[D.filas.length - 1];
  caraDeArriba(s, es.celdas[D.cols[0] + ',' + frente], xa, xb);
  debajoDelCantero(s, es, y0, prof, D.tipo);
  D.cols.forEach((cx, ci) => columnaDelCorte(s, es.celdas[cx + ',' + frente], cx, D.x0 + ci * D.cw, D.cw, y0, prof));
  if (D.tipo === 'cajon') marcoDelCorte(s, xa, xb, y0, prof);
  s.rectPx(px(xa), px(y0), px(xb - xa), 3, 'rgba(0,0,0,0.3)');
  regla(s, xb, y0, prof);
}
