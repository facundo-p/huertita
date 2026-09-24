/** El almanaque de siembra: 36 décadas por especie, arriba la siembra y abajo el trasplante. */
import { almanaque } from '../../aplicacion/consultas';
import * as M from '../../dominio';
import { almanaqueCompleto, usarPartida } from '../estado';
import { hacer } from '../mensajes';
import { Franja, Leyenda, Meses } from '../piezas/Almanaque';

export function Almanaque() {
  const E = usarPartida(),
    todas = almanaqueCompleto.value,
    lista = almanaque(E, todas),
    total = Object.keys(M.ESPECIES).length;
  return (
    <>
      <h2>Almanaque de siembra</h2>
      <p>
        Conurbano, por décadas de 10 días. Arriba la siembra, abajo el trasplante. Tocá una especie para ver su ficha.
      </p>
      <div class="hz-seg dos">
        <button data-todas="0" class={todas ? '' : 'on'} onClick={() => (almanaqueCompleto.value = false)}>
          Mis sobres
        </button>
        <button data-todas="1" class={todas ? 'on' : ''} onClick={() => (almanaqueCompleto.value = true)}>
          Las {total} especies
        </button>
      </div>
      <Leyenda />
      <div class="hz-alm">
        <div class="hz-alm-fila cab">
          <span />
          <Meses />
        </div>
        {lista.map((x) => (
          <button
            key={x.slug}
            class={'hz-alm-fila v-' + x.ventana}
            data-slug={x.slug}
            onClick={() => hacer({ tipo: 'ficha', slug: x.slug })}
          >
            <span class="nom">
              {x.nombre} {x.sobres > 0 && <small>×{x.sobres}</small>}
            </span>
            <Franja slug={x.slug} hoy={E.dec} />
          </button>
        ))}
      </div>
      {!lista.length && <p class="hz-dim">No te quedan sobres. Mirá las {total} especies.</p>}
    </>
  );
}
