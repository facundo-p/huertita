/**
 * El piso del patio, píxel a píxel: pasto con matas, flores y manchas de luz; sendero de tierra con
 * piedritas, grietas y yuyos; y el piso de baldosas de la galería. Es continuo de una celda a la
 * otra: el ruido depende de la posición absoluta, no de la celda.
 */
import { mezcla } from '../../arte';
import type { Escena } from '../contrato';
import type { GeometriaPlana } from './camaras/plano';
import { C, T } from './paleta';
import { empaquetar, hash, porBloques, Superficie } from './superficie';

/** una región de píxeles */
interface Zona {
  i: number;
  j: number;
  w: number;
  h: number;
}

/** Ruido suave de baja frecuencia (manchas grandes), entre 0 y 1. */
function mancha(i: number, j: number, paso: number, semilla: number): number {
  const x = i / paso,
    y = j / paso,
    x0 = Math.floor(x),
    y0 = Math.floor(y),
    fx = x - x0,
    fy = y - y0,
    a = hash(x0, y0, semilla),
    b = hash(x0 + 1, y0, semilla),
    c = hash(x0, y0 + 1, semilla),
    d = hash(x0 + 1, y0 + 1, semilla);
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}

/** Una flor chica de pasto: cinco pétalos y un centro. */
function florDePasto(s: Superficie, cx: number, cy: number, petalo: string, centro: string): void {
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, 1],
  ])
    s.px(cx + dx, cy + dy, petalo);
  s.px(cx, cy, centro);
  s.px(cx, cy + 3, '#2f8a46');
  s.px(cx, cy + 2, '#3f8531');
}

/** El tono de un píxel de una hoja de pasto: oscuro en la base, claro en la punta. */
function tonoDeHoja(n: number, largo: number): string {
  if (n >= largo - 2) return C.pasto2;
  return n === 0 ? C.pasto3 : C.pasto;
}

/** El tono base del pasto en un punto: más claro o más oscuro según la mancha de luz. */
function baseDePasto(m: number): string {
  if (m > 0.62) return mezcla(C.pasto, C.pasto2, (m - 0.62) * 1.6);
  return m < 0.38 ? mezcla(C.pasto, C.pasto3, (0.38 - m) * 1.6) : C.pasto;
}

/** Nueve tonos de pasto, del más oscuro al más claro, ya empaquetados: la textura los elige sin hacer cuentas. */
const TONOS_PASTO = Array.from({ length: 9 }, (_, n) => empaquetar(baseDePasto((n + 0.5) / 9)));

/** Un manojito de hojas de pasto: tallos de dos a cinco píxeles que se abren. */
function mata(s: Superficie, i: number, j: number, k: number): void {
  const largo = 3 + Math.floor(hash(i, j, k) * 3);
  for (const dx of [-1, 0, 1]) {
    const ladeo = dx * (hash(i, j, k + 5) < 0.5 ? 1 : 0);
    for (let n = 0; n < largo - Math.abs(dx); n++) {
      const tono = tonoDeHoja(n, largo);
      s.px(i + dx + Math.round((ladeo * n) / 3), j - n, tono);
    }
  }
}

function pasto(s: Superficie, z: Zona): void {
  const { i, j, w, h } = z,
    oscuro = empaquetar(C.pasto3),
    claro = empaquetar(C.pasto2);
  // las manchas de luz son de bloques de 4 × 4 píxeles; cada píxel suma su granito
  porBloques(i, j, w, h, (bx, by, bw, bh) => {
    const base = TONOS_PASTO[Math.min(8, Math.floor(mancha(bx >> 2, by >> 2, 10, 1) * 9))];
    for (let y = by; y < by + bh; y++)
      for (let x = bx; x < bx + bw; x++) s.set(x, y, granoDePasto(hash(x, y, 2), base, oscuro, claro));
  });
  for (let n = 0; n < (w * h) / 60; n++) {
    const x = i + 2 + Math.floor(hash(n, i, 3) * (w - 4)),
      y = j + 4 + Math.floor(hash(n, j, 4) * (h - 5));
    mata(s, x, y, n);
  }
  // los tréboles y las flores aparecen en algunas celdas
  const celda = hash(Math.floor(i / 128), Math.floor(j / 64), 9);
  if (celda > 0.55)
    florDePasto(
      s,
      i + 30 + Math.floor(hash(i, j, 6) * 60),
      j + 14 + Math.floor(hash(j, i, 7) * (h - 24)),
      '#fff6e0',
      '#ffd23f',
    );
  if (celda > 0.75)
    florDePasto(
      s,
      i + 80 + Math.floor(hash(i, j, 8) * 30),
      j + 10 + Math.floor(hash(j, i, 9) * (h - 20)),
      '#ffd23f',
      '#f08a24',
    );
}

