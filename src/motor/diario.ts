/**
 * El diario de cada planta: qué le fue pasando y por qué tiene la salud que tiene.
 * Vive en la planta (`pl.hist`), no en el cuaderno: el cuaderno junta avisos repetidos y se recorta,
 * y acá hace falta la historia completa de UNA planta, incluso lo que no amerita un aviso general.
 * Un plantín repicado se lleva la historia del grupo del que salió.
 */
import type { Estado, Planta, TipoEvento } from './tipos';

const MAXIMO = 16;

/** Anota algo en el diario de la planta, en la entrada de esta década (la crea si hace falta). */
export function apuntar(E: Pick<Estado, 'dec' | 'turno'>, pl: Planta, tipo: TipoEvento, texto: string): void {
  const hist = pl.hist || (pl.hist = []);
  let r = hist[hist.length - 1];
  if (!r || r.turno !== E.turno) { r = { dec: E.dec, turno: E.turno, s: Math.round(pl.salud), n: [] }; hist.push(r); if (hist.length > MAXIMO) hist.shift(); }
  if (!r.n.some((x) => x[1] === texto)) r.n.push([tipo, texto]);
  r.s = Math.round(pl.salud);
}
/** Cierra la década de una planta: deja asentada la salud aunque no haya pasado nada digno de nota. */
export function cerrar(E: Pick<Estado, 'dec' | 'turno'>, pl: Planta, saludAntes: number): void {
  const r = pl.hist && pl.hist[pl.hist.length - 1];
  if (r && r.turno === E.turno) r.s = Math.round(pl.salud);
  else if (Math.round(pl.salud) !== Math.round(saludAntes)) apuntar(E, pl, pl.salud > saludAntes ? 'bien' : 'mal', pl.salud > saludAntes ? 'Recuperó salud.' : 'Perdió salud.');
}
