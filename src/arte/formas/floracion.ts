/**
 * La planta que va a flor y a semilla (`semillando`) o que ya pasó (`pasada`, la misma con la paleta
 * seca). Conserva la base vegetativa de su forma y suma una vara floral propia de su familia: umbela
 * (apiáceas), racimo de cuatro pétalos (brasicáceas), panícula de capítulos (lechuga), espiga de
 * glomérulos (acelga, espinaca, remolacha), bola (cebollas), espiga con verticilos (labiadas), estrellas
 * (solanáceas), trompetas (zapallos) y flores de mariposa (leguminosas).
 */
import type { Estilo } from '../estilos';
import { PERFIL, hojaV } from '../hojas';
import { mezcla, rampaDe, rampaDeHoja, type Paleta, type Rampa } from '../paleta';
import { florcita, type Pincel } from '../pincel';
import { FORMAS } from './index';
import type { Postura } from './tipos';

/** El color de la flor de cada especie; las que no están usan el de su estilo (`florc`, `tinta`). */
const COLOR_DE_FLOR: Record<string, string> = {
  lechuga: '#ffd23f',
  radicchio: '#7aa0ff',
  espinaca: '#b8d878',
  acelga: '#9ab85a',
  remolacha: '#c0604a',
  rucula: '#fff6e0',
  kale: '#ffe34a',
  repollo: '#ffe34a',
  brocoli: '#ffd23f',
  coliflor: '#fff1b0',
  'repollitos-de-bruselas': '#ffe34a',
  nabo: '#ffe34a',
  rabanito: '#f4c8e8',
  berro: '#ffffff',
  zanahoria: '#fff6e0',
  apio: '#e8f0b0',
  perejil: '#d8e070',
  cilantro: '#fff0f4',
  eneldo: '#e8d84a',
  cebolla: '#f4eef8',
  ajo: '#f0e0f0',
  puerro: '#e8d0f4',
  'cebolla-de-verdeo': '#fff6e0',
  tomate: '#ffe34a',
  pimiento: '#fff6e0',
  'aji-picante': '#fff6e0',
  papa: '#fff6e0',
  frutilla: '#fff6e0',
  zapallo: '#ffb01f',
  'zapallito-de-tronco': '#ffd23f',
  pepino: '#ffe34a',
  melon: '#ffe34a',
  sandia: '#ffe34a',
  batata: '#c48aff',
  laurel: '#d8e070',
};

/** La altura de la vara de cada familia, en unidades de dibujo. */
const ALTURA: Record<string, number> = {
  apiacea: 27,
  brasicacea: 26,
  asteracea: 28,
  quenopodiacea: 30,
  aliacea: 24,
  lamiacea: 22,
  solanacea: 26,
  leguminosa: 24,
};

interface Vara {
  slug: string;
  color: string;
  sec: boolean;
  st: Postura;
  /** el tallo y la flor */
  tallo: Rampa;
  flor: Rampa;
  hoja: Rampa;
  /** la altura de la vara y dónde queda su punta con el viento */
  top: number;
  xx: number;
}

const rad = (g: number): number => (g * Math.PI) / 180;
const secar = (c: string): string => mezcla(c, '#b89a4a', 0.6);

/** El tallo de la vara: un polígono que se afina hacia la punta y se mece con el viento. */
function tallo(B: Pincel, v: Vara, desde: number, g: number): void {
  B.volumen(
    B.mascara().poligono([
      [-g / 2, -desde],
      [g / 2, -desde],
      [v.xx + g * 0.3, -v.top],
      [v.xx - g * 0.3, -v.top],
    ]),
    v.tallo,
  );
}

/** El x del tallo a una altura, para colgar cosas de él. */
const xEn = (v: Vara, y: number): number => (v.xx * y) / v.top;

/** una flor de cuatro pétalos en cruz */
function cruz(B: Pincel, x: number, y: number, r: number, flor: Rampa): void {
  B.volumen(
    B.mascara()
      .elipse(x - r, y, r * 0.7, r * 0.6)
      .elipse(x + r, y, r * 0.7, r * 0.6)
      .elipse(x, y - r, r * 0.6, r * 0.7)
      .elipse(x, y + r, r * 0.6, r * 0.7),
    flor,
  );
  B.r(x - 0.25, y - 0.25, 0.5, 0.5, flor[1]);
}

