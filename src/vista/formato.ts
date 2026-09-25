/** Formatos chicos que usa la vista. */
export { nombreCorto as corto } from '../aplicacion/consultas';
export { cap, numero } from '../dominio/util';

const dos = (n: number): string => (n < 10 ? '0' : '') + n;
/** "18/09 14:05" */
export function cuando(t: number | undefined): string {
  if (!t) return '';
  const d = new Date(t);
  return dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + ' ' + dos(d.getHours()) + ':' + dos(d.getMinutes());
}
