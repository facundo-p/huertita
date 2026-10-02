/**
 * Los bancales, píxel a píxel: la tierra con su textura según la humedad y la materia orgánica, el cajón
 * de tablones con vetas, nudos y clavos, las macetas de terracota, la almaciguera, el mantillo de paja y
 * la compostera. La luz viene de arriba a la izquierda: cada cosa tiene su cara clara y su cara oscura.
 */
import { mezcla } from '../../arte';
import type { CeldaDeEscena, Escena } from '../contrato';
import type { GeometriaPlana } from './camaras/plano';
import type { CeldaEnPantalla } from './geometria';
import { C, T, tierra } from './paleta';
import { empaquetar, hash, porBloques, Superficie } from './superficie';

const px = Superficie.px;

/** una región de píxeles */
interface Zona {
  i: number;
  j: number;
  w: number;
  h: number;
}

const zonaDe = (q: CeldaEnPantalla): Zona => ({ i: px(q.x), j: px(q.y), w: px(T), h: px(q.h) });

/** El color base de la tierra de una celda: más húmeda, más oscura; con mucha materia orgánica, casi negra. */
export function tierraDe(c: CeldaDeEscena): string {
  const base = tierra(c.humedo);
  return c.mo >= 75 ? mezcla(base, '#2a160c', 0.45) : base;
}

/** Ruido suave de baja frecuencia entre 0 y 1: las manchas de tierra más seca o más húmeda. */
function mancha(i: number, j: number, paso: number): number {
  const x = i / paso,
    y = j / paso,
    x0 = Math.floor(x),
    y0 = Math.floor(y),
    fx = x - x0,
    fy = y - y0;
  return (
    hash(x0, y0, 51) * (1 - fx) * (1 - fy) +
    hash(x0 + 1, y0, 51) * fx * (1 - fy) +
    hash(x0, y0 + 1, 51) * (1 - fx) * fy +
    hash(x0 + 1, y0 + 1, 51) * fx * fy
  );
}

const tablas = new Map<string, number[]>();

/**
 * Los colores de la tierra de una celda ya empaquetados: nueve niveles de mancha (de más oscura a más
 * clara) con tres variantes cada uno [normal, grano oscuro, grano claro].
 */
export function tablaDeTierra(base: string): number[] {
  let t = tablas.get(base);
  if (!t) {
    t = [];
    for (let n = 0; n < 9; n++) {
      const m = (n + 0.5) / 9,
        c = mezcla(base, m > 0.5 ? '#c9a070' : '#2a160c', Math.abs(m - 0.5) * 0.35);
      t.push(empaquetar(c), empaquetar(mezcla(c, '#1e0f08', 0.35)), empaquetar(mezcla(c, '#e0b886', 0.4)));
    }
    tablas.set(base, t);
  }
  return t;
}

/** El color de un píxel de tierra de una tabla: el nivel de mancha y un grano más oscuro o más claro. */
export function granoDeTierra(i: number, j: number, tabla: number[]): number {
  return elegirGrano(tabla, Math.min(8, Math.floor(mancha(i >> 2, j >> 2, 7) * 9)) * 3, hash(i, j, 52));
}

/** De la tabla de tierra, el color del nivel de mancha: casi siempre el normal, a veces un grano oscuro o claro. */
function elegirGrano(tabla: number[], nivel: number, r: number): number {
  if (r < 0.1) return tabla[nivel + 1];
  return tabla[nivel + (r > 0.94 ? 2 : 0)];
}

/** Un terrón o una piedrita en la tierra: cuerpo, luz arriba a la izquierda, sombra abajo a la derecha. */
const coloresDeTerron = new Map<string, [string, string, string]>();
function terron(s: Superficie, cx: number, cy: number, rx: number, ry: number, base: string): void {
  let c = coloresDeTerron.get(base);
  if (!c) {
    c = [mezcla(base, '#1e0f08', 0.5), mezcla(base, '#c9a070', 0.18), mezcla(base, '#f0d0a0', 0.32)];
    coloresDeTerron.set(base, c);
  }
  s.elipsePx(cx + 1, cy + 1, rx, ry, c[0]);
  s.elipsePx(cx, cy, rx, ry, c[1]);
  s.elipsePx(cx - 1, cy - 1, Math.max(0.8, rx - 1.4), Math.max(0.8, ry - 1), c[2]);
}

