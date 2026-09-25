/**
 * El sonido del juego: los sonidos cortos de lo que hace el que juega y el ambiente de la década.
 * Arranca apagado; se prende con un gesto (los navegadores no dejan sonar antes). Sin Web Audio
 * (tests, navegadores viejos) no hace nada.
 *
 * No sabe nada del juego: la vista le dice qué sonar y cómo está el tiempo (`Mezcla`).
 */
import { type Mezcla, SILENCIO } from './mezcla';
import { chicharras, type Fondo, lluvia, pajaro, type Sonido, SONIDOS } from './sintes';

export { type Ambiente, type Mezcla, mezcla, SILENCIO } from './mezcla';
export type { Sonido } from './sintes';

export interface Parlante {
  prender(si: boolean): void;
  sonar(s: Sonido): void;
  ambiente(m: Mezcla): void;
}

type ConContexto = { AudioContext?: new () => AudioContext; webkitAudioContext?: new () => AudioContext };

export function crearParlante(g: ConContexto = globalThis as ConContexto): Parlante {
  const Contexto = g.AudioContext ?? g.webkitAudioContext;
  let ctx: AudioContext | null = null,
    salida: GainNode | null = null,
    fondos: { lluvia: Fondo; chicharras: Fondo } | null = null,
    prendido = false,
    actual: Mezcla = SILENCIO,
    reloj: ReturnType<typeof setTimeout> | null = null;

  function abrir(): AudioContext | null {
    if (!ctx && Contexto) {
      ctx = new Contexto();
      salida = ctx.createGain();
      salida.gain.value = 0.6;
      salida.connect(ctx.destination);
      fondos = { lluvia: lluvia(ctx, salida), chicharras: chicharras(ctx, salida) };
    }
    if (ctx?.state === 'suspended') void ctx.resume();
    return ctx;
  }
  /** El próximo pájaro, a un tiempo al azar alrededor del promedio de la mezcla. */
  function cantar(): void {
    if (reloj) clearTimeout(reloj);
    reloj = null;
    const cada = actual.pajaros;
    if (!prendido || cada == null || !ctx) return;
    reloj = setTimeout(
      () => {
        if (ctx && salida) pajaro(ctx, salida);
        cantar();
      },
      cada * 1000 * (0.4 + Math.random() * 1.2),
    );
  }
  function mezclar(): void {
    const m = prendido ? actual : SILENCIO;
    fondos?.lluvia.volumen(m.lluvia);
    fondos?.chicharras.volumen(m.chicharras ? 1 : 0);
  }
  return {
    prender(si) {
      prendido = si;
      if (si) abrir();
      else void ctx?.suspend();
      mezclar();
      cantar();
    },
    sonar(s) {
      if (prendido && abrir() && salida) SONIDOS[s](ctx!, salida);
    },
    ambiente(m) {
      // los pájaros se reprograman solo si cambia cada cuánto cantan: si no, cada redibujo los atrasaría
      const antes = actual.pajaros;
      actual = m;
      mezclar();
      if (m.pajaros !== antes) cantar();
    },
  };
}
