/** El diario de una planta: lo más nuevo arriba, con la salud de cada década y cuánto cambió. */
import * as M from '../../dominio';
import type { Planta, Registro, TipoEvento } from '../../dominio';
import { cap } from '../formato';

const ICONO: Record<TipoEvento, string> = { bien: '+', mal: '−', info: '·', clima: '·', logro: '★' };
const MAXIMO = 16;

/** La última cosa mala que le pasó: lo primero que hay que mirar si está floja. */
function ultimaMala(hist: Registro[]): string | null {
  for (let i = hist.length - 1; i >= 0; i--) {
    const mala = hist[i].n.find((x) => x[0] === 'mal');
    if (mala) return mala[1];
  }
  return null;
}
/** La salud con la que arrancó cada entrada: la del cierre anterior (o 100 si el diario empieza ahí). */
function saludAntes(hist: Registro[], j: number): number {
  if (j > 0) return hist[j - 1].s;
  return hist.length >= MAXIMO ? hist[j].s : 100;
}

const tendencia = (d: number): string => {
  if (d < 0) return ' baja';
  return d > 0 ? ' sube' : '';
};

export function Diario({ pl }: { pl: Planta }) {
  const hist = pl.hist || [];
  if (!hist.length)
    return (
      <details class="hz-diario">
        <summary>Diario de esta planta</summary>
        <p class="hz-dim">Todavía no le pasó nada. Se va llenando a medida que pasan los días.</p>
      </details>
    );
  const floja = pl.salud < 70,
    porQue = floja && ultimaMala(hist);
  return (
    <details class="hz-diario" open={floja}>
      <summary>Diario de esta planta{porQue ? ' · por qué está así' : ''}</summary>
      <ol>
        {hist
          .map((r, j) => ({ r, d: r.s - saludAntes(hist, j) }))
          .reverse()
          .map(({ r, d }) => (
            <li key={r.turno}>
              <b>{cap(M.fechaDe(r.dec))}</b>
              <span class={'hz-dsalud' + tendencia(d)}>
                salud {r.s}
                {d ? ' (' + (d > 0 ? '+' : '−') + Math.abs(d) + ')' : ''}
              </span>
              <ul>
                {r.n.map((x, i) => (
                  <li key={i} class={'t-' + x[0]}>
                    <i>{ICONO[x[0]]}</i>
                    {x[1]}
                  </li>
                ))}
              </ul>
            </li>
          ))}
      </ol>
      {hist.length >= MAXIMO && <p class="hz-dim">Se guardan las últimas 16 anotaciones.</p>}
    </details>
  );
}