/** La tierra de una región: textura, terrones, brotecitos de yuyo y, si está seca, grietas. */
function tierraEn(s: Superficie, z: Zona, c: CeldaDeEscena): void {
  const base = tierraDe(c),
    tabla = tablaDeTierra(base);
  // las manchas son de bloques de 4 × 4 píxeles; cada píxel suma su granito
  porBloques(z.i, z.j, z.w, z.h, (bx, by, bw, bh) => {
    const nivel = Math.min(8, Math.floor(mancha(bx >> 2, by >> 2, 7) * 9)) * 3;
    for (let y = by; y < by + bh; y++)
      for (let x = bx; x < bx + bw; x++) s.set(x, y, elegirGrano(tabla, nivel, hash(x, y, 52)));
  });
  for (let n = 0; n < (z.w * z.h) / 380; n++) {
    const rx = 2 + Math.floor(hash(n, z.i, 53) * 3);
    terron(
      s,
      z.i + 4 + Math.floor(hash(n, z.i, 54) * (z.w - 8)),
      z.j + 4 + Math.floor(hash(n, z.j, 55) * (z.h - 8)),
      rx,
      Math.max(1.4, rx * 0.65),
      base,
    );
  }
  if (c.humedo === 0) grietas(s, z);
  else if (c.humedo >= 3) gotas(s, z);
  for (let x = z.i + px(6); x < z.i + z.w; x += px(10))
    for (let y = z.j + 4; y < z.j + z.h - 4; y++) s.px(x, y, 'rgba(0,0,0,0.09)');
}

/** Grietas de tierra seca: líneas quebradas de un píxel. */
function grietas(s: Superficie, z: Zona): void {
  for (let n = 0; n < 3; n++) {
    let x = z.i + 8 + Math.floor(hash(n, z.i, 56) * (z.w - 16)),
      y = z.j + 6 + Math.floor(hash(n, z.j, 57) * (z.h - 14));
    for (let k = 0; k < 12; k++) {
      s.px(x, y, 'rgba(60,36,20,0.55)');
      x += hash(k, n + z.i, 58) < 0.5 ? 1 : 0;
      y += 1;
    }
  }
}

/** Gotas de agua en la tierra empapada: una gota azul con un destello. */
function gotas(s: Superficie, z: Zona): void {
  for (let n = 0; n < 5; n++) {
    const x = z.i + 8 + Math.floor(hash(n, z.i, 59) * (z.w - 16)),
      y = z.j + 6 + Math.floor(hash(n, z.j, 60) * (z.h - 14));
    s.rectPx(x, y, 2, 3, '#4aa6d8');
    s.px(x, y, '#d8f6ff');
  }
}

/** La sombra que una pared o un borde le echa a la tierra: un degradé en damero hacia adentro. */
function oscurecerBorde(s: Surface, z: Zona, lado: 'n' | 's' | 'o' | 'e', grosor: number): void {
  for (let k = 0; k < grosor; k++) {
    const a = 0.34 * (1 - k / grosor);
    for (let t = 0; t < (lado === 'n' || lado === 's' ? z.w : z.h); t++) {
      if (k > 1 && (t + k) % 2) continue;
      const x = { o: z.i + k, e: z.i + z.w - 1 - k, n: z.i + t, s: z.i + t }[lado],
        y = { n: z.j + k, s: z.j + z.h - 1 - k, o: z.j + t, e: z.j + t }[lado];
      s.px(x, y, `rgba(20,10,4,${a.toFixed(2)})`);
    }
  }
}
type Surface = Superficie;

/** El labio de un cantero de tierra: un borde de tierra apisonada con luz arriba y sombra abajo. */
function labio(s: Superficie, z: Zona, c: CeldaDeEscena): void {
  const base = tierraDe(c);
  if (c.borde.n) {
    s.rectPx(z.i, z.j, z.w, 3, mezcla(base, '#1e0f08', 0.45));
    s.rectPx(z.i, z.j + 3, z.w, 1, mezcla(base, '#e0b886', 0.3));
  }
  if (c.borde.s) {
    s.rectPx(z.i, z.j + z.h - 3, z.w, 3, mezcla(base, '#1e0f08', 0.5));
    s.rectPx(z.i, z.j + z.h - 4, z.w, 1, mezcla(base, '#e0b886', 0.25));
  }
  if (c.borde.o) s.rectPx(z.i, z.j, 3, z.h, mezcla(base, '#1e0f08', 0.4));
  if (c.borde.e) s.rectPx(z.i + z.w - 3, z.j, 3, z.h, mezcla(base, '#1e0f08', 0.5));
}

