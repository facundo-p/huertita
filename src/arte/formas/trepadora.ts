/** Legumbres: guía que trepa por las cañas (chaucha, arveja) o tallo derecho (haba), flores y chauchas. */
import { PERFIL, hojaV } from '../hojas';
import { CANA, MADERA, PAJA, rampaDe, rampaDeHoja } from '../paleta';
import { florcita, hojaOval } from '../pincel';
import type { DibujoDeForma } from './tipos';

const CAÑA = rampaDe(CANA),
  PALO = rampaDe(MADERA);

export const trepadora: DibujoDeForma = (B, a, e, palDeLaPlanta, st) => {
  const pal = e.pal || palDeLaPlanta,
    rampa = rampaDeHoja(pal),
    H = Math.round(5 + a * (e.sincana ? 20 : 25));
  if (!e.sincana) {
    // dos cañas cruzadas, atadas arriba
    B.volumen(
      B.mascara().poligono([
        [-7.6, 0],
        [-6.4, 0],
        [1.4, -31],
        [0.2, -31],
      ]),
      CAÑA,
    );
    B.volumen(
      B.mascara().poligono([
        [6.4, 0],
        [7.6, 0],
        [-0.2, -31],
        [-1.4, -31],
      ]),
      PALO,
    );
    B.r(-2, -29, 4, 0.75, PAJA);
  } else {
    B.volumen(
      B.mascara().poligono([
        [-1, 0],
        [1, 0],
        [0.9, -H],
        [-0.9, -H],
      ]),
      rampa,
    );
  }
  for (let y = -3, i = 0; y > -H; y -= 3, i++) {
    const lado = i % 2 ? 1 : -1,
      x = (e.sincana ? lado * 3 : Math.round(lado * 7 * (1 + y / 31)) + lado) + st.dx(y);
    // el zarcillo que se agarra de la caña y la hoja
    if (!e.sincana) B.linea(x, y, x + lado * 0.5, y + 2.5, rampa[2], 0.25);
    hojaOval(B, x + lado * 2.2, y, 2.4, 2, pal);
    if (a > 0.6 && !st.madura && i % 3 === 1) florcita(B, x - lado * 2, y - 1, 1.3, e.florc, '#1d1b4b', true);
    if (st.madura && i % 2 === 1) {
      // la chaucha: una vaina larga y fina que cuelga
      hojaV(B, x - lado * 2, y, 5.6, 1.5, 90, rampaDe(e.tinta!), PERFIL.lanza);
    }
  }
};
