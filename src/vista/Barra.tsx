/** La barra de acciones principales: a qué panel ir, la capa de sol y pasar la década. */
import type { NombreDeModo } from './modos';
import { capa, interaccion, usarPartida } from './estado';
import { hacer, pasarDecada } from './mensajes';

const MODOS: [Exclude<NombreDeModo, 'moviendo' | 'ficha'>, string][] = [
  ['semillas', 'Sembrar'],
  ['riego', 'Regar'],
  ['proteger', 'Proteger'],
];
const DESPUES: [Exclude<NombreDeModo, 'moviendo' | 'ficha'>, string][] = [
  ['almanaque', 'Almanaque'],
  ['cuaderno', 'Cuaderno'],
];

export function Barra() {
  const E = usarPartida(),
    actual = interaccion.value.modo.modo;
  const boton = ([modo, texto]: (typeof MODOS)[number]) => (
    <button key={modo} data-modo={modo} class={actual === modo ? 'on' : ''} onClick={() => hacer({ tipo: 'ir', modo })}>
      {texto}
    </button>
  );
  return (
    <nav class="hz-barra" id="hz-barra" aria-label="Acciones">
      {MODOS.map(boton)}
      <button
        id="hz-capa"
        class={capa.value === 'sol' ? 'on' : ''}
        onClick={() => (capa.value = capa.value === 'sol' ? null : 'sol')}
      >
        Ver sol
      </button>
      {DESPUES.map(boton)}
      <button id="hz-pasar" disabled={E.tiempo.terminado} onClick={pasarDecada}>
        Pasar 10 días ▶
      </button>
    </nav>
  );
}
