/**
 * Las animaciones puntuales que dispara una acción: partículas (semillas, tierra, agua, hojas
 * secas, papel picado), plantas que vuelan (cosecha, trasplante) y textos que suben.
 */
import { pincel, planta, type Pincel, type PlantaParaDibujar } from '../../arte';
import type { DatosDeEfecto, Efecto, Escena } from '../contrato';
import type { Geometria } from './geometria';
import { letras } from './letras';
import { C, ruido } from './paleta';

interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  v0: number;
  col: string;
  tam: number;
  /** gravedad */
  g: number;
  /** cuadros que espera antes de salir */
  espera: number;
}
interface Vuelo {
  p: PlantaParaDibujar;
  x: number;
  y: number;
  x1: number;
  y1: number;
  u: number;
  dur: number;
  s: number;
  fuera?: boolean;
  arco?: number;
  fin?: () => void;
}
interface TextoQueSube {
  x: number;
  y: number;
  txt: string;
  vida: number;
  col: string;
}

const PAPEL_PICADO = ['#ffc233', '#e0502f', '#1fc2b8', '#ff7aa8', '#3fc25a'];

type Soltar = (
  x: number,
  y: number,
  vx: number,
  vy: number,
  vida: number,
  col: string,
  tam?: number,
  gr?: number,
  espera?: number,
) => void;
type Receta = (P: Soltar, q: { bx: number; by: number }, s: number) => void;

function hojarasca(claro: string, oscuro: string): Receta {
  return (P, q, s) => {
    for (let i = 0; i < 16; i++)
      P(
        q.bx - 12 + ruido(i, 11) * 24,
        q.by - 26 * s - ruido(i, 12) * 8,
        0,
        1.2,
        14,
        i % 2 ? claro : oscuro,
        s + 1,
        0.25,
        i,
      );
  };
}

/** Las partículas de cada efecto que pasa en una celda. */
const EN_LA_CELDA: Partial<Record<Efecto, Receta>> = {
  sembrar(P, q, s) {
    for (let i = 0; i < 6; i++)
      P(q.bx - 5 + i * 2, q.by - 30 * s, (i - 2.5) * 0.12, 0.6, 16, i % 2 ? '#f0d071' : '#fff1d0', s, 0.3, i * 2);
    for (let i = 0; i < 12; i++)
      P(
        q.bx,
        q.by - 1,
        (ruido(i, 1) - 0.5) * 3.2,
        -1.2 - ruido(i, 2) * 2,
        12,
        i % 2 ? '#7a4d2e' : '#b07a4e',
        s + 1,
        0.35,
        12,
      );
  },
  brote(P, q, s) {
    for (let i = 0; i < 8; i++)
      P(
        q.bx,
        q.by - 4,
        Math.cos(i * 0.785) * 1.6,
        Math.sin(i * 0.785) * 1.6 - 0.8,
        12,
        i % 2 ? '#86db5c' : '#fff6e0',
        s,
        0.05,
      );
  },
  polvo(P, q, s) {
    for (let i = 0; i < 10; i++)
      P(q.bx, q.by, (ruido(i, 3) - 0.5) * 3.4, -0.8 - ruido(i, 4) * 1.4, 11, i % 2 ? '#7a4d2e' : '#b07a4e', s + 1, 0.3);
  },
  morir(P, q, s) {
    for (let i = 0; i < 12; i++)
      P(
        q.bx + (ruido(i, 6) - 0.5) * 12,
        q.by - ruido(i, 7) * 18 * s,
        (ruido(i, 8) - 0.5) * 1.2,
        0.5,
        20,
        i % 2 ? '#c9a74a' : '#8a6a3a',
        s + 1,
        0.04,
        i,
      );
  },
  tratar(P, q, s) {
    for (let i = 0; i < 16; i++)
      P(
        q.bx - 14,
        q.by - 20 * s,
        1.2 + ruido(i, 9) * 1.6,
        (ruido(i, 10) - 0.4) * 1.8,
        12,
        i % 2 ? '#c8f4ff' : '#ffffff',
        s,
        0.08,
        i % 5,
      );
  },
  mulch: hojarasca('#f0d071', '#d9b04a'),
  compost: hojarasca('#3d2617', '#6b4a2a'),
  tutorar(P, q, s) {
    for (let i = 0; i < 6; i++) P(q.bx + 7, q.by - 28 * s, (ruido(i, 13) - 0.5) * 2, -0.6, 10, '#d9b779', s, 0.2);
  },
};

export class Efectos {
  parts: Particula[] = [];
  vuelos: Vuelo[] = [];
  textos: TextoQueSube[] = [];
  /** la celda cuya planta está volando: no se dibuja en su lugar */
  oculta: string | null = null;

  /** `mundo` da la geometría y la escena del último dibujo: un efecto que termina más tarde usa las de ese momento. */
  constructor(private mundo: () => { G: Geometria; es: Escena } | null) {}

  private P(
    x: number,
    y: number,
    vx: number,
    vy: number,
    vida: number,
    col: string,
    tam?: number,
    gr?: number,
    espera?: number,
  ): void {
    this.parts.push({
      x,
      y,
      vx,
      vy,
      vida,
      v0: vida,
      col,
      tam: tam || 1,
      g: gr == null ? 0.25 : gr,
      espera: espera || 0,
    });
  }

