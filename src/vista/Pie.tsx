/** Abajo: la cámara y la gráfica, los logros, cómo se juega y el guardado. */
import { activo, RENDERERS } from './efectos';
import { camara, renderer } from './estado';
import { hacer } from './mensajes';

export function Pie() {
  const r = activo.value,
    cams = r?.camaras;
  return (
    <div class="hz-pie">
      <button id="hz-camara" hidden={!cams} onClick={() => (camara.value = (camara.value + 1) % (cams?.length ?? 1))}>
        {cams ? 'Cámara: ' + cams[camara.value % cams.length][1] : 'Cámara'}
      </button>
      <button id="hz-render" onClick={() => (renderer.value = (renderer.value + 1) % RENDERERS.length)}>
        Gráfica: {r?.nombre ?? ''}
      </button>
      <button data-modo="logros" onClick={() => hacer({ tipo: 'ir', modo: 'logros' })}>
        Logros
      </button>
      <button data-modo="inicio" onClick={() => hacer({ tipo: 'ir', modo: 'inicio' })}>
        Cómo se juega
      </button>
      <button data-modo="partidas" onClick={() => hacer({ tipo: 'ir', modo: 'partidas' })}>
        Guardar y cargar
      </button>
    </div>
  );
}
