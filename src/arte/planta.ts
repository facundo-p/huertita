/**
 * HUERTITA — ilustraciones pixel-art de las plantas (caja de 32 unidades de dibujo).
 *
 * Capa de arte compartida: la usan el renderer del patio, la vista de cerca y la tira de estadíos
 * de las fichas. No sabe nada del motor: recibe una planta plana (`PlantaParaDibujar`, que la
 * `PlantaDeEscena` del renderer cumple).
 */
import { estiloDe } from './estilos';
import { FORMAS, type Postura } from './formas';
import { floracion } from './formas/floracion';
import { PERFIL, hojaV, nervadura } from './hojas';
import { mezcla, PAJA, rampaDe, rampaDeHoja, V, type Paleta } from './paleta';
import { escalaDeLienzo, pincel, type Lienzo2D, type Pincel } from './pincel';

/** Lo que el arte necesita saber de una planta para dibujarla. */
export interface PlantaParaDibujar {
  slug: string;
  grupo?: string;
  familia?: string;
  /** semilla, plantin, creciendo, cosechable, semillando o pasada */
  etapa: string;
  /** 0..1 hacia la cosecha */
  avance: number;
  salud?: number;
  plaga?: string | null;
  tutor?: boolean;
  dulce?: boolean;
}

/** Amarillea desde temprano: a salud 60 ya se nota, a 30 está pajiza. */
function paletaConSalud(pal: Paleta, salud: number): Paleta {
  if (salud >= 80) return pal;
  const k = Math.min(0.85, ((80 - salud) / 80) * 1.1);
  return {
    v: mezcla(pal.v, '#c9a74a', k),
    c: mezcla(pal.c, '#e6cf6a', k),
    o: mezcla(pal.o, '#8a6a3a', k),
    oo: mezcla(pal.oo || pal.o, '#6b4a2a', k),
  };
}

function semilla(B: Pincel): void {
  // un montoncito de tierra removida y tres semillas asomando
  B.volumen(B.mascara().elipse(0, -1.2, 5, 2.1), rampaDe('#5a3820'));
  for (const [x, y, an] of [
    [-2.2, -2.6, 20],
    [1, -2.2, -35],
    [3, -3, 60],
  ])
    hojaV(B, x, y, 1.6, 0.9, an, rampaDe(PAJA), PERFIL.oval);
  B.r(-3.5, -1.6, 0.5, 0.25, '#2a160c');
  B.r(2.2, -0.9, 0.75, 0.25, '#2a160c');
}

function plantin(B: Pincel, a: number, pal: Paleta, st: Postura): void {
  const h = Math.round(3 + a * 7),
    x = st.dx(-h * 2),
    clara = rampaDeHoja({ v: pal.c, c: mezcla(pal.c, '#fff6b8', 0.45), o: pal.v, oo: pal.o }),
    rampa = rampaDeHoja(pal);
  B.linea(0, 0, x, -h, clara[3], 0.5);
  B.linea(-0.25, 0, x - 0.25, -h, clara[5], 0.25);
  // los dos cotiledones, y las primeras hojas de verdad cuando ya tiene fuerza
  hojaV(B, x, -h, 3.6, 2, -160, clara, PERFIL.oval);
  hojaV(B, x, -h, 3.6, 2, -20, clara, PERFIL.oval);
  nervadura(B, x, -h, 3, -160, clara[2], 0);
  nervadura(B, x, -h, 3, -20, clara[2], 0);
  if (a > 0.55) {
    hojaV(B, x, -h - 0.5, 3.4, 2, -112, rampa, PERFIL.oval);
    hojaV(B, x, -h - 0.5, 3.8, 2.2, -70, clara, PERFIL.oval);
  }
}

const COLOR_DE_PLAGA: Record<string, string> = { pulgon: '#16161a', oruga: '#d6ff3a' };

