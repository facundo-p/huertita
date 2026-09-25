/**
 * El patio: el lienzo donde dibuja el renderer elegido y, con la cámara de cerca, los botones para
 * elegir qué cantero mirar. El renderer solo recibe la escena y avisa qué celda se tocó.
 */
import { useEffect, useRef } from 'preact/hooks';
import * as M from '../dominio';
import type { Renderer } from '../render/contrato';
import { activo, dispararEfectos, RENDERERS } from './efectos';
import { escena } from './escena';
import { renderer, usarPartida } from './estado';
import { mirarZona, tocarCelda } from './mensajes';
import './Patio.css';

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
  const es = escena.value;
  useEffect(() => {
    const r = montado.current;
    if (!r) return;
    r.dibujar(es);
    dispararEfectos(r);
  });
  return <div id="hz-lienzo" ref={lugar} />;
}

function Zonas() {
  const E = usarPartida(),
    { camara, cerca } = escena.value;
  return (
    <div class="hz-zonas" id="hz-zonas" hidden={camara !== 'cerca'}>
      {M.idsDeZonas(E).map((z) => (
        <button key={z} data-zona={z} class={z === cerca.zona ? 'on' : ''} onClick={() => mirarZona(z)}>
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
