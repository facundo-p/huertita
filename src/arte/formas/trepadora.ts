/** Legumbres: guía que trepa por las cañas (chaucha, arveja) o tallo derecho (haba), flores y chauchas. */
import { mezcla, CANA, MADERA, PAJA } from '../paleta';
import { florcita, hojaOval } from '../pincel';
import type { DibujoDeForma } from './tipos';

export const trepadora: DibujoDeForma = (B, a, e, palDeLaPlanta, st) => {
  const pal = e.pal || palDeLaPlanta,
    H = Math.round(5 + a * (e.sincana ? 20 : 25));
  if (!e.sincana) {
    B.linea(-7, 0, 1, -31, CANA);
    B.linea(7, 0, -1, -31, MADERA);
    B.r(-2, -29, 4, 1, PAJA);
  } else B.r(-1, -H, 2, H, pal.o);
  for (let y = -3, i = 0; y > -H; y -= 3, i++) {
    const lado = i % 2 ? 1 : -1,
      x = (e.sincana ? lado * 3 : Math.round(lado * 7 * (1 + y / 31)) + lado) + st.dx(y);
    hojaOval(B, x + lado * 2, y, 2, 2, pal);
    if (!e.sincana) B.r(x, y, 1, 3, pal.o);
    if (a > 0.6 && !st.madura && i % 3 === 1) florcita(B, x - lado * 2, y - 1, 1, e.florc, '#1d1b4b');
    if (st.madura && i % 2 === 1) {
      B.linea(x - lado * 2, y, x - lado * 2, y + 5, e.tinta);
      B.r(x - lado * 2 + 1, y + 1, 1, 3, mezcla(e.tinta!, '#000000', 0.25));
    }
  }
};
