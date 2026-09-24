/** Riego por cantero: un régimen que queda puesto y cuesta ratos cada década. */
import * as M from '../../dominio';
import { usarPartida } from '../estado';
import { regar } from '../mensajes';

export function Riego() {
  const E = usarPartida(),
    techadas = M.zonasDe(E)
      .filter((z) => z.techo)
      .map((z) => z.conArticulo);
  return (
    <>
      <h2>Riego por cantero</h2>
      <p>
        Elegís un régimen y se mantiene solo, pero te come ratos cada década. Cada especie pide el suyo: al romero lo
        mata el exceso, a la lechuga la sed.
      </p>
      {M.zonasDe(E).map((z) => (
        <div key={z.id} class="hz-riego">
          <b>{z.nombre}</b>
          <div class="hz-seg">
            {M.RIEGOS.map((nombre, nivel) => (
              <button
                key={nivel}
                data-zona={z.id}
                data-nivel={nivel}
                class={E.recursos.riego[z.id] === nivel ? 'on' : ''}
                onClick={() => regar(z.id, nivel)}
              >
                {nombre}
                <small>{z.riegoCosto[nivel]}</small>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p class="hz-dim">
        El número es el costo en ratos. La lluvia suma, el calor resta, las macetas se secan antes y el mulch ayuda.
        {techadas.length > 0 &&
          ' Bajo techo no llueve: ' +
            techadas.join(' y ') +
            ' ' +
            (techadas.length > 1 ? 'dependen' : 'depende') +
            ' solo de tu riego.'}
      </p>
    </>
  );
}
