/** El compost: la bolsa de secos, la tanda abierta con su receta, las que maduran y lo que da el patio. */
import { compost, type Compost as DatosDelCompost } from '../../aplicacion/consultas';
import type { Mezcla } from '../../dominio';
import { usarPartida } from '../estado';
import { numero as n } from '../formato';
import { jugar } from '../mensajes';

const MEZCLA: Record<Mezcla, string> = { pareja: 'bien tapada', humeda: 'húmeda: le faltan secos', seca: 'muy seca' };

function Abierta({ C }: { C: DatosDelCompost }) {
  const a = C.abierta;
  return (
    <div class={'hz-tanda abierta m-' + a.mezcla}>
      <b>Tanda abierta</b>
      <span>
        {n(a.verdes)} de {a.cierraCon} verdes · {n(a.secos)} de secos
        {a.secosPorVerde !== null && ' · ' + n(a.secosPorVerde) + ' secos por verde, ' + MEZCLA[a.mezcla]}
      </span>
    </div>
  );
}

export function Compost() {
  const C = compost(usarPartida());
  if (!C.hay) return <p>En este patio no hay compostera.</p>;
  const J = C.jardin;
  return (
    <>
      <h2>Compost</h2>
      <p>
        Cada balde de restos (verdes) se tapa con {C.receta.min} a {C.receta.max} de secos: hojas, pasto seco, poda
        picada, cartón. Lo más usado es {C.receta.ideal} a 1. Con pocos secos se pudre y tarda; con demasiados, no
        arranca. Los secos salen de la bolsa, que también da el mulch.
      </p>
      <p>
        Bolsa de secos: <b class="hz-bolsa">{n(C.bolsa)}</b> · Compost listo: <b>{C.dosis} dosis</b>
      </p>
      <Abierta C={C} />
      {C.tandas.map((t, i) => (
        <div key={i} class={'hz-tanda m-' + t.mezcla}>
          <b>Tanda {i + 1}</b>
          <span class="hz-barrita">
            <i style={{ width: Math.round(t.avance * 100) + '%' }} />
          </span>
          <span>{MEZCLA[t.mezcla]}</span>
        </div>
      ))}
      <p class="hz-dim">
        En el patio: {J.pasto !== null && 'pasto crecido ' + n(J.pasto) + ' · '}hojas caídas {n(J.hojas)}
        {J.poda > 0 && ' · poda por hacer ' + n(J.poda)}
      </p>
      <div class="hz-fila">
        {C.acciones.map((a) => (
          <button
            key={a.texto}
            class="hz-btn"
            data-acc={a.accion.tipo}
            disabled={!a.se}
            title={a.porque ?? ''}
            onClick={() => jugar(a.accion)}
          >
            {a.texto + ' · ' + a.costo}
          </button>
        ))}
      </div>
    </>
  );
}
