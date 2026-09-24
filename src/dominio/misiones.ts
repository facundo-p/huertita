/** Logros. Hoy son código; el paso 5 de los cimientos los pasa a una tabla junto con eventos y pedidos. */
import { ESPECIES } from './catalogo';
import { anotar } from './estado';
import type { Estado, Evento } from './tipos';
import { nombreDe } from './planta';

export interface Mision {
  id: string;
  titulo: string;
  texto: string;
  premio: Record<string, number>;
}
export const MISIONES: Mision[] = [
  {
    id: 'germina',
    titulo: 'Que algo nazca',
    texto: 'Lográ que germine tu primera semilla.',
    premio: { copete: 4, chaucha: 6 },
  },
  {
    id: 'cosecha1',
    titulo: 'Primera cosecha',
    texto: 'Cosechá cualquier cosa. El rabanito es el más rápido: 25 días.',
    premio: { 'zapallito-de-tronco': 3, pepino: 3, borraja: 3 },
  },
  {
    id: 'plantin',
    titulo: 'Del almácigo al bancal',
    texto: 'Trasplantá un plantín listo a su lugar definitivo.',
    premio: { pimiento: 3, berenjena: 3, brocoli: 4 },
  },
  {
    id: 'socios',
    titulo: 'Buenos vecinos',
    texto: 'Tené dos plantas que se asocien bien, una al lado de la otra.',
    premio: { remolacha: 6, espinaca: 6, kale: 4 },
  },
  {
    id: 'ensalada',
    titulo: 'Ensalada del patio',
    texto: 'Cosechá lechuga, tomate y albahaca en la misma partida.',
    premio: { 'aji-picante': 3, choclo: 6, zapallo: 2 },
  },
  {
    id: 'semillas',
    titulo: 'Semilla propia',
    texto: 'Dejá semillar una planta y guardá tus sobres.',
    premio: { ajo: 6, puerro: 4, romero: 1, menta: 1, lavanda: 1 },
  },
  {
    id: 'cinco',
    titulo: 'Diversidad',
    texto: 'Cosechá 5 especies distintas.',
    premio: { frutilla: 4, girasol: 3, capuchina: 3, cilantro: 4 },
  },
  {
    id: 'invierno',
    titulo: 'Huerta de invierno',
    texto: 'Cosechá algo entre junio y agosto.',
    premio: { repollo: 4, coliflor: 4, cebolla: 6, papa: 4 },
  },
];
export function cumplir(E: Estado, id: string, evs: Evento[]): void {
  if (id in E.misiones) return;
  const m = MISIONES.find((x) => x.id === id);
  if (!m) return;
  E.misiones[id] = E.turno;
  for (const s in m.premio) E.sobres[s] = (E.sobres[s] || 0) + m.premio[s];
  evs.push(
    anotar(
      E,
      'logro',
      'Logro: ' +
        m.titulo +
        '. Una vecina te pasa sobres de ' +
        Object.keys(m.premio)
          .map((s) => nombreDe(ESPECIES[s]))
          .join(', ') +
        '.',
    ),
  );
}
