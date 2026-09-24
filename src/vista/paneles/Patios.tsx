/** Elegir patio: cada uno plantea un problema distinto de luz, espacio y agua. */
import * as M from '../../dominio';
import { usarPartida } from '../estado';
import { empezarEn } from '../guardado';
import { hacer } from '../mensajes';
import { Confirmar } from './Confirmar';

export function Patios() {
  const E = usarPartida();
  return (
    <>
      <h2>Elegí un patio</h2>
      <p>
        Cada patio plantea un problema distinto de luz, espacio y agua.{' '}
        {E.tiempo.terminado
          ? ''
          : 'Empezar uno nuevo reemplaza la partida de ahora: si la querés conservar, guardala antes en una ranura.'}
      </p>
      <div class="hz-ranuras">
        {Object.values(M.PLANTILLAS).map((P) => (
          <div key={P.id} class="hz-ranura">
            <div>
              <b>
                {P.nombre}
                {P.id === E.meta.plantilla && ' · el de ahora'}
                {P.id !== M.PLANTILLA_INICIAL && ' · en prueba'}
              </b>
              <span>{P.desc}</span>
              <span class="hz-dim">{P.zonas.map((z) => z.nombre).join(' · ')}</span>
            </div>
            <Confirmar
              class={'hz-btn' + (P.id === E.meta.plantilla ? '' : ' pri')}
              data-patio={P.id}
              sinPreguntar={E.tiempo.terminado}
              pregunta="¿Seguro? Tocá de nuevo"
              alConfirmar={() => empezarEn(P.id)}
            >
              Empezar acá
            </Confirmar>
          </div>
        ))}
      </div>
      <div class="hz-fila">
        <button class="hz-btn sec" data-modo="partidas" onClick={() => hacer({ tipo: 'ir', modo: 'partidas' })}>
          Volver
        </button>
      </div>
    </>
  );
}
