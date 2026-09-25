/** Lo que pasa en el patio entero al final de cada turno, después de recorrer las plantas. */
import { alCompost, compostera, mezclaDe, ritmoDe, secosPorVerde, tapar } from '../estructuras';
import { REGLAS } from '../../../datos/juego/reglas';
import { abrigo } from '../abrigo';
import { DECADAS_DEL_ANIO } from '../calendario';
import { generarTiempo } from '../clima';
import { ratosLibres } from '../estado';
import { fVecinos, floresAbiertas } from '../factores';
import { cumplir } from '../misiones';
import { pasarJardin } from '../jardin';
import { idsDeZonas, zona } from '../patio';
import * as TC from '../textos/compost';
import * as TH from '../textos/heladas';
import * as TT from '../textos/temporada';
import type { ZonaId } from '../tipos';
import { clamp, r1 } from '../util';
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

/**
 * [REPO] compostaje.json: listo desde ~120 días, más rápido en verano; los verdes se tapan con secos y
 * una pila con pocos secos se pudre y tarda, con demasiados no arranca. El mulch se hace tierra; las
 * flores atraen visitas.
 */
export const suelosYCompost: SistemaDelPatio = ({ E, w, ev }) => {
  for (const c of Object.values(E.mundo.celdas)) if (c.mulch) c.mo = clamp(c.mo + REGLAS.suelo.moPorMulch, 0, 100);
  const k = compostera(E);
  if (k) {
    const antes = mezclaDe(k.verdes, k.secos);
    alCompost(E, COMPOST.cocina.verdes, 'verde');
    alCompost(E, COMPOST.cocina.secos, 'seco');
    tapar(E);
    // tapar llega a la receta mientras haya secos: si la tanda queda húmeda, es que la bolsa se vació
    if (antes !== 'humeda' && mezclaDe(k.verdes, k.secos) === 'humeda') ev('mal', TC.seAcabaronLosSecos());
    if (k.verdes >= COMPOST.tanda) {
      const mezcla = mezclaDe(k.verdes, k.secos);
      ev(mezcla === 'pareja' ? 'info' : 'mal', TC.tandaCerrada(mezcla, secosPorVerde(k.verdes, k.secos)));
      k.tandas.push({ avance: 0, mezcla });
      k.verdes = 0;
      k.secos = 0;
    }
    k.tandas = k.tandas.filter((t) => {
      t.avance = r1(t.avance + avanceDelCompost(w.tmed) * ritmoDe(t.mezcla));
      if (t.avance < COMPOST.madura) return true;
      k.dosis += COMPOST.dosisPorTanda;
      ev('bien', TC.tandaMadura(COMPOST.dosisPorTanda));
      return false;
    });
  }
  E.progreso.visitas += Math.round(floresAbiertas(E) * (w.tmed > POLI.calorDesde ? POLI.visitasConCalor : 1));
};

/** Crece el pasto, caen las hojas, llega la poda. No tira dados. */
export const crecerElJardin: SistemaDelPatio = ({ E, w }) => {
  pasarJardin(E.mundo.jardin, E.mundo.patio, E.tiempo.dec, w.tmed);
};

/** Se sacan las mantas, se devuelven los ratos y avanza el calendario. A las 36 décadas, termina el año. */
export const cerrarTurno: SistemaDelPatio = ({ E, ev }) => {
  E.recursos.manta = {};
  E.recursos.ratosGastados = 0;
  E.tiempo.turno++;
  E.tiempo.dec = (E.tiempo.dec % DECADAS_DEL_ANIO) + 1;
  if (E.tiempo.turno % DECADAS_DEL_ANIO === 0) {
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
