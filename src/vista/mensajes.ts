/**
 * Lo que hacen los botones y los toques. Cada función traduce un gesto en un evento de la interfaz
 * (`modos.ts`), despacha la acción del juego si hace falta, guarda y pide la animación. Los
 * componentes solo llaman a estas funciones: no tocan la partida ni el guardado.
 */
import { escena as armarEscena, zonaCerca as elegirZonaCerca } from '../aplicacion/consultas';
import { guardar as guardarEn } from '../aplicacion/partidas';
import * as M from '../dominio';
import type { Accion, CeldaId, Estado } from '../dominio';
import type { Escena, PlantaDeEscena } from '../render/contrato';
import { activo, efecto } from './efectos';
import {
  animar,
  aviso,
  camara,
  capa,
  interaccion,
  nota,
  partida,
  sinStorage,
  tocada,
  ultimos,
  zonaCerca,
} from './estado';
import { type EventoUI, type Interaccion, normalizar, transicion } from './modos';
import { almacenes } from './persistencia';

// ── la escena que ve el renderer ──
export function escenaActual(E: Estado = partida.value): Escena {
  const { modo, sel } = interaccion.value,
    r = activo.value,
    cams = r?.camaras;
  let fantasma: string | null = null;
  if (modo.modo === 'semillas') fantasma = modo.sobre;
  if (modo.modo === 'moviendo') fantasma = E.plantas[modo.planta]?.slug ?? null;
  return armarEscena(E, {
    fantasma,
    trasplantando: modo.modo === 'moviendo',
    seleccion: sel,
    zonaCerca: elegirZonaCerca(E, sel, zonaCerca.value),
    camara: cams ? cams[camara.value % cams.length][0] : 'cenital',
    capa: capa.value,
    animar: animar.value,
  });
}
/** Cómo se ve la planta de una celda ahora: para animarla antes de que cambie. */
const vistaDe = (k: CeldaId | null): PlantaDeEscena | null => (k ? (escenaActual().celdas[k]?.planta ?? null) : null);

// ── guardar ──
export function guardar(): void {
  void guardarEn(partida.value, almacenes.local, almacenes.reloj).then((ok) => (sinStorage.value = !ok));
}

// ── cambiar la interacción ──
function poner(i: Interaccion): void {
  const E = partida.value;
  const n = normalizar(i, E.sobres, (id) => !!E.plantas[id]);
  if (n.sel && E.celdas[n.sel]) zonaCerca.value = E.celdas[n.sel].zona;
  interaccion.value = n;
}
const patio = () => {
  const E = partida.value;
  return { existe: (k: CeldaId) => !!E.celdas[k], libre: (k: CeldaId) => !!E.celdas[k] && !E.celdas[k].planta };
};

/** Despacha una acción del juego. Si no se pudo, queda la explicación en el aviso. */
export function jugar(accion: Accion): boolean {
  const r = M.despachar(partida.value, accion);
  aviso.value = r.ok ? '' : r.error;
  if (r.ok) {
    if (r.eventos.length) ultimos.value = r.eventos;
    guardar();
  }
  tocada();
  return r.ok;
}

/** Un evento de la interfaz: cambia el modo y, si corresponde, juega. */
export function hacer(ev: EventoUI): boolean {
  const antes = interaccion.value,
    t = transicion(antes, ev, patio());
  if (ev.tipo === 'ir' || ev.tipo === 'ficha') aviso.value = '';
  if (!t.accion) {
    poner(t.i);
    return true;
  }
  const de = t.accion.tipo === 'trasplantar' && antes.modo.modo === 'moviendo' ? antes.modo.desde : null,
    planta = vistaDe(de);
  const ok = jugar(t.accion);
  poner(ok ? t.i : (t.siFalla ?? t.i));
  if (ok && t.accion.tipo === 'sembrar') efecto('sembrar', { celda: t.accion.celda });
  if (ok && t.accion.tipo === 'trasplantar') efecto('trasplantar', { de, celda: t.accion.celda, planta });
  return ok;
}

