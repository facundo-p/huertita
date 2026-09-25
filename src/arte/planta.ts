/**
 * HUERTITA — ilustraciones pixel-art de las plantas (caja de 32 px).
 *
 * Capa de arte compartida: la usan el renderer del patio, la vista de cerca y la tira de estadíos
 * de las fichas. No sabe nada del motor: recibe una planta plana (`PlantaParaDibujar`, que la
 * `PlantaDeEscena` del renderer cumple).
 */
import { estiloDe, type Estilo } from './estilos';
import { FORMAS, type Postura } from './formas';
import { mezcla, PAJA, TIERRA, V, type Paleta } from './paleta';
import { pincel, type Lienzo2D, type Pincel } from './pincel';

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
  B.elipse(0, -1, 5, 2, TIERRA);
  B.elipse(0, -2, 4, 1, '#6b4326');
  B.r(-2, -3, 1, 1, PAJA);
  B.r(1, -2, 1, 1, PAJA);
  B.r(3, -3, 1, 1, '#fff1d0');
}

function plantin(B: Pincel, a: number, pal: Paleta, st: Postura): void {
  const h = Math.round(3 + a * 7),
    x = st.dx(-h * 2);
  B.linea(0, 0, x, -h, pal.c, 1);
  B.elipse(x - 3, -h, 2, 1, pal.v);
  B.elipse(x + 3, -h - 1, 2, 1, pal.v);
  B.r(x - 3, -h - 1, 2, 1, pal.c);
  B.r(x + 2, -h - 2, 2, 1, pal.c);
  if (a > 0.55) {
    B.elipse(x - 1, -h - 3, 1, 2, pal.c);
    B.elipse(x + 2, -h - 4, 1, 2, pal.v);
  }
}

/** La vara floral de una planta que semilla, o la planta seca si ya pasó. */
function semillandoOPasada(B: Pincel, sec: boolean, pal: Paleta, st: Postura): void {
  const tallo = sec ? '#b89a4a' : pal.o,
    xx = st.dx(-26);
  B.elipse(0, -3, 7, 3, sec ? '#8a7a3a' : pal.oo);
  B.elipse(0, -4, 5, 2, sec ? '#b8a04a' : pal.v);
  B.linea(0, -3, xx, -27, tallo, 2);
  for (const [x, y] of [
    [-5, -16],
    [5, -20],
    [-4, -24],
    [3, -12],
  ]) {
    B.linea(Math.round(xx * (-y / 27)), y + 3, x + xx, y, tallo);
    B.disco(x + xx, y - 1, 2, sec ? '#f2e27a' : PAJA);
    B.r(x + xx, y - 2, 1, 1, sec ? '#fff6c0' : '#8a5526');
  }
  B.disco(xx, -28, 2, sec ? '#f2e27a' : PAJA);
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
      }
    } else if (b < 2) {
      B.r(bx * 2 - 2, -1, 5, 2, col);
      B.r(bx * 2 + 2, -3, 1, 2, '#e0b080');
    }
  }
}

/** Dibuja una planta. B = pincel anclado en su base; t = tiempo (para el viento y los bichos). */
export function planta(B: Pincel, p: PlantaParaDibujar, t?: number, fase?: number): void {
  const tt = t || 0,
    f = fase || 0;
  const e = estiloDe(p),
    a = Math.max(0.1, Math.min(1, p.avance || 0)),
    pal = paletaConSalud(e.pal || V, p.salud == null ? 100 : p.salud);
  if (!pal.oo) pal.oo = pal.o;
  const viento = Math.sin(tt * 0.55 + f) * (0.6 + 0.4 * Math.sin(tt * 0.13 + f * 2));
  const st: Postura = {
    madura: p.etapa === 'cosechable',
    tutor: !!p.tutor,
    dx: (y) => Math.round(viento * Math.min(2.2, -y / 11)),
  };
  if (p.etapa === 'semilla') return semilla(B);
  if (p.etapa === 'plantin') return plantin(B, a, pal, st);
  if (p.etapa === 'pasada' || p.etapa === 'semillando') return semillandoOPasada(B, p.etapa === 'pasada', pal, st);
  (FORMAS[e.f] || FORMAS.roseta)(B, a, e, pal, st);
  if (p.plaga) bichos(B, p.plaga, a, tt);
  if (p.dulce) {
    B.r(-8, -Math.round(6 + a * 10), 1, 1, '#ffffff');
    B.r(6, -Math.round(4 + a * 8), 1, 1, '#d6f0ff');
    B.r(0, -Math.round(8 + a * 12), 1, 1, '#ffffff');
  }
}

