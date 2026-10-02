/**
 * La caché de plantas dibujadas. Una planta se dibuja rectángulo por rectángulo; hacerlo en cada
 * cuadro (cada 90 ms) cuesta, y a resolución alta mucho. Acá se dibuja una vez en un lienzo chico (un
 * sprite) y los cuadros siguientes lo pegan con `drawImage`.
 *
 * El sprite es el cuerpo de la planta (`dibujarPlanta`): lo que no cambia con el tiempo. Los bichos y
 * el salto de la planta lista para cosechar se dibujan aparte, en cada cuadro. Para que haya pocas
 * versiones de cada planta, el avance, la salud y el viento se redondean a pasos (de ahí sale la
 * clave): la misma clave es siempre el mismo dibujo, porque el sprite se dibuja con los valores ya
 * redondeados.
 */
import { RES, dibujarPlanta, pincel, type PlantaParaDibujar } from '../../arte';

/** pasos a los que se redondea lo que cambia el dibujo */
const PASO_AVANCE = 1 / 64,
  PASO_SALUD = 5,
  PASO_VIENTO = 0.25;

/**
 * La caja del sprite, en unidades de dibujo a escala 1, medida sobre todas las especies, etapas,
 * avances y vientos (con un margen): la planta más ancha va de -19 a 21 y la más alta llega a -44.
 */
export const CAJA_DEL_SPRITE = { izquierda: 24, ancho: 48, arriba: 48, alto: 56 };
const IZQUIERDA = CAJA_DEL_SPRITE.izquierda,
  ANCHO = CAJA_DEL_SPRITE.ancho,
  ARRIBA = CAJA_DEL_SPRITE.arriba,
  ALTO = CAJA_DEL_SPRITE.alto;

/** lo que se guarda en la caché, como máximo (en bytes de píxeles) */
const TOPE_DE_BYTES = 64 * 1024 * 1024;

/** Lo que el sprite necesita de un lienzo: el canvas del navegador cumple. */
export interface LienzoDeSprite {
  width: number;
  height: number;
  getContext(tipo: '2d'): CanvasRenderingContext2D | null;
}

/** Lo que hace falta del lienzo donde se pega. */
export interface DondePegar {
  drawImage(img: never, x: number, y: number, w: number, h: number): void;
}

const aPasos = (v: number, paso: number): number => Math.round(v / paso) * paso;
/** al píxel del lienzo, como el pincel: múltiplo de `1/RES` unidades */
const alPixel = (v: number): number => Math.round(v * RES) / RES;
const haciaArriba = (v: number): number => Math.ceil(v * RES - 1e-9) / RES;

export class SpritesDePlantas {
  private mapa = new Map<string, LienzoDeSprite>();
  private bytes = 0;
  /** cuántos sprites se dibujaron (para los tests y para medir) */
  dibujados = 0;

  constructor(
    private fabrica: () => LienzoDeSprite = () => document.createElement('canvas'),
    private tope = TOPE_DE_BYTES,
  ) {}

  /** La planta con el avance, la salud y el viento ya redondeados: lo que de verdad se dibuja. */
  static redondeada(p: PlantaParaDibujar, viento: number): { p: PlantaParaDibujar; viento: number } {
    return {
      p: {
        ...p,
        avance: Math.min(1, Math.max(0, aPasos(p.avance || 0, PASO_AVANCE))),
        salud: p.salud == null ? 100 : Math.min(100, Math.max(0, aPasos(p.salud, PASO_SALUD))),
        plaga: null,
      },
      viento: aPasos(viento, PASO_VIENTO),
    };
  }

  /** La clave de la caché: todo lo que cambia el dibujo. */
  static clave(p: PlantaParaDibujar, viento: number, escala: number, S: number): string {
    const r = SpritesDePlantas.redondeada(p, viento);
    return [
      r.p.slug,
      r.p.grupo ?? '',
      r.p.familia ?? '',
      r.p.etapa,
      r.p.avance,
      r.p.salud,
      r.p.tutor ? 1 : 0,
      r.p.dulce ? 1 : 0,
      r.viento,
      escala,
      S,
    ].join('|');
  }

  /** Pega la planta con su base en (x, y). `g` ya está escalado por `S`. */
  pegar(
    g: CanvasRenderingContext2D & DondePegar,
    S: number,
    x: number,
    y: number,
    escala: number,
    p: PlantaParaDibujar,
    viento: number,
  ): void {
    const k = SpritesDePlantas.clave(p, viento, escala, S),
      ox = haciaArriba(IZQUIERDA * escala),
      oy = haciaArriba(ARRIBA * escala),
      w = haciaArriba(ANCHO * escala),
      h = haciaArriba(ALTO * escala);
    let cv = this.mapa.get(k);
    if (cv) {
      this.mapa.delete(k);
      this.mapa.set(k, cv);
    } else {
      cv = this.dibujar(p, viento, escala, S, ox, oy, w, h);
      this.mapa.set(k, cv);
      this.bytes += cv.width * cv.height * 4;
      this.recortar();
    }
    g.drawImage(cv as never, alPixel(x) - ox, alPixel(y) - oy, w, h);
  }

  private dibujar(
    p: PlantaParaDibujar,
    viento: number,
    escala: number,
    S: number,
    ox: number,
    oy: number,
    w: number,
    h: number,
  ): LienzoDeSprite {
    const cv = this.fabrica(),
      r = SpritesDePlantas.redondeada(p, viento);
    cv.width = Math.round(w * S);
    cv.height = Math.round(h * S);
    const c = cv.getContext('2d')!;
    c.setTransform(S, 0, 0, S, 0, 0);
    c.imageSmoothingEnabled = false;
    dibujarPlanta(pincel(c, ox, oy, escala), r.p, r.viento);
    this.dibujados++;
    return cv;
  }

  /** Tira las que hace más que no se usan hasta volver al tope. */
  private recortar(): void {
    for (const [k, cv] of this.mapa) {
      if (this.bytes <= this.tope || this.mapa.size <= 1) break;
      this.mapa.delete(k);
      this.bytes -= cv.width * cv.height * 4;
    }
  }

  get tamanio(): number {
    return this.mapa.size;
  }
}
