/**
 * Los pedidos de los vecinos que están abiertos, para el panel de logros y el hud: quién, qué, cuánto
 * llevás, para cuándo y qué da. No dice hasta cuándo sembrar: eso se cuenta con la ficha.
 */
import * as M from '../../dominio';
import type { Estado } from '../../dominio';
import { premioCompost, premioGoteo, premioSobres } from '../../dominio/textos/pedidos';
import { cap } from '../../dominio/util';

export interface PedidoALaVista {
  id: string;
  quien: string;
  para: string;
  especie: string;
  slug: string;
  porciones: number;
  llevas: number;
  /** la fecha, como "fines de diciembre" */
  fecha: string;
  /** décadas que faltan para la fecha; 0 es esta */
  faltan: number;
  premio: string;
}

export interface Pedidos {
  abiertos: PedidoALaVista[];
  cumplidos: number;
}

function premio(p: M.Pedido): string {
  const pr = p.premio;
  if (pr.tipo === 'sobres') return premioSobres(Object.keys(pr.sobres).map((s) => M.nombreDe(M.ESPECIES[s])));
  return pr.tipo === 'compost' ? premioCompost(pr.dosis) : premioGoteo();
}

export function pedidos(E: Estado): Pedidos {
  const abiertos = E.progreso.pedidos.abiertos.flatMap((pd) => {
    const p = M.pedidoPorId(pd.id);
    if (!p) return [];
    return [
      {
        id: p.id,
        quien: cap(p.quien),
        para: p.para,
        especie: M.nombreDe(M.ESPECIES[p.especie]),
        slug: p.especie,
        porciones: p.porciones,
        llevas: Math.max(0, M.llevas(E, pd, p)),
        fecha: M.fechaDe(M.decadaDelTurno(E, pd.vence)),
        faltan: pd.vence - E.tiempo.turno,
        premio: premio(p),
      },
    ];
  });
  abiertos.sort((a, b) => a.faltan - b.faltan);
  return { abiertos, cumplidos: E.progreso.pedidos.cumplidos };
}
