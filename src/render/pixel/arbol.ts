/**
 * El árbol del patio, con volumen y sin contorno: el tronco con su corteza, las ramas, y la copa hecha de
 * masas de hojas con el borde ondulado y hojitas sueltas por encima. En otoño se pone amarillo y naranja,
 * en primavera florece, y si es caduco en invierno queda en ramas. Como las plantas, se dibuja una vez en
 * un lienzo chico (un sprite) y los cuadros siguientes lo pegan; solo cambia con la estación y con el
 * viento (que se redondea a tres pasos).
 */
import { PERFIL, hojaV, pincel, rampaDe, type Pincel, type Rampa } from '../../arte';
import { C } from './paleta';
import { hash } from './superficie';

/** La caja del sprite, en unidades de dibujo con la base del tronco en (ORIGEN_X, ORIGEN_Y). */
const ANCHO = 100,
  ALTO = 112,
  ORIGEN_X = 50,
  ORIGEN_Y = 106;

/** [dx, dy, radio, tono] de cada masa de la copa: 0 la más oscura (atrás), 2 la más clara (adelante) */
const MASAS: [number, number, number, number][] = [
  [0, 0, 28, 0],
  [-12, -8, 20, 1],
  [10, -4, 18, 1],
  [-4, -16, 14, 2],
  [12, -14, 10, 2],
  [-16, 2, 10, 2],
];

const RAMPA_TRONCO: Rampa = rampaDe(C.tronco);

interface Datos {
  alto: number;
  sw: number;
  hojas: boolean;
  estacion: string;
}

/** Las tres rampas de la copa, de la sombra a la luz, según la estación. */
function rampasDeCopa(estacion: string): Rampa[] {
  const sombra = estacion === 'otoño' ? '#8a4a1f' : C.copa3,
    medio = estacion === 'otoño' ? '#d9702a' : C.copa,
    luz = estacion === 'otoño' ? '#f0b030' : C.copa2;
  return [rampaDe(sombra), rampaDe(medio), rampaDe(luz)];
}

/** Una rama: un cuadrilátero que se afina de (x0, y0) a (x1, y1). */
function rama(B: Pincel, [x0, y0]: [number, number], [x1, y1]: [number, number], g0: number, g1: number): void {
  const an = Math.atan2(y1 - y0, x1 - x0),
    nx = -Math.sin(an),
    ny = Math.cos(an);
  B.volumen(
    B.mascara().poligono([
      [x0 + (nx * g0) / 2, y0 + (ny * g0) / 2],
      [x1 + (nx * g1) / 2, y1 + (ny * g1) / 2],
      [x1 - (nx * g1) / 2, y1 - (ny * g1) / 2],
      [x0 - (nx * g0) / 2, y0 - (ny * g0) / 2],
    ]),
    RAMPA_TRONCO,
  );
}

/** El tronco con su base ensanchada, las ramas gruesas y la corteza rayada. */
function tronco(B: Pincel, alto: number): void {
  B.volumen(
    B.mascara()
      .poligono([
        [-5, 0],
        [5, 0],
        [3.4, -alto],
        [-3.4, -alto],
      ])
      .elipse(0, -1.5, 8.5, 2.6),
    RAMPA_TRONCO,
  );
  for (let k = 0; k < alto / 3; k++) {
    const x = -2.2 + hash(k, 1, 81) * 4.4;
    B.r(x, -3 - k * 3 + hash(k, 2, 81), 0.25, 1.6 + hash(k, 3, 81) * 1.6, RAMPA_TRONCO[1]);
  }
  rama(B, [0, -alto + 8], [-16, -alto - 8], 4, 2.2);
  rama(B, [0, -alto + 4], [12, -alto - 12], 4, 2.2);
}

/** Una masa de la copa: una elipse con el borde ondulado de hojas, y una nervadura de luz. */
function masa(B: Pincel, cx: number, cy: number, R: number, rampa: Rampa, semilla: number): void {
  const m = B.mascara().elipse(cx, cy, R, R * 0.92);
  for (let k = 0; k < 14; k++) {
    const an = (k / 14) * Math.PI * 2 + hash(k, semilla, 82),
      r = R * (0.22 + hash(k, semilla, 83) * 0.14);
    m.elipse(cx + Math.cos(an) * R * 0.88, cy + Math.sin(an) * R * 0.8, r, r);
  }
  B.volumen(m, rampa);
}

