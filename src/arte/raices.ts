/**
 * Lo que pasa bajo tierra, para la cámara de cerca: raíces de un píxel que se ramifican y terminan en
 * pelitos, bien claras para que contrasten con la capa oscura de arriba, y las raíces carnosas, los
 * tubérculos y los bulbos con volumen.
 */
import { estiloDe, type Estilo } from './estilos';
import { PAJA, rampaDe } from './paleta';
import type { PlantaParaDibujar } from './planta';
import { RES, type Pincel } from './pincel';

/** de la raíz principal a las más finas, y el color de los pelitos */
const TRAMOS = ['#f6e6c4', '#ecd2a2', '#e0c08e'],
  PELO = '#fff8e8',
  SOMBRA = '#b88f5c',
  RAD = Math.PI / 180,
  /** un hilo de raíz mide un píxel del lienzo, sea cual sea la escala del pincel */
  FINO = 0.125;

/** Un número entre 0 y 1 que depende solo de (a, b): las raíces de una planta salen siempre iguales. */
function azarFijo(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/** Un hilo de un píxel entre dos puntos, sin huecos aunque el pincel esté agrandado. */
function hilo(B: Pincel, x0: number, y0: number, x1: number, y1: number, col: string): void {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * RES * B.s) + 1;
  for (let k = 0; k <= n; k++) B.r(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, FINO, FINO, col);
}

/** Tres pelitos abiertos en abanico en la punta. */
function pelitos(B: Pincel, x: number, y: number, ang: number): void {
  for (const d of [-38, 0, 38]) {
    const a = (ang + d) * RAD;
    hilo(B, x, y, x + Math.sin(a) * 1.2, y + Math.cos(a) * 1.2, PELO);
  }
}

/**
 * Una raicilla que baja desde (x, y) con el ángulo `ang` (0 es hacia abajo), se va torciendo y, a mitad
 * de camino, echa otras más finas. Se frena a `prof`.
 */
function rama(
  B: Pincel,
  x: number,
  y: number,
  ang: number,
  largo: number,
  nivel: number,
  sem: number,
  prof: number,
): void {
  const paso = 0.5;
  let px = x,
    py = y;
  for (let t = 0; t < largo; t += paso) {
    ang += (azarFijo(sem, t) - 0.5) * 18;
    const nx = px + Math.sin(ang * RAD) * paso,
      ny = py + Math.cos(ang * RAD) * paso;
    if (ny > prof - 1) break;
    hilo(B, px, py, nx, ny, TRAMOS[nivel]);
    px = nx;
    py = ny;
    if (nivel < 2 && t > largo * 0.3 && azarFijo(sem + 3, t) < 0.2) {
      const lado = azarFijo(sem + 5, t) < 0.5 ? -1 : 1;
      rama(B, px, py, ang + lado * (42 + azarFijo(sem + 7, t) * 25), largo * 0.45, nivel + 1, sem + t * 7 + 1, prof);
    }
  }
  pelitos(B, px, py, ang);
}

/** Cuánto hunde la raíz cada forma, en píxeles, ya crecida. */
function hondoDeRaiz(e: Estilo): number {
  if (e.f === 'raiz') return e.largo ? 30 : 16;
  if (e.f === 'mata' || e.f === 'alta' || e.f === 'rastrera') return 34;
  if (e.f === 'trepadora' || e.f === 'repollo') return 26;
  return e.f === 'aromatica' ? 24 : 14;
}

/** La raíz carnosa (zanahoria, rabanito…) entera, bajo tierra, con volumen. */
function raizCarnosa(B: Pincel, e: Estilo, a: number, prof: number): void {
  const w = 2 + a * (e.largo ? 3 : 3.5),
    L = Math.min(prof - 3, Math.round(e.largo ? 6 + a * 22 : 3 + a * 6)),
    m = B.mascara();
  if (e.largo)
    m.poligono([
      [-w, 0],
      [w, 0],
      [w * 0.62, L * 0.45],
      [w * 0.28, L * 0.8],
      [0.3, L],
      [-0.3, L],
      [-w * 0.28, L * 0.8],
      [-w * 0.62, L * 0.45],
    ]);
  else m.elipse(0, L / 2, w, L / 2);
  B.volumen(m, rampaDe(e.tinta!));
  hilo(B, 0, L, 0, Math.min(prof - 1, L + 6), TRAMOS[1]);
  for (let i = 0; i < 4; i++) {
    const lado = i % 2 ? 1 : -1;
    rama(B, lado * w * 0.8, 2 + i * (L / 5), lado * 62, 3 + (i % 2) * 2, 2, i * 5 + 1, prof);
  }
  pelitos(B, 0, Math.min(prof - 1, L + 6), 0);
}

/** Las raicillas de una planta de hojas: una principal con laterales que se abren y se subdividen. */
function raicillas(B: Pincel, a: number, d: number, prof: number, tope: boolean): void {
  const n = 4 + Math.round(a * 4);
  // la principal, con un hilo más oscuro al lado que le da cuerpo
  hilo(B, 0.25, 0, 0.25, Math.min(d, prof - 2), SOMBRA);
  rama(B, 0, 0, 0, d, 0, 1, prof);
  for (let i = 0; i < n; i++) {
    const y = (d * (i + 0.8)) / (n + 1),
      lado = i % 2 ? 1 : -1,
      largo = (3 + a * 9) * (1 - (i / (n + 1)) * 0.55);
    rama(B, 0, y, lado * (58 + azarFijo(i, 2) * 22), largo, 1, 11 + i * 13, prof);
    if (i % 3 === 0) rama(B, 0, y + 1, -lado * (70 + azarFijo(i, 4) * 15), largo * 0.55, 2, 17 + i * 7, prof);
  }
  // la raíz topa y se enrula contra el fondo
  if (tope)
    for (const lado of [-1, 1]) {
      hilo(B, 0, prof - 2, lado * 7, prof - 2, TRAMOS[0]);
      pelitos(B, lado * 7, prof - 2, lado * 80);
    }
}

/** Tubérculos y bulbos entre las raíces. */
function reservas(B: Pincel, e: Estilo, a: number, prof: number): void {
  if (e.tuber && a > 0.6)
    for (const [x, y] of [
      [-7, 8],
      [5, 11],
      [-2, 15],
      [9, 6],
    ])
      if (y + 3 < prof) B.volumen(B.mascara().elipse(x, y, 3, 2.2), rampaDe(e.tuber));
  if (e.bulbo && a > 0.6) B.volumen(B.mascara().elipse(0, 3, 4, 3), rampaDe(e.tinta!));
}

/**
 * Lo que pasa bajo tierra, para la vista de cerca. B anclado al ras del suelo; prof = unidades de tierra
 * disponibles. Devuelve cuánto pide la raíz y si topa con el fondo.
 */
export function raiz(B: Pincel, p: PlantaParaDibujar, prof: number): { pide: number; tope?: boolean } {
  const e = estiloDe(p),
    a = Math.max(0.1, Math.min(1, p.avance || 0));
  if (p.etapa === 'semilla') {
    B.volumen(B.mascara().elipse(0, 3.5, 1.2, 0.9), rampaDe(PAJA));
    return { pide: 0 };
  }
  const pide = hondoDeRaiz(e),
    d = Math.min(prof - 2, Math.round(pide * (0.25 + 0.75 * a))),
    tope = pide * (0.25 + 0.75 * a) > prof - 2;
  if (e.f === 'raiz' && a > 0.3) raizCarnosa(B, e, a, prof);
  else raicillas(B, a, d, prof, tope);
  reservas(B, e, a, prof);
  return { pide, tope };
}