/** Un tablón con degradé de luz, vetas, nudos y clavos en las puntas. Largo en el lado más largo. */
function tablon(s: Superficie, z: Zona, semilla: number): void {
  const horizontal = z.w >= z.h,
    n = horizontal ? z.h : z.w,
    largo = horizontal ? z.w : z.h;
  for (let t = 0; t < n; t++) {
    const u = t / Math.max(1, n - 1),
      c = u < 0.18 ? mezcla('#e0a860', '#d39a55', u / 0.18) : mezcla('#c98a45', '#8a5526', Math.max(0, u - 0.4) / 0.6);
    if (horizontal) s.rectPx(z.i, z.j + t, z.w, 1, c);
    else s.rectPx(z.i + t, z.j, 1, z.h, c);
  }
  for (let g = 0; g < largo / 10; g++) {
    const a = Math.floor(hash(g, semilla, 61) * largo),
      b = Math.min(largo, a + 8 + Math.floor(hash(g, semilla, 62) * 22)),
      t = 2 + Math.floor(hash(g, semilla, 63) * Math.max(1, n - 4)),
      c = hash(g, semilla, 64) < 0.6 ? 'rgba(90,50,16,0.45)' : 'rgba(240,190,120,0.3)';
    if (horizontal) s.rectPx(z.i + a, z.j + t, b - a, 1, c);
    else s.rectPx(z.i + t, z.j + a, 1, b - a, c);
  }
  if (hash(semilla, n, 65) < 0.6 && n >= 8) {
    const a = 12 + Math.floor(hash(semilla, 1, 66) * Math.max(1, largo - 24));
    s.elipsePx(horizontal ? z.i + a : z.i + n / 2, horizontal ? z.j + n / 2 : z.j + a, 2.2, 1.6, '#6a3c1c');
    s.px(horizontal ? z.i + a - 1 : z.i + n / 2 - 1, horizontal ? z.j + n / 2 - 1 : z.j + a - 1, '#c98a45');
  }
}

/** Un clavo con su brillo. */
function clavo(s: Superficie, i: number, j: number): void {
  s.px(i, j, '#2a2222');
  s.px(i + 1, j, '#3a3030');
  s.px(i, j - 1, '#9a8a8a');
}

/** El cajón: los tablones de los lados que tiene la celda, los postes de las esquinas y la sombra. */
function marcoDeCajon(s: Superficie, z: Zona, c: CeldaDeEscena, obl: boolean, semilla: number): void {
  const grueso = px(3),
    frente = px(obl ? 9 : 4);
  if (c.borde.n) tablon(s, { i: z.i, j: z.j, w: z.w, h: grueso }, semilla);
  if (c.borde.o) tablon(s, { i: z.i, j: z.j, w: grueso, h: z.h }, semilla + 1);
  if (c.borde.e) tablon(s, { i: z.i + z.w - grueso, j: z.j, w: grueso, h: z.h }, semilla + 2);
  if (c.borde.s) {
    // la cara de adelante del cajón: uno o dos tablones, según lo alto
    const alto = Math.round(frente / (obl ? 2 : 1)),
      y0 = z.j + z.h - 8;
    tablon(s, { i: z.i, j: y0, w: z.w, h: alto }, semilla + 3);
    if (obl) tablon(s, { i: z.i, j: y0 + alto, w: z.w, h: frente - alto }, semilla + 4);
    s.rectPx(z.i, y0, z.w, 2, '#e8b270');
    s.rectPx(z.i, y0 + frente - 2, z.w, 2, '#5a3410');
    clavo(s, z.i + 10, y0 + 6);
    clavo(s, z.i + z.w - 12, y0 + 6);
    if (obl) s.damero(z.i, y0 + frente, z.w, 6, 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.1)');
  }
  postes(s, z, c, grueso, semilla);
}

/** Los postes en las esquinas donde se juntan dos tablones: una cara de arriba más clara y un clavo. */
function postes(s: Superficie, z: Zona, c: CeldaDeEscena, g: number, semilla: number): void {
  const esquinas: [boolean, number, number][] = [
    [c.borde.n && c.borde.o, z.i, z.j],
    [c.borde.n && c.borde.e, z.i + z.w - g, z.j],
    [c.borde.s && c.borde.o, z.i, z.j + z.h - g],
    [c.borde.s && c.borde.e, z.i + z.w - g, z.j + z.h - g],
  ];
  for (const [hay, i, j] of esquinas)
    if (hay) {
      s.rectPx(i, j, g, g, '#b5793a');
      s.rectPx(i, j, g, 2, '#e8b270');
      s.rectPx(i, j, 2, g, '#d39a55');
      s.rectPx(i + g - 2, j, 2, g, '#8a5526');
      clavo(s, i + (g >> 1), j + (g >> 1) + (semilla % 2));
    }
}

