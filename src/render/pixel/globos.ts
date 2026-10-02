/**
 * Los globos de aviso sobre las plantas: lista para cosechar, plantín para trasplantar y plaga. Un globo
 * redondo con volumen (la luz arriba a la izquierda), una sombra suave que cae hacia abajo, una colita
 * que apunta a la planta y un ícono blanco adentro que se lee sin leer: una tilde, una flecha, una
 * admiración. Sin contorno duro. Cada globo se dibuja una vez en un lienzo chico y se pega (flota con el tiempo).
 */
import { RES, mezcla, pincel, rampaDe } from '../../arte';
import { C } from './paleta';

export type TipoDeGlobo = 'cosecha' | 'listo' | 'pasado' | 'plaga';

const TONOS: Record<TipoDeGlobo, string> = {
  cosecha: C.maiz,
  listo: '#3fc25a',
  pasado: '#e0502f',
  plaga: '#e0502f',
};

/** Los íconos, de siete filas: un píxel de ícono mide 0,75 unidades. */
const ICONOS: Record<TipoDeGlobo, string[]> = {
  cosecha: ['......XX', '.....XXX', 'X...XXX.', 'XX.XXX..', 'XXXXX...', '.XXX....', '..X.....'],
  listo: ['..XXX..', '..XXX..', '..XXX..', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
  pasado: ['..XXX..', '..XXX..', '..XXX..', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
  plaga: ['..XXX..', '..XXX..', '..XXX..', '..XXX..', '.......', '..XXX..', '..XXX..'],
};

const PX = 0.75,
  RADIO = 4.6,
  /** el lienzo del globo, en unidades: el centro del globo está en (IZQ, ARR) */
  IZQ = 6,
  ARR = 6,
  ANCHO = 12,
  ALTO = 14;

interface Dibujo {
  width: number;
  height: number;
  getContext(tipo: '2d'): CanvasRenderingContext2D | null;
}

const guardados = new Map<string, Dibujo>();

function dibujar(tipo: TipoDeGlobo, S: number): Dibujo {
  const cv = document.createElement('canvas');
  cv.width = ANCHO * S;
  cv.height = ALTO * S;
  const c = cv.getContext('2d')!;
  c.setTransform(S, 0, 0, S, 0, 0);
  c.imageSmoothingEnabled = false;
  const forma = (B: ReturnType<typeof pincel>) =>
      B.mascara()
        .elipse(0, 0, RADIO, RADIO)
        .poligono([
          [-1.4, RADIO - 1],
          [1.4, RADIO - 1],
          [0, RADIO + 1.9],
        ]),
    sombra = 'rgba(24,20,70,0.3)';
  // la sombra suave, un poco corrida hacia abajo y a la derecha
  const Bs = pincel(c, IZQ + 0.75, ARR + 1, 1);
  Bs.volumen(forma(Bs), [sombra, sombra, sombra, sombra, sombra, sombra, sombra]);
  const B = pincel(c, IZQ, ARR, 1),
    tono = TONOS[tipo];
  B.volumen(forma(B), rampaDe(tono));
  // el ícono, con una sombrita del tono oscuro para que se lea sobre el brillo
  const filas = ICONOS[tipo],
    ancho = filas[0].length * PX,
    x0 = -ancho / 2 + 0.2,
    y0 = -filas.length * PX * 0.5 - 0.3;
  for (const [dx, col] of [
    [0.25, mezcla(tono, '#0c1a3a', 0.55)],
    [0, C.blanco],
  ] as const)
    filas.forEach((fila, j) => {
      for (let i = 0; i < fila.length; i++) {
        if (fila[i] !== 'X') continue;
        let n = 1;
        while (i + n < fila.length && fila[i + n] === 'X') n++;
        B.r(x0 + i * PX + dx, y0 + j * PX + dx, n * PX, PX, col);
        i += n - 1;
      }
    });
  return cv;
}

/** Pega un globo con su centro en (x, y); `g` ya está escalado por `S`. */
export function globo(g: CanvasRenderingContext2D, tipo: TipoDeGlobo, x: number, y: number): void {
  const S = g.getTransform().a,
    k = tipo + '|' + S;
  let cv = guardados.get(k);
  if (!cv) {
    cv = dibujar(tipo, S);
    guardados.set(k, cv);
  }
  const alPixel = (v: number): number => Math.round(v * RES) / RES;
  g.drawImage(cv as CanvasImageSource, alPixel(x - IZQ), alPixel(y - ARR), ANCHO, ALTO);
}