function bichos(B: Pincel, plaga: string, a: number, t: number): void {
  const col = COLOR_DE_PLAGA[plaga] ?? '#c58a5a',
    alto = Math.round(4 + a * 12);
  for (let b = 0; b < 5; b++) {
    const bx = Math.round(Math.sin(t * 0.4 + b * 1.7) * 5),
      by = -Math.round(2 + (b / 5) * alto);
    if (plaga === 'pulgon') B.r(bx, by, 1, 1, col);
    else if (plaga === 'oruga') {
      if (b < 2) {
        B.r(bx - 1, by, 4, 1, col);
        B.r(bx + (Math.floor(t) % 2), by - 1, 2, 1, col);
        B.r(bx, by + 0.5, 0.5, 0.5, '#3a7a14');
        B.r(bx + 1.5, by + 0.5, 0.5, 0.5, '#3a7a14');
      }
    } else if (b < 2) {
      B.r(bx * 2 - 2, -1, 5, 2, col);
      B.r(bx * 2 + 2, -3, 1, 2, '#e0b080');
    }
  }
}

/** Cuánto sopla el viento sobre una planta en el instante `t` (-1..1). `fase` desfasa una planta de otra. */
export function vientoDe(t?: number, fase?: number): number {
  const tt = t || 0,
    f = fase || 0;
  return Math.sin(tt * 0.55 + f) * (0.6 + 0.4 * Math.sin(tt * 0.13 + f * 2));
}

/** El avance, entre 0,1 y 1, que usan todas las formas. */
const avanceDe = (p: PlantaParaDibujar): number => Math.max(0.1, Math.min(1, p.avance || 0));

/** El cuerpo de la planta sin lo que se mueve con el tiempo (los bichos) ni las gotas de dulce. */
function cuerpo(B: Pincel, p: PlantaParaDibujar, viento: number): void {
  const e = estiloDe(p),
    a = avanceDe(p),
    pal = paletaConSalud(e.pal || V, p.salud == null ? 100 : p.salud);
  if (!pal.oo) pal.oo = pal.o;
  const st: Postura = {
    madura: p.etapa === 'cosechable',
    tutor: !!p.tutor,
    dx: (y) => Math.round(viento * Math.min(2.2, -y / 11)),
  };
  if (p.etapa === 'semilla') return semilla(B);
  if (p.etapa === 'plantin') return plantin(B, a, pal, st);
  if (p.etapa === 'pasada' || p.etapa === 'semillando') {
    const seca = p.etapa === 'pasada';
    return floracion(B, p.slug, p.familia, e, seca ? paletaConSalud(pal, 20) : pal, st, seca);
  }
  (FORMAS[e.f] || FORMAS.roseta)(B, a, e, pal, st);
}

/** Las gotas brillantes de una planta dulce. */
function dulce(B: Pincel, p: PlantaParaDibujar): void {
  const a = avanceDe(p);
  if (p.etapa === 'semilla' || p.etapa === 'plantin' || p.etapa === 'pasada' || p.etapa === 'semillando') return;
  if (!p.dulce) return;
  B.r(-8, -Math.round(6 + a * 10), 1, 1, '#ffffff');
  B.r(6, -Math.round(4 + a * 8), 1, 1, '#d6f0ff');
  B.r(0, -Math.round(8 + a * 12), 1, 1, '#ffffff');
}

/** Los bichos de una planta con plaga: se mueven con el tiempo `t`, así que no entran en la caché. */
export function bichosDePlanta(B: Pincel, p: PlantaParaDibujar, t?: number): void {
  if (p.plaga && !['semilla', 'plantin', 'pasada', 'semillando'].includes(p.etapa))
    bichos(B, p.plaga, avanceDe(p), t || 0);
}

/** El dibujo de una planta que no cambia con el tiempo, con un viento dado: lo que se guarda en la caché. */
export function dibujarPlanta(B: Pincel, p: PlantaParaDibujar, viento: number): void {
  cuerpo(B, p, viento);
  dulce(B, p);
}

/** Dibuja una planta. B = pincel anclado en su base; t = tiempo (para el viento y los bichos). */
export function planta(B: Pincel, p: PlantaParaDibujar, t?: number, fase?: number): void {
  cuerpo(B, p, vientoDe(t, fase));
  bichosDePlanta(B, p, t);
  dulce(B, p);
}

