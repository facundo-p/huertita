/**
 * Los eventos sorpresa en el paso del tiempo (`src/dominio/sorpresas.ts`). No consumen `azar`: tiran
 * con `tirada`, así que su lugar en la tubería no le cambia el clima a nadie.
 */
import { amenazaParaAnunciar, darRegalo, descargar, regaloDeLaDecada, sorpresaPorId } from '../sorpresas';
import { TEXTOS } from '../textos/sorpresas';
import type { SistemaDelPatio } from './contexto';

/** Al terminar la década: si había una amenaza anunciada (siempre para esta), pasa; si no, puede llegar un regalo. */
export const llegaSorpresa: SistemaDelPatio = ({ E, ev }) => {
  const a = E.tiempo.anunciada;
  if (a) {
    E.tiempo.anunciada = null;
    const s = sorpresaPorId(a.id),
      T = TEXTOS[a.id];
    if (!s || T?.clase !== 'amenaza') return;
    const g = descargar(E, s, T.enLaPlanta());
    E.progreso.sorpresas[s.id] = E.tiempo.turno;
    ev(g.cuantas ? 'mal' : 'bien', T.paso(g));
    return;
  }
  const s = regaloDeLaDecada(E),
    T = s && TEXTOS[s.id];
  if (!s || T?.clase !== 'regalo') return;
  const r = darRegalo(E, s);
  E.progreso.sorpresas[s.id] = E.tiempo.turno;
  ev('bien', T.llega(r.que, r.cuanto));
};

/** Al empezar la década que viene, con el pronóstico ya hecho: puede anunciarse una amenaza. */
export const anunciarSorpresa: SistemaDelPatio = ({ E, ev }) => {
  const s = amenazaParaAnunciar(E),
    T = s && TEXTOS[s.id];
  if (!s || T?.clase !== 'amenaza') return;
  E.tiempo.anunciada = { id: s.id, turno: E.tiempo.turno };
  ev('mal', T.aviso());
};