/** Una piedrita con luz arriba a la izquierda y sombra abajo. */
function piedra(s: Superficie, cx: number, cy: number, rx: number, ry: number, color: string): void {
  s.elipsePx(cx + 1, cy + 1, rx, ry, mezcla(color, '#4a2e1a', 0.45));
  s.elipsePx(cx, cy, rx, ry, color);
  s.elipsePx(cx - 1, cy - 1, Math.max(1, rx - 1.5), Math.max(1, ry - 1), mezcla(color, '#fff6e0', 0.3));
  s.px(Math.round(cx - rx * 0.5), Math.round(cy - ry * 0.5), mezcla(color, '#ffffff', 0.7));
}

const PALETA_SENDERO = {
  base: empaquetar(C.sendero),
  mancha: empaquetar(mezcla(C.sendero, C.sendero3, 0.35)),
  oscuros: [C.sendero2, C.sendero2, '#c4a060', '#c4a060'].map(empaquetar),
  claros: [C.sendero3, C.sendero3, '#f4e2b4', '#f4e2b4'].map(empaquetar),
};

/** Un píxel de pasto: casi siempre el base, y de vez en cuando uno más oscuro o más claro. */
function granoDePasto(r: number, base: number, oscuro: number, claro: number): number {
  if (r < 0.07) return oscuro;
  return r > 0.94 ? claro : base;
}

/** Un píxel de sendero: la arena de fondo, con granos oscuros y claros. */
function granoDeSendero(r: number, fondo: number): number {
  if (r < 0.1) return PALETA_SENDERO.oscuros[Math.floor(r * 40) % 4];
  if (r > 0.93) return PALETA_SENDERO.claros[Math.floor((r - 0.93) * 57) % 4];
  return fondo;
}

function sendero(s: Superficie, z: Zona): void {
  const { i, j, w, h } = z,
    P = PALETA_SENDERO;
  porBloques(i, j, w, h, (bx, by, bw, bh) => {
    const fondo = mancha(bx >> 2, by >> 2, 8, 11) > 0.6 ? P.mancha : P.base;
    for (let y = by; y < by + bh; y++)
      for (let x = bx; x < bx + bw; x++) s.set(x, y, granoDeSendero(hash(x, y, 12), fondo));
  });
  for (let n = 0; n < (w * h) / 420; n++) {
    const rx = 2 + Math.floor(hash(n, i, 13) * 4),
      c = ['#b8905a', '#c9a263', '#a88860', '#d4b078'][Math.floor(hash(n, j, 14) * 4)];
    piedra(
      s,
      i + 4 + Math.floor(hash(n, i, 15) * (w - 8)),
      j + 3 + Math.floor(hash(n, j, 16) * (h - 6)),
      rx,
      Math.max(1.5, rx * 0.6),
      c,
    );
  }
  // un yuyo que se cuela entre las piedras en algunas celdas
  if (hash(Math.floor(i / 128), Math.floor(j / 64), 17) > 0.6) {
    const x = i + 20 + Math.floor(hash(i, j, 18) * (w - 40)),
      y = j + h - 8 - Math.floor(hash(j, i, 19) * 10);
    for (const dx of [-2, 0, 2])
      for (let n = 0; n < 5 - Math.abs(dx); n++)
        s.px(x + dx + (dx ? Math.sign(dx) * (n >> 1) : 0), y - n, n > 2 ? '#52a85a' : '#2f8a46');
  }
}

/** Los colores empaquetados de una baldosa: [normal, desgaste oscuro, desgaste claro, junta, bisel, sombra del borde]. */
const coloresDeBaldosa = new Map<string, number[]>();
function paletaDeBaldosa(tx: number, ty: number): number[] {
  const k = tx + ',' + ty;
  let v = coloresDeBaldosa.get(k);
  if (!v) {
    const base = mezcla('#d9a45f', '#c98a4a', hash(tx, ty, 21) * 0.8);
    v = [
      base,
      mezcla(base, '#8a5a30', 0.35),
      mezcla(base, '#fff6e0', 0.3),
      '#a8743a',
      mezcla(base, '#fff6e0', 0.35),
      mezcla(base, '#6a4020', 0.18),
    ].map(empaquetar);
    coloresDeBaldosa.set(k, v);
  }
  return v;
}

