/**
 * Horas de sol directo de una celda, por geometría: latitud, fecha y obstáculos del patio.
 *
 * [SUPUESTO] el modelo entero. Simplificaciones: terreno plano, el sol cuenta desde que supera el
 * `horizonte` del patio, la planta mide 20 cm, los árboles son un cilindro de copa sobre un fuste.
 * No usa azar ni mira el estado: lo único que cambia con la partida son las plantas altas, que
 * entran como obstáculos temporales (`temporales`) y por eso no se guardan en caché.
 */
import type { Obstaculo, Patio } from '../../datos/juego/patio';
import { diaCentral } from './clima';
import { clamp, r1 } from './util';

const LATITUD = (-34.6 * Math.PI) / 180; // Gran Buenos Aires
const PASO_MIN = 10;
const ALTURA_PLANTA = 0.2;
/** [SUPUESTO] el paraíso y otros caducos del GBA tienen hoja de octubre a abril; pelados dejan pasar el 70 % */
export const conHojas = (dec: number): boolean => dec >= 28 || dec <= 12;
const SOMBRA_SIN_HOJAS = 0.3;

/** Hacia dónde está el sol: este, norte y arriba, para un día del año y una hora solar. */
export function posicionSol(dia: number, horaSolar: number): { este: number; norte: number; arriba: number } {
  const decl = ((-23.44 * Math.PI) / 180) * Math.cos((2 * Math.PI * (dia + 10)) / 365);
  const H = ((horaSolar - 12) * 15 * Math.PI) / 180;
  return {
    este: -Math.cos(decl) * Math.sin(H),
    norte: Math.cos(LATITUD) * Math.sin(decl) - Math.sin(LATITUD) * Math.cos(decl) * Math.cos(H),
    arriba: Math.sin(LATITUD) * Math.sin(decl) + Math.cos(LATITUD) * Math.cos(decl) * Math.cos(H),
  };
}

/** Cuánta sombra (0..1) le hace un obstáculo a un punto, con el sol en esa dirección. Todo en metros; y crece al sur. */
function sombraDe(
  o: Obstaculo,
  m: number,
  px: number,
  py: number,
  dx: number,
  dy: number,
  pendiente: number,
  hojas: boolean,
): number {
  if (o.tipo === 'muro') {
    const ax = o.desde[0] * m,
      ay = o.desde[1] * m,
      bx = o.hasta[0] * m,
      by = o.hasta[1] * m;
    const ex = bx - ax,
      ey = by - ay,
      den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) return 0;
    const s = ((ax - px) * ey - (ay - py) * ex) / den,
      u = ((ax - px) * dy - (ay - py) * dx) / den;
    if (s <= 1e-6 || u < 0 || u > 1) return 0;
    return o.alto > ALTURA_PLANTA + s * pendiente ? (o.opacidad ?? 1) : 0;
  }
  if (o.tipo === 'losa') {
    const s = (o.alto - ALTURA_PLANTA) / pendiente,
      x = (px + dx * s) / m,
      y = (py + dy * s) / m;
    return x >= o.desde[0] && x <= o.hasta[0] && y >= o.desde[1] && y <= o.hasta[1] ? 1 : 0;
  }
  const cx = o.en[0] * m - px,
    cy = o.en[1] * m - py,
    R = o.copa * m;
  const alCentro = cx * dx + cy * dy,
    lejos2 = cx * cx + cy * cy - alCentro * alCentro;
  if (lejos2 >= R * R) return 0;
  const media = Math.sqrt(R * R - lejos2),
    s1 = Math.max(0, alCentro - media),
    s2 = alCentro + media;
  if (s2 <= 0) return 0;
  const h1 = ALTURA_PLANTA + s1 * pendiente,
    h2 = ALTURA_PLANTA + s2 * pendiente;
  if (h1 > o.alto || h2 < o.fuste) return 0;
  return o.caduco && !hojas ? SOMBRA_SIN_HOJAS : 1;
}

const cache = new Map<string, number>();
/**
 * Horas de sol directo en el centro de la celda (x,y), en la década `dec`. `temporales` son
 * obstáculos que no son del patio y cambian con la partida (plantas altas): con ellos el resultado
 * ya no es fijo, así que no se guarda en caché.
 */
export function horasSolGeometria(p: Patio, x: number, y: number, dec: number, temporales: Obstaculo[] = []): number {
  const clave = p.id + '|' + dec + '|' + x + ',' + y,
    guardado = temporales.length ? undefined : cache.get(clave);
  if (guardado !== undefined) return guardado;
  const dia = diaCentral(dec),
    hojas = conHojas(dec),
    m = p.celdaM,
    px = (x + 0.5) * m,
    py = (y + 0.5) * m;
  const minimo = Math.sin((p.horizonte * Math.PI) / 180);
  let horas = 0;
  for (let t = 4; t < 20; t += PASO_MIN / 60) {
    const s = posicionSol(dia, t + PASO_MIN / 120);
    if (s.arriba <= minimo) continue;
    const plano = Math.hypot(s.este, s.norte) || 1e-9,
      dx = s.este / plano,
      dy = -s.norte / plano,
      pendiente = s.arriba / plano;
    let luz = 1;
    for (const o of p.obstaculos) {
      luz *= 1 - sombraDe(o, m, px, py, dx, dy, pendiente, hojas);
      if (luz <= 0) break;
    }
    if (luz > 0)
      for (const o of temporales) {
        luz *= 1 - sombraDe(o, m, px, py, dx, dy, pendiente, hojas);
        if (luz <= 0) break;
      }
    horas += (luz * PASO_MIN) / 60;
  }
  const h = r1(clamp(horas, 0, 12));
  if (!temporales.length) cache.set(clave, h);
  return h;
}

/**
 * La fórmula a mano del prototipo v0.4, tal cual. Solo vale para el patio 'fondo' y solo existe
 * para que el test dorado siga verde. Se borra junto con él.
 */
export function horasSolV04(x: number, y: number, dec: number): number {
  const dia = diaCentral(dec);
  const inv = (Math.cos((6.2831853 * (dia - 172)) / 365) + 1) / 2;
  const base = 10 - 3.5 * inv;
  const pared = [0, 2 + 3.5 * inv, 3 * inv, 1.2 * inv, 0.5 * inv][y] || 0;
  const dist = Math.max(Math.abs(x - 7), Math.min(Math.abs(y - 1), Math.abs(y - 2)));
  const arbol = (dist <= 1 ? 4.5 : dist === 2 ? 3 : dist === 3 ? 1.5 : 0) * (conHojas(dec) ? 1 : 0.3);
  return r1(clamp(base - pared - arbol, 0, 12));
}
