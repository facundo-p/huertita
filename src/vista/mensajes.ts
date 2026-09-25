/**
 * Lo que hacen los botones y los toques. Cada función traduce un gesto en un evento de la interfaz
 * (`modos.ts`), despacha la acción del juego si hace falta, guarda y pide la animación. Los
 * componentes solo llaman a estas funciones: no tocan la partida ni el guardado.
 *
 * Cada gesto cambia varias señales (la partida, el modo, la zona, el aviso) en un solo `batch`: así
 * la escena y la pantalla se rearman una vez por gesto, no una por señal.
 */
import { batch } from '@preact/signals';
import { guardar as guardarEn } from '../aplicacion/partidas';
import * as M from '../dominio';
import type { Accion, CeldaId, Estado } from '../dominio';
import type { PlantaDeEscena } from '../render/contrato';
import { efecto } from './efectos';
import { escena } from './escena';
import { animar, aviso, interaccion, nota, partida, sinStorage, tocada, ultimos, zonaCerca } from './estado';
import { type EventoUI, type Interaccion, normalizar, transicion } from './modos';
import { subirANube } from './guardado';
import { almacenes } from './persistencia';

/** Cómo se ve la planta de una celda ahora: para animarla antes de que cambie. */
const vistaDe = (k: CeldaId | null): PlantaDeEscena | null => (k ? (escena.value.celdas[k]?.planta ?? null) : null);

// ── guardar ──
export function guardar(): void {
  void guardarEn(partida.value, almacenes.local, almacenes.reloj).then((ok) => (sinStorage.value = !ok));
}

// ── cambiar la interacción ──
function poner(i: Interaccion): void {
  return batch(() => {
    const E = partida.value;
    nota.value = '';
    const n = normalizar(i, E.recursos.sobres, (id) => !!E.mundo.plantas[id]);
    if (n.sel && E.mundo.celdas[n.sel]) zonaCerca.value = E.mundo.celdas[n.sel].zona;
    interaccion.value = n;
  });
}
const patio = () => {
  const E = partida.value;
  return {
    existe: (k: CeldaId) => !!E.mundo.celdas[k],
    libre: (k: CeldaId) => !!E.mundo.celdas[k] && !E.mundo.celdas[k].planta,
  };
};

/** Despacha una acción del juego. Si no se pudo, queda la explicación en el aviso. */
export function jugar(accion: Accion): boolean {
  return batch(() => {
    const r = M.despachar(partida.value, accion);
    aviso.value = r.ok ? '' : r.error;
    if (r.ok) {
      if (r.eventos.length) ultimos.value = r.eventos;
      guardar();
    }
    tocada();
    return r.ok;
  });
}

/** Un evento de la interfaz: cambia el modo y, si corresponde, juega. */
export function hacer(ev: EventoUI): boolean {
  return batch(() => {
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
  });
}

export const tocarCelda = (celda: CeldaId): boolean => hacer({ tipo: 'tocar', celda });

/** Lo que se le hace a la planta de la celda elegida, con su animación. */
export function cuidarPlanta(tipo: 'cosechar' | 'semillar' | 'arrancar' | 'tutorar' | 'tratar' | 'ralear'): void {
  return batch(() => {
    const E = partida.value,
      sel = interaccion.value.sel,
      pl = sel ? M.plantaEn(E, sel) : null;
    if (!pl) return;
    const planta = vistaDe(sel),
      antes = E.progreso.porciones;
    if (!jugar({ tipo, planta: pl.id })) return;
    const cosecha =
      tipo === 'cosechar' ? '+' + String(Math.round((E.progreso.porciones - antes) * 10) / 10).replace('.', ',') : null;
    const anim = { arrancar: 'polvo', ralear: 'polvo', semillar: 'brote' } as const;
    efecto(anim[tipo as keyof typeof anim] ?? tipo, { celda: sel, planta, texto: cosecha });
    // si la planta ya no está (se cosechó entera, se arrancó), se muestra lo que pasó
    if (!M.plantaEn(E, sel!) && ultimos.value.length) poner({ modo: { modo: 'resumen' }, sel });
  });
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
function animacionDelClima(w: Estado['tiempo']['clima']): typeof animar.value {
  if (w.helada) return 'helada';
  if (w.lluvia > 30) return 'lluvia';
  return w.ola ? 'calor' : null;
}

/** Pasar 10 días: el clima de la década, la animación que le toca y lo que pasó. */
export function pasarDecada(): void {
  return batch(() => {
    const E = partida.value,
      w = E.tiempo.clima;
    ultimos.value = M.pasarDecada(E);
    aviso.value = '';
    tocada();
    poner(transicion(interaccion.value, { tipo: 'decadaPasada', terminado: E.tiempo.terminado }, patio()).i);
    animar.value = animacionDelClima(w);
    for (const e of ultimos.value) {
      if (e.tipo === 'logro') efecto('logro');
      else if (e.celda && M.esPerdida(e.codigo)) efecto('morir', { celda: e.celda });
    }
    guardar();
    void subirANube(false);
    if (animar.value) setTimeout(() => (animar.value = null), 2100);
  });
}

export function seguirOtroAnio(): void {
  return batch(() => {
    jugar({ tipo: 'seguir' });
    poner({ modo: { modo: 'inicio' }, sel: interaccion.value.sel });
  });
}

/** Mirar un cantero de cerca: la cámara de cerca muestra esa zona. */
export function mirarZona(zona: string): void {
  return batch(() => {
    zonaCerca.value = zona;
    poner(transicion(interaccion.value, { tipo: 'zona' }, patio()).i);
  });
}

/** Usar otra partida (cargada, traída, importada o nueva). */
export function cambiarPartida(E: Estado, mensaje: string, esNueva = false): void {
  return batch(() => {
    partida.value = E;
    ultimos.value = [];
    aviso.value = '';
    zonaCerca.value = null;
    tocada();
    const ev: EventoUI = esNueva
      ? { tipo: 'partidaNueva', terminada: false }
      : { tipo: 'partidaCargada', terminada: E.tiempo.terminado };
    poner(transicion(interaccion.value, ev, patio()).i);
    nota.value = mensaje;
    guardar();
  });
}
