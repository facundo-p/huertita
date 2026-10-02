/** Brasicáceas: hojas grandes y, al madurar, la cabeza (repollo, coliflor, brócoli) o los repollitos en el tallo. */
import type { Estilo } from '../estilos';
import { PERFIL, hojaV, nervadura } from '../hojas';
import { AZ, mezcla, rampaDe, rampaDeHoja, type Paleta } from '../paleta';
import type { Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

function cabeza(B: Pincel, H: number, R: number, color: string, lisa: boolean, madura: boolean): void {
  const rc = Math.max(2, Math.round(R * (madura ? 0.55 : 0.3))),
    cy = -Math.round(H * 0.55),
    r = rampaDe(color),
    suave = [r[3], r[3], r[3], r[4], r[5], r[5], r[6]];
  if (lisa) {
    // repollo: una bola con las hojas envueltas, marcadas por curvas
    B.volumen(B.mascara().elipse(0, cy, rc, rc * 0.92), r);
    for (const dx of [-0.5, 0.1, 0.6])
      for (let k = 0; k < rc * 1.4; k++)
        B.r(dx * rc + Math.sin(k * 0.5) * 0.4, cy - rc * 0.8 + k * 0.9, 0.25, 0.25, r[2]);
  } else {
    // coliflor y brócoli: racimos apretados, cada uno con su luz
    B.volumen(B.mascara().elipse(0, cy, rc, rc * 0.85), r);
    for (let i = 0; i < rc * 3; i++) {
      const an = i * 2.4,
        d = rc * (0.2 + (0.7 * ((i * 37) % 10)) / 10);
      B.volumen(B.mascara().elipse(Math.cos(an) * d, cy + Math.sin(an) * d * 0.8, 1.3, 1.3), suave);
    }
  }
}

function hojas(B: Pincel, R: number, H: number, e: Estilo, pal: Paleta, st: Postura): void {
  const alto = e.rizado || e.tallo,
    rampa = rampaDeHoja(pal);
  for (let i = -2; i <= 2; i++) {
    if (!i && !e.rizado) continue;
    const yy = alto ? -Math.round(H * (0.35 + 0.28 * (2 - Math.abs(i)))) : -Math.round(H * 0.35) - (2 - Math.abs(i)),
      x = Math.round(i * R * 0.45) + st.dx(yy),
      ang = -90 + i * 28,
      L = Math.max(3.5, R * 0.95);
    hojaV(
      B,
      x * 0.6,
      yy + L * 0.35,
      L,
      L * 0.85,
      ang,
      rampa,
      e.rizado ? { ...PERFIL.ancha, festones: 4 } : PERFIL.redonda,
    );
    nervadura(B, x * 0.6, yy + L * 0.35, L * 0.8, ang, rampa[5], 3);
  }
}

export const repollo: DibujoDeForma = (B, a, e, _pal, st) => {
  const pal = e.pal || AZ,
    alto = e.rizado || e.tallo,
    R = Math.round(3 + a * 10),
    H = Math.round(3 + a * (alto ? 20 : 10)),
    rampa = rampaDeHoja(pal);
  if (alto)
    B.volumen(
      B.mascara().poligono([
        [-1.1, 0],
        [1.1, 0],
        [1, -H],
        [-1, -H],
      ]),
      rampa,
    );
  hojas(B, R, H, e, pal, st);
  if (e.tallo && st.madura)
    for (let i = 0; i < 4; i++) {
      B.volumen(
        B.mascara().elipse(i % 2 ? 2.6 : -2.6, -4 - i * 3, 1.5, 1.5),
        rampaDe(e.cabeza || mezcla(pal.c, '#ffffff', 0.2)),
      );
    }
  if (e.cabeza && !e.tallo && a > 0.55) cabeza(B, H, R, e.cabeza, !!e.lisa, st.madura);
};