/** La paja del mantillo: pajitas largas en dos tonos, con su sombra fina abajo. */
function mantillo(s: Superficie, z: Zona, semilla: number): void {
  for (let n = 0; n < 34; n++) {
    const x = z.i + 4 + Math.floor(hash(n, semilla, 67) * (z.w - 20)),
      y = z.j + 6 + Math.floor(hash(n, semilla, 68) * Math.max(1, z.h - 14)),
      dx = 9 + Math.floor(hash(n, semilla, 69) * 11),
      dy = Math.floor((hash(n, semilla, 70) - 0.5) * 8);
    s.lineaPx(x, y + 1, x + dx, y + dy + 1, 'rgba(60,40,10,0.35)');
    s.lineaPx(x, y, x + dx, y + dy, n % 2 ? C.paja : C.paja2);
    s.px(x, y - 1, '#fff1b0');
  }
}

/** Un cantero de tierra o un cajón: la tierra y, alrededor, su borde o sus tablones. */
function cantero(s: Superficie, G: GeometriaPlana, k: string, c: CeldaDeEscena, q: CeldaEnPantalla): void {
  const z = zonaDe(q),
    semilla = Math.floor(hash(q.x, q.y, 71) * 1000);
  tierraEn(s, z, c);
  if (c.tipo === 'cajon') {
    for (const lado of ['n', 'o', 'e', 's'] as const) if (c.borde[lado]) oscurecerBorde(s, z, lado, px(2));
    marcoDeCajon(s, z, c, G.obl, semilla);
  } else labio(s, z, c);
  if (c.mulch) mantillo(s, z, semilla + k.length);
}

/** El radio de la maceta, en unidades, según los litros. */
function radioDeMaceta(litros: number): number {
  if (litros >= 20) return 14;
  return litros >= 8 ? 11 : 8;
}

/** Qué tono de terracota lleva una columna del cuerpo de la maceta: luz a la izquierda, sombra a la derecha. */
function luzDelCuerpo(x: number, w: number): number {
  if (x < -w * 0.4) return 2;
  return x > w * 0.45 ? 0 : 1;
}

/** Una maceta de terracota: el cuerpo con luz y sombra, el borde, la tierra adentro y su sombra en el piso. */
function maceta(s: Superficie, c: CeldaDeEscena, q: CeldaEnPantalla, obl: boolean): void {
  const litros = c.maceta!.litros,
    R = px(radioDeMaceta(litros)),
    cx = px(q.bx),
    base = tierraDe(c),
    terracota = [C.terracota2, C.terracota, C.terracota3, '#fbb08a'];
  if (obl) {
    const cy = px(q.by - 1),
      ry = Math.round(R * 0.42),
      alto = Math.round(R * 0.95);
    s.sombraEn(cx + 12, cy + alto, R, ry, 'rgba(0,0,0,0.2)');
    for (let t = 0; t < alto; t++) {
      const w = Math.round(R - t * 0.28);
      for (let x = -w; x < w; x++) s.px(cx + x, cy + t, terracota[luzDelCuerpo(x, w)]);
      if (t < 5) s.rectPx(cx - w, cy + t, 2 * w, 1, terracota[2]);
    }
    s.elipsePx(cx, cy, R, ry, C.terracota3);
    s.elipsePx(cx, cy, R - 3, Math.max(1, ry - 2), mezcla(base, '#1e0f08', 0.3));
    for (let n = 0; n < R * 2; n++)
      s.set(
        cx - R + 4 + Math.floor(hash(n, cx, 72) * (2 * R - 8)),
        cy - ry + 3 + Math.floor(hash(n, cy, 73) * (2 * ry - 5)),
        granoDeTierra(n, cy, tablaDeTierra(base)),
      );
    return;
  }
  const cy = px(q.y + 16);
  s.sombraEn(cx + 6, cy + 6, R, R, 'rgba(0,0,0,0.22)');
  s.elipsePx(cx, cy, R, R, C.terracota2);
  s.elipsePx(cx - 1, cy - 1, R - 1, R - 1, C.terracota);
  s.elipsePx(cx - 3, cy - 3, R - 6, R - 6, C.terracota3);
  s.elipsePx(cx, cy, R - 12, R - 12, mezcla(base, '#1e0f08', 0.3));
  const tabla = tablaDeTierra(base);
  for (let y = cy - R; y < cy + R; y++)
    for (let x = cx - R; x < cx + R; x++)
      if (((x - cx) / (R - 14)) ** 2 + ((y - cy) / (R - 14)) ** 2 < 1) s.set(x, y, granoDeTierra(x, y, tabla));
}

