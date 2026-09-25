/**
 * Lo que se hace en el patio para tener verdes y secos: cortar el pasto, juntar hojas, podar y
 * revolver una tanda húmeda. [REPO] compostaje.json: el pasto recién cortado es verde y seco es seco;
 * una pila que huele tiene pocos secos y se arregla sumándole secos y aireándola.
 */
import { REGLAS } from '../../../datos/juego/reglas';
import { alCompost, compostera, secosParaEnderezar } from '../estructuras';
import { anotar } from '../estado';
import { faseDeCaducos, hayCaducos } from '../jardin';
import { regionDe } from '../region';
import * as TC from '../textos/compost';
import { r1 } from '../util';
import type { De, Regla } from './regla';

const J = REGLAS.jardin;

export const cortarPasto: Regla<De<'cortarPasto'>> = {
  puede(E, a) {
    if (!E.mundo.patio.pastoM2) return TC.sinPasto();
    if (a.destino === 'compost' && !compostera(E)) return TC.sinCompostera();
    if (E.mundo.jardin.pasto < J.pastoMinimo) return TC.pastoCorto();
    return null;
  },
  costo: () => J.ratosCortar,
  aplicar(E, a, evs) {
    const pasto = E.mundo.jardin.pasto;
    E.mundo.jardin.pasto = 0;
    if (a.destino === 'compost') {
      alCompost(E, pasto, 'verde');
      evs.push(anotar(E, 'info', TC.cortaste(pasto, 'compost')));
    } else {
      const seco = r1(pasto * J.pastoSeco);
      E.recursos.secos = r1(E.recursos.secos + seco);
      evs.push(anotar(E, 'info', TC.cortaste(seco, 'secar')));
    }
  },
};

export const juntarHojas: Regla<De<'juntarHojas'>> = {
  puede: (E) => (E.mundo.jardin.hojas > 0 ? null : TC.sinHojas()),
  costo: () => J.ratosJuntar,
  aplicar(E, _a, evs) {
    const hojas = E.mundo.jardin.hojas;
    E.mundo.jardin.hojas = 0;
    E.recursos.secos = r1(E.recursos.secos + hojas);
    evs.push(anotar(E, 'info', TC.juntaste(hojas)));
  },
};

export const podar: Regla<De<'podar'>> = {
  puede(E) {
    if (!hayCaducos(E.mundo.patio)) return TC.sinCaducos();
    const fase = faseDeCaducos(regionDe(E), E.tiempo.dec);
    if (fase === 'hoja') return TC.conHojasNoSePoda();
    if (fase === 'caida') return TC.todaviaCaen();
    return E.mundo.jardin.poda > 0 ? null : TC.yaPodaste();
  },
  costo: () => J.ratosPodar,
  aplicar(E, _a, evs) {
    const poda = E.mundo.jardin.poda;
    E.mundo.jardin.poda = 0;
    E.recursos.secos = r1(E.recursos.secos + poda);
    evs.push(anotar(E, 'info', TC.podaste(poda)));
  },
};

export const revolver: Regla<De<'revolver'>> = {
  puede(E) {
    const k = compostera(E);
    if (!k) return TC.sinCompostera();
    if (!k.tandas.some((t) => t.mezcla === 'humeda')) return TC.nadaQueRevolver();
    return E.recursos.secos >= secosParaEnderezar() ? null : TC.faltanSecos(secosParaEnderezar());
  },
  costo: () => REGLAS.ratos.accion,
  aplicar(E, _a, evs) {
    const t = compostera(E)!.tandas.find((x) => x.mezcla === 'humeda')!,
      usa = secosParaEnderezar();
    t.mezcla = 'pareja';
    E.recursos.secos = r1(E.recursos.secos - usa);
    evs.push(anotar(E, 'bien', TC.revolviste(usa)));
  },
};
