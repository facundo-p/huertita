/** [REPO] temperaturas.helada y el umbral de FAUBA. [SUPUESTO] los grados de cada abrigo y el daño. */
import { REGLAS } from '../../../datos/juego/reglas';
import { ABRIGO, abrigo, type Abrigo } from '../abrigo';
import { quitarPlanta } from '../estado';
import { zona } from '../patio';
import * as TH from '../textos/heladas';
import type { Estado, Tiempo, ZonaId } from '../tipos';
import type { SistemaDePlanta } from './contexto';

const HELADA = REGLAS.helada;

/** Qué le faltó a una planta que heló: la frase que el cuaderno agrega después del daño. */
function queFaltoContraLaHelada(E: Estado, w: Tiempo, z: ZonaId, ab: Abrigo): string {
  const Z = zona(E, z);
  if (!(ab.grados > 0)) {
    if (w.tmin + ABRIGO.manta > HELADA.umbral) return TH.mantaAlcanzaba(ABRIGO.manta);
    if (Z.admiteTunel && w.tmin + ABRIGO.manta + ABRIGO.tunel > HELADA.umbral) return TH.hacianFaltaMantaYTunel();
    return TH.heladaMuyFuerte(w.tmin);
  }
  let yDespues = TH.sinLugarAfuera();
  if (Z.admiteTunel && !(E.recursos.tunel[z] && E.recursos.manta[z]))
    yDespues = TH.mantaYTunelSuman(ABRIGO.manta + ABRIGO.tunel);
  else if (!Z.cria && !E.recursos.manta[z]) yDespues = TH.conMantaSumaba(ABRIGO.manta);
  return TH.estabaAbrigada(ab, yDespues);
}

/** Hiela para la planta si la mínima más su abrigo no pasa del umbral. La que no lo tolera, muere. */
export const helar: SistemaDePlanta = (ctx, t) => {
  const { E, w, ev, salvadas } = ctx,
    { pl, sp, z } = t;
  const ab = (t.ab = abrigo(E, z));
  const hiela = w.helada && w.tmin + ab.grados <= HELADA.umbral,
    sensible = sp.helada === 'muere' || sp.helada === 'sensible';
  if (w.helada && !hiela && sensible) (salvadas[z] = salvadas[z] || []).push(sp.nombre);
  if (!hiela) return 'sigue';
  const falta = queFaltoContraLaHelada(E, w, z, ab);
  if (sp.helada === 'muere') {
    ev('mal', TH.murio(sp, w.tmin, falta), pl.celda);
    quitarPlanta(E, pl, true);
    return 'basta';
  }
  if (sp.helada === 'sensible') {
    pl.salud -= HELADA.danioSensible;
    ev('mal', TH.seQuemo(sp, w.tmin, falta), pl.celda);
  }
  if (sp.helada === 'mejora' && !pl.dulce) {
    pl.dulce = true;
    ev('bien', TH.laEndulzo(sp), pl.celda);
  }
  return 'sigue';
};
