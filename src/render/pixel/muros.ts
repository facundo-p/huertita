/**
 * Lo que cierra el patio por el norte y por el sur, píxel a píxel: el paredón de ladrillo con su hiedra
 * y su humedad, la baranda del balcón con los techos de enfrente, el cielo, la casa o la galería, y la
 * sombra que el paredón le echa al patio.
 */
import { PERFIL, hojaV, mezcla, pincel, rampaDeHoja } from '../../arte';
import { V } from '../../arte/paleta';
import type { Escena } from '../contrato';
import type { GeometriaPlana } from './camaras/plano';
import { C, cielo } from './paleta';
import { empaquetar, hash, Superficie } from './superficie';

const px = Superficie.px;

/** El cielo: dos colores con una franja de damero en el medio y nubes de damero. */
export function cieloDeBanda(
  s: Superficie,
  j0: number,
  j1: number,
  [arriba, horizonte]: [string, string],
  nubes: boolean,
): void {
  const h = j1 - j0,
    corte = j0 + Math.round(h * 0.55);
  s.rectPx(0, j0, s.w, h, arriba);
  s.damero(0, corte - 4, s.w, 8, arriba, horizonte);
  s.rectPx(0, corte + 4, s.w, j1 - corte - 4, horizonte);
  if (!nubes) return;
  for (let n = 0; n < s.w / 220; n++) {
    const cx = Math.floor(hash(n, 1, 31) * s.w),
      cy = j0 + 6 + Math.floor(hash(n, 2, 31) * Math.max(2, h * 0.3));
    s.elipsePx(cx, cy, 22, 4, '#ffffff');
    s.elipsePx(cx + 12, cy - 3, 12, 4, '#ffffff');
    s.rectPx(cx - 20, cy + 3, 40, 1, mezcla(horizonte, '#ffffff', 0.5));
  }
}

/** Una hiedra que sube por el paredón: un tallo oscuro y hojas de a pares. */
function hiedra(s: Superficie, x: number, alto: number, base: number, semilla: number): void {
  const B = pincel(s, 0, 0, 1),
    rampa = rampaDeHoja(V),
    n = Math.round(alto / 1.5);
  let antes: [number, number] | null = null;
  for (let k = 0; k <= n; k++) {
    const y = base - k * 1.5,
      vx = x + Math.sin(k * 0.45 + semilla) * 3.5,
      p: [number, number] = [Superficie.px(vx), Superficie.px(y)];
    if (antes) {
      s.lineaPx(antes[0], antes[1], p[0], p[1], '#1f4a2e');
      s.lineaPx(antes[0] + 1, antes[1], p[0] + 1, p[1], '#2f6a3e');
    }
    antes = p;
    if (k % 2 === 1) hojaV(B, vx, y, 3.4, 2.4, -90 + (k % 4 === 1 ? 62 : -62), rampa, PERFIL.oval);
  }
}

/** El paredón de ladrillo: ladrillos de tonos distintos con luz y sombra, juntas, desportillados, musgo y humedad al pie. */
export function paredon(s: Superficie, y0: number, y1: number): void {
  const ancho = px(16),
    alto = px(6),
    j0 = px(y0),
    j1 = px(y1),
    tonos = ['#c9573a', '#bf4a32', '#d46844', '#b8442f', '#cc5c3c', '#c24e36'];
  s.rectPx(0, j0, s.w, j1 - j0, '#d9ae8a');
  for (let f = 0; j0 + f * alto < j1; f++) {
    const yy = j0 + f * alto,
      desfase = (f % 2) * (ancho >> 1);
    for (let xx = -desfase; xx < s.w; xx += ancho) {
      const n = Math.floor(hash(xx, f, 32) * tonos.length),
        c = mezcla(tonos[n], '#e08a5a', Math.max(0, 0.18 - ((yy - j0) / (j1 - j0)) * 0.5)),
        a = Math.max(0, xx + 1),
        w = Math.min(s.w, xx + ancho - 1) - a,
        h = Math.min(alto - 1, j1 - yy);
      if (w <= 0) continue;
      s.rectPx(a, yy, w, h, c);
      s.rectPx(a, yy, w, 1, mezcla(c, '#ffd2a8', 0.38));
      s.rectPx(a, yy + h - 1, w, 1, mezcla(c, '#4a1a3a', 0.38));
      s.rectPx(a, yy, 1, h, mezcla(c, '#ffd2a8', 0.15));
      const motas = [empaquetar(mezcla(c, '#f0b890', 0.5)), empaquetar(mezcla(c, '#8a2e2a', 0.5))];
      for (let k = 0; k < (w * h) / 14; k++)
        s.set(a + Math.floor(hash(xx + k, f, 33) * w), yy + Math.floor(hash(k, xx + f, 34) * h), motas[k % 2]);
      if (hash(xx, f, 35) < 0.12) s.rectPx(a + w - 12, yy, 12, 8, '#d9ae8a');
    }
  }
  // luz del sol arriba y humedad al pie: velos transparentes en damero, para que se sigan viendo los ladrillos
  for (let i = 0; i < 8; i++)
    s.damero(0, j0 + i, s.w, 1, `rgba(255,214,170,${(0.34 - i * 0.04).toFixed(2)})`, 'rgba(0,0,0,0)', i);
  for (let i = 0; i < 44; i++)
    s.damero(0, j1 - 44 + i, s.w, 1, `rgba(90,30,50,${(0.04 + (i / 44) * 0.42).toFixed(2)})`, 'rgba(0,0,0,0)', i);
  // musgo
  for (let n = 0; n < s.w / 40; n++) {
    const mx = Math.floor(hash(n, 1, 36) * s.w),
      my = j1 - 6 - Math.floor(hash(n, 2, 36) * 50);
    for (let k = 0; k < 10; k++)
      s.px(
        mx + Math.floor(hash(n, k, 37) * 20) - 10,
        my + Math.floor(hash(k, n, 38) * 6) - 3,
        ['#2f6a3a', '#3f8a46', '#5aa04a'][k % 3],
      );
  }
  for (let n = 0; n < s.w / 280; n++)
    hiedra(s, 8 + Math.floor(hash(n, 3, 39) * (s.w / 4 - 16)), (j1 - j0) / 4 - 6, y1 - 1, n);
}

