/** Lo que pasa en el patio entero al final de cada turno, después de recorrer las plantas. */
import { compostera } from '../estructuras';
import { REGLAS } from '../../../datos/juego/reglas';
import { abrigo } from '../abrigo';
import { generarTiempo } from '../clima';
import { ratosLibres } from '../estado';
import { fVecinos, floresAbiertas } from '../factores';
import { cumplir } from '../misiones';
import { idsDeZonas, zona } from '../patio';
import * as TH from '../textos/heladas';
import * as TT from '../textos/temporada';
import type { ZonaId } from '../tipos';
import { clamp } from '../util';
import type { SistemaDelPatio } from './contexto';

const { compost: COMPOST, polinizadores: POLI } = REGLAS;

/** Por cada zona donde el abrigo salvó plantas sensibles de la helada, un aviso. */
export const avisarSalvadas: SistemaDelPatio = ({ E, w, ev, salvadas }) => {
  for (const z of Object.keys(salvadas) as ZonaId[]) {
    const nombres = [...new Set(salvadas[z])];
    ev('bien', TH.seSalvaron(w.tmin, abrigo(E, z), zona(E, z), nombres));
  }
};

export const anotarAvisos: SistemaDelPatio = (ctx) => ctx.anotarAvisos();

/** El logro de tener dos plantas que se asocian bien, una al lado de la otra. */
export const logroDeSocios: SistemaDelPatio = ({ E, evs }) => {
  for (const pl of Object.values(E.mundo.plantas))
    if (pl.etapa !== 'semilla' && fVecinos(E, pl.slug, pl.celda, pl.id).buenas.length) {
      cumplir(E, 'socios', evs);
      return;
    }
};

/** Cuánto avanza una tanda de compost en la década: más rápido con calor, más lento con frío. */
function avanceDelCompost(tmed: number): number {
  if (tmed > COMPOST.calorDesde) return COMPOST.avanceConCalor;
  return tmed < COMPOST.frioDesde ? COMPOST.avanceConFrio : 1;
}

/** [REPO] compostaje.json: listo desde ~120 días, más rápido en verano. El mulch se hace tierra; las flores atraen visitas. */
export const suelosYCompost: SistemaDelPatio = ({ E, w, ev }) => {
  for (const c of Object.values(E.mundo.celdas)) if (c.mulch) c.mo = clamp(c.mo + REGLAS.suelo.moPorMulch, 0, 100);
  const k = compostera(E);
  if (k) {
    k.carga += COMPOST.restosDeCocina;
    if (k.carga >= COMPOST.tanda) {
      k.carga -= COMPOST.tanda;
      k.tandas.push({ avance: 0 });
      ev('info', TT.tandaCerrada());
    }
    k.tandas = k.tandas.filter((t) => {
      t.avance += avanceDelCompost(w.tmed);
      if (t.avance < COMPOST.madura) return true;
      k.dosis += COMPOST.dosisPorTanda;
      ev('bien', TT.tandaMadura(COMPOST.dosisPorTanda));
      return false;
    });
  }
  E.progreso.visitas += Math.round(floresAbiertas(E) * (w.tmed > POLI.calorDesde ? POLI.visitasConCalor : 1));
};

/** Se sacan las mantas, se devuelven los ratos y avanza el calendario. A las 36 décadas, termina el año. */
export const cerrarTurno: SistemaDelPatio = ({ E, ev }) => {
  E.recursos.manta = {};
  E.recursos.ratosGastados = 0;
  E.tiempo.turno++;
  E.tiempo.dec = (E.tiempo.dec % 36) + 1;
  if (E.tiempo.turno % 36 === 0) {
    E.tiempo.terminado = true;
    ev('logro', TT.anioTerminado());
  }
};

/** El clima de la década que viene y su pronóstico. Consume azar: va después de todo lo demás. */
export const pronosticar: SistemaDelPatio = ({ E }) => {
  const { real, pron } = generarTiempo(E, E.tiempo.dec);
  E.tiempo.clima = real;
  E.tiempo.pronostico = pron;
};

/** Si el riego elegido ya no entra en los ratos de la década que viene, se baja zona por zona. */
export const ajustarRiego: SistemaDelPatio = ({ E }) => {
  while (ratosLibres(E) < 0)
    for (const z of idsDeZonas(E)) if (E.recursos.riego[z] > 0 && ratosLibres(E) < 0) E.recursos.riego[z]--;
};
