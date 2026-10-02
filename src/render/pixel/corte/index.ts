/**
 * El fondo de la cámara de cerca. Se pinta en una `Superficie` de `RES` píxeles por unidad y se pega
 * agrandado por un factor entero; como cuesta, el fondo ya pintado se guarda y mientras no cambie nada
 * de lo que se ve (la tierra, las raíces, las macetas…) se pega de nuevo sin repintar.
 */
import type { Escena } from '../../contrato';
import { Superficie } from '../superficie';
import { CORTE, type DatosDelCorte } from './comun';
import { almaciguera, flechas, macetas, manta, raicesDeLaCama, tunel } from './recipientes';
import { cama, cieloYSol, detras, piso } from './suelo';

export { CORTE, type DatosDelCorte } from './comun';

const guardados = new Map<string, HTMLCanvasElement>();
const MAXIMO = 4;

/** Todo lo que cambia cómo se ve el corte: si una clave se repite, el dibujo es el mismo. */
export function claveDelCorte(es: Escena, D: DatosDelCorte): string {
  const celdas = D.cols.flatMap((cx) =>
    D.filas.map((fy) => {
      const k = cx + ',' + fy,
        c = es.celdas[k],
        p = c.planta;
      return [
        k,
        c.humedo,
        c.mo,
        +c.mulch,
        c.maceta ? c.maceta.litros + '/' + c.maceta.prof : '',
        p ? [p.slug, p.etapa, Math.round(p.avance * 64)].join('.') : '',
      ].join(':');
    }),
  );
  return [
    D.tipo,
    D.zona,
    es.estacion,
    es.piso,
    es.sombraPared,
    es.cerca.hondo,
    +D.masIzq,
    +D.masDer,
    +es.tuneles.includes(D.zona),
    +!!es.mantas[D.zona],
    ...celdas,
  ].join('|');
}

/** Lo de atrás del cantero (cielo, pared o cerco, piso): no cambia con la tierra, así que se guarda aparte. */
const escenarios = new Map<string, Superficie>();

function escenarioDe(es: Escena, tipo: string): Superficie {
  const k = [tipo === 'suelo' || tipo === 'cajon' ? tipo : 'cerco', es.estacion, es.piso, es.sombraPared].join('|');
  let s = escenarios.get(k);
  if (!s) {
    s = new Superficie(CORTE.ancho, CORTE.ancho);
    cieloYSol(s, es);
    detras(s, tipo);
    piso(s, es, tipo);
    if (escenarios.size >= MAXIMO * 2) escenarios.delete(escenarios.keys().next().value!);
    escenarios.set(k, s);
  }
  return s.clonar();
}

/** El fondo del corte, píxel a píxel. */
export function superficieDelCorte(es: Escena, D: DatosDelCorte): Superficie {
  const s = escenarioDe(es, D.tipo),
    hondo = es.cerca.hondo;
  if (D.tipo === 'macetas') macetas(s, es, D);
  else if (D.tipo === 'almaciguera') almaciguera(s, es, D);
  else {
    cama(s, es, D, hondo);
    raicesDeLaCama(s, es, D, hondo);
  }
  flechas(s, D);
  if (D.tipo === 'cajon' && es.tuneles.includes(D.zona)) tunel(s);
  if (es.mantas[D.zona]) manta(s, D);
  return s;
}

function pintar(es: Escena, D: DatosDelCorte): HTMLCanvasElement {
  const s = superficieDelCorte(es, D),
    cv = document.createElement('canvas');
  cv.width = s.w;
  cv.height = s.h;
  cv.getContext('2d')!.putImageData(s.imagen(), 0, 0);
  return cv;
}

/** Pega en `g` (ya escalado) el fondo del corte, pintándolo si no estaba guardado. */
export function fondoDelCorte(g: CanvasRenderingContext2D, es: Escena, D: DatosDelCorte): void {
  const k = claveDelCorte(es, D);
  let cv = guardados.get(k);
  if (cv) guardados.delete(k);
  else {
    cv = pintar(es, D);
    if (guardados.size >= MAXIMO) guardados.delete(guardados.keys().next().value!);
  }
  guardados.set(k, cv);
  g.imageSmoothingEnabled = false;
  g.drawImage(cv, 0, 0, CORTE.ancho, CORTE.ancho);
}
