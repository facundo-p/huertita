/**
 * El arte, sin navegador: un lienzo falso que anota cada rectángulo alcanza para saber que todas
 * las especies se dibujan en todas sus etapas sin tirar. Que se vean igual que antes lo prueban las
 * capturas (`npm run capturas`), píxel a píxel.
 */
import { describe, expect, it } from 'vitest';
import { ESTILO, FORMAS, FORMAS_DE_PLANTA, estiloDe, etapaDeTira, pincel, planta, raiz, tira } from '../src/arte';
import type { Lienzo2D, PlantaParaDibujar } from '../src/arte';
import { ESPECIES } from '../src/dominio';

function lienzoFalso(): Lienzo2D & { rects: number; malos: number } {
  return {
    fillStyle: '',
    rects: 0,
    malos: 0,
    fillRect(x, y, w, h) {
      this.rects++;
      if (![x, y, w, h].every(Number.isFinite)) this.malos++;
    },
  };
}

const ETAPAS = ['semilla', 'plantin', 'creciendo', 'cosechable', 'semillando', 'pasada'];

describe('el arte', () => {
  it('cada estilo pide una forma que existe', () => {
    for (const [slug, e] of Object.entries(ESTILO)) {
      expect(FORMAS_DE_PLANTA, slug).toContain(e.f);
      expect(FORMAS[e.f], slug).toBeTypeOf('function');
    }
  });
  it('una especie sin estilo propio usa el de su grupo', () => {
    expect(estiloDe({ slug: 'nueva', grupo: 'Legumbre' }).f).toBe('trepadora');
    expect(estiloDe({ slug: 'nueva', familia: 'cucurbitacea' }).f).toBe('rastrera');
    expect(estiloDe({ slug: 'nueva' }).f).toBe('roseta');
  });
  it.each(Object.keys(ESPECIES))('%s se dibuja en todas sus etapas, sana y enferma, y su raíz', (slug) => {
    const sp = ESPECIES[slug];
    for (const etapa of ETAPAS)
      for (const avance of [0, 0.5, 1])
        for (const [salud, plaga] of [
          [100, null],
          [40, 'pulgon'],
          [20, 'oruga'],
          [60, 'babosa'],
        ] as const) {
          const g = lienzoFalso();
          const p: PlantaParaDibujar = {
            slug,
            grupo: sp.grupo,
            familia: sp.familia,
            etapa,
            avance,
            salud,
            plaga,
            tutor: true,
            dulce: true,
          };
          planta(pincel(g, 20, 40, 1), p, 3.3, 1);
          expect(g.rects, `${slug} ${etapa} ${avance}`).toBeGreaterThan(0);
          const r = raiz(pincel(g, 20, 40, 2), p, 30);
          expect(r.pide).toBeGreaterThanOrEqual(0);
        }
    // salvo las especies genéricas sin fruto definido, nada se dibuja fuera del lienzo
    const g = lienzoFalso();
    planta(pincel(g, 20, 40, 1), { slug, grupo: sp.grupo, familia: sp.familia, etapa: 'creciendo', avance: 0.7 }, 0, 0);
    expect(g.malos).toBe(0);
  });
  it('la tira de estadíos dibuja las seis columnas', () => {
    const g = lienzoFalso();
    const cv = {
      width: 0,
      height: 0,
      style: { width: '', maxWidth: '', aspectRatio: '' },
      getContext: () => ({ ...g, fillRect: g.fillRect.bind(g), imageSmoothingEnabled: true, setTransform() {} }),
    };
    expect(tira(cv, { slug: 'tomate', grupo: 'Hortaliza de fruto', familia: 'solanacea', tutor: true })).toHaveLength(
      6,
    );
    expect(cv.width).toBe(36 * 6 * 2);
  });
  it('cada planta cae en su columna de la tira', () => {
    expect(etapaDeTira({ etapa: 'semilla', avance: 0 })).toBe(0);
    expect(etapaDeTira({ etapa: 'creciendo', avance: 0.3 })).toBe(2);
    expect(etapaDeTira({ etapa: 'creciendo', avance: 0.7 })).toBe(3);
    expect(etapaDeTira({ etapa: 'pasada', avance: 1 })).toBe(5);
  });
});
