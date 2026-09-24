/** Una lista de lo que pasó. Si algo pasó en una celda, tocarlo lleva a esa celda. */
import type { Evento } from '../../dominio';
import { hacer } from '../mensajes';

export function Eventos({ eventos }: { eventos: Evento[] }) {
  if (!eventos.length) return <p class="hz-dim">Sin novedades.</p>;
  return (
    <ul class="hz-evs">
      {eventos.map((e, i) => (
        <li
          key={i}
          class={'ev-' + e.tipo}
          data-celda={e.celda ?? undefined}
          onClick={e.celda ? () => hacer({ tipo: 'irACelda', celda: e.celda! }) : undefined}
        >
          {e.texto}
        </li>
      ))}
    </ul>
  );
}
