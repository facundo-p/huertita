/** Proteger de la helada: por cantero, qué abrigo tiene, qué riesgo corre y qué se puede sumar. */
import { riesgoPorZona, type ZonaAbrigada } from '../../aplicacion/consultas';
import * as M from '../../dominio';
import { usarPartida } from '../estado';
import { cap, corto } from '../formato';
import { armarTunel, taparConManta } from '../mensajes';

const aguantaHasta = (aguanta: number): string => (aguanta + 0.1).toFixed(0);

function claseDeManta(z: ZonaAbrigada): string {
  if (z.conManta) return ' on';
  return z.sensibles.length && z.riesgo >= 15 ? ' pri' : '';
}

function ZonaConAbrigo({ z }: { z: ZonaAbrigada }) {
  return (
    <div class={'hz-abrigo n-' + z.nivel}>
      <div>
        <b>{z.nombre}</b>
        <span>
          {z.abrigo.grados
            ? z.abrigo.partes.join(' + ') +
              ': +' +
              z.abrigo.grados +
              ' °C, aguanta hasta ' +
              aguantaHasta(z.abrigo.aguanta) +
              ' °C'
            : 'sin abrigo: se hiela con 3 °C o menos'}
        </span>
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
        disabled={z.conManta}
        onClick={() => taparConManta(z.id)}
      >
        {z.conManta ? 'Manta puesta' : 'Manta · 1'}
      </button>
    </div>
  );
}

/** Cuánto abriga cada cosa y cómo se suman. */
function ComoSeSuman() {
  const E = usarPartida(),
    A = M.ABRIGO;
  const fijos = M.zonasDe(E)
    .filter((z) => z.abrigo)
    .map(
      (z) =>
        cap(z.conArticulo) +
        (/^l[ao]s /.test(z.conArticulo) ? ' ya tienen ' : ' ya tiene ') +
        z.abrigo!.grados +
        ' °C por ' +
        z.abrigo!.nombre +
        '. ',
    )
    .join('');
  return (
    <p class="hz-dim">
      Cada manta tapa un solo cantero, abriga unos {A.manta} °C y dura esta década. El microtúnel abriga {A.tunel} °C y
      queda puesto, pero no deja entrar lluvia ni polinizadores y en verano cocina. {fijos}
      Los abrigos se suman: manta sobre microtúnel aguanta hasta {3 - A.manta - A.tunel} °C. Una helada más fuerte que
      eso mata igual, y el cuaderno te lo va a decir.
    </p>
  );
}

export function Proteger() {
  const E = usarPartida(),
    p = E.tiempo.pronostico,
    zonas = riesgoPorZona(E);
  return (
    <>
      <h2>Proteger de la helada</h2>
      <p>
        Pronóstico: mínima <b>{p.tmin} °C</b>. Hiela para la planta cuando la mínima, más el abrigo que tenga, no pasa
        de 3 °C. El pronóstico se equivoca un par de grados: es una apuesta.
      </p>
      <div class="hz-abrigos">
        {zonas.map((z) => (
          <ZonaConAbrigo key={z.id} z={z} />
        ))}
      </div>
      <div class="hz-fila">
        {zonas
          .filter((z) => z.admiteTunel)
          .map((z) => (
            <button
              key={z.id}
              class={'hz-btn' + (z.conTunel ? ' on' : '')}
              data-acc="tunel"
              data-zona={z.id}
              onClick={() => armarTunel(z.id)}
            >
              {(z.conTunel ? 'Sacar' : 'Armar') + ' microtúnel en ' + M.zona(E, z.id).conArticulo + ' · 2'}
            </button>
          ))}
      </div>
      <ComoSeSuman />
    </>
  );
}
