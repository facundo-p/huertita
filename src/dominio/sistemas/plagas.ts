/** [REPO] qué plaga ataca a qué y cuándo, del texto de plagas de cada ficha. [SUPUESTO] las probabilidades. */
import { REGLAS } from '../../../datos/juego/reglas';
import { azar } from '../azar';
import { objetivoCosecha } from '../catalogo';
import { aliadosCerca } from '../factores';
import { macetaDe } from '../patio';
import * as TP from '../textos/plagas';
import { clamp } from '../util';
import type { SistemaDePlanta } from './contexto';

const PLAGAS = REGLAS.plagas;
const decadaEntre = (d: number, desde: number, hasta: number): boolean => d >= desde && d <= hasta;

/**
 * Una planta sana puede agarrar una plaga (una sola tirada de azar por turno: el mismo número decide
 * cuál); una con plaga pierde salud cada turno hasta que la traten o lleguen vaquitas.
 */
export const plagas: SistemaDePlanta = ({ E, w, ev, nota, flores }, { pl, sp }) => {
  if (pl.plaga) {
    pl.salud -= PLAGAS.danioPorDecada;
    nota('mal', TP.sigueConPlaga(pl.plaga));
    if (flores >= PLAGAS.floresParaVaquitas && azar(E) < PLAGAS.probVaquitas) {
      ev('bien', TP.llegaronVaquitas(sp, pl.plaga), pl.celda);
      pl.plaga = null;
    }
    return 'sigue';
  }
  const prot = clamp(1 - PLAGAS.proteccionPorAliado * aliadosCerca(E, pl.celda), PLAGAS.proteccionMaxima, 1),
    joven = pl.prog < objetivoCosecha(sp) * PLAGAS.jovenHasta,
    rot = E.celdas[pl.celda].fam === sp.familia ? PLAGAS.riesgoRepitiendoFamilia : 1,
    d = w.dec,
    p = azar(E),
    sinAliados = prot === 1;
  const epocaDeOruga = d >= 31 || d <= 12,
    epocaDePulgon = decadaEntre(d, 25, 33) || decadaEntre(d, 7, 12);
  if (sp.familia === 'brasicacea' && epocaDeOruga && p < PLAGAS.oruga.prob * prot * rot) {
    pl.plaga = 'oruga';
    ev('mal', TP.orugas(sp, sinAliados), pl.celda);
  } else if (joven && w.lluvia > PLAGAS.babosa.lluviaDesde && !macetaDe(E, pl.celda) && p < PLAGAS.babosa.prob * prot) {
    pl.plaga = 'babosa';
    ev('mal', TP.babosas(sp), pl.celda);
  } else if (/hoja|fruto|Legumbre/.test(sp.grupo) && epocaDePulgon && p < PLAGAS.pulgon.prob * prot * rot) {
    pl.plaga = 'pulgon';
    ev('mal', TP.pulgones(sp, sinAliados), pl.celda);
  }
  return 'sigue';
};