/** Tira de estadíos para la ficha: semilla → plantín → creciendo → cosecha/flor → semilla. [etapa, avance, nombre] */
export const ETAPAS: [string, number, string][] = [
  ['semilla', 0, 'semilla'],
  ['plantin', 0.8, 'plantín'],
  ['creciendo', 0.45, 'crece'],
  ['creciendo', 0.8, 'florece'],
  ['cosechable', 1, 'cosecha'],
  ['semillando', 1, 'da semilla'],
];

/** Lo que necesita la tira de un lienzo: el canvas del navegador cumple. */
export interface LienzoDeTira {
  width: number;
  height: number;
  style: { width: string; maxWidth: string; aspectRatio: string; imageRendering?: string };
  getContext(tipo: '2d'): (Lienzo2D & { imageSmoothingEnabled: boolean; setTransform(...m: number[]): void }) | null;
}

function fondoDeTira(g: Lienzo2D, ancho: number, alto: number): void {
  g.fillStyle = '#9fd8f0';
  g.fillRect(0, 0, ancho, alto);
  g.fillStyle = '#c6ecf8';
  g.fillRect(0, 22, ancho, 16);
  g.fillStyle = '#7a4a2c';
  g.fillRect(0, 38, ancho, 12);
  g.fillStyle = '#5e3a22';
  g.fillRect(0, 38, ancho, 2);
  for (let k = 0; k < ancho; k += 7) {
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.fillRect(k + (k % 3), 42 + (k % 5), 2, 1);
  }
}

export function tira(
  cv: LienzoDeTira,
  esp: { slug: string; grupo?: string; familia?: string; tutor?: boolean },
  opciones: { escala?: number; actual?: number; t?: number; dpr?: number } = {},
): string[] {
  const S = opciones.escala || 2,
    ancho = 36,
    alto = 50,
    n = ETAPAS.length,
    dpr = Math.min(3, opciones.dpr || 1),
    E = escalaDeLienzo(S * dpr);
  cv.width = ancho * n * E;
  cv.height = alto * E;
  cv.style.width = '100%';
  cv.style.maxWidth = ancho * n * S + 'px';
  cv.style.aspectRatio = ancho * n + ' / ' + alto;
  // con más píxeles que la pantalla se suaviza al achicar; si no, píxeles nítidos (lo que dice el CSS)
  cv.style.imageRendering = E > S * dpr * 1.05 ? 'auto' : '';
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.setTransform(E, 0, 0, E, 0, 0);
  fondoDeTira(g, ancho * n, alto);
  ETAPAS.forEach(([etapa, avance], i) => {
    const x = i * ancho + ancho / 2;
    if (opciones.actual === i) {
      g.fillStyle = 'rgba(255,194,51,0.45)';
      g.fillRect(i * ancho, 0, ancho, 38);
    }
    if (i) {
      g.fillStyle = 'rgba(29,27,75,0.35)';
      g.fillRect(i * ancho - 3, 30, 2, 1);
      g.fillRect(i * ancho - 2, 29, 1, 3);
      g.fillRect(i * ancho - 6, 30, 3, 1);
    }
    const p: PlantaParaDibujar = {
      slug: esp.slug,
      grupo: esp.grupo,
      familia: esp.familia,
      etapa,
      avance,
      salud: 100,
      tutor: avance >= 0.8 && esp.tutor,
    };
    if (etapa === 'semilla') {
      const Bs = pincel(g, x, 39, 1);
      Bs.r(-2, 4, 1, 1, '#f0d071');
      Bs.r(1, 5, 1, 1, '#f0d071');
      Bs.r(3, 3, 1, 1, '#fff1d0');
      Bs.elipse(0, 0, 5, 1, '#5e3a22');
    } else planta(pincel(g, x, 39, 1), p, opciones.t || 0, i);
  });
  return ETAPAS.map((e) => e[2]);
}

/** A qué columna de la tira corresponde una planta viva. */
export function etapaDeTira(p: Pick<PlantaParaDibujar, 'etapa' | 'avance'>): number {
  const COLUMNA: Record<string, number> = { semilla: 0, plantin: 1, cosechable: 4, semillando: 5, pasada: 5 };
  return COLUMNA[p.etapa] ?? (p.avance < 0.62 ? 2 : 3);
}