/** Hojitas sueltas sobre la copa, y en primavera las flores. */
function detalles(B: Pincel, d: Datos, rampas: Rampa[]): void {
  for (let i = 0; i < 46; i++) {
    const [mx, my, R] = MASAS[i % MASAS.length],
      an = hash(i, 1, 84) * Math.PI * 2,
      dd = Math.sqrt(hash(i, 2, 84)) * R * 0.85,
      x = mx + Math.cos(an) * dd,
      y = -d.alto - 4 + my + Math.sin(an) * dd * 0.9;
    hojaV(
      B,
      x,
      y,
      4.2,
      2.8,
      -60 + hash(i, 3, 84) * -60 + (i % 2 ? 180 : 0),
      rampas[2 - (i % 3 === 0 ? 1 : 0)],
      PERFIL.oval,
    );
    if (d.estacion === 'primavera' && i % 4 === 0)
      B.volumen(B.mascara().elipse(x + 1, y - 1, 1.1, 1.1), rampaDe('#e0c8ff'));
  }
}

/** La copa entera, con el viento corriendo las masas de arriba. */
function copa(B: Pincel, d: Datos): void {
  const rampas = rampasDeCopa(d.estacion),
    cy = -d.alto - 4;
  MASAS.forEach(([dx, dy, R, tono], i) => {
    const rampa = d.estacion === 'otoño' && i % 2 ? rampas[Math.max(0, tono - 1)] : rampas[tono];
    masa(B, dx + (i > 2 ? d.sw : 0), cy + dy, R, rampa, i);
  });
  detalles(B, d, rampas);
}

/** Si es caduco y es invierno: solo ramas, cada vez más finas. */
function ramasPeladas(B: Pincel, alto: number): void {
  const cy = -alto - 4;
  for (let j = 0; j < 7; j++) {
    const bx = Math.sin(j * 1.9) * 18,
      by = cy - 4 + Math.cos(j * 2.3) * 12;
    rama(B, [j % 2 ? 10 : -14, cy + 2], [bx, by], 3.2, 1.8);
    rama(B, [bx, by], [bx + (j % 2 ? 6 : -6), by - 8], 1.8, 0.8);
    rama(B, [bx + (j % 2 ? 3 : -3), by - 4], [bx + (j % 2 ? 9 : -9), by - 3], 1, 0.5);
  }
}

/** Dibuja el árbol en un pincel con la base del tronco en (0, 0). */
export function dibujarArbol(B: Pincel, d: Datos): void {
  tronco(B, d.alto);
  if (d.hojas) copa(B, d);
  else ramasPeladas(B, d.alto);
}

interface Sprite {
  cv: HTMLCanvasElement;
}

const cache = new Map<string, Sprite>();
const MAXIMO = 10;

/** Pega el árbol con la base del tronco en (x, y); `g` ya está escalado por `S`. */
export function pegarArbol(g: CanvasRenderingContext2D, x: number, y: number, d: Datos): void {
  const S = g.getTransform().a,
    k = [d.alto, d.estacion, d.hojas ? 1 : 0, d.sw, S].join('|');
  let sp = cache.get(k);
  if (sp) {
    cache.delete(k);
  } else {
    const cv = document.createElement('canvas');
    cv.width = ANCHO * S;
    cv.height = ALTO * S;
    const c = cv.getContext('2d')!;
    c.setTransform(S, 0, 0, S, 0, 0);
    dibujarArbol(pincel(c, ORIGEN_X, ORIGEN_Y, 1), d);
    sp = { cv };
    if (cache.size >= MAXIMO) cache.delete(cache.keys().next().value!);
  }
  cache.set(k, sp);
  g.imageSmoothingEnabled = false;
  g.drawImage(sp.cv, x - ORIGEN_X, y - ORIGEN_Y, ANCHO, ALTO);
}

export type DatosDeArbol = Datos;
