/**
 * Las horas de sol de todas las celdas, para la escena y la capa de sol. Con sol por geometría y
 * plantas altas, cada celda cuesta ~100 posiciones del sol por obstáculo: se calcula una vez por
 * patio, década y conjunto de plantas altas, y se reutiliza hasta que algo de eso cambie.
 */
import * as M from '../../dominio';
import type { CeldaId, Estado } from '../../dominio';

let memo: { clave: string; horas: Record<CeldaId, number> } | null = null;

/** Qué hace sombra hoy, además del patio: las plantas que levantan (vacío con el espacio real apagado). */
function claveDeSombra(E: Estado): string {
  const altas = Object.values(E.plantas)
    .map((pl) => ({ id: pl.id, celdas: M.celdasDePlanta(pl), alto: Math.round(M.altoDe(pl) * 100) }))
    .filter((p) => p.alto >= 40);
  return E.patio + '|' + E.dec + '|' + (M.espacioReal() ? JSON.stringify(altas) : '');
}

export function horasDeSol(E: Estado): Record<CeldaId, number> {
  const clave = claveDeSombra(E);
  if (memo && memo.clave === clave) return memo.horas;
  const horas: Record<CeldaId, number> = {};
  for (const k of Object.keys(E.celdas)) horas[k] = M.horasSol(E, k);
  memo = { clave, horas };
  return horas;
}