export const tocarCelda = (celda: CeldaId): boolean => hacer({ tipo: 'tocar', celda });

/** Lo que se le hace a la planta de la celda elegida, con su animación. */
export function cuidarPlanta(tipo: 'cosechar' | 'semillar' | 'arrancar' | 'tutorar' | 'tratar' | 'ralear'): void {
  const E = partida.value,
    sel = interaccion.value.sel,
    pl = sel ? M.plantaEn(E, sel) : null;
  if (!pl) return;
  const planta = vistaDe(sel),
    antes = E.porciones;
  if (!jugar({ tipo, planta: pl.id })) return;
  const cosecha =
    tipo === 'cosechar' ? '+' + String(Math.round((E.porciones - antes) * 10) / 10).replace('.', ',') : null;
  const anim = { arrancar: 'polvo', ralear: 'polvo', semillar: 'brote' } as const;
  efecto(anim[tipo as keyof typeof anim] ?? tipo, { celda: sel, planta, texto: cosecha });
  // si la planta ya no está (se cosechó entera, se arrancó), se muestra lo que pasó
  if (!M.plantaEn(E, sel!) && ultimos.value.length) poner({ modo: { modo: 'resumen' }, sel });
}

/** Cuidar el suelo de la celda elegida. */
export function cuidarSuelo(tipo: 'mulch' | 'compost'): void {
  const sel = interaccion.value.sel;
  if (sel && jugar({ tipo, celda: sel })) efecto(tipo, { celda: sel });
}

export function regar(zona: string, nivel: number): void {
  if (jugar({ tipo: 'riego', zona, nivel }) && nivel > 0) efecto('regar', { zona, nivel });
}
export const taparConManta = (zona: string): boolean => jugar({ tipo: 'manta', zona });
export const armarTunel = (zona: string): boolean => jugar({ tipo: 'tunel', zona });

/** La animación del clima que acaba de pasar: helada, mucha lluvia u ola de calor. */
function animacionDelClima(w: Estado['prox']['real']): typeof animar.value {
  if (w.helada) return 'helada';
  if (w.lluvia > 30) return 'lluvia';
  return w.ola ? 'calor' : null;
}

/** Pasar 10 días: el clima de la década, la animación que le toca y lo que pasó. */
export function pasarDecada(): void {
  const E = partida.value,
    w = E.prox.real;
  ultimos.value = M.pasarDecada(E);
  aviso.value = '';
  tocada();
  poner(transicion(interaccion.value, { tipo: 'decadaPasada', terminado: E.terminado }, patio()).i);
  animar.value = animacionDelClima(w);
  for (const e of ultimos.value) {
    if (e.tipo === 'logro') efecto('logro');
    else if (e.tipo === 'mal' && e.celda && /murió|se perdió|se secó/.test(e.texto))
      efecto('morir', { celda: e.celda });
  }
  guardar();
  if (almacenes.nube) void guardarEn(E, almacenes.nube, almacenes.reloj);
  if (animar.value) setTimeout(() => (animar.value = null), 2100);
}

export function seguirOtroAnio(): void {
  jugar({ tipo: 'seguir' });
  poner({ modo: { modo: 'inicio' }, sel: interaccion.value.sel });
}

/** Mirar un cantero de cerca: la cámara de cerca muestra esa zona. */
export function mirarZona(zona: string): void {
  zonaCerca.value = zona;
  poner(transicion(interaccion.value, { tipo: 'zona' }, patio()).i);
}

/** Usar otra partida (cargada, traída, importada o nueva). */
export function usarPartida(E: Estado, mensaje: string, esNueva = false): void {
  partida.value = E;
  ultimos.value = [];
  aviso.value = '';
  nota.value = mensaje;
  zonaCerca.value = null;
  tocada();
  const ev: EventoUI = esNueva
    ? { tipo: 'partidaNueva', terminada: false }
    : { tipo: 'partidaCargada', terminada: E.terminado };
  poner(transicion(interaccion.value, ev, patio()).i);
  guardar();
}
