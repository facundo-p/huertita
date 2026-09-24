/** Guardar y cargar: el autoguardado, la nube, las ranuras, llevarla a otro lado y empezar de cero. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { resumenDePartida } from '../../aplicacion/consultas';
import { resumenDe, type Vistazo } from '../../aplicacion/partidas';
import { interaccion, partida, sinStorage, usarPartida, version } from '../estado';
import { cuando } from '../formato';
import * as G from '../guardado';
import { hacer } from '../mensajes';
import { almacenes, nube } from '../persistencia';
import { Confirmar } from './Confirmar';

const RANURAS = [1, 2, 3];

function EnLaNube() {
  const n = nube.value;
  if (n.estado !== 'lista')
    return (
      <p class="hz-dim">
        {n.estado === 'buscando'
          ? 'Buscando la nube…'
          : 'La nube no está disponible en esta vista (por ejemplo, si abriste el archivo suelto). Las ranuras y el código funcionan igual.'}
      </p>
    );
  return (
    <>
      <p>
        Se sube sola cada vez que pasás 10 días, a una carpeta que solo vos podés leer. Sirve para seguir en el celular
        lo que empezaste en la compu.
        {n.remota ? (
          <>
            {' '}
            En la nube hay: <b>{resumenDe(n.remota)}</b>, del {cuando(n.remota.t)}.
          </>
        ) : (
          ' Todavía no hay nada subido.'
        )}
        {n.error && (
          <>
            {' '}
            <b class="hz-mal">{n.error}</b>
          </>
        )}
      </p>
      <div class="hz-fila">
        <button class="hz-btn" onClick={() => void G.subirANube(true)}>
          Subir ahora
        </button>
        <Confirmar
          class="hz-btn"
          disabled={!n.remota}
          pregunta="¿Pisar la actual?"
          alConfirmar={() => void G.traerDeLaNube()}
        >
          Traer de la nube
        </Confirmar>
      </div>
    </>
  );
}

function Ranuras() {
  const [vistas, setVistas] = useState<(Vistazo | null)[]>([]),
    [releer, setReleer] = useState(0);
  usarPartida();
  useEffect(() => {
    void Promise.all(RANURAS.map((n) => almacenes.ranura(n).mirar())).then(setVistas);
  }, [releer, version.value]);
  return (
    <div class="hz-ranuras">
      {RANURAS.map((n, i) => {
        const r = vistas[i];
        return (
          <div key={n} class="hz-ranura">
            <div>
              <b>Ranura {n}</b>
              <span>{r ? resumenDe(r) + ' · guardada el ' + cuando(r.t) : 'vacía'}</span>
            </div>
            <button class="hz-btn" onClick={() => void G.guardarEnRanura(n).then(() => setReleer((x) => x + 1))}>
              Guardar acá
            </button>
            <Confirmar
              class="hz-btn"
              disabled={!r}
              pregunta="¿Pisar la actual?"
              alConfirmar={() => void G.cargarRanura(n)}
            >
              Cargar
            </Confirmar>
          </div>
        );
      })}
    </div>
  );
}

function Llevarla() {
  const { modo } = interaccion.value,
    verCodigo = modo.modo === 'partidas' && modo.verCodigo,
    codigo = useRef<HTMLTextAreaElement>(null),
    pegado = useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <h3>Llevarla a otro lado</h3>
      <div class="hz-fila">
        <button class="hz-btn" onClick={() => void G.bajar()}>
          Bajar archivo
        </button>
        <button class="hz-btn" onClick={() => hacer({ tipo: 'verCodigo' })}>
          {verCodigo ? 'Ocultar código' : 'Ver código de la partida'}
        </button>
      </div>
      {verCodigo && (
        <>
          <textarea
            id="hz-codigo"
            ref={codigo}
            class="hz-codigo"
            readOnly
            rows={4}
            aria-label="Código de la partida"
            value={G.codigoDeLaPartida()}
          />
          <div class="hz-fila">
            <button class="hz-btn" onClick={() => codigo.current && G.copiar(codigo.current)}>
              Copiar
            </button>
          </div>
        </>
      )}
      <label class="hz-dim" for="hz-importar">
        Pegá acá un código o el contenido de un archivo para cargarlo:
      </label>
      <textarea id="hz-importar" ref={pegado} class="hz-codigo" rows={3} />
      <div class="hz-fila">
        <button class="hz-btn" onClick={() => G.importar(pegado.current?.value ?? '')}>
          Cargar lo pegado
        </button>
      </div>
    </>
  );
}

export function Partidas() {
  const E = usarPartida();
  return (
    <>
      <h2>Tu huerta guardada</h2>
      <p>
        {sinStorage.value ? (
          <>
            <b class="hz-mal">Este navegador no está dejando guardar en el dispositivo.</b> Usá la nube o el código para
            no perder la partida.
          </>
        ) : (
          'Se guarda sola en este dispositivo después de cada cosa que hacés. Última vez: ' +
          cuando(E.meta.guardado) +
          '.'
        )}
      </p>
      <p class="hz-sub">{resumenDePartida(partida.value)}</p>
      <h3>En la nube</h3>
      <EnLaNube />
      <h3>Ranuras</h3>
      <p class="hz-dim">Copias a mano, para probar algo arriesgado y poder volver.</p>
      <Ranuras />
      <Llevarla />
      <h3>Empezar de cero</h3>
      <div class="hz-fila">
        <button class="hz-btn sec" data-modo="patios" onClick={() => hacer({ tipo: 'ir', modo: 'patios' })}>
          Elegir patio y empezar
        </button>
      </div>
    </>
  );
}
