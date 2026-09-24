/**
 * La pasada de plantas: cada una en su celda, animada si acaba de crecer, con sus avisos encima
 * (lista para cosechar, lista para trasplantar, salud baja, plaga) y las abejas en las flores.
 */
import { pincel, planta, type Pincel, type PlantaParaDibujar } from '../../arte';
import type { CeldaDeEscena, Escena, PlantaDeEscena } from '../contrato';
import type { CeldaEnPantalla, Geometria } from './geometria';
import { letras } from './letras';
import { C, easeBack } from './paleta';

/** Una planta que crece de a poco entre dos fotos: de `de` a `a`, arrancando en `t0` y durando `dur` ms. */
export interface Tween {
  de: number;
  a: number;
  t0: number;
  dur: number;
  brote: boolean;
  hecho?: boolean;
}

/** Lo que la pasada de plantas necesita del renderer: sus animaciones en curso. */
export interface Animaciones {
  tw: Record<string, Tween>;
  /** la celda cuya planta está volando (trasplante): no se dibuja en su lugar */
  oculta: string | null;
  efecto(tipo: 'brote', datos: { celda: string }): void;
}

/** El avance a dibujar: el de la escena, o el del tween si la planta está creciendo. */
function avanceAnimado(k: string, p: PlantaDeEscena, anim: Animaciones, ahora: number): number {
  const tw = anim.tw[k];
  if (!tw) return p.avance;
  const u = (ahora - tw.t0) / tw.dur;
  if (u >= 1) {
    delete anim.tw[k];
    return p.avance;
  }
  if (u <= 0) return tw.de;
  if (tw.brote && !tw.hecho) {
    tw.hecho = true;
    anim.efecto('brote', { celda: k });
  }
  return tw.de + (tw.a - tw.de) * easeBack(u);
}

interface Lugar {
  q: CeldaEnPantalla;
  by: number;
  a: number;
  esc: number;
  chica: boolean;
  salto: number;
}

/** Varios plantines juntos: en la bandeja, uno por celdita; en tierra, un manojo apretado. */
function manojo(
  g: CanvasRenderingContext2D,
  G: Geometria,
  c: CeldaDeEscena,
  vista: PlantaParaDibujar,
  n: number,
  L: Lugar,
  t: number,
): void {
  const { q, by, esc, salto } = L,
    enBandeja = c.tipo === 'almaciguera',
    paso = enBandeja ? G.plantas.bandeja.paso : 6 * esc,
    ee = enBandeja ? G.plantas.bandeja.escala : esc * 0.78,
    m = enBandeja ? n : Math.min(4, n);
  for (let ni = 0; ni < m; ni++)
    planta(
      pincel(
        g,
        q.bx + Math.round((ni - (m - 1) / 2) * paso),
        by - Math.round(salto) - (ni % 2 && !enBandeja ? 2 : 0),
        ee,
      ),
      vista,
      t,
      q.bx * 0.13 + ni * 1.7,
    );
  letras(g, q.bx + Math.round(q.w / 2) - 9, G.plantas.numeroAbajo ? by + 4 : q.y + 2, String(n), C.blanco, 1);
}

function listaParaCosechar(r: Pincel['r'], { q, by, a, esc }: Lugar, t: number): void {
  const yy = by - Math.round((8 + a * 22) * esc) - 6 + Math.round(Math.sin(t * 0.4 + q.bx) * 1.5);
  r(q.bx - 3, yy, 7, 7, C.anil);
  r(q.bx - 2, yy + 1, 5, 5, C.maiz);
  r(q.bx - 1, yy + 2, 1, 2, C.blanco);
  r(q.bx, yy + 7, 1, 2, C.anil);
}

/** plantín en su punto: flecha verde (listo) o ladrillo (se está pasando) */
function flechaDeTrasplante(r: Pincel['r'], G: Geometria, p: PlantaDeEscena, { q, by, chica }: Lugar, t: number): void {
  const ty = by - Math.round((chica ? 14 : 20) * G.plantas.alturaDeFlecha) + Math.round(Math.sin(t * 0.4 + q.bx) * 1.5),
    tc = p.trasplante === 'listo' ? '#3fc25a' : '#e0502f';
  r(q.bx - 4, ty, 9, 9, C.anil);
  r(q.bx - 3, ty + 1, 7, 7, tc);
  r(q.bx, ty + 2, 1, 5, C.blanco);
  r(q.bx - 1, ty + 3, 3, 1, C.blanco);
  r(q.bx - 2, ty + 4, 5, 1, C.blanco);
}

/** salud baja: barrita bajo la planta, para verla sin abrir la ficha */
function barraDeSalud(r: Pincel['r'], salud: number, { q, by }: Lugar): void {
  const sw2 = 12,
    sx = q.bx - 6,
    sy2 = by + 2;
  r(sx - 1, sy2 - 1, sw2 + 2, 4, C.anil);
  r(sx, sy2, sw2, 2, '#4a2030');
  r(sx, sy2, Math.max(1, Math.round((sw2 * salud) / 100)), 2, salud < 30 ? '#ff5a4a' : '#ffc233');
}