/** La baranda del balcón: cielo, los techos de enfrente con sus ventanas y los barrotes. */
function baranda(s: Superficie, y0: number, y1: number, colores: [string, string]): void {
  const j0 = px(y0),
    j1 = px(y1);
  cieloDeBanda(s, j0, j1, colores, true);
  for (let n = 0; n < s.w / 90; n++) {
    const x = Math.floor(hash(n, 1, 41) * (s.w - 130)),
      h = 20 + Math.floor(hash(n, 2, 41) * (j1 - j0) * 0.4),
      w = 70 + Math.floor(hash(n, 3, 41) * 60),
      c = n % 2 ? '#8f86c8' : '#a59ad6';
    s.rectPx(x, j1 - 12 - h, w, h, c);
    s.rectPx(x, j1 - 12 - h, w, 2, mezcla(c, '#ffffff', 0.3));
    s.rectPx(x + w - 3, j1 - 12 - h, 3, h, mezcla(c, '#1d1b4b', 0.25));
    for (let v = 0; v < (w * h) / 600; v++)
      s.rectPx(
        x + 6 + Math.floor(hash(v, n, 42) * (w - 14)),
        j1 - 12 - h + 6 + Math.floor(hash(n, v, 43) * (h - 12)),
        4,
        5,
        hash(v, n, 44) > 0.5 ? '#ffe9a0' : '#4a48a0',
      );
  }
  for (let x = px(3); x < s.w; x += px(8)) {
    s.rectPx(x, j0 + 16, 7, j1 - j0 - 16, '#2a2869');
    s.rectPx(x, j0 + 16, 2, j1 - j0 - 16, '#4a48a0');
    s.rectPx(x + 5, j0 + 16, 2, j1 - j0 - 16, '#1d1b4b');
  }
  s.rectPx(0, j0 + 8, s.w, 12, '#1d1b4b');
  s.rectPx(0, j0 + 8, s.w, 3, '#5a58b0');
  s.rectPx(0, j1 - 12, s.w, 12, '#1d1b4b');
  s.rectPx(0, j1 - 12, s.w, 2, '#4a48a0');
}

/** El norte: cielo (si se mira desde la galería) y el paredón o la baranda. */
export function norte(s: Superficie, es: Escena, G: GeometriaPlana): void {
  const colores = cielo(es.estacion);
  if (G.obl) cieloDeBanda(s, 0, px(10), colores, false);
  const y0 = G.obl ? 10 : 0;
  if (es.norte === 'baranda') baranda(s, y0, G.muro, colores);
  else paredon(s, y0, G.muro);
}