  disparar(tipo: Efecto, d: DatosDeEfecto = {}): void {
    const ahora = this.mundo();
    if (!ahora) return;
    const { G, es } = ahora;
    if (tipo === 'regar') return this.regar(d, G, es);
    if (tipo === 'logro') return this.logro(G);
    const q = d && d.celda ? G.celda(d.celda) : null;
    if (!q) return;
    if (tipo === 'cosechar') return this.cosechar(d, q, q.s);
    if (tipo === 'trasplantar') return this.trasplantar(d, G, q, q.s);
    EN_LA_CELDA[tipo]?.(this.P.bind(this), q, q.s);
  }

  private cosechar(d: DatosDeEfecto, q: { bx: number; by: number }, s: number): void {
    const P = this.P.bind(this);
    if (d.planta)
      this.vuelos.push({ p: d.planta, x: q.bx, y: q.by, x1: q.bx, y1: q.by - 60 * s, u: 0, dur: 14, s, fuera: true });
    for (let i = 0; i < 14; i++)
      P(
        q.bx,
        q.by - 10 * s,
        Math.cos(i * 0.45) * 2.4,
        Math.sin(i * 0.45) * 2.4 - 1,
        16,
        i % 3 ? '#ffc233' : '#fff6e0',
        s + 1,
        0.12,
        3,
      );
    for (let i = 0; i < 6; i++) P(q.bx, q.by, (ruido(i, 5) - 0.5) * 3, -1.5, 10, '#7a4d2e', s + 1, 0.35);
    if (d.texto) this.textos.push({ x: q.bx, y: q.by - 18 * s, txt: d.texto, vida: 26, col: C.maiz });
  }

  private trasplantar(d: DatosDeEfecto, G: Geometria, q: { bx: number; by: number }, s: number): void {
    const o = d.de ? G.celda(d.de) : null;
    if (!o || !d.planta) return this.disparar('polvo', d);
    this.oculta = d.celda!;
    this.vuelos.push({
      p: d.planta,
      x: o.bx,
      y: o.by,
      x1: q.bx,
      y1: q.by,
      u: 0,
      dur: 12,
      s,
      arco: 26,
      fin: () => {
        this.oculta = null;
        this.disparar('polvo', { celda: d.celda });
      },
    });
  }

  private regar(d: DatosDeEfecto, G: Geometria, es: Escena): void {
    Object.keys(es.celdas).forEach((k, j) => {
      const c = es.celdas[k],
        qq = G.celda(k);
      if (!qq || c.zona !== d.zona) return;
      for (let i = 0; i < 2 + (d.nivel ?? 0) * 2; i++)
        this.P(
          qq.bx - 10 + ruido(i, j) * 20,
          qq.by - 28 * qq.s,
          -0.3,
          2.2,
          10,
          i % 2 ? '#7fd0f0' : '#c8f4ff',
          qq.s,
          0.2,
          Math.floor(ruido(j, i) * 10),
        );
    });
  }

  private logro(G: Geometria): void {
    for (let i = 0; i < 40; i++)
      this.P(
        ruido(i, 14) * G.W,
        -4,
        (ruido(i, 15) - 0.5) * 1.5,
        1 + ruido(i, 16) * 1.5,
        40,
        PAPEL_PICADO[i % 5],
        2,
        0.03,
        Math.floor(ruido(i, 17) * 14),
      );
  }

  /** Un cuadro de todo lo que está en el aire; lo que terminó, se va. */
  dibujar(g: CanvasRenderingContext2D, r: Pincel['r']): void {
    this.vuelos = this.vuelos.filter((v) => {
      v.u++;
      const u = Math.min(1, v.u / v.dur),
        e = u * u * (3 - 2 * u),
        x = v.x + (v.x1 - v.x) * e,
        y = v.y + (v.y1 - v.y) * e - (v.arco ? Math.sin(u * 3.14) * v.arco : 0);
      g.globalAlpha = v.fuera ? 1 - u * u : 1;
      planta(pincel(g, x, y, v.s), v.p, 0, 0);
      g.globalAlpha = 1;
      if (u < 1) return true;
      if (v.fin) v.fin();
      return false;
    });
    this.parts = this.parts.filter((p) => {
      if (p.espera > 0) {
        p.espera--;
        return true;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.vida--;
      g.globalAlpha = Math.min(1, p.vida / (p.v0 * 0.4));
      r(p.x, p.y, p.tam, p.tam, p.col);
      g.globalAlpha = 1;
      return p.vida > 0;
    });
    this.textos = this.textos.filter((t) => {
      t.y -= 0.9;
      t.vida--;
      g.globalAlpha = Math.min(1, t.vida / 8);
      letras(g, Math.round(t.x - t.txt.length * 4), Math.round(t.y), t.txt, C.anil, 2, 1);
      letras(g, Math.round(t.x - t.txt.length * 4), Math.round(t.y) - 1, t.txt, t.col, 2);
      g.globalAlpha = 1;
      return t.vida > 0;
    });
  }
}
