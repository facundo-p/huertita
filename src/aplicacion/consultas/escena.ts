/**
 * La escena: la foto plana del patio que recibe cualquier renderer (`src/render/contrato.ts`).
 * Se arma desde la partida y desde lo que la persona está mirando o eligiendo (`VistaDeEscena`).
 */
import * as M from '../../dominio';
import type { CeldaId, Estado, Planta, ZonaId } from '../../dominio';
import type { CeldaDeEscena, Escena, PlantaDeEscena } from '../../render/contrato';
import { horasDeSol } from './sol';

/** Lo que la escena necesita saber de la interfaz. */
export interface VistaDeEscena {
  /** la especie que se está por sembrar, o la de la planta que se está trasplantando: pinta el fantasma */
  fantasma: string | null;
  /** si se está trasplantando: la almaciguera no recibe, así que ahí no se pinta el fantasma */
  trasplantando: boolean;
  seleccion: CeldaId | null;
  zonaCerca: ZonaId;
  camara: string;
  capa: Escena['capa'];
  animar: Escena['animar'];
}

/** El nombre corto de una especie: "Lechuga" y no "Lechuga (de hoja suelta)". */
export const nombreCorto = (nombre: string): string => nombre.split(' (')[0].split(' / ')[0];

function plantaDeEscena(pl: Planta): PlantaDeEscena {
  const sp = M.especieDe(pl),
    pt = M.puntoDeTrasplante(pl);
  const avance = pl.etapa === 'plantin' && sp.dt ? pl.prog / sp.dt.min : pl.prog / M.objetivoCosecha(sp);
  return {
    slug: pl.slug,
    nombre: nombreCorto(sp.nombre),
    emoji: sp.emoji,
    grupo: sp.grupo,
    familia: sp.familia,
    etapa: pl.etapa,
    n: M.vivas(pl),
    salud: pl.salud,
    plaga: pl.plaga,
    tutor: pl.tutor,
    flor: sp.flor,
    dulce: pl.dulce,
    trasplante: pt && pt.punto !== 'chico' ? pt.punto : null,
    avance,
  };
}

/** Qué lados de la celda dan a otra zona (o al borde): ahí se dibuja el borde del cantero. */
function bordes(E: Estado, k: CeldaId): CeldaDeEscena['borde'] {
  const { x, y } = M.xy(k),
    z = E.mundo.celdas[k].zona,
    otra = (cx: number, cy: number) => M.zonaDeCelda(E, M.idCelda(cx, cy)) !== z;
  return { n: otra(x, y - 1), s: otra(x, y + 1), o: x === 0 || otra(x - 1, y), e: otra(x + 1, y) };
}

function celdaDeEscena(E: Estado, k: CeldaId, vista: VistaDeEscena, sol: number): CeldaDeEscena {
  const c = E.mundo.celdas[k],
    Z = M.zona(E, c.zona),
    pl = M.plantaEn(E, k);
  const fantasmaAca = vista.fantasma && !pl && !(vista.trasplantando && Z.cria);
  return {
    zona: c.zona,
    tipo: Z.tipo,
    nombreZona: Z.nombre,
    mo: c.mo,
    mulch: c.mulch,
    humedo: E.recursos.riego[c.zona],
    maceta: M.macetaDe(E, k),
    sol,
    planta: pl ? plantaDeEscena(pl) : null,
    ancla: !pl || pl.celda === k,
    tinte: fantasmaAca ? M.evaluarCelda(E, vista.fantasma!, k)!.nivel : null,
    seleccion: vista.seleccion === k,
    borde: bordes(E, k),
  };
}

/** La zona que muestra la cámara de cerca: la de la celda elegida, o la que ya se miraba, o la del microtúnel. */
export function zonaCerca(E: Estado, seleccion: CeldaId | null, actual: ZonaId | null): ZonaId {
  if (seleccion && E.mundo.celdas[seleccion]) return E.mundo.celdas[seleccion].zona;
  if (actual && actual in E.recursos.riego) return actual;
  return M.zonaDeTunel(E) || M.idsDeZonas(E)[0];
}

/** Los árboles del patio: dónde apoya el tronco (la fila más al sur que ocupa su letra). */
function arboles(P: M.Patio): Escena['arboles'] {
  return P.obstaculos.flatMap((o) => {
    if (o.tipo !== 'arbol') return [];
    const col = Math.floor(o.en[0]);
    let base = Math.floor(o.en[1]);
    while (P.plano[base + 1] && P.plano[base + 1][col] === 'T') base++;
    return [{ x: o.en[0], base, caduco: o.caduco }];
  });
}

export function escena(E: Estado, vista: VistaDeEscena): Escena {
  const P = M.patioDe(E),
    R = M.regionDe(E),
    K = M.compostera(E),
    sol = horasDeSol(E),
    celdas: Record<CeldaId, CeldaDeEscena> = {};
  for (const k of Object.keys(E.mundo.celdas)) celdas[k] = celdaDeEscena(E, k, vista, sol[k]);
  const ZC = M.zona(E, vista.zonaCerca),
    sel = vista.seleccion && E.mundo.celdas[vista.seleccion] ? vista.seleccion : null,
    selEnLaZona = sel && E.mundo.celdas[sel].zona === vista.zonaCerca;
  return {
    camara: vista.camara,
    cerca: { zona: vista.zonaCerca, tipo: ZC.tipo, hondo: ZC.hondo, col: selEnLaZona ? M.xy(sel).x : null },
    ancho: P.plano[0].length,
    alto: P.plano.length,
    plano: P.plano,
    piso: P.aspecto.piso,
    norte: P.aspecto.norte,
    celdas,
    arboles: arboles(P),
    compostera: K ? K.en : null,
    dec: E.tiempo.dec,
    estacion: M.estacionDe(R, E.tiempo.dec),
    arbolConHojas: M.conHojas(R, E.tiempo.dec),
    // la sombra pintada del paredón es la de la fórmula v0.4; con sol por geometría, la capa de sol es la que cuenta
    sombraPared: P.sol === 'v04' ? 0.35 + 1.9 * M.invierno(R, E.tiempo.dec) : 0,
    tuneles: Object.keys(E.recursos.tunel).filter((z) => E.recursos.tunel[z]),
    mantas: E.recursos.manta,
    capa: vista.capa,
    animar: vista.animar,
    compost: K ? { carga: K.carga, tandas: K.tandas.length, dosis: K.dosis } : { carga: 0, tandas: 0, dosis: 0 },
  };
}
