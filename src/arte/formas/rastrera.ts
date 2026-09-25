/** Cucurbitáceas y batata: guías por el suelo con hojas redondas y, al madurar, el fruto (zapallo, pepino, sandía…). */
import type { Estilo } from '../estilos';
import { mezcla, type Paleta } from '../paleta';
import { florcita, type Pincel } from '../pincel';
import type { DibujoDeForma } from './tipos';

function fruto(B: Pincel, e: Estilo, pal: Paleta): void {
  const t = e.tinta!,
    os = mezcla(t, '#000000', 0.28);
  if (e.frl) {
    B.r(-9, -4, 10, 4, os);
    B.r(-9, -5, 10, 3, t);
    B.r(-8, -5, 7, 1, mezcla(t, '#ffffff', 0.35));
    return;
  }
  const rr = e.frr!;
  B.elipse(-5, -rr + 1, rr + 1, rr, os);
  B.elipse(-5, -rr, rr, rr - 1, t);
  if (e.raya) for (let i = -rr + 1; i < rr; i += 2) B.r(-5 + i, -rr * 2 + 2, 1, rr * 2 - 3, e.raya);
  else {
    B.r(-5, -rr * 2 + 1, 1, rr * 2 - 2, os);
    B.r(-6 - Math.round(rr / 2), -rr - 1, 1, 2, mezcla(t, '#ffffff', 0.4));
  }
  B.r(-5, -rr * 2, 2, 1, pal.o);
}

export const rastrera: DibujoDeForma = (B, a, e, pal, st) => {
  const R = Math.round(4 + a * 10),
    hc: Paleta = e.hojac
      ? { v: e.hojac, c: mezcla(e.hojac, '#ffffff', 0.3), o: mezcla(e.hojac, '#000000', 0.3), oo: pal.oo }
      : pal;
  B.linea(-R, -2, R, -3, pal.oo);
  for (let i = 0; i < 3 + Math.round(a * 3); i++) {
    const vaiven = st.dx(-10) && i % 2 ? st.dx(-10) : 0,
      x = Math.round((i / (2 + a * 3) - 0.5) * 2 * R),
      y = -Math.round(3 + a * 6 * (0.6 + 0.4 * Math.sin(i * 2.1))) + vaiven,
      r2 = Math.max(2, Math.round(2 + a * 3));
    B.linea(x, -2, x, y, pal.o);
    B.disco(x, y, r2, hc.o);
    B.disco(x, y - 1, r2 - 1, hc.v);
    B.r(x, y - 1, 1, r2, hc.c);
    B.r(x - r2 + 1, y - 1, r2, 1, hc.c);
  }
  if (a > 0.6) {
    florcita(B, R - 3, -Math.round(4 + a * 6), 2, '#ffd23f', '#f08a24', true);
    if (a > 0.8) B.linea(-R, -3, -R - 2, -8, pal.c);
  }
  if (st.madura && !e.sinfruto) fruto(B, e, pal);
};
