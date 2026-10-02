/** Aromáticas: mata de hojas anchas o en cojín, romero de agujas, lavanda de espigas, laurel como arbolito. */
import type { Estilo } from '../estilos';
import { PERFIL, hojaV, nervadura } from '../hojas';
import { MADERA, mezcla, rampaDe, rampaDeHoja, type Paleta, type Rampa } from '../paleta';
import type { Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

interface Medidas {
  a: number;
  R: number;
  H: number;
}

const RAMPA_MADERA = rampaDe(MADERA);

const rad = (g: number): number => (g * Math.PI) / 180;

function arbolito(B: Pincel, { R, H }: Medidas, pal: Paleta, st: Postura): void {
  const r = rampaDeHoja(pal),
    cx = st.dx(-H);
  // el tronco, con un poco de curva
  B.volumen(
    B.mascara().poligono([
      [-1.1, 0],
      [1.1, 0],
      [0.7 + cx * 0.3, -H],
      [-0.7 + cx * 0.3, -H],
    ]),
    RAMPA_MADERA,
  );
  // la copa, de adentro hacia afuera: una masa y hojas sueltas por el borde
  B.volumen(B.mascara().elipse(cx, -H, R * 0.8, H * 0.45), r);
  for (let i = 0; i < 12; i++) {
    const an = i * 30 + 8,
      px = cx + Math.cos(rad(an)) * R * 0.72,
      py = -H + Math.sin(rad(an)) * H * 0.4;
    hojaV(B, px, py, 4.4, 2.4, an + 75, r, PERFIL.lanza);
  }
  for (let i = 0; i < 6; i++)
    hojaV(
      B,
      cx + Math.sin(i * 2.4) * R * 0.45,
      -H + Math.cos(i * 1.7) * H * 0.22,
      3,
      1.7,
      -60 - i * 12,
      r,
      PERFIL.lanza,
    );
}

function agujas(B: Pincel, { a, H }: Medidas, e: Estilo, pal: Paleta, st: Postura): void {
  const r = rampaDeHoja(pal),
    n = 3 + Math.round(a * 3),
    florr = rampaDe(e.florc || '#8fb8ff');
  for (let i = 0; i < n; i++) {
    const sx = (i - (n - 1) / 2) * 2.2,
      tx = sx * 1.25 + st.dx(-H),
      ty = -H + Math.abs(sx),
      dir = (Math.atan2(ty, tx - sx * 0.5) * 180) / Math.PI;
    B.linea(sx * 0.5, 0, tx, ty, RAMPA_MADERA[3], 0.5);
    // agujas de a pares a lo largo de la rama
    for (let k = 0.2; k <= 1.01; k += 0.1) {
      const px = sx * 0.5 + (tx - sx * 0.5) * k,
        py = ty * k;
      for (const lado of [1, -1])
        hojaV(B, px, py, 2.6, 0.9, dir + lado * 48, (k * 10) % 2 < 1 ? r : mezcla2(r), PERFIL.lanza);
    }
    if (st.madura && i % 2) hojaV(B, tx, ty + 2, 1.8, 1.8, dir, florr, PERFIL.redonda);
  }
}

/** la misma rampa, un tono más abajo */
const mezcla2 = (r: Rampa): Rampa => r.map((_, i) => r[Math.max(0, i - 1)]);

function mata(B: Pincel, { a, R, H }: Medidas, e: Estilo, pal: Paleta, st: Postura): void {
  const r = rampaDeHoja(pal),
    clara = rampaDeHoja({ v: pal.c, c: mezcla(pal.c, '#fff6b8', 0.45), o: pal.v, oo: pal.o });
  // la masa de la mata
  B.volumen(B.mascara().elipse(st.dx(-H * 0.5), -H * 0.5, R, Math.max(2, H * 0.5)), r);
  const n = (e.tipo === 'ancha' ? 8 : 10) + Math.round(a * 12);
  for (let i = 0; i < n; i++) {
    const lx = Math.sin(i * 2.4) * R * 0.85 + st.dx(-H * 0.5),
      ly = -(H * 0.55 + Math.cos(i * 1.9) * H * 0.35),
      ang = -90 + Math.sin(i * 3.1) * 70;
    if (e.tipo === 'ancha') {
      hojaV(B, lx, ly + 1, 3.8 + a * 1.4, 2.8 + a * 1.2, ang, i % 3 ? r : clara, PERFIL.oval);
      nervadura(B, lx, ly + 1, 3 + a, ang, r[2], 1);
    } else hojaV(B, lx, ly, 2.2, 1.5, ang, i % 4 ? r : clara, PERFIL.redonda);
  }
}

function espigas(B: Pincel, { a, H }: Medidas, e: Estilo, pal: Paleta, st: Postura): void {
  const r = rampaDeHoja(pal),
    flor = rampaDe(st.madura ? e.florc || '#9a6ad0' : mezcla(e.florc || '#9a6ad0', '#6a8a5a', 0.55));
  for (let i = -2; i <= 2; i++) {
    const ex = i * 3 + st.dx(-H - 6),
      eh = a * 9;
    B.linea(i, -H + 2, ex, -H - eh, r[3], 0.25);
    // la espiga: un cono de flores apiñadas arriba del tallito
    if (a > 0.7) hojaV(B, ex, -H - eh + 1, 6, 2, -90, flor, PERFIL.lanza);
  }
}

function flores(B: Pincel, { R, H }: Medidas, e: Estilo, st: Postura): void {
  const flor = rampaDe(e.florc!);
  for (let i = -1; i <= 1; i++) {
    const fx = i * Math.round(R * 0.55) + st.dx(-H);
    B.linea(fx, -H + Math.abs(i), fx, -H - 3 + Math.abs(i), flor[2], 0.25);
    B.volumen(B.mascara().elipse(fx, -H - 3.5 + Math.abs(i), 1.7, 1.2), flor);
  }
}

/** cuánto sube cada tipo con el crecimiento */
const SUBE: Record<string, number> = { aguja: 22, arbolito: 22, cojin: 7 };

export const aromatica: DibujoDeForma = (B, a, e, pal, st) => {
  const m: Medidas = { a, R: Math.round(3 + a * 9), H: Math.round(3 + a * (SUBE[e.tipo ?? ''] ?? 14)) };
  if (e.tipo === 'arbolito') return arbolito(B, m, pal, st);
  if (e.tipo === 'aguja') return agujas(B, m, e, pal, st);
  mata(B, m, e, pal, st);
  if (e.tipo === 'espiga') espigas(B, m, e, pal, st);
  else if (st.madura && e.florc) flores(B, m, e, st);
};
