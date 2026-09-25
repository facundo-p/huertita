/**
 * Migraciones de partidas guardadas.
 * Regla: si cambia la forma de `Estado`, se sube `v` y se agrega acá el paso de la versión
 * anterior a la nueva. Nunca se rompe una partida guardada de alguien.
 */
import { validarPatio } from '../../datos/juego/patio';
import { REGLAS } from '../../datos/juego/reglas';
import { jardinInicial } from './jardin';
import { PLANTILLAS, copiarPlantilla } from './patio';
import type { Estado } from './tipos';

export const VERSION = 5;
type Guardada = Record<string, any>;

/** Cada paso lleva una partida de la versión de su clave a la siguiente. */
const PASOS: Record<number, (e: Guardada) => void> = {
  // v1 → v2 (0.6): el patio pasa a ser un dato. Todas las partidas v1 son del fondo, y el microtúnel,
  // que era un sí/no, pasa a anotarse por zona.
  1: (e) => {
    e.patio = 'fondo';
    e.tunel = e.tunel ? { elevado: true } : {};
    e.v = 2;
  },
  // v2 → v3 (0.8): una planta puede ocupar varias celdas (`pl.celdas`). Las partidas v2 se jugaron
  // todas con una planta por celda, así que no hay nada que llenar: el ancla alcanza.
  2: (e) => {
    e.v = 3;
  },
  // v3 → v4 (0.9): el estado se ordena en cinco partes, el patio pasa a ser una copia propia de la
  // partida y la compostera sale del plano y de `compost` a `mundo.estructuras`.
  3: (e) => {
    const patio = copiarPlantilla(e.patio),
      estructuras = patio.estructuras.map((s) => ({
        tipo: s.tipo,
        en: s.en,
        carga: e.compost.carga,
        tandas: e.compost.tandas,
        dosis: e.compost.dosis,
      }));
    const v4: Guardada = {
      meta: { v: 4, semilla: e.semilla, rng: e.rng, region: patio.region, plantilla: e.patio },
      mundo: { patio, celdas: e.celdas, plantas: e.plantas, estructuras },
      tiempo: {
        dec: e.dec,
        turno: e.turno,
        anio: e.anio,
        caracter: e.caracter,
        clima: e.prox.real,
        pronostico: e.prox.pron,
        terminado: e.terminado,
      },
      recursos: {
        ratosGastados: e.ratosGastados,
        riego: e.riego,
        tunel: e.tunel,
        manta: e.manta,
        goteo: e.goteo,
        sobres: e.sobres,
        gen: e.gen,
      },
      progreso: {
        cosechado: e.cosechado,
        porciones: e.porciones,
        semillasGuardadas: e.semillasGuardadas,
        visitas: e.visitas,
        moInicial: e.moInicial,
        misiones: e.misiones,
        cuaderno: e.cuaderno,
        nextId: e.nextId,
      },
    };
    if (e.guardado != null) v4.meta.guardado = e.guardado;
    for (const clave of Object.keys(e)) delete e[clave];
    Object.assign(e, v4);
  },
  // v4 → v5 (0.10): la compostera separa verdes y secos y cada tanda sabe cómo quedó armada; aparecen
  // el jardín (pasto, hojas, poda) y la bolsa de secos. Lo que había se toma como bien tapado, que es
  // como lo contaba el juego hasta acá, y la bolsa arranca como en una partida nueva. Aparecen también
  // los eventos sorpresa: ninguno anunciado y ninguno pasado.
  4: (e) => {
    const plantilla = PLANTILLAS[e.meta.plantilla];
    if (plantilla) {
      if (plantilla.pastoM2 != null && e.mundo.patio.pastoM2 == null) e.mundo.patio.pastoM2 = plantilla.pastoM2;
      if (plantilla.vereda != null && e.mundo.patio.vereda == null) e.mundo.patio.vereda = plantilla.vereda;
    }
    e.mundo.estructuras = e.mundo.estructuras.map((k: Guardada) => ({
      tipo: k.tipo,
      en: k.en,
      verdes: k.carga,
      secos: k.carga * REGLAS.compost.receta.ideal,
      tandas: k.tandas.map((t: Guardada) => ({ avance: t.avance, mezcla: 'pareja' })),
      dosis: k.dosis,
    }));
    e.mundo.jardin = jardinInicial(e.mundo.patio, e.tiempo.dec);
    e.recursos.secos = REGLAS.jardin.bolsaInicial;
    e.tiempo.anunciada = null;
    e.progreso.sorpresas = {};
    e.meta.v = 5;
  },
};

/** Las partes de un mundo: tierra, plantas, lo construido, el jardín y un patio que se sostiene. */
function mundoValido(m: Partial<Estado['mundo']> | undefined): boolean {
  return !!(
    m?.celdas &&
    m.plantas &&
    Array.isArray(m.estructuras) &&
    m.jardin &&
    m.patio &&
    validarPatio(m.patio).length === 0
  );
}

export function esPartidaValida(E: unknown): E is Estado {
  const e = E as Partial<Estado> | null;
  return !!(
    e &&
    typeof e === 'object' &&
    e.meta?.v === VERSION &&
    mundoValido(e.mundo) &&
    e.meta.region === e.mundo!.patio.region &&
    e.tiempo?.clima &&
    e.tiempo.anunciada !== undefined &&
    typeof e.recursos?.secos === 'number' &&
    e.progreso?.sorpresas
  );
}
/** Las partidas del prototipo anteriores a la almaciguera real no tenían n ni semillas, ni mantas. */
function completarPrototipo(e: Guardada): void {
  for (const pl of Object.values<Guardada>(e.plantas)) {
    if (pl.n == null) pl.n = pl.etapa === 'semilla' ? 0 : 1;
    if (pl.semillas == null) pl.semillas = 1;
  }
  if (!e.manta) e.manta = {};
}
/** Una partida de antes de la v4, con todo suelto. */
const esPlana = (e: Guardada): boolean => typeof e.v === 'number' && !!e.celdas && !!e.plantas && !!e.prox;

/** Una partida plana (antes de la v4) hasta que tiene `meta`. */
function desplegar(e: Guardada): boolean {
  if (!esPlana(e) || (e.patio != null && !PLANTILLAS[e.patio])) return false;
  completarPrototipo(e);
  while (!e.meta) {
    const paso = PASOS[e.v];
    if (!paso) return false;
    paso(e);
  }
  return true;
}

/** Lleva cualquier partida vieja a la forma actual. Devuelve null si no se puede. */
export function migrar(E: unknown): Estado | null {
  const e = E as Guardada | null;
  if (!e || typeof e !== 'object') return null;
  if (!e.meta && !desplegar(e)) return null;
  while (typeof e.meta?.v === 'number' && e.meta.v < VERSION && e.mundo?.estructuras) {
    const paso = PASOS[e.meta.v];
    if (!paso) return null;
    paso(e);
  }
  return esPartidaValida(e) ? e : null;
}
