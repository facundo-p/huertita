/** La ficha completa de una especie: cuándo, qué pide, con quién se lleva, cuidados y problemas. */
import { fichaDeEspecie, type FichaDeEspecie, type Vecino } from '../../aplicacion/consultas';
import { interaccion, usarPartida } from '../estado';
import { hacer } from '../mensajes';
import { Epoca, Franja, Leyenda, Meses, metodoEnPalabras } from '../piezas/Almanaque';
import { Escala, EscalaDeAgua, EscalaDeLuz, EscalaDeTemperatura } from '../piezas/Escala';
import { TiraDeEstadios } from '../piezas/Tira';
import { Almanaque } from './Almanaque';

const HELADA = {
  muere: 'la mata',
  sensible: 'la daña',
  tolera: 'la tolera',
  mejora: 'la mejora: concentra azúcares',
} as const;

const Chips = ({ vecinos }: { vecinos: Vecino[] }) => (
  <>
    {vecinos.map((v) => (
      <button key={v.slug} class="hz-chip" data-slug={v.slug} onClick={() => hacer({ tipo: 'ficha', slug: v.slug })}>
        {v.nombre}
      </button>
    ))}
  </>
);

function Cuando({ f }: { f: FichaDeEspecie }) {
  const E = usarPartida(),
    sp = f.sp,
    met = metodoEnPalabras(f.metodo);
  return (
    <>
      <h3>Cuándo</h3>
      <div class="hz-alm solo">
        <div class="hz-alm-fila cab">
          <Meses />
        </div>
        <div class="hz-alm-fila">
          <Franja slug={sp.slug} hoy={E.dec} grande />
        </div>
      </div>
      <Leyenda />
      <dl class="hz-datos">
        <dt>Este mes</dt>
        <dd>{met ?? 'no es mes de siembra'}</dd>
        <dt>Cómo</dt>
        <dd>{sp.siembra}</dd>
        <dt>Tiempos</dt>
        <dd>
          {'germina en ' + sp.dg.min + '–' + sp.dg.max + ' días'}
          {sp.dt ? ' · trasplante a los ' + sp.dt.min + '–' + sp.dt.max : ' · no se trasplanta'}
          {' · cosecha a los ' + sp.dc.min + '–' + sp.dc.max}
        </dd>
        <dt>Vida</dt>
        <dd>{sp.vida}</dd>
      </dl>
    </>
  );
}

/** Lo que dice el catálogo del contenedor mínimo, en una frase. */
function textoDeMaceta(sp: FichaDeEspecie['sp']): string {
  const mac = sp.maceta || { litros_min: null, profundidad_min_cm: null, plantas_por_contenedor: null };
  if (!mac.litros_min && !mac.profundidad_min_cm) return 'sin dato en el catálogo';
  return (
    (mac.litros_min ? mac.litros_min + ' L' : '') +
    (mac.litros_min && mac.profundidad_min_cm ? ' y ' : '') +
    (mac.profundidad_min_cm ? mac.profundidad_min_cm + ' cm de hondo' : '') +
    (mac.plantas_por_contenedor ? ' · ' + mac.plantas_por_contenedor + ' por maceta' : '')
  );
}

function FilaGermina({ f }: { f: FichaDeEspecie }) {
  const tg = f.sp.tg;
  if (!tg) return null;
  return (
    <tr>
      <th>Germina</th>
      <td>
        <Escala
          min={-5}
          max={40}
          bandas={[
            [tg.min, tg.max, 'tol'],
            [tg.ideal_min, tg.ideal_max, 'ideal'],
          ]}
          valor={f.tmed}
          f={1}
          izq="−5 °C"
          der="40 °C"
        />
      </td>
      <td>
        suelo ideal {tg.ideal_min}–{tg.ideal_max} °C · mín {tg.min}
      </td>
    </tr>
  );
}