/** Cuánto hunde la raíz cada forma, en píxeles, ya crecida. */
function hondoDeRaiz(e: Estilo): number {
  if (e.f === 'raiz') return e.largo ? 30 : 16;
  if (e.f === 'mata' || e.f === 'alta' || e.f === 'rastrera') return 34;
  if (e.f === 'trepadora' || e.f === 'repollo') return 26;
  return e.f === 'aromatica' ? 24 : 14;
}

const RAICILLA = '#e9d2a8',
  RAICILLA_OSCURA = '#c9a878';

/** La raíz carnosa (zanahoria, rabanito…) entera, bajo tierra. */
function raizCarnosa(B: Pincel, e: Estilo, a: number, prof: number): void {
  const t = e.tinta!,
    w = Math.round(2 + a * (e.largo ? 3 : 3.5)),
    L = Math.min(prof - 3, Math.round(e.largo ? 6 + a * 22 : 3 + a * 6));
  if (e.largo)
    for (let i = 0; i < L; i++) {
      const ww = Math.max(1, Math.round(w * (1 - (i / L) * 0.85)));
      B.r(-ww, i, ww * 2, 1, i % 5 === 4 ? mezcla(t, '#000000', 0.18) : t);
      B.r(-ww, i, 1, 1, mezcla(t, '#ffffff', 0.35));
    }
  else {
    B.elipse(0, Math.round(L / 2), w, Math.round(L / 2), mezcla(t, '#000000', 0.2));
    B.elipse(-1, Math.round(L / 2) - 1, w - 1, Math.round(L / 2) - 1, t);
    B.r(-w + 2, 2, 2, 2, mezcla(t, '#ffffff', 0.45));
  }
  B.linea(0, L, 0, Math.min(prof - 1, L + 6), RAICILLA_OSCURA);
  for (let i = 0; i < 4; i++) B.linea(i % 2 ? w : -w, 3 + i * 2, i % 2 ? w + 4 : -w - 4, 5 + i * 3, RAICILLA_OSCURA);
}

function raicillas(B: Pincel, e: Estilo, a: number, d: number, prof: number, tope: boolean): void {
  B.linea(0, 0, 0, d, RAICILLA);
  for (let i = 1; i <= 5; i++) {
    const y = Math.round((d * i) / 6),
      s = i % 2 ? 1 : -1,
      l = Math.round((3 + a * 9) * (1 - i / 8));
    B.linea(0, y, s * l, Math.min(prof - 1, y + Math.round(l * 0.7)), i % 3 ? RAICILLA : RAICILLA_OSCURA);
    B.linea(0, y + 1, -s * Math.round(l * 0.6), Math.min(prof - 1, y + 3 + Math.round(l * 0.4)), RAICILLA_OSCURA);
  }
  if (tope) B.linea(-7, prof - 2, 7, prof - 2, RAICILLA); // la raíz topa y se enrula contra el fondo
  if (e.tuber && a > 0.6)
    for (const [x, y] of [
      [-7, 8],
      [5, 11],
      [-2, 15],
      [9, 6],
    ])
      if (y + 3 < prof) {
        B.elipse(x, y, 3, 2, mezcla(e.tuber, '#000000', 0.2));
        B.elipse(x, y - 1, 2, 1, e.tuber);
      }
  if (e.bulbo && a > 0.6) {
    B.elipse(0, 3, 4, 3, e.tinta);
    B.r(-2, 1, 2, 1, '#ffffff');
  }
}

/**
 * Lo que pasa bajo tierra, para la vista de cerca. B anclado al ras del suelo; prof = px de tierra
 * disponibles. Devuelve cuánto pide la raíz y si topa con el fondo.
 */
export function raiz(B: Pincel, p: PlantaParaDibujar, prof: number): { pide: number; tope?: boolean } {
  const e = estiloDe(p),
    a = Math.max(0.1, Math.min(1, p.avance || 0));
  if (p.etapa === 'semilla') {
    B.r(-1, 3, 2, 2, PAJA);
    return { pide: 0 };
  }
  const pide = hondoDeRaiz(e),
    d = Math.min(prof - 2, Math.round(pide * (0.25 + 0.75 * a))),
    tope = pide * (0.25 + 0.75 * a) > prof - 2;
  if (e.f === 'raiz' && a > 0.3) raizCarnosa(B, e, a, prof);
  else raicillas(B, e, a, d, prof, tope);
  return { pide, tope };
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
  style: { width: string; maxWidth: string; aspectRatio: string };
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
    dpr = Math.min(3, opciones.dpr || 1);
  cv.width = ancho * n * S * dpr;
  cv.height = alto * S * dpr;
  cv.style.width = '100%';
  cv.style.maxWidth = ancho * n * S + 'px';
  cv.style.aspectRatio = ancho * n + ' / ' + alto;
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.setTransform(S * dpr, 0, 0, S * dpr, 0, 0);
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
