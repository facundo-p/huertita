/** Aliáceas: varas finas o gruesas, con bulbo (cebolla, ajo), fuste (puerro) o flores (ciboulette). */
import type { Estilo } from '../estilos';
import { PERFIL, hojaV } from '../hojas';
import { AZ, rampaDe, rampaDeHoja } from '../paleta';
import type { Pincel } from '../pincel';
import type { DibujoDeForma, Postura } from './tipos';

function bulbo(B: Pincel, tinta: string): void {
  const r = rampaDe(tinta);
  B.volumen(B.mascara().elipse(0, -2.4, 4, 3), r);
  // las raicitas blancas debajo
  for (const dx of [-1.6, -0.5, 0.7, 1.7]) B.linea(dx, 0.3, dx * 1.4, 1.6, '#f0e6cc', 0.25);
  B.r(-2, -4.2, 1, 0.5, r[6]);
}

function hojas(B: Pincel, a: number, H: number, n: number, e: Estilo, st: Postura): void {
  const rampa = rampaDeHoja(AZ),
    clara = rampaDeHoja({ ...AZ, v: AZ.c, o: AZ.v, oo: AZ.o });
  for (let i = 0; i < n; i++) {
    const sp = i - (n - 1) / 2,
      x1 = Math.round(sp * (e.fino ? 1.2 : 2.4)) + st.dx(-H) + Math.round(sp * a * 1.5),
      y1 = -H + Math.abs(Math.round(sp * 2)),
      dir = (Math.atan2(y1 + 1, x1 - sp * 0.6) * 180) / Math.PI,
      largo = Math.hypot(x1 - sp * 0.6, y1 + 1);
    // una hoja larga y angosta, hueca como una caña: se afina hacia la punta
    hojaV(B, sp * 0.6, -1, largo, e.fino || a < 0.5 ? 1.1 : 2.4, dir, i % 2 ? rampa : clara, PERFIL.fina);
  }
}

export const varas: DibujoDeForma = (B, a, e, _pal, st) => {
  const H = Math.round(4 + a * (e.fino ? 14 : 20)),
    n = e.fino ? 5 + Math.round(a * 5) : 3 + Math.round(a * 3);
  if (e.grueso && a > 0.4) {
    // el fuste blanco del puerro
    const alto = Math.round(H * 0.4);
    B.volumen(
      B.mascara().poligono([
        [-2, 0],
        [2, 0],
        [1.6, -alto],
        [-1.6, -alto],
      ]),
      rampaDe('#f4f0d8'),
    );
  }
  hojas(B, a, H, n, e, st);
  if (e.bulbo && a > 0.6 && e.tinta) bulbo(B, e.tinta);
  if (e.fino && st.madura)
    for (let i = -1; i <= 1; i++) {
      const cx = i * 4 + st.dx(-H),
        cy = -H - 1 + Math.abs(i) * 2,
        r = rampaDe(e.tinta!);
      B.volumen(B.mascara().elipse(cx, cy, 2.4, 2.4), r);
      for (const [dx, dy] of [
        [-1, -1],
        [1, -0.5],
        [0, 1],
        [-0.5, 0.2],
      ])
        B.disco(cx + dx, cy + dy, 0.5, r[5]);
    }
};
