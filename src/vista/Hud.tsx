/** Arriba de todo: la fecha, el estado del guardado, los ratos de la década y el pronóstico. */
import { hud } from '../aplicacion/consultas';
import { sinStorage, usarPartida } from './estado';
import { cuando } from './formato';
import { hacer } from './mensajes';
import { nube } from './persistencia';

const CLASE_DE_HELADA = { alta: 'alto', media: 'medio' } as const;

export function Hud() {
  const E = usarPartida(),
    h = hud(E),
    p = h.pronostico;
  const guardada = sinStorage.value ? 'sin guardar' : 'guardada ' + cuando(E.guardado).slice(6);
  return (
    <>
      <div class="hz-marca">
        <h1>Huertita</h1>
        <span>
          {h.fecha} · {h.estacion} · año {h.anio}
        </span>
      </div>
      <button
        class="hz-guardada"
        data-modo="partidas"
        title="Guardar y cargar"
        onClick={() => hacer({ tipo: 'ir', modo: 'partidas' })}
      >
        {guardada + (nube.value.estado === 'lista' ? ' · nube' : '')}
      </button>
      <div class="hz-ratos" title="Ratos libres esta década. Los celestes se van en regar.">
        <b>{h.libres}</b> ratos
        <span class="hz-pips">
          {h.ratos.map((r, i) => (
            <i key={i} class={r} />
          ))}
        </span>
      </div>
      <div class="hz-pron">
        <span class="hz-eti">Pronóstico de la década</span>
        <span>
          {p.tmin}° / {p.tmax}°
        </span>
        <span class={h.alertaDeHelada ? CLASE_DE_HELADA[h.alertaDeHelada] : ''}>helada {p.pHelada} %</span>
        <span>{p.lluvia}</span>
      </div>
    </>
  );
}