function QuePide({ f }: { f: FichaDeEspecie }) {
  const sp = f.sp;
  return (
    <>
      <h3>Qué pide</h3>
      <table class="hz-factores">
        <tr>
          <th>Luz</th>
          <td>
            <EscalaDeLuz sp={sp} horas={null} f={1} />
          </td>
          <td>
            {f.luz} · {sp.hmin}–{sp.hideal} h
          </td>
        </tr>
        <tr>
          <th>Agua</th>
          <td>
            <EscalaDeAgua sp={sp} H={null} f={1} />
          </td>
          <td>riego {sp.riego}</td>
        </tr>
        {sp.tc && (
          <tr>
            <th>Crece</th>
            <td>
              <EscalaDeTemperatura tc={sp.tc} t={f.tmed} f={1} />
            </td>
            <td>
              ideal {sp.tc.ideal_min}–{sp.tc.ideal_max} °C · tolera {sp.tc.tolera_min} a {sp.tc.tolera_max}
            </td>
          </tr>
        )}
        <FilaGermina f={f} />
      </table>
      <p class="hz-dim">La marca en temperatura es la media pronosticada para esta década en tu patio.</p>
      <dl class="hz-datos">
        <dt>Suelo</dt>
        <dd>
          {f.suelo}. {sp.sueloNo}
        </dd>
        <dt>Poca luz</dt>
        <dd>{sp.luzNo}</dd>
        <dt>Helada</dt>
        <dd>{HELADA[sp.helada]}</dd>
        <dt>Maceta</dt>
        <dd>{textoDeMaceta(sp)}</dd>
      </dl>
    </>
  );
}

function Cuidados({ f }: { f: FichaDeEspecie }) {
  const sp = f.sp,
    cf = sp.conf || { luz: null, suelo: null, temp: null, cal: null, asoc: null };
  return (
    <>
      <h3>Cuidados y problemas</h3>
      <dl class="hz-datos">
        {sp.cuidados.length > 0 && (
          <>
            <dt>Cuidados</dt>
            <dd>{sp.cuidados.join(', ')}</dd>
          </>
        )}
        <dt>Cosecha</dt>
        <dd>{sp.listo}</dd>
        <dt>Plagas</dt>
        <dd>{sp.plagas}</dd>
        <dt>Riesgos</dt>
        <dd>{sp.riesgos}</dd>
      </dl>
      {sp.truco && (
        <p class="hz-cita">
          <span>Truco del catálogo</span>
          {sp.truco}
        </p>
      )}
      {sp.nota && (
        <p class="hz-cita">
          <span>Temperatura</span>
          {sp.nota}
        </p>
      )}
      <p class="hz-dim">
        Confianza de los datos en huertapp (1 a 10): luz {String(cf.luz)}, suelo {String(cf.suelo)}, temperatura{' '}
        {String(cf.temp)}, calendario {String(cf.cal)}, asociaciones {String(cf.asoc)}.
        {sp.sup.length > 0 && ' Supuesto por el juego: ' + sp.sup.join(', ') + '.'}
      </p>
    </>
  );
}

export function Ficha() {
  const E = usarPartida(),
    { modo } = interaccion.value,
    f = modo.modo === 'ficha' ? fichaDeEspecie(E, modo.slug) : null;
  if (!f) return <Almanaque />;
  const sp = f.sp,
    sobres = E.sobres[sp.slug] || 0;
  return (
    <>
      <div class="hz-fila">
        <button class="hz-btn sec" data-modo="almanaque" onClick={() => hacer({ tipo: 'ir', modo: 'almanaque' })}>
          ← Almanaque
        </button>
        {sobres > 0 && (
          <button class="hz-btn pri" onClick={() => hacer({ tipo: 'sembrarDesdeFicha', slug: sp.slug })}>
            Sembrar (tenés ×{sobres})
          </button>
        )}
      </div>
      <h2>{sp.nombre}</h2>
      <p class="hz-sub">
        <i>{sp.cient || ''}</i> · {sp.grupo.toLowerCase()} · {sp.familia} <Epoca v={f.ventana} />
      </p>
      <TiraDeEstadios slug={sp.slug} />
      <Cuando f={f} />
      <QuePide f={f} />
      <h3>Vecinos</h3>
      {f.buenas.length > 0 && (
        <p class="hz-chips">
          <b class="hz-bien">Se lleva bien</b>
          <Chips vecinos={f.buenas} />
        </p>
      )}
      {f.malas.length > 0 && (
        <p class="hz-chips">
          <b class="hz-mal">Se lleva mal</b>
          <Chips vecinos={f.malas} />
        </p>
      )}
      {!f.buenas.length && !f.malas.length && <p class="hz-dim">Sin asociaciones en el catálogo.</p>}
      <Cuidados f={f} />
    </>
  );
}
