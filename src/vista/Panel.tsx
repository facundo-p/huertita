/**
 * El panel de la derecha (abajo en el celular): lo que corresponde al modo, con el aviso de error o
 * la confirmación arriba y, si se está trasplantando, la indicación de elegir destino.
 */
import type { JSX } from 'preact';
import * as M from '../dominio';
import { aviso, interaccion, nota, usarPartida } from './estado';
import { corto } from './formato';
import { hacer } from './mensajes';
import type { NombreDeModo } from './modos';
import { PANELES } from './paneles';

function Trasplantando({ planta }: { planta: string }) {
  const E = usarPartida(),
    pl = E.mundo.plantas[planta];
  if (!pl) return null;
  return (
    <div class="hz-eval n-regular">
      <b>Trasplantando {corto(M.especieDe(pl).nombre)}.</b> Tocá la celda de destino.{' '}
      <button class="hz-btn sec" onClick={() => hacer({ tipo: 'cancelar' })}>
        Cancelar
      </button>
    </div>
  );
}

export function Panel() {
  const { modo } = interaccion.value;
  // trasplantando, el panel sigue mostrando la celda de origen
  const nombre: NombreDeModo = modo.modo === 'moviendo' ? 'celda' : modo.modo;
  const Cuerpo = PANELES[nombre] as () => JSX.Element | null;
  return (
    <>
      {nota.value && (
        <p class="hz-nota" role="status">
          {nota.value}
        </p>
      )}
      {aviso.value && (
        <p class="hz-aviso" role="alert">
          {aviso.value}
        </p>
      )}
      {modo.modo === 'moviendo' && <Trasplantando planta={modo.planta} />}
      <Cuerpo />
    </>
  );
}
