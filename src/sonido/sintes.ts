/**
 * Los sonidos, sintetizados con Web Audio: nada de archivos. Cada función arma sus nodos, los
 * conecta a `salida` y los deja morir solos.
 */

/** Un segundo de ruido rosado, para la lluvia, la tierra y el agua. */
function ruido(ctx: AudioContext): AudioBuffer {
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate),
    d = b.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + w * 0.029591;
    b1 = 0.985 * b1 + w * 0.032534;
    b2 = 0.95 * b2 + w * 0.048056;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.5;
  }
  return b;
}

let buffer: AudioBuffer | null = null;
const deRuido = (ctx: AudioContext): AudioBufferSourceNode => {
  const s = ctx.createBufferSource();
  s.buffer = buffer ??= ruido(ctx);
  return s;
};

/** Una envolvente: sube en `ataque` segundos hasta `pico` y se apaga en `caida`. */
function envolvente(ctx: AudioContext, salida: AudioNode, pico: number, ataque: number, caida: number): GainNode {
  const g = ctx.createGain(),
    t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(pico, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + caida);
  g.connect(salida);
  return g;
}

/** Ruido filtrado, corto: la tierra (grave) o el agua (agudo). */
function soplo(ctx: AudioContext, salida: AudioNode, frec: number, pico: number, ataque: number, caida: number): void {
  const s = deRuido(ctx),
    f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = frec;
  f.Q.value = 0.8;
  s.connect(f).connect(envolvente(ctx, salida, pico, ataque, caida));
  s.start();
  s.stop(ctx.currentTime + ataque + caida + 0.05);
}

/** Un tono que se desliza de `de` a `a` Hz. */
function tono(ctx: AudioContext, salida: AudioNode, de: number, a: number, pico: number, dur: number, en = 0): void {
  const o = ctx.createOscillator(),
    t = ctx.currentTime + en,
    g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(de, t);
  o.frequency.exponentialRampToValueAtTime(a, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(pico, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(salida);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export type Sonido = 'pop' | 'tierra' | 'agua' | 'campanita';

/** Los sonidos cortos, que responden a lo que hace el que juega. */
export const SONIDOS: Record<Sonido, (ctx: AudioContext, salida: AudioNode) => void> = {
  /** la cosecha: un pop redondo */
  pop: (ctx, s) => tono(ctx, s, 520, 160, 0.5, 0.12),
  /** sembrar, trasplantar, mulch: tierra que se acomoda */
  tierra: (ctx, s) => soplo(ctx, s, 350, 0.5, 0.01, 0.18),
  /** regar: agua que cae */
  agua: (ctx, s) => soplo(ctx, s, 2200, 0.25, 0.12, 0.5),
  /** un logro: dos notas de la pentatónica */
  campanita: (ctx, s) => {
    tono(ctx, s, 1047, 1040, 0.25, 0.5);
    tono(ctx, s, 1568, 1560, 0.2, 0.7, 0.14);
  },
};

/** Un pájaro: dos a cuatro silbidos cortos que suben. */
export function pajaro(ctx: AudioContext, salida: AudioNode): void {
  const base = 2400 + Math.random() * 1600,
    veces = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < veces; i++) tono(ctx, salida, base, base * 1.35, 0.06, 0.07, i * 0.11);
}

/** Un fondo continuo con su volumen: la lluvia (ruido agudo) o las chicharras (ruido agudo que late). */
export interface Fondo {
  volumen(v: number): void;
}
export function lluvia(ctx: AudioContext, salida: AudioNode): Fondo {
  const s = deRuido(ctx),
    f = ctx.createBiquadFilter(),
    g = ctx.createGain();
  f.type = 'highpass';
  f.frequency.value = 900;
  g.gain.value = 0;
  s.loop = true;
  s.connect(f).connect(g).connect(salida);
  s.start();
  return { volumen: (v) => g.gain.setTargetAtTime(v * 0.35, ctx.currentTime, 1.2) };
}
export function chicharras(ctx: AudioContext, salida: AudioNode): Fondo {
  const s = deRuido(ctx),
    f = ctx.createBiquadFilter(),
    latido = ctx.createOscillator(),
    am = ctx.createGain(),
    g = ctx.createGain();
  f.type = 'bandpass';
  f.frequency.value = 5200;
  f.Q.value = 6;
  latido.frequency.value = 38;
  am.gain.value = 0;
  latido.connect(am.gain);
  g.gain.value = 0;
  s.loop = true;
  s.connect(f).connect(am).connect(g).connect(salida);
  s.start();
  latido.start();
  return { volumen: (v) => g.gain.setTargetAtTime(v * 0.12, ctx.currentTime, 2) };
}
