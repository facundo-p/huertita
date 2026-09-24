/**
 * HUERTITA — renderer pixel-art (canvas, baldosas de 32 px), con cámaras intercambiables.
 *
 * Cumple el contrato de `../contrato.ts`: montar, dibujar una escena plana, avisar qué celda se tocó
 * y desmontar; ofrece sus cámaras y los efectos de las acciones. No importa el motor ni lee el
 * estado. Cada cámara es un archivo en `camaras/`: arma su geometría, pinta su fondo y, si quiere,
 * algo antes y después de las plantas. Lo demás (plantas, capas, efectos, clima) es común.
 */
import { pincel } from '../../arte';
import type { CeldaId, DatosDeEfecto, Efecto, Escena, Renderer } from '../contrato';
import { CAMARAS, camaraDe, type Camara } from './camaras';
import { capas } from './capas';
import { clima } from './clima';
import { Efectos } from './efectos';
import type { Geometria } from './geometria';
import { xyDe } from './geometria';
import { ruido } from './paleta';
import { plantas, type Tween } from './plantas';

interface Previa {
  id: string;
  a: number;
  etapa: string;
}

/** y, después x: se dibuja de atrás hacia adelante */
function deAtrasHaciaAdelante(a: string, b: string): number {
  const [ax, ay] = xyDe(a),
    [bx, by] = xyDe(b);
  return ay - by || ax - bx;
}

export class RenderPixel implements Renderer {
  nombre = 'Pixel';
  camaras: [string, string][] = CAMARAS.map((c) => [c.id, c.etiqueta]);

  private cb: ((celda: CeldaId) => void) | null = null;
  private escena: Escena | null = null;
  private camara: Camara = CAMARAS[0];
  private G: Geometria | null = null;
  private t = 0;
  private S = 1;
  private tw: Record<string, Tween> = {};
  private prev: Record<string, Previa | null> = {};
  private efectos = new Efectos(() => (this.G && this.escena ? { G: this.G, es: this.escena } : null));
  private el!: HTMLElement;
  private cv!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private bg!: HTMLCanvasElement;
  private timer = 0;
  private alHacerClick = (e: MouseEvent): void => {
    if (!this.G || !this.cb) return;
    const r = this.cv.getBoundingClientRect();
    const k = this.G.hit(((e.clientX - r.left) / r.width) * this.G.W, ((e.clientY - r.top) / r.height) * this.G.H);
    if (k) this.cb(k);
  };
  private alCambiarDeTamanio = (): void => {
    if (this.escena) this.dibujar(this.escena);
  };

  montar(el: HTMLElement): void {
    this.el = el;
    this.cv = document.createElement('canvas');
    this.cv.className = 'hz-canvas';
    this.cv.setAttribute('role', 'img');
    this.cv.setAttribute('aria-label', 'Patio de la huerta');
    el.appendChild(this.cv);
    this.ctx = this.cv.getContext('2d')!;
    this.bg = document.createElement('canvas');
    this.cv.addEventListener('click', this.alHacerClick);
    window.addEventListener('resize', this.alCambiarDeTamanio);
    const quieto = !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.timer = window.setInterval(
      () => {
        this.t += quieto ? 0 : 0.5;
        if (this.escena) this.cuadro();
      },
      quieto ? 600 : 90,
    );
  }

  desmontar(): void {
    clearInterval(this.timer);
    window.removeEventListener('resize', this.alCambiarDeTamanio);
    this.cv.removeEventListener('click', this.alHacerClick);
    if (this.cv.parentNode) this.cv.parentNode.removeChild(this.cv);
  }

  alTocar(cb: (celda: CeldaId) => void): void {
    this.cb = cb;
  }

  /** brotes y crecimiento: si el avance subió desde la última foto, se anima */
  private animarCrecimiento(es: Escena, ahora: number): void {
    for (const k of Object.keys(es.celdas)) {
      const p = es.celdas[k].ancla === false ? null : es.celdas[k].planta,
        id = p ? k + p.slug : null,
        ant = this.prev[k];
      if (p && ant && ant.id === id) {
        const brote = ant.etapa === 'semilla' && p.etapa !== 'semilla',
          de = brote ? 0.02 : ant.a;
        if (p.avance > de + 0.015 || ant.etapa !== p.etapa) {
          const [x, y] = xyDe(k);
          this.tw[k] = { de, a: p.avance, t0: ahora + Math.round(ruido(x, y) * 500), dur: 900, brote };
        }
      }
      this.prev[k] = p ? { id: id!, a: p.avance, etapa: p.etapa } : null;
    }
  }

  dibujar(es: Escena): void {
    this.animarCrecimiento(es, Date.now());
    this.escena = es;
    this.camara = camaraDe(es.camara);
    const G = (this.G = this.camara.geometria(es));
    const cssW = this.el.clientWidth || 320,
      S = Math.max(1, Math.round((cssW * (window.devicePixelRatio || 1)) / G.W));
    if (this.cv.width !== G.W * S || this.cv.height !== G.H * S) {
      this.cv.width = G.W * S;
      this.cv.height = G.H * S;
    }
    this.S = S;
    this.bg.width = G.W * S;
    this.bg.height = G.H * S;
    const bg = this.bg.getContext('2d')!;
    bg.setTransform(S, 0, 0, S, 0, 0);
    bg.imageSmoothingEnabled = false;
    this.camara.fondo(bg, es, G);
    this.cuadro();
  }

  /** un cuadro: el fondo ya pintado y todo lo que se mueve */
  private cuadro(): void {
    const es = this.escena!,
      G = this.G!,
      g = this.ctx,
      t = this.t;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(this.bg, 0, 0);
    g.setTransform(this.S, 0, 0, this.S, 0, 0);
    const r = pincel(g, 0, 0, 1).r,
      claves = Object.keys(es.celdas)
        .filter((k) => G.celda(k))
        .sort(deAtrasHaciaAdelante);
    this.camara.debajo?.(g, es, G, t);
    const anim = {
      tw: this.tw,
      oculta: this.efectos.oculta,
      efecto: (tipo: 'brote', d: { celda: string }) => this.efecto(tipo, d),
    };
    plantas(g, es, G, claves, anim, t, Date.now());
    this.camara.delante?.(g, es, G, t);
    capas(g, es, G, claves, t);
    this.efectos.dibujar(g, r);
    clima(g, r, es, G, t);
  }

  efecto(tipo: Efecto, datos: DatosDeEfecto = {}): void {
    this.efectos.disparar(tipo, datos);
  }
}
