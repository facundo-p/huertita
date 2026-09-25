/** Logros y cosecha: lo juntado en el año, los pedidos de los vecinos y los logros, con su premio. Y el balance de fin de año. */
import { pedidos } from '../../aplicacion/consultas';
import * as M from '../../dominio';
import { usarPartida } from '../estado';
import { corto, numero } from '../formato';
import { hacer, seguirOtroAnio } from '../mensajes';

/** Los pedidos abiertos: quién, qué, cuánto llevás, para cuándo y qué da. Cuándo sembrar, lo cuenta el que juega. */
function Pedidos() {
  const E = usarPartida(),
    ps = pedidos(E);
  return (
    <>
      <h3>Pedidos de los vecinos</h3>
      {ps.abiertos.length ? (
        <ul class="hz-logros hz-pedidos">
          {ps.abiertos.map((p) => (
            <li key={p.id} class={p.llevas >= p.porciones ? 'ok' : ''}>
              <b>
                {p.porciones} de {p.especie} para {p.fecha}
              </b>
              <span>
                {p.quien}, {p.para}. Llevás {numero(p.llevas)} de {p.porciones}
                {p.faltan > 0
                  ? '; faltan ' + p.faltan + (p.faltan === 1 ? ' década.' : ' décadas.')
                  : '; es esta década.'}
              </span>
              <small>A cambio: {p.premio}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p class="hz-nota">
          Ninguno abierto. Cuando ven que cosechás, los vecinos piden: vienen con fecha, y cuándo sembrar lo contás vos
          con la ficha.
        </p>
      )}
      {ps.cumplidos > 0 && (
        <p class="hz-nota">
          Cumpliste {ps.cumplidos} {ps.cumplidos === 1 ? 'pedido' : 'pedidos'}.
        </p>
      )}
    </>
  );
}

export function Logros() {
  const E = usarPartida(),
    b = M.balance(E);
  return (
    <>
      <h2>Logros y cosecha</h2>
      <p class="hz-cifras">
        <b>{b.porciones}</b> porciones · <b>{b.especies}</b> especies · <b>{b.semillas}</b> sobres propios ·{' '}
        <b>{b.visitas}</b> visitas de polinizadores
      </p>
      <Pedidos />
      <h3>Logros</h3>
      <ul class="hz-logros">
        {M.MISIONES.map((m) => (
          <li key={m.id} class={m.id in E.progreso.misiones ? 'ok' : ''}>
            <b>{m.titulo}</b>
            <span>{m.texto}</span>
            <small>
              Premio:{' '}
              {Object.keys(m.premio)
                .map((s) => corto(M.ESPECIES[s].nombre))
                .join(', ')}
            </small>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Fin() {
  const E = usarPartida(),
    b = M.balance(E);
  return (
    <>
      <h2>Balance del año</h2>
      <p class="hz-estrellas">
        {'★★★'.slice(0, b.estrellas)}
        <i>{'★★★'.slice(b.estrellas)}</i>
      </p>
      <dl class="hz-datos">
        <dt>Porciones cosechadas</dt>
        <dd>{b.porciones}</dd>
        <dt>Especies distintas</dt>
        <dd>{b.especies}</dd>
        <dt>Sobres de semilla propia</dt>
        <dd>{b.semillas}</dd>
        <dt>Materia orgánica del suelo</dt>
        <dd>
          {b.dMo >= 0 ? '+' : ''}
          {b.dMo} puntos
        </dd>
        <dt>Visitas de polinizadores</dt>
        <dd>{b.visitas}</dd>
        <dt>Logros</dt>
        <dd>
          {b.logros} de {M.MISIONES.length}
        </dd>
        <dt>Puntaje</dt>
        <dd>{b.puntos}</dd>
      </dl>
      <p>
        {b.dMo < 0
          ? 'La tierra terminó más pobre de lo que empezó: cada cosecha se lleva nutrientes. Compost, mulch y legumbres la devuelven.'
          : 'Dejaste la tierra mejor de lo que la encontraste. Esa es la huerta que dura.'}
      </p>
      <div class="hz-fila">
        <button class="hz-btn pri" onClick={seguirOtroAnio}>
          Seguir otro año
        </button>
        <button class="hz-btn" data-modo="patios" onClick={() => hacer({ tipo: 'ir', modo: 'patios' })}>
          Patio nuevo
        </button>
      </div>
    </>
  );
}
