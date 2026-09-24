/** Brasicáceas: hojas grandes y, al madurar, la cabeza (repollo, coliflor, brócoli) o los repollitos en el tallo. */
import type { Estilo } from '../estilos';
import { mezcla, AZ, type Paleta } from '../paleta';
import { hojaOval, type Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

function cabeza(B: Pincel, H: number, R: number, color: string, lisa: boolean, madura: boolean): void {
  const rc = Math.max(2, Math.round(R * (madura ? 0.55 : 0.3))),
    cy = -Math.round(H * 0.55);
  B.disco(0, cy, rc, mezcla(color, '#000000', 0.18));
  B.disco(0, cy - 1, rc - 1, color);
  if (!lisa) for (let i = -rc + 1; i < rc; i += 2) B.r(i, cy - ((i + 20) % 3), 1, 1, mezcla(color, '#ffffff', 0.4));
  else B.linea(-1, cy - rc + 1, 1, cy + 1, mezcla(color, '#3a9a3f', 0.4));
}

function hojas(B: Pincel, R: number, H: number, e: Estilo, pal: Paleta, st: Postura): void {
  const alto = e.rizado || e.tallo;
  for (let i = -2; i <= 2; i++) {
    if (!i && !e.rizado) continue;
    const yy = alto ? -Math.round(H * (0.35 + 0.28 * (2 - Math.abs(i)))) : -Math.round(H * 0.35) - (2 - Math.abs(i));
    const x = Math.round(i * R * 0.45) + st.dx(yy);
    hojaOval(B, x, yy, Math.max(2, Math.round(R * 0.48)), Math.max(2, Math.round(R * 0.4)), pal);
    if (e.rizado) B.r(x - 2, yy - Math.round(R * 0.4), 5, 1, pal.c);
  }
}

export const repollo: DibujoDeForma = (B, a, e, _pal, st) => {
  const pal = e.pal || AZ,
    alto = e.rizado || e.tallo,
    R = Math.round(3 + a * 10),
    H = Math.round(3 + a * (alto ? 20 : 10));
  if (alto) B.r(-1, -H + 2, 2, H - 2, pal.c);
  hojas(B, R, H, e, pal, st);
  if (e.tallo && st.madura) for (let i = 0; i < 4; i++) B.disco(i % 2 ? 2 : -2, -4 - i * 3, 1, e.cabeza);
  if (e.cabeza && !e.tallo && a > 0.55) cabeza(B, H, R, e.cabeza, !!e.lisa, st.madura);
};