/** Baldosas cerámicas de 16 × 16 unidades: cada una con su tono, junta, bisel y desgaste. */
function baldosas(s: Superficie, z: Zona): void {
  const { i, j, w, h } = z,
    L = Superficie.px(16);
  for (let y = j; y < j + h; y++)
    for (let x = i; x < i + w; x++) {
      const tx = Math.floor(x / L),
        ty = Math.floor(y / L),
        u = x - tx * L,
        v = y - ty * L,
        P = paletaDeBaldosa(tx, ty),
        r = hash(x, y, 22);
      let c = P[0];
      if (r < 0.06) c = P[1];
      else if (r > 0.95) c = P[2];
      if (u < 2 || v < 2) c = P[3];
      else if (u === 2 || v === 2) c = P[4];
      else if (u >= L - 3 || v >= L - 3) c = P[5];
      s.set(x, y, c);
    }
}

/** La clase de piso de una celda: 'p' pasto, 's' sendero, 'b' baldosa, o null si no es piso. */
function claseDe(es: Escena, x: number, y: number): string | null {
  const ch = es.plano[y]?.[x];
  if (ch === undefined || ch === 'P' || ch === 'H') return null;
  const camino = ch === ':' || (es.piso === 'baldosa' && ch !== 'T');
  if (!camino) return 'p';
  return es.piso === 'baldosa' ? 'b' : 's';
}

/** Una orilla irregular entre pasto y sendero: el pasto se mete unos píxeles en el sendero y el sendero en el pasto. */
function orilla(s: Superficie, i: number, j: number, largo: number, vertical: boolean, pastoAntes: boolean): void {
  /** el píxel a `d` de la orilla, del lado de adelante (+) o de atrás (-) */
  const lado = (t: number, d: number, adelante: boolean): [number, number] => {
    const o = adelante ? d : -1 - d;
    return vertical ? [i + o, j + t] : [i + t, j + o];
  };
  for (let t = 0; t < largo; t++) {
    const entra = Math.floor(hash(t, vertical ? i : j, 23) * 5) + (hash(t, i + j, 24) < 0.25 ? 2 : 0),
      sale = Math.floor(hash(t, vertical ? i : j, 25) * 3);
    for (let d = 0; d < entra; d++) s.px(...lado(t, d, pastoAntes), d < entra - 1 ? C.pasto : C.pasto2);
    for (let d = 0; d < sale; d++) s.px(...lado(t, d, !pastoAntes), d ? C.sendero2 : C.sendero);
  }
}

/** Donde un pasto limita con un sendero, a derecha o abajo, se hace la orilla. */
function orillas(s: Superficie, es: Escena, G: GeometriaPlana): void {
  for (let y = 0; y < es.alto; y++)
    for (let x = 0; x < es.ancho; x++) {
      const a = claseDe(es, x, y),
        der = claseDe(es, x + 1, y),
        aba = claseDe(es, x, y + 1),
        borde = (b: string | null): boolean => (a === 'p' && b === 's') || (a === 's' && b === 'p');
      if (borde(der))
        orilla(s, Superficie.px((x + 1) * T), Superficie.px(G.fy(y)), Superficie.px(G.fh(y)), true, a === 'p');
      if (borde(aba)) orilla(s, Superficie.px(x * T), Superficie.px(G.fy(y + 1)), Superficie.px(T), false, a === 'p');
    }
}

/** El piso de todo el patio: pasto, sendero o baldosa según el plano. */
export function piso(s: Superficie, es: Escena, G: GeometriaPlana): void {
  for (let y = 0; y < es.alto; y++)
    for (let x = 0; x < es.ancho; x++) {
      const ch = es.plano[y][x];
      if (ch === 'P' || ch === 'H') continue;
      const z: Zona = {
        i: Superficie.px(x * T),
        j: Superficie.px(G.fy(y)),
        w: Superficie.px(T),
        h: Superficie.px(G.fh(y)),
      };
      const camino = ch === ':' || (es.piso === 'baldosa' && ch !== 'T');
      if (!camino) pasto(s, z);
      else if (es.piso === 'baldosa') baldosas(s, z);
      else sendero(s, z);
    }
  orillas(s, es, G);
}
