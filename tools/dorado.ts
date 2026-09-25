/**
 * El dorado: una foto de lo que juega el bot, un año entero con 8 semillas en cada patio. Por partida
 * guarda el balance (legible, para ver en el diff del PR qué cambió) y una huella del estado final
 * (para que nada cambie sin que se note).
 *
 * `npm run dorado` compara contra la foto guardada. `npm run dorado -- --guardar` la regenera: se usa
 * solo cuando una regla cambia a propósito, y el diff de `tests/fixtures/dorado.json` va en el PR.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as M from '../src/dominio';
import { jugarUnAnio } from './jugador';

export const ARCHIVO = fileURLToPath(new URL('../tests/fixtures/dorado.json', import.meta.url));
export const SEMILLAS = [1, 2, 3, 4, 5, 6, 7, 8];

/** JSON con las claves ordenadas: la misma partida da siempre el mismo texto. */
export const canon = (v: unknown): string =>
  JSON.stringify(v, (_k, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1)))
      : x,
  );

export interface Foto {
  patio: string;
  semilla: number;
  caracter: string;
  balance: ReturnType<typeof M.balance>;
  vivas: number;
  /** renglones del cuaderno */
  cuaderno: number;
  /** sha256 del estado final, recortado */
  huella: string;
}

export function foto(patio: string, semilla: number): Foto {
  const E = jugarUnAnio(M, semilla, undefined, { patio });
  return {
    patio,
    semilla,
    caracter: E.tiempo.caracter,
    balance: M.balance(E),
    vivas: Object.keys(E.mundo.plantas).length,
    cuaderno: E.progreso.cuaderno.length,
    huella: createHash('sha256').update(canon(E)).digest('hex').slice(0, 16),
  };
}

export const fotos = (): Foto[] => Object.keys(M.PLANTILLAS).flatMap((p) => SEMILLAS.map((s) => foto(p, s)));

export const guardada = (): Foto[] => JSON.parse(readFileSync(ARCHIVO, 'utf8')) as Foto[];

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const nuevas = fotos();
  if (process.argv.includes('--guardar')) {
    writeFileSync(ARCHIVO, JSON.stringify(nuevas, null, 2) + '\n');
    console.log(`dorado guardado: ${nuevas.length} partidas`);
  } else {
    const viejas = new Map(guardada().map((f) => [`${f.patio}/${f.semilla}`, f]));
    let distintas = 0;
    for (const f of nuevas) {
      const v = viejas.get(`${f.patio}/${f.semilla}`);
      if (v && canon(v) === canon(f)) continue;
      distintas++;
      console.log(`${f.patio}/${f.semilla}: ${v ? canon(v.balance) : '(no estaba)'}\n  → ${canon(f.balance)}`);
    }
    console.log(distintas ? `${distintas} partidas distintas` : 'dorado igual');
    process.exitCode = distintas ? 1 : 0;
  }
}
