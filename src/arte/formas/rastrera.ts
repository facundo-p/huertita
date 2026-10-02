/** Cucurbitáceas y batata: guías por el suelo con hojas redondas y, al madurar, el fruto (zapallo, pepino, sandía…). */
import type { Estilo } from '../estilos';
import { mezcla, rampaDe, rampaDeHoja, type Paleta } from '../paleta';
import { florcita, type Pincel } from '../pincel';
import type { DibujoDeForma } from './tipos';

function fruto(B: Pincel, e: Estilo, pal: Paleta): void {
  const t = e.tinta!,
    r = rampaDe(t),
    verde = rampaDeHoja(pal);
  if (e.frl) {
    // pepino: largo, con las puntas redondas y un brillo a lo largo
    B.volumen(B.mascara().elipse(-4.5, -2.2, 5.2, 2.1), r);
    B.r(-8, -3.7, 6, 0.25, r[6]);
    return;
  }
  const rr = e.frr!;
  B.volumen(B.mascara().elipse(-5, -rr + 0.5, rr + 0.8, rr), r);
  if (e.raya)
    // sandía y melón: rayas oscuras de arriba abajo
    for (let i = -rr + 1; i < rr; i += 2) B.linea(-5 + i, -rr * 2 + 1, -5 + i * 0.8, -0.5, e.raya, 0.5);
  else {
    // zapallo: gajos marcados por curvas
    for (const dx of [-0.55, 0, 0.55])
      for (let k = 0; k < rr * 1.7; k++)
        B.r(-5 + dx * rr + Math.sin(k * 0.4) * 0.3, -rr * 2 + 0.8 + k * 1.05, 0.25, 0.25, r[1]);
    B.r(-5 - Math.round(rr / 2), -rr - 1, 0.5, 1.4, mezcla(t, '#ffffff', 0.5));
  }
  B.volumen(
    B.mascara().poligono([
      [-5.6, -rr * 2 - 0.2],
      [-4.4, -rr * 2 - 0.2],
      [-4.2, -rr * 2 - 1.6],
      [-5.8, -rr * 2 - 1.6],
    ]),
    verde,
  );
}

export const rastrera: DibujoDeForma = (B, a, e, pal, st) => {
  const R = Math.round(4 + a * 10),
    hc: Paleta = e.hojac
      ? { v: e.hojac, c: mezcla(e.hojac, '#ffffff', 0.3), o: mezcla(e.hojac, '#000000', 0.3), oo: pal.oo }
      : pal,
    rampa = rampaDeHoja(hc),
    guia = rampaDeHoja(pal);
  B.linea(-R, -2, R, -3, guia[1], 0.5);
  for (let i = 0; i < 3 + Math.round(a * 3); i++) {
    const vaiven = st.dx(-10) && i % 2 ? st.dx(-10) : 0,
      x = Math.round((i / (2 + a * 3) - 0.5) * 2 * R),
      y = -Math.round(3 + a * 6 * (0.6 + 0.4 * Math.sin(i * 2.1))) + vaiven,
      r2 = Math.max(2.4, 2.4 + a * 3.2);
    B.linea(x, -2, x, y, guia[2], 0.25);
    // hoja redonda: un escudo con las venas abiertas desde el pecíolo
    B.volumen(B.mascara().elipse(x, y - 0.5, r2, r2 * 0.88), rampa);
    for (let k = 0; k < 5; k++) {
      const an = (-90 + (k - 2) * 38) * (Math.PI / 180);
      B.linea(x, y + r2 * 0.4, x + Math.cos(an) * r2 * 0.85, y + r2 * 0.4 + Math.sin(an) * r2 * 0.95, rampa[2], 0.25);
    }
  }
  if (a > 0.6) {
    florcita(B, R - 3, -Math.round(4 + a * 6), 2.4, '#ffd23f', '#f08a24', true);
    if (a > 0.8) B.linea(-R, -3, -R - 2, -8, guia[4], 0.25);
  }
  if (st.madura && !e.sinfruto) fruto(B, e, pal);
};