/** apiáceas: una umbela de rayos con florcitas en la punta de cada uno */
function umbelaEn(B: Pincel, v: Vara, cx: number, cy: number, r: number): void {
  const n = 11;
  for (let k = 0; k < n; k++) {
    const an = rad(-170 + (k * 160) / (n - 1)),
      ex = cx + Math.cos(an) * r,
      ey = cy + Math.sin(an) * r * 0.62;
    B.linea(cx, cy + 1, ex, ey, v.tallo[3], 0.25);
    B.volumen(B.mascara().elipse(ex, ey, 1.2, 1), v.flor);
  }
  B.volumen(B.mascara().elipse(cx, cy - r * 0.45, r * 0.45, r * 0.3), v.flor);
}

function umbela(B: Pincel, v: Vara): void {
  tallo(B, v, 5, 1.2);
  const by = v.top * 0.6,
    bx = xEn(v, by) - 5.5;
  B.linea(xEn(v, v.top * 0.42), -v.top * 0.42, bx, -by, v.tallo[3], 0.25);
  umbelaEn(B, v, bx, -by - 1, 4);
  umbelaEn(B, v, v.xx, -v.top, 7);
}

/** brasicáceas: un racimo ramificado de flores en cruz; secas, vainitas finas colgando */
function racimo(B: Pincel, v: Vara): void {
  tallo(B, v, 5, 1.1);
  const ramas: [number, number][] = [
    [0.4, -1],
    [0.55, 1],
    [0.7, -1],
    [0.85, 1],
  ];
  for (const [u, lado] of ramas) {
    const y = v.top * u,
      x = xEn(v, y),
      ex = x + lado * 6,
      ey = y + 4;
    B.linea(x, -y, ex, -ey, v.tallo[3], 0.25);
    for (let k = 1; k <= 3; k++) {
      const fx = x + (ex - x) * (k / 3),
        fy = -y + (-ey + y) * (k / 3);
      if (v.sec) B.linea(fx, fy, fx + lado * 0.8, fy + 4, v.flor[2], 0.25);
      else cruz(B, fx, fy, 1.25 - k * 0.15, v.flor);
    }
  }
  for (let k = 0; k < 4; k++) {
    const fy = -v.top + k * 1.9;
    if (v.sec) B.linea(v.xx, fy, v.xx + (k % 2 ? 1 : -1), fy + 4, v.flor[2], 0.25);
    else cruz(B, v.xx, fy, k === 0 ? 0.8 : 1.3, k === 0 ? v.hoja : v.flor);
  }
}

/** compuestas chicas (lechuga): hojitas que abrazan la vara y una panícula de capítulos arriba */
function panicula(B: Pincel, v: Vara): void {
  tallo(B, v, 5, 1.2);
  for (let y = 8; y < v.top - 5; y += 5) {
    const x = xEn(v, y);
    for (const lado of [1, -1]) hojaV(B, x, -y, 4.4, 1.6, -90 + lado * 62, v.hoja, PERFIL.lanza);
  }
  for (let k = 0; k < 5; k++) {
    const an = rad(-150 + k * 30),
      ex = v.xx + Math.cos(an) * 7,
      ey = -v.top + 4 + Math.sin(an) * 6;
    B.linea(v.xx, -v.top + 3, ex, ey, v.tallo[3], 0.25);
    if (v.sec) B.volumen(B.mascara().elipse(ex, ey - 0.8, 1.3, 1.4), rampaDe('#e8e0c0'));
    else florcita(B, ex, ey - 0.5, k % 2 ? 1.6 : 1.3, v.color, '#c8741a', true);
  }
}

/** quenopodiáceas: glomérulos apretados a lo largo de la parte de arriba de la vara (la acelga, más gruesa y con bolas más grandes) */
const GLOMERULOS: Record<string, [number, number]> = { acelga: [1.7, 2], espinaca: [0.95, 0.9] };

function espiga(B: Pincel, v: Vara): void {
  const [r, g] = GLOMERULOS[v.slug] ?? [1.3, 1.4];
  tallo(B, v, 5, g);
  for (let y = 8; y < v.top * 0.55; y += 6) {
    const x = xEn(v, y);
    hojaV(B, x, -y, 5, 2.2, -150, v.hoja, PERFIL.oval);
    hojaV(B, x, -y, 5, 2.2, -30, v.hoja, PERFIL.oval);
  }
  for (let y = v.top * 0.45, k = 0; y < v.top; y += r * 1.5, k++) {
    const x = xEn(v, y) + (k % 2 ? r : -r);
    B.volumen(B.mascara().elipse(x, -y, r, r * 0.9), k % 3 ? v.flor : v.hoja);
  }
}

