/**
 * El fondo del patio para las cámaras que lo miran entero: piso, paredón o baranda, la casa, los
 * bancales con su tierra, la compostera y la sombra del paredón. Se pinta píxel a píxel en una
 * `Superficie` de `RES` píxeles por unidad y se pega en el lienzo agrandada por un factor entero. Como
 * cuesta, el fondo ya pintado se guarda: mientras no cambie nada de lo que se ve (la humedad de la
 * tierra, un mantillo, la estación…) se pega de nuevo sin repintar.
 */
import type { Escena } from '../contrato';
import { bancales } from './bancales';
import type { GeometriaPlana } from './camaras/plano';
import { casa, norte, sombraDelParedon } from './muros';
import { piso } from './piso';
import { Superficie } from './superficie';

/** los fondos pintados, el último usado al final */
const guardados = new Map<string, HTMLCanvasElement>();
const MAXIMO = 4;

/** Todo lo que cambia cómo se ve el fondo: si una clave se repite, el fondo es el mismo. */
export function claveDelFondo(es: Escena, G: GeometriaPlana): string {
  const celdas = Object.keys(es.celdas)
    .sort()
    .map((k) => {
      const c = es.celdas[k],
        b = c.borde;
      return [
        k,
        c.tipo,
        c.humedo,
        c.mo >= 75 ? 1 : 0,
        c.mulch ? 1 : 0,
        +b.n,
        +b.s,
        +b.e,
        +b.o,
        c.maceta?.litros ?? 0,
      ].join(':');
    });
  const { carga, tandas, dosis } = es.compost;
  return [
    G.cam,
    G.W,
    G.H,
    es.piso,
    es.norte,
    es.estacion,
    es.plano.join('/'),
    es.sombraPared,
    es.compostera,
    carga,
    tandas,
    dosis,
    ...celdas,
  ].join('|');
}

/** El terreno (piso, norte y casa), que no cambia con la humedad ni con los bancales: se guarda aparte. */
const terrenos = new Map<string, Superficie>();

function terrenoDe(es: Escena, G: GeometriaPlana): Superficie {
  const k = [G.cam, G.W, G.H, es.piso, es.norte, es.estacion, es.plano.join('/')].join('|');
  let s = terrenos.get(k);
  if (!s) {
    s = new Superficie(G.W, G.H);
    piso(s, es, G);
    norte(s, es, G);
    casa(s, es, G);
    if (terrenos.size >= MAXIMO) terrenos.delete(terrenos.keys().next().value!);
    terrenos.set(k, s);
  }
  return s;
}

/** Pinta el fondo del patio en un canvas con `RES` píxeles por unidad: el terreno guardado, los bancales encima y la sombra. */
function pintar(es: Escena, G: GeometriaPlana): HTMLCanvasElement {
  const s = terrenoDe(es, G).clonar();
  bancales(s, es, G);
  sombraDelParedon(s, es, G);
  const cv = document.createElement('canvas');
  cv.width = s.w;
  cv.height = s.h;
  cv.getContext('2d')!.putImageData(s.imagen(), 0, 0);
  return cv;
}

export function fondoDelPatio(g: CanvasRenderingContext2D, es: Escena, G: GeometriaPlana): void {
  const k = claveDelFondo(es, G);
  let cv = guardados.get(k);
  if (cv) guardados.delete(k);
  else {
    cv = pintar(es, G);
    if (guardados.size >= MAXIMO) guardados.delete(guardados.keys().next().value!);
  }
  guardados.set(k, cv);
  g.imageSmoothingEnabled = false;
  g.drawImage(cv, 0, 0, G.W, G.H);
}