/** Una celdita de la bandeja: la tierra, con la sombra del plástico arriba y a la izquierda y un reborde claro abajo. */
function celdaDeBandeja(s: Superficie, z: Zona, base: string): void {
  const tabla = tablaDeTierra(base);
  for (let y = z.j; y < z.j + z.h; y++) for (let x = z.i; x < z.i + z.w; x++) s.set(x, y, granoDeTierra(x, y, tabla));
  s.rectPx(z.i, z.j, z.w, 2, 'rgba(10,6,30,0.45)');
  s.rectPx(z.i, z.j, 2, z.h, 'rgba(10,6,30,0.35)');
  s.rectPx(z.i, z.j + z.h, z.w, 1, '#5a58b0');
}

/** La bandeja de almácigos: plástico añil con celdas de tierra, nervaduras claras y un labio adelante. */
function almaciguera(s: Superficie, q: CeldaEnPantalla, c: CeldaDeEscena, obl: boolean): void {
  const z = zonaDe(q),
    base = tierraDe(c),
    j0 = z.j + 8,
    alto = z.h - 12,
    celdaH = Math.floor((alto - 4) / 2);
  s.rectPx(z.i, j0, z.w, alto + 4, '#2a2869');
  s.rectPx(z.i, j0, z.w, 2, '#5a58b0');
  s.rectPx(z.i, j0 + alto + 2, z.w, 2, '#1d1b4b');
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 2; b++)
      celdaDeBandeja(s, { i: z.i + 8 + a * 40, j: j0 + 6 + b * (celdaH + 2), w: 32, h: celdaH - 2 }, base);
  if (obl) s.rectPx(z.i, z.j + z.h - 4, z.w, 8, '#1d1b4b');
}

/** La compostera: tablas con vetas, adentro la pila de compost con su nivel, y las bolsitas de la dosis. */
function compostera(s: Superficie, es: Escena, G: GeometriaPlana): void {
  if (!es.compostera) return;
  const q = G.celda(es.compostera)!,
    cp = es.compost,
    alto = G.obl ? 24 : 26,
    cy = q.y + q.h - alto - 2,
    z: Zona = { i: px(q.x + 3), j: px(cy), w: px(26), h: px(alto) },
    nivel = Math.min(alto - 6, Math.round(cp.carga * 2.5) + cp.tandas * 5);
  s.rectPx(z.i, z.j, z.w, z.h, '#1a0e08');
  s.rectPx(z.i + 8, z.j + 8, z.w - 16, z.h - 12, '#2f1c10');
  const pila = px(nivel),
    j0 = z.j + z.h - 6 - pila;
  const compost = tablaDeTierra('#5e3e22');
  for (let y = j0; y < z.j + z.h - 4; y++)
    for (let x = z.i + 8; x < z.i + z.w - 8; x++) s.set(x, y, granoDeTierra(x, y, compost));
  for (let n = 0; n < 8; n++)
    s.rectPx(z.i + 12 + Math.floor(hash(n, 1, 74) * (z.w - 28)), j0 + (n % 2) * 2, 4, 2, n % 2 ? '#8fb04a' : '#c9803a');
  for (let t = 0; t < 4; t++) tablon(s, { i: z.i, j: z.j + 12 + t * 24, w: z.w, h: 8 }, 80 + t);
  tablon(s, { i: z.i, j: z.j, w: 8, h: z.h }, 90);
  tablon(s, { i: z.i + z.w - 8, j: z.j, w: 8, h: z.h }, 91);
  bolsitas(s, q, Math.min(5, cp.dosis));
}

/** Las bolsitas de compost maduro en el piso: yute oscuro con un nudo arriba. */
function bolsitas(s: Superficie, q: CeldaEnPantalla, n: number): void {
  for (let i = 0; i < n; i++) {
    const cx = px(q.x + 2 + i * 6) + 10,
      cy = px(q.y + q.h - 5);
    s.elipsePx(cx, cy + 6, 11, 4, 'rgba(0,0,0,0.25)');
    s.elipsePx(cx, cy, 10, 8, '#5e3a22');
    s.elipsePx(cx - 2, cy - 2, 7, 5, '#7a4d2e');
    s.rectPx(cx - 2, cy - 9, 4, 3, '#3d2617');
  }
}

/** Todos los bancales del patio, las macetas y la compostera. */
export function bancales(s: Superficie, es: Escena, G: GeometriaPlana): void {
  for (const k of Object.keys(es.celdas)) {
    const c = es.celdas[k],
      q = G.celda(k)!;
    if (c.tipo === 'macetas') maceta(s, c, q, G.obl);
    else if (c.tipo === 'almaciguera') almaciguera(s, q, c, G.obl);
    else cantero(s, G, k, c, q);
  }
  compostera(s, es, G);
}