/** aliáceas: un escapo sin hojas con una bola de florcitas (el ajo lo rula y lleva bulbillos; el puerro, la bola más grande) */
const RADIO_DE_BOLA: Record<string, number> = { puerro: 4.4, ajo: 2.2, 'cebolla-de-verdeo': 2.8 };

function bola(B: Pincel, v: Vara): void {
  const ajo = v.slug === 'ajo',
    R = RADIO_DE_BOLA[v.slug] ?? 3.6;
  tallo(B, v, 2, v.slug === 'cebolla' ? 2.1 : 1.5);
  let cx = v.xx,
    cy = -v.top - R * 0.5;
  if (ajo) {
    // el escapo del ajo hace un rulo antes de dar los bulbillos
    for (let k = 0; k < 9; k++)
      B.disco(v.xx + Math.sin(k * 0.6) * 3, -v.top + k * 0.2 - Math.cos(k * 0.6) * 2.6, 0.5, v.tallo[3]);
    cx = v.xx + 3.4;
    cy = -v.top - 1.4;
  }
  B.volumen(B.mascara().elipse(cx, cy, R, R * 0.95), v.flor);
  for (let k = 0; k < 16; k++) {
    const an = k * 2.4,
      d = 0.3 + ((k * 7) % 10) * 0.09 * R;
    B.disco(cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.95, 0.5, v.flor[5]);
  }
  if (v.sec)
    for (let k = 0; k < 6; k++)
      B.r(cx + Math.cos(k * 1.1) * R * 0.65, cy + Math.sin(k * 1.1) * R * 0.6, 0.5, 0.5, '#2a160c');
}

/** labiadas: una espiga de verticilos de flores del color de la especie */
function labiada(B: Pincel, v: Vara): void {
  tallo(B, v, 4, 1);
  for (let y = v.top * 0.4, k = 0; y < v.top - 2; y += 3, k++) {
    const x = xEn(v, y);
    for (const lado of [1, -1]) {
      hojaV(B, x, -y, 2.6, 1.4, -90 + lado * 40, v.flor, PERFIL.oval);
      if (k % 2 === 0) hojaV(B, x, -y + 0.5, 3.2, 1.6, -90 + lado * 80, v.hoja, PERFIL.oval);
    }
  }
  hojaV(
    B,
    v.xx,
    -v.top + 1.5,
    v.slug === 'lavanda' ? 10 : 5.6,
    v.slug === 'lavanda' ? 2.6 : 2.4,
    -90,
    v.flor,
    PERFIL.lanza,
  );
}

/** solanáceas: ramas con estrellas (el tomate, de a racimos; la papa, un cúmulo arriba; el ají, chicas y colgando) */
function estrellas(B: Pincel, v: Vara): void {
  const aji = v.slug === 'aji-picante',
    papa = v.slug === 'papa',
    r = aji ? 1.5 : 2.1;
  tallo(B, v, 5, 1.2);
  for (const [u, lado] of [
    [0.45, -1],
    [0.65, 1],
    [0.82, -1],
  ] as const) {
    const y = v.top * u,
      x = xEn(v, y),
      ex = x + lado * (papa ? 3.5 : 5.5),
      ey = y + (aji ? -1 : 3);
    B.linea(x, -y, ex, -ey, v.tallo[3], 0.25);
    florcita(B, ex, -ey + (aji ? 2 : 0), r, v.color, '#c8741a', true);
    if (papa) florcita(B, ex + lado * 2.4, -ey + 1.5, 1.6, v.color, '#ffd23f', true);
  }
  florcita(B, v.xx, -v.top, papa ? 2.6 : 2.3, v.color, '#c8741a', true);
  if (papa) for (const dx of [-3, 3]) florcita(B, v.xx + dx, -v.top + 2, 1.9, v.color, '#ffd23f', true);
}

/** cucurbitáceas: trompetas grandes sobre las guías (zapallos) o estrellitas (pepino, melón, sandía) */
function trompetas(B: Pincel, v: Vara): void {
  const estrella = ['pepino', 'melon', 'sandia'].includes(v.slug);
  for (const [x, y] of [
    [-6, 10],
    [5, 15],
    [-1, 20],
  ]) {
    B.linea(x * 0.6, -4, x, -y + 2, v.tallo[3], 0.25);
    if (estrella) florcita(B, x, -y + 1, 1.9, v.color, '#c8741a', true);
    else {
      const g = v.slug === 'zapallo' ? 1.15 : 1;
      for (let k = -2; k <= 2; k++) hojaV(B, x, -y + 1, 4.4 * g, 2.1 * g, -90 + k * 26, v.flor, PERFIL.oval);
      B.volumen(B.mascara().elipse(x, -y + 0.6, 1.2, 0.8), v.hoja);
    }
  }
}