/** La galería vista desde la galería: baldosas a cuadros con junta y bisel, y el zócalo de la casa. */
function galeria(s: Superficie, yc: number, hc: number): void {
  const L = px(16),
    j0 = px(yc),
    h = px(hc),
    paletas: number[][] = [0, 1].map((par) => {
      const base = par ? '#d9704a' : '#f0d8a8';
      return [
        base,
        mezcla(base, '#6a3a20', 0.2),
        mezcla(base, '#ffffff', 0.25),
        mezcla(base, '#6a3a20', 0.35),
        mezcla(base, '#ffffff', 0.3),
        mezcla(base, '#6a3a20', 0.14),
      ].map(empaquetar);
    });
  for (let y = j0; y < j0 + h; y++)
    for (let x = 0; x < s.w; x++) {
      const tx = Math.floor(x / L),
        ty = Math.floor((y - j0) / L),
        u = x - tx * L,
        v = y - j0 - ty * L,
        P = paletas[(tx + ty) % 2],
        r = hash(x, y, 45);
      let c = P[0];
      if (r < 0.05) c = P[1];
      else if (r > 0.96) c = P[2];
      if (u < 2 || v < 2) c = P[3];
      else if (u === 2 || v === 2) c = P[4];
      else if (u >= L - 3 || v >= L - 3) c = P[5];
      s.set(x, y, c);
    }
  s.rectPx(0, j0, s.w, 8, C.casa2);
  s.rectPx(0, j0 + 8, s.w, 3, mezcla(C.casa2, '#000000', 0.2));
  s.rectPx(0, j0 + h - 20, s.w, 20, C.techo2);
  s.rectPx(0, j0 + h - 20, s.w, 4, C.techo3);
}

/** El techo de tejas de la casa, visto desde arriba: hileras de tejas con luz y sombra. */
function techo(s: Superficie, j0: number, j1: number): void {
  for (let f = 0; j0 + f * 12 < j1; f++)
    for (let x = -((f % 2) * 16); x < s.w; x += 32) {
      const c = hash(x, f, 46) < 0.2 ? mezcla(C.techo, '#1d1b4b', 0.15) : C.techo;
      s.rectPx(Math.max(0, x), j0 + f * 12, Math.min(30, s.w - x), 11, c);
      s.rectPx(Math.max(0, x), j0 + f * 12, Math.min(30, s.w - x), 3, C.techo3);
      s.rectPx(Math.max(0, x), j0 + f * 12 + 8, Math.min(30, s.w - x), 3, C.techo2);
    }
}

/** La puerta y la ventana de la casa. */
function aberturas(s: Superficie, W: number, yc: number): void {
  const pi = px(W - 56),
    pj = px(yc + 14),
    vi = px(W - 88),
    vj = px(yc + 16);
  s.rectPx(pi, pj, px(16), px(18), C.puerta);
  s.rectPx(pi, pj, px(16), 8, '#a8341d');
  s.rectPx(pi + 6, pj + 14, px(16) - 12, 20, '#c0412a');
  s.rectPx(pi + 6, pj + 42, px(16) - 12, 20, '#c0412a');
  s.elipsePx(pi + px(16) - 10, pj + px(9), 3, 3, C.paja);
  s.rectPx(vi - 3, vj - 3, px(20) + 6, px(12) + 6, C.casa2);
  s.rectPx(vi, vj, px(20), px(12), '#7fd6e0');
  s.rectPx(vi, vj, px(20), 10, '#9ae6ee');
  s.rectPx(vi + px(9), vj, 8, px(12), C.casa2);
  s.rectPx(vi, vj + px(5), px(20), 8, C.casa2);
  s.rectPx(vi + 6, vj + 6, 14, 8, '#c8f4f8');
  s.rectPx(vi - 4, vj + px(12) + 3, px(20) + 8, 6, mezcla(C.casa2, '#000000', 0.2));
}

/** La casa desde arriba, o las baldosas de la galería desde la galería. */
export function casa(s: Superficie, es: Escena, G: GeometriaPlana): void {
  const yc = G.fy(es.alto - 1),
    hc = G.fh(es.alto - 1);
  if (G.obl) return galeria(s, yc, hc);
  s.rectPx(0, px(yc), s.w, px(hc), C.casa);
  for (let k = 0; k < (s.w * px(hc)) / 30; k++)
    s.px(
      Math.floor(hash(k, 1, 47) * s.w),
      px(yc) + Math.floor(hash(k, 2, 47) * px(hc)),
      mezcla(C.casa, '#c8b880', 0.5),
    );
  techo(s, px(yc), px(yc + 13));
  s.rectPx(0, px(yc + 13) - 6, s.w, 6, C.techo2);
  aberturas(s, G.W, yc);
}

/** La sombra que el paredón le echa al patio: transparente, con el borde de abajo en damero. */
export function sombraDelParedon(s: Superficie, es: Escena, G: GeometriaPlana): void {
  if (es.sombraPared <= 0) return;
  const j0 = px(G.muro),
    h = px(es.sombraPared * G.TH);
  s.rectPx(0, j0, s.w, h, C.sombra);
  s.damero(0, j0 + h, s.w, 6, C.sombra, 'rgba(24,20,70,0.16)');
}
