/**
 * Lo que dice el juego del compost y de lo que da el patio para hacerlo: verdes, secos, tandas, pasto,
 * hojas y poda. [REPO] compostaje.json: la receta de secos y verdes y sus señales.
 */
import type { Mezcla } from '../tipos';
import { numero as n } from '../util';
import { frase, type Frase } from './frase';

export function tandaCerrada(mezcla: Mezcla, secosPorVerde: number): Frase {
  const receta = n(secosPorVerde) + ' de secos por cada verde';
  if (mezcla === 'humeda')
    return frase(
      'compost.tanda-humeda',
      'Cerraste una tanda de compost con ' +
        receta +
        ': le faltan secos, se va a pudrir, oler y tardar el doble. Cada balde de restos se tapa con uno o dos de ' +
        'secos (hojas, pasto seco, cartón): guardá bolsas de hojas en otoño. Si revolvés la tanda con secos de la ' +
        'bolsa, se endereza.',
    );
  if (mezcla === 'seca')
    return frase(
      'compost.tanda-seca',
      'Cerraste una tanda de compost con ' +
        receta +
        ': tiene tanto seco que no pasa nada y va a tardar. Con más verdes (restos de cocina, pasto recién cortado) arranca.',
    );
  return frase(
    'compost.tanda',
    'Cerraste una tanda de compost con ' + receta + ', bien tapada. En unos 4 meses va a estar madura.',
  );
}
export const tandaMadura = (dosis: number): Frase =>
  frase('compost.madura', 'Una tanda de compost maduró: huele a tierra de monte. +' + dosis + ' dosis.');
export const seAcabaronLosSecos = (): Frase =>
  frase(
    'compost.sin-secos',
    'Se acabaron los secos de la bolsa: los restos de cocina quedan sin tapar y la tanda se va a humedecer. Juntá hojas, podá o cortá el pasto y dejalo secar.',
  );

// ── acciones ──
export const cortaste = (carga: number, destino: 'compost' | 'secar'): Frase =>
  destino === 'compost'
    ? frase(
        'jardin.pasto-verde',
        'Cortaste el pasto: ' + n(carga) + ' de verdes a la compostera. El pasto recién cortado es verde: pide secos.',
      )
    : frase(
        'jardin.pasto-seco',
        'Cortaste el pasto y lo dejaste secar al sol: ' +
          n(carga) +
          ' de secos a la bolsa. Seco se achica, pero tapa los restos.',
      );
export const juntaste = (carga: number): Frase =>
  frase(
    'jardin.hojas',
    'Juntaste las hojas caídas: ' +
      n(carga) +
      ' de secos a la bolsa. Guardadas secas no se pierden: tapan el compost y sirven de mulch cuando ya no caen más.',
  );
export const podaste = (carga: number): Frase =>
  frase('jardin.poda', 'Podaste en reposo, sin hojas: ' + n(carga) + ' de ramitas picadas a la bolsa de secos.');
export const revolviste = (secos: number): Frase =>
  frase(
    'compost.revolver',
    'Revolviste la tanda húmeda con ' + n(secos) + ' de secos: se aireó, dejó de oler y vuelve a su ritmo.',
  );

// ── por qué no se puede ──
export const sinPasto = (): string => 'En este patio no hay pasto.';
export const pastoCorto = (): string => 'El pasto está corto: todavía no hay nada que cortar.';
export const sinCompostera = (): string => 'No hay compostera para echarlo.';
export const sinHojas = (): string =>
  'No hay hojas caídas para juntar. Los árboles caducos las largan en otoño, cuando se les termina la temporada.';
export const sinCaducos = (): string => 'En este patio no hay árboles que se poden.';
export const conHojasNoSePoda = (): string =>
  'El árbol tiene hoja: los caducos se podan en invierno, en reposo, cuando ya se les cayeron.';
export const yaPodaste = (): string => 'Ya podaste este invierno. La próxima poda, el invierno que viene.';
export const todaviaCaen = (): string => 'Todavía se le están cayendo las hojas: se poda cuando termina, ya en reposo.';
export const nadaQueRevolver = (): string => 'No hay ninguna tanda húmeda: las tandas van bien.';
export const faltanSecos = (hacen: number): string =>
  'Para enderezar una tanda húmeda hacen falta ' + n(hacen) + ' de secos en la bolsa.';
export const sinSecosParaMulch = (): string =>
  'No te quedan secos en la bolsa para cubrir el suelo: juntá hojas, podá o cortá el pasto y dejalo secar.';
