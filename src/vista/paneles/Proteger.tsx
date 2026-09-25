/** Proteger de la helada: por cantero, qué abrigo tiene, qué riesgo corre y qué se puede sumar. */
import { proteccion, type Proteccion, type ZonaAbrigada } from '../../aplicacion/consultas';
import { usarPartida } from '../estado';
import { corto } from '../formato';
import { armarTunel, taparConManta } from '../mensajes';

function claseDeManta(z: ZonaAbrigada): string {
  if (z.manta.puesto) return ' on';
  return z.prioridad ? ' pri' : '';
}

function ZonaConAbrigo({ z }: { z: ZonaAbrigada }) {
  return (
    <div class={'hz-abrigo n-' + z.nivel}>
      <div>
        <b>{z.nombre}</b>
        <span>{z.textoDeAbrigo}</span>
        <span>
          {z.sensibles.length ? (
            <>
              <i class="hz-riesgo">{z.riesgo} % de que se hiele</i> · sensibles:{' '}
              {z.sensibles.map(corto).join(', ').toLowerCase()}
            </>
          ) : (
            'nada sensible a la helada acá'
          )}
        </span>
      </div>
      <button
        class={'hz-btn' + claseDeManta(z)}
        data-zona={z.id}
        disabled={!z.manta.se}
        onClick={() => taparConManta(z.id)}
      >
        {z.manta.puesto ? 'Manta puesta' : 'Manta · ' + z.manta.costo}
      </button>
    </div>
  );
}

/** Cuánto abriga cada cosa y cómo se suman. */
function ComoSeSuman({ ayuda }: { ayuda: Proteccion['ayuda'] }) {
  return (
    <p class="hz-dim">
      {ayuda.queAbriga}
      {ayuda.fijos}
      {ayuda.seSuman}
    </p>
  );
}

export function Proteger() {
  const P = proteccion(usarPartida());
  return (
    <>
      <h2>Proteger de la helada</h2>
      <p>
        Pronóstico: mínima <b>{P.tmin} °C</b>. {P.ayuda.cuandoHiela}
      </p>
      <div class="hz-abrigos">
        {P.zonas.map((z) => (
          <ZonaConAbrigo key={z.id} z={z} />
        ))}
      </div>
      <div class="hz-fila">
        {P.zonas.map(
          (z) =>
            z.tunel && (
              <button
                key={z.id}
                class={'hz-btn' + (z.tunel.puesto ? ' on' : '')}
                data-acc="tunel"
                data-zona={z.id}
                onClick={() => armarTunel(z.id)}
              >
                {(z.tunel.puesto ? 'Sacar' : 'Armar') + ' microtúnel en ' + z.conArticulo + ' · ' + z.tunel.costo}
              </button>
            ),
        )}
      </div>
      <ComoSeSuman ayuda={P.ayuda} />
    </>
  );
}