/** leguminosas: flores de mariposa de a pares en la parte de arriba */
function mariposas(B: Pincel, v: Vara): void {
  for (let y = 12, k = 0; y < v.top + 4; y += 3.6, k++) {
    const lado = k % 2 ? 1 : -1,
      x = xEn(v, y) + lado * 2.6;
    B.volumen(B.mascara().elipse(x, -y, 1.7, 1.5), v.flor);
    B.volumen(B.mascara().elipse(x - lado * 1.4, -y + 1, 1, 0.9), rampaDe(mezcla(v.color, '#ffffff', 0.35)));
    B.r(x - 0.25, -y + 1.5, 0.5, 0.5, v.flor[1]);
  }
}

/** frutilla: tallitos finos con flores blancas por encima de las hojas */
function florDeFrutilla(B: Pincel, v: Vara): void {
  for (const [x, y] of [
    [-6, 12],
    [1, 15],
    [7, 11],
  ]) {
    B.linea(x * 0.5, -3, x, -y + 1, v.tallo[3], 0.25);
    florcita(B, x, -y, 1.8, v.color, '#ffd23f', true);
  }
}

/** laurel: ramilletes de florcitas amarillo verdosas entre las hojas de la copa */
function ramilletes(B: Pincel, v: Vara): void {
  for (let k = 0; k < 10; k++) {
    const an = rad(-160 + k * 16),
      x = v.xx + Math.cos(an) * 8,
      y = -v.top * 0.82 + Math.sin(an) * 7;
    B.volumen(B.mascara().elipse(x, y, 1.2, 1.1), v.flor);
  }
}

/** Qué vara lleva cada familia; las que no están se resuelven por la forma de la planta. */
const POR_FAMILIA: Record<string, (B: Pincel, v: Vara) => void> = {
  apiacea: umbela,
  brasicacea: racimo,
  quenopodiacea: espiga,
  aliacea: bola,
  lamiacea: labiada,
  solanacea: estrellas,
  cucurbitacea: trompetas,
  leguminosa: mariposas,
};

/** Las formas que ya traen su flor: se dibujan maduras, con su flor o su cabeza. */
const MADURAS = new Set(['alta', 'flor']);

/** la edad a la que se dibuja la base vegetativa de cada forma */
const BASE: Record<string, number> = { trepadora: 0.8, rastrera: 0.6 };

function varaDe(familia: string | undefined, e: Estilo): ((B: Pincel, v: Vara) => void) | null {
  if (e.f === 'baja') return florDeFrutilla;
  if (e.tipo === 'arbolito') return ramilletes;
  if (e.f === 'rastrera' && !familia?.startsWith('cucurb')) return trompetas;
  if (e.f === 'roseta' && familia === 'asteracea') return panicula;
  return POR_FAMILIA[familia ?? ''] ?? null;
}

/**
 * La planta que florece: su base vegetativa y la vara floral de su familia. `sec` es la planta que
 * ya pasó: todo con la paleta seca.
 */
export function floracion(
  B: Pincel,
  slug: string,
  familia: string | undefined,
  e: Estilo,
  pal: Paleta,
  st: Postura,
  sec: boolean,
): void {
  if (MADURAS.has(e.f)) return FORMAS[e.f](B, 1, e, pal, { ...st, madura: true });
  const vara = varaDe(familia, e);
  FORMAS[e.f](B, BASE[e.f] ?? 0.55, e, pal, { ...st, madura: false });
  if (!vara) return;
  const color0 = COLOR_DE_FLOR[slug] ?? e.florc ?? e.tinta ?? '#ffe34a',
    color = sec ? secar(color0) : color0,
    top = ALTURA[familia ?? ''] ?? 26;
  vara(B, {
    slug,
    color,
    sec,
    st,
    tallo: rampaDe(sec ? '#b89a4a' : mezcla(pal.o, '#2f8a46', 0.5)),
    flor: rampaDe(color),
    hoja: rampaDeHoja(pal),
    top,
    xx: st.dx(-top),
  });
}
