/** Aliáceas: varas finas o gruesas, con bulbo (cebolla, ajo), fuste (puerro) o flores (ciboulette). */
import { mezcla, AZ } from '../paleta';
import type { Estilo } from '../estilos';
import type { Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

function bulbo(B: Pincel, tinta: string): void {
  B.elipse(0, -1, 4, 3, mezcla(tinta, '#000000', 0.15));
  B.elipse(0, -2, 3, 2, tinta);
  B.r(-2, -3, 2, 1, '#ffffff');
}

function hojas(B: Pincel, a: number, H: number, n: number, e: Estilo, st: Postura): void {
  const pal = AZ;
  for (let i = 0; i < n; i++) {
    const sp = i - (n - 1) / 2,
      x1 = Math.round(sp * (e.fino ? 1.2 : 2.4)) + st.dx(-H) + Math.round(sp * a * 1.5),
      y1 = -H + Math.abs(Math.round(sp * 2));
    B.linea(Math.round(sp * 0.6), -1, x1, y1, i % 2 ? pal.v : pal.c, e.fino || a < 0.5 ? 1 : 2);
    if (!e.fino && a > 0.6 && i % 2 === 0) B.linea(x1, y1, x1 + (sp < 0 ? -3 : 3), y1 + 4, pal.v);
  }
}

export const varas: DibujoDeForma = (B, a, e, _pal, st) => {
  const H = Math.round(4 + a * (e.fino ? 14 : 20)),
    n = e.fino ? 5 + Math.round(a * 5) : 3 + Math.round(a * 3);
  if (e.grueso && a > 0.4) B.r(-2, -Math.round(H * 0.4), 4, Math.round(H * 0.4), e.tinta);
  hojas(B, a, H, n, e, st);
  if (e.bulbo && a > 0.6 && e.tinta) bulbo(B, e.tinta);
  if (e.fino && st.madura)
    for (let i = -1; i <= 1; i++) B.disco(i * 4 + st.dx(-H), -H - 1 + Math.abs(i) * 2, 2, e.tinta);
};