function avisoDePlaga(r: Pincel['r'], { q, by, a, esc }: Lugar): void {
  const py2 = by - Math.round((8 + a * 20) * esc) - 5;
  r(q.bx + 6, py2, 7, 7, '#e0502f');
  r(q.bx + 9, py2 + 1, 1, 3, C.blanco);
  r(q.bx + 9, py2 + 5, 1, 1, C.blanco);
}

/** abejas en las flores abiertas */
function abejas(r: Pincel['r'], { q, by, esc }: Lugar, t: number): void {
  for (let bb = 0; bb < 2; bb++) {
    const ax = q.bx + Math.round(Math.sin(t * 0.37 + bb * 3 + q.bx) * 11 * esc),
      ay = by - Math.round(16 * esc) + Math.round(Math.cos(t * 0.53 + bb * 2) * 6 * esc);
    r(ax, ay, 3, 2, '#ffd23f');
    r(ax + 1, ay, 1, 2, '#16161a');
    r(ax + (Math.floor(t * 2) % 2), ay - 1, 2, 1, 'rgba(255,255,255,0.85)');
  }
}

/** Lo que la planta dibuja: su foto, con el avance del momento (y como semilla hasta que el brote asoma). */
function vistaDe(p: PlantaDeEscena, a: number, brotando: boolean): PlantaParaDibujar {
  return {
    slug: p.slug,
    grupo: p.grupo,
    familia: p.familia,
    etapa: brotando && a < 0.05 ? 'semilla' : p.etapa,
    avance: a,
    salud: p.salud,
    plaga: p.plaga,
    tutor: p.tutor,
    dulce: p.dulce,
  };
}

function sombraEnElPiso(g: CanvasRenderingContext2D, { q, by, a }: Lugar): void {
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.beginPath();
  g.ellipse(q.bx + 2, by, 4 + a * 7, 2 + a, 0, 0, 6.3);
  g.fill();
}

/** Los avisos sobre la planta: lista, para trasplantar, floja, con plaga; y las abejas si está en flor. */
function avisos(r: Pincel['r'], G: Geometria, p: PlantaDeEscena, L: Lugar, t: number): void {
  if (p.etapa === 'cosechable' && !p.flor) listaParaCosechar(r, L, t);
  if (p.trasplante) flechaDeTrasplante(r, G, p, L, t);
  if (p.salud < 60 && p.etapa !== 'semilla') barraDeSalud(r, p.salud, L);
  if (p.plaga && G.plantas.avisoDePlaga) avisoDePlaga(r, L);
  if (p.flor && p.etapa === 'cosechable') abejas(r, L, t);
}

function unaPlanta(
  g: CanvasRenderingContext2D,
  r: Pincel['r'],
  G: Geometria,
  k: string,
  c: CeldaDeEscena,
  p: PlantaDeEscena,
  anim: Animaciones,
  t: number,
  ahora: number,
): void {
  const q = G.celda(k)!,
    brotando = !!anim.tw[k]?.brote,
    a = avanceAnimado(k, p, anim, ahora),
    esc = q.s,
    salto = p.etapa === 'cosechable' && !p.flor ? Math.max(0, Math.sin(t * 0.5 + q.bx) - 0.8) * 8 : 0,
    by = G.plantas.apoyo(c, q),
    L: Lugar = { q, by, a, esc, chica: G.plantas.chica(c), salto },
    vista = vistaDe(p, a, brotando);
  if (G.plantas.sombra && p.etapa !== 'semilla') sombraEnElPiso(g, L);
  const n = p.etapa === 'semilla' ? 1 : Math.min(6, p.n || 1);
  if (n > 1) manojo(g, G, c, vista, n, L, t);
  else planta(pincel(g, q.bx, by - Math.round(salto), L.chica ? 0.8 : esc), vista, t, q.bx * 0.13 + by * 0.07);
  avisos(r, G, p, L, t);
}

export function plantas(
  g: CanvasRenderingContext2D,
  es: Escena,
  G: Geometria,
  claves: string[],
  anim: Animaciones,
  t: number,
  ahora: number,
): void {
  const r = pincel(g, 0, 0, 1).r;
  let bruma = false;
  for (const k of claves) {
    const c = es.celdas[k],
      p = c.planta;
    if (G.plantas.bruma && G.celda(k)!.frente && !bruma) {
      bruma = true;
      g.fillStyle = 'rgba(190,225,250,0.30)';
      g.fillRect(0, 58, G.W, 80);
    }
    if (!p || c.ancla === false || anim.oculta === k) continue;
    unaPlanta(g, r, G, k, c, p, anim, t, ahora);
  }
}
