/**
 * HUERTITA — renderer de texto (grilla de emojis en DOM).
 * Existe para demostrar que la gráfica es intercambiable: cumple el mismo contrato que el renderer
 * pixel y no comparte una línea con él. Un renderer isométrico o 3D entra por la misma puerta.
 */
import type { CeldaDeEscena, CeldaId, Escena, Renderer } from './contrato';

const FONDO: Record<string, string> = { P: '🧱', H: '🏠', T: '🌳', '.': '', ':': '' };
const ETAPA: Record<string, string> = { semilla: '·', plantin: '🌱', pasada: '🥀', semillando: '🌾' };

function claseDe(c: CeldaDeEscena): string {
  const p = c.planta;
  let clase = 'hz-tcelda z-' + c.tipo + (c.tinte ? ' t-' + c.tinte : '') + (c.seleccion ? ' sel' : '');
  if (p && p.etapa === 'cosechable') clase += ' lista';
  if (p && p.plaga) clase += ' plaga';
  if (p && p.salud < 60 && p.etapa !== 'semilla') clase += ' floja';
  return clase;
}

function textoDe(es: Escena, c: CeldaDeEscena): string {
  const p = c.planta;
  let t = '';
  if (p) {
    if (c.ancla === false) t = '·';
    else t = ETAPA[p.etapa] || (p.avance < 0.5 ? '🌿' : p.emoji);
  }
  if (es.capa === 'sol') t = Math.round(c.sol) + 'h';
  if (p && p.trasplante) t = '⤴' + t;
  return t;
}

/** Lo que no es cantero: pared, casa, árbol (pelado en invierno) o nada. */
function fondoDe(es: Escena, ch: string): string {
  const f = FONDO[ch] || '';
  return f === '🌳' && !es.arbolConHojas ? '🪾' : f;
}

export class RenderTexto implements Renderer {
  nombre = 'Texto';
  private cb: ((celda: CeldaId) => void) | null = null;
  private grid!: HTMLDivElement;

  montar(el: HTMLElement): void {
    this.grid = document.createElement('div');
    this.grid.className = 'hz-texto';
    el.appendChild(this.grid);
  }
  desmontar(): void {
    if (this.grid.parentNode) this.grid.parentNode.removeChild(this.grid);
  }
  alTocar(cb: (celda: CeldaId) => void): void {
    this.cb = cb;
  }
  dibujar(es: Escena): void {
    this.grid.style.gridTemplateColumns = 'repeat(' + es.ancho + ', 1fr)';
    this.grid.innerHTML = '';
    for (let y = 0; y < es.alto; y++)
      for (let x = 0; x < es.ancho; x++) {
        const k = x + ',' + y,
          c = es.celdas[k],
          b = document.createElement(c ? 'button' : 'div');
        if (!c) {
          b.className = 'hz-tcelda';
          b.textContent = fondoDe(es, es.plano[y][x]);
        } else {
          b.className = claseDe(c);
          b.textContent = textoDe(es, c);
          b.title = c.nombreZona + (c.planta ? ' · ' + c.planta.nombre + ' · ' + c.planta.etapa : '');
          b.addEventListener('click', () => {
            if (this.cb) this.cb(k);
          });
        }
        this.grid.appendChild(b);
      }
  }
}
