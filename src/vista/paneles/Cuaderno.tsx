/** El cuaderno de huerta (lo que pasó, década por década) y el resumen de la última década. */
import { Fragment } from 'preact';
import * as M from '../../dominio';
import type { Evento } from '../../dominio';
import { ultimos, usarPartida } from '../estado';
import { cap } from '../formato';
import { Eventos } from '../piezas/Eventos';

/** Agrupa el cuaderno por turno, del más nuevo al más viejo. */
function porTurno(cuaderno: Evento[]): Evento[][] {
  const grupos = new Map<number, Evento[]>();
  for (const e of cuaderno) grupos.set(e.turno, [...(grupos.get(e.turno) ?? []), e]);
  return [...grupos.values()].reverse();
}

export function Cuaderno() {
  const E = usarPartida();
  return (
    <>
      <h2>Cuaderno de huerta</h2>
      {porTurno(E.progreso.cuaderno)
        .slice(0, 12)
        .map((evs) => (
          <Fragment key={evs[0].turno}>
            <h3>{cap(M.fechaDe(evs[0].dec))}</h3>
            <Eventos eventos={evs} />
          </Fragment>
        ))}
    </>
  );
}

export function Resumen() {
  return (
    <>
      <h2>Pasaron 10 días</h2>
      <Eventos eventos={ultimos.value} />
    </>
  );
}
