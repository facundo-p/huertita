/**
 * La caché de plantas dibujadas, sin navegador: lienzos falsos que anotan lo que se les pide.
 * Que el sprite pegado sea idéntico al dibujo directo lo prueban las capturas, píxel a píxel.
 */
import { describe, expect, it } from 'vitest';
import { dibujarPlanta, pincel } from '../src/arte';
import type { PlantaParaDibujar } from '../src/arte';
import { ESPECIES } from '../src/dominio';
import { CAJA_DEL_SPRITE, SpritesDePlantas, type LienzoDeSprite } from '../src/render/pixel/sprites';

interface Lienzo extends LienzoDeSprite {
  rects: number[][];
}
const fabrica = (): Lienzo => {
  const cv: Lienzo = {
    width: 0,
    height: 0,
    rects: [],
    getContext() {
      return {
        fillStyle: '',
        imageSmoothingEnabled: true,
        setTransform() {},
        fillRect: (...r: number[]) => cv.rects.push(r),
      } as unknown as CanvasRenderingContext2D;
    },
  };
  return cv;
};
function destino() {
  const pegados: unknown[][] = [];
  const g = { drawImage: (...a: unknown[]) => pegados.push(a) } as unknown as CanvasRenderingContext2D & {
    drawImage(img: never, x: number, y: number, w: number, h: number): void;
  };
  return { g, pegados };
}
const tomate: PlantaParaDibujar = { slug: 'tomate', etapa: 'creciendo', avance: 0.5, salud: 100 };

describe('la caché de plantas', () => {
  it('dibuja una vez y pega todas las veces que haga falta', () => {
    const c = new SpritesDePlantas(fabrica),
      { g, pegados } = destino();
    for (let i = 0; i < 5; i++) c.pegar(g, 4, 30, 40, 1, tomate, 0.3);
    expect(c.dibujados).toBe(1);
    expect(pegados).toHaveLength(5);
  });

  it('pega con la base de la planta en el lugar pedido, en píxeles enteros del lienzo', () => {
    const c = new SpritesDePlantas(fabrica),
      { g, pegados } = destino();
    c.pegar(g, 4, 30.3, 40.8, 1.4, tomate, 0);
    const [, x, y, w, h] = pegados[0] as number[];
    for (const v of [x, y, w, h]) expect(Number.isInteger(v * 4), String(v)).toBe(true);
    // la base (30,5 ; 41) cae dentro de la caja pegada
    expect(x).toBeLessThan(30.5);
    expect(x + w).toBeGreaterThan(30.5);
    expect(y).toBeLessThan(41);
    expect(y + h).toBeGreaterThan(41);
  });

  it('la clave cambia con todo lo que cambia el dibujo', () => {
    const k = (p: Partial<PlantaParaDibujar>, viento = 0, esc = 1, S = 4) =>
      SpritesDePlantas.clave({ ...tomate, ...p }, viento, esc, S);
    const base = k({});
    for (const otra of [
      k({ slug: 'lechuga' }),
      k({ grupo: 'hojas' }),
      k({ familia: 'asteráceas' }),
      k({ etapa: 'cosechable' }),
      k({ avance: 0.7 }),
      k({ salud: 40 }),
      k({ tutor: true }),
      k({ dulce: true }),
      k({}, 0.5),
      k({}, 0, 1.4),
      k({}, 0, 1, 8),
    ])
      expect(otra).not.toBe(base);
  });

  it('la clave no cambia con lo que no cambia el dibujo', () => {
    const k = (p: Partial<PlantaParaDibujar>, viento = 0) => SpritesDePlantas.clave({ ...tomate, ...p }, viento, 1, 4);
    expect(k({ plaga: 'pulgon' })).toBe(k({}));
    expect(k({ avance: 0.5 + 0.004 })).toBe(k({}));
    expect(k({ salud: 98 })).toBe(k({}));
    expect(k({}, 0.05)).toBe(k({}));
  });

  it('una misma clave es siempre el mismo dibujo', () => {
    const dib = (p: PlantaParaDibujar, v: number) => {
      const r = SpritesDePlantas.redondeada(p, v),
        cv = fabrica();
      dibujarPlanta(pincel(cv.getContext('2d')!, 24, 48, 1), r.p, r.viento);
      return cv.rects;
    };
    const a = { ...tomate, avance: 0.5, salud: 100 },
      b = { ...tomate, avance: 0.5 + 0.004, salud: 98, plaga: 'oruga' };
    expect(SpritesDePlantas.clave(a, 0.3, 1, 4)).toBe(SpritesDePlantas.clave(b, 0.31, 1, 4));
    expect(dib(b, 0.31)).toEqual(dib(a, 0.3));
  });

  it('cuando pasa el tope tira las que hace más que no se usan', () => {
    const c = new SpritesDePlantas(
        () => {
          const cv = fabrica();
          return cv;
        },
        // entran dos sprites de 48 × 56 unidades a escala 1 y S = 1
        2 * 48 * 56 * 4,
      ),
      { g } = destino();
    const con = (avance: number) => c.pegar(g, 1, 30, 40, 1, { ...tomate, avance }, 0);
    con(0.2);
    con(0.4);
    con(0.2); // la usa de nuevo: ahora la más vieja es la de 0,4
    con(0.6); // no entra: tira la de 0,4
    expect(c.tamanio).toBe(2);
    const antes = c.dibujados;
    con(0.2);
    expect(c.dibujados).toBe(antes);
    con(0.4);
    expect(c.dibujados).toBe(antes + 1);
  });

  it('ninguna planta se sale de la caja del sprite', () => {
    const { izquierda, ancho, arriba, alto } = CAJA_DEL_SPRITE;
    let afuera = '';
    const g = {
      fillStyle: '',
      fillRect(x: number, y: number, w: number, h: number) {
        if (x < -izquierda || x + w > ancho - izquierda || y < -arriba || y + h > alto - arriba)
          afuera = `${actual} ${x},${y},${w},${h}`;
      },
    };
    let actual = '';
    for (const slug of Object.keys(ESPECIES))
      for (const etapa of ['semilla', 'plantin', 'creciendo', 'cosechable', 'semillando', 'pasada'])
        for (const avance of [0.1, 0.5, 1])
          for (const viento of [-1, 0, 1])
            for (const tutor of [false, true]) {
              actual = `${slug} ${etapa} ${avance} v${viento}`;
              dibujarPlanta(
                pincel(g, 0, 0, 1),
                {
                  slug,
                  grupo: ESPECIES[slug].grupo,
                  familia: ESPECIES[slug].familia,
                  etapa,
                  avance,
                  salud: 100,
                  tutor,
                  dulce: true,
                },
                viento,
              );
            }
    expect(afuera).toBe('');
  });
});
