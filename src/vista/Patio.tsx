/**
 * El patio: el lienzo donde dibuja el renderer elegido y, con la cámara de cerca, los botones para
 * elegir qué cantero mirar. El renderer solo recibe la escena y avisa qué celda se tocó.
 */
import { useEffect, useRef } from 'preact/hooks';
import { zonaCerca as elegirZonaCerca } from '../aplicacion/consultas';
import * as M from '../dominio';
import type { Renderer } from '../render/contrato';
import { activo, dispararEfectos, RENDERERS } from './efectos';
import { interaccion, renderer, usarPartida, zonaCerca } from './estado';
import { escenaActual, mirarZona, tocarCelda } from './mensajes';

function Lienzo() {
  const lugar = useRef<HTMLDivElement>(null),
    montado = useRef<Renderer | null>(null);
  const cual = renderer.value;
  useEffect(() => {
    const r = new RENDERERS[cual]();
    r.montar(lugar.current!);
    r.alTocar(tocarCelda);
    montado.current = r;
    activo.value = r;
    return () => {
      r.desmontar();
      montado.current = null;
    };
  }, [cual]);
  usarPartida();
  const escena = escenaActual();
  useEffect(() => {
    const r = montado.current;
    if (!r) return;
    r.dibujar(escena);
    dispararEfectos(r);
  });
  return <div id="hz-lienzo" ref={lugar} />;
}

function Zonas() {
  const E = usarPartida(),
    escena = escenaActual(E),
    actual = elegirZonaCerca(E, interaccion.value.sel, zonaCerca.value);
  return (
    <div class="hz-zonas" id="hz-zonas" hidden={escena.camara !== 'cerca'}>
      {M.idsDeZonas(E).map((z) => (
        <button key={z} data-zona={z} class={z === actual ? 'on' : ''} onClick={() => mirarZona(z)}>
          {M.zona(E, z).nombre}
        </button>
      ))}
    </div>
  );
}

export function Patio() {
  return (
    <section class="hz-patio" aria-label="El patio">
      <Lienzo />
      <Zonas />
    </section>
  );
}
