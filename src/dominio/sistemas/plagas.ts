/** [REPO] qué plaga ataca a qué y cuándo, del texto de plagas de cada ficha. [SUPUESTO] las probabilidades. */
import { decadaEstacional, enTramo, regionDe } from '../region';
import { REGLAS } from '../../../datos/juego/reglas';
import { azar } from '../azar';
import { objetivoCosecha } from '../catalogo';
import { riesgoConAliados } from '../factores';
import { macetaDe } from '../patio';
import * as TP from '../textos/plagas';
import type { SistemaDePlanta } from './contexto';

const PLAGAS = REGLAS.plagas;
const enEpoca = (d: number, epocas: readonly (readonly [number, number])[]): boolean =>
  epocas.some(([desde, hasta]) => enTramo(d, desde, hasta));

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
  const prot = riesgoConAliados(E, pl.celda),
    joven = pl.prog < objetivoCosecha(sp) * PLAGAS.jovenHasta,
    rot = E.mundo.celdas[pl.celda].fam === sp.familia ? PLAGAS.riesgoRepitiendoFamilia : 1,
    d = decadaEstacional(regionDe(E), w.dec), // las épocas de plaga están escritas para el sur
    p = azar(E),
    sinAliados = prot === 1;
  const epocaDeOruga = enEpoca(d, PLAGAS.oruga.epocas),
    epocaDePulgon = enEpoca(d, PLAGAS.pulgon.epocas);
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
