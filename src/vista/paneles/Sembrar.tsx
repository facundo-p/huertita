/** Sembrar: los sobres que tenés, la ficha del elegido y cómo le iría en la celda elegida. */
import { fichaDeEspecie, type FichaDeEspecie, sobresDisponibles } from '../../aplicacion/consultas';
import * as M from '../../dominio';
import { interaccion, usarPartida } from '../estado';
import { corto } from '../formato';
import { hacer } from '../mensajes';
import { Epoca, metodoEnPalabras } from '../piezas/Almanaque';
import { TiraDeEstadios } from '../piezas/Tira';

const HELADA = { muere: 'la mata', sensible: 'la daña', tolera: 'la tolera', mejora: 'la mejora' } as const;
const NIVEL = { bien: 'Buen lugar', regular: 'Lugar regular', mal: 'Mal lugar' } as const;
const vecinos = (xs: { nombre: string }[]) =>
  xs
    .slice(0, 7)
    .map((x) => x.nombre)
    .join(', ');

function Evaluacion({ slug, celda }: { slug: string; celda: string }) {
  const E = usarPartida(),
    ev = M.evaluarCelda(E, slug, celda)!;
  return (
    <div class={'hz-eval n-' + ev.nivel}>
      <b>{NIVEL[ev.nivel]}</b> · {M.zonaDe(E, celda).nombre} · {ev.horas} h de sol
      {ev.razones.length > 0 && (
        <ul>
          {ev.razones.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      <button class="hz-btn pri" data-acc="sembrar" onClick={() => hacer({ tipo: 'tocar', celda })}>
        Sembrar acá · 1 rato
      </button>
    </div>
  );
}

function DatosDelSobre({ f }: { f: FichaDeEspecie }) {
  const sp = f.sp,
    met = metodoEnPalabras(f.metodo);
  return (
    <dl class="hz-datos">
      <dt>Ahora conviene</dt>
      <dd>
        {met ?? 'no es mes de siembra'}
        {sp.dt ? '' : ' · no se trasplanta'}
      </dd>
      <dt>Luz</dt>
      <dd>
        {f.luz} · {sp.hmin}–{sp.hideal} h
      </dd>
      <dt>Suelo</dt>
      <dd>{f.suelo}</dd>
      <dt>Riego</dt>
      <dd>{sp.riego}</dd>
      <dt>Tiempos</dt>
      <dd>
        {'germina en ' +
          sp.dg.min +
          '–' +
          sp.dg.max +
          ' d' +
          (sp.dt ? ' · trasplante a los ' + sp.dt.min + '–' + sp.dt.max + ' d' : '')}
        {' · cosecha a los ' + sp.dc.min + '–' + sp.dc.max + ' d'}
      </dd>
      <dt>Helada</dt>
      <dd>{HELADA[sp.helada]}</dd>
      {f.buenas.length > 0 && (
        <>
          <dt>Se lleva bien</dt>
          <dd>{vecinos(f.buenas)}</dd>
        </>
      )}
      {f.malas.length > 0 && (
        <>
          <dt>Se lleva mal</dt>
          <dd>{vecinos(f.malas)}</dd>
        </>
      )}
    </dl>
  );
}

function FichaDelSobre({ slug }: { slug: string }) {
  const E = usarPartida(),
    f = fichaDeEspecie(E, slug)!,
    sel = interaccion.value.sel,
    tanda = M.semillasPorSiembra(slug, true);
  return (
    <div class="hz-ficha">
      <h3>
        {f.sp.nombre} <Epoca v={f.ventana} />
      </h3>
      <TiraDeEstadios slug={slug} />
      <DatosDelSobre f={f} />
      {sel && E.celdas[sel] && !E.celdas[sel].planta ? (
        <Evaluacion slug={slug} celda={sel} />
      ) : (
        <p class="hz-dim">
          Tocá una celda para ver cómo le iría. Tocala de nuevo para sembrar.
          {tanda > 1 &&
            ' En la almaciguera cada siembra es una tanda de ' +
              tanda +
              ' celdas; en tierra van ' +
              M.semillasPorSiembra(slug, false) +
              ' semillas juntas.'}
        </p>
      )}
      <div class="hz-fila">
        <button class="hz-btn sec" data-acc="ficha" data-slug={slug} onClick={() => hacer({ tipo: 'ficha', slug })}>
          Ficha completa
        </button>
      </div>
    </div>
  );
}

export function Sembrar() {
  const E = usarPartida(),
    { modo } = interaccion.value,
    sobre = modo.modo === 'semillas' ? modo.sobre : null;
  return (
    <>
      <h2>Sobres de semillas</h2>
      <div class="hz-sobres">
        {sobresDisponibles(E).map((x) => (
          <button
            key={x.slug}
            class={'hz-sobre' + (sobre === x.slug ? ' on' : '') + ' v-' + x.ventana}
            data-slug={x.slug}
            onClick={() => hacer({ tipo: 'sobre', slug: x.slug })}
          >
            <b>{corto(x.nombre)}</b>
            <span>
              ×{x.sobres}
              {x.gen ? ' · gen ' + x.gen : ''}
            </span>
          </button>
        ))}
      </div>
      {sobre ? (
        <FichaDelSobre slug={sobre} />
      ) : (
        <p class="hz-dim">Verde: época ideal ahora. Amarillo: posible. Gris: fuera de época en el GBA.</p>
      )}
    </>
  );
}
