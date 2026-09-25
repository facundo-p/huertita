/**
 * Lo que dicen los eventos sorpresa (`datos/juego/sorpresas.ts`). Cada fila de la tabla tiene acá
 * sus frases, con el mismo id: un test lo exige. Una amenaza se anuncia diciendo qué la frena, y
 * cuando pasa dice a quién le pegó y qué lo habría evitado; si no le pegó a nadie, dice por qué.
 */
import { numero as n } from '../util';
import { frase, type Frase } from './frase';

/** "tomate", "tomate y arveja", "tomate, arveja y haba" */
function lista(xs: string[]): string {
  if (xs.length < 2) return xs.join('');
  return xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
}
const plantas = (k: number): string => k + (k === 1 ? ' planta' : ' plantas');

/**
 * Cómo terminó una amenaza: a cuántas les pegó (y de qué especies), cuántas estaban expuestas y
 * cuántas protegidas. Una plaga puede no prender en una expuesta: `expuestas` puede ser más que `cuantas`.
 */
export interface Golpe {
  cuantas: number;
  especies: string[];
  expuestas: number;
  protegidas: number;
}

export interface TextosDeRegalo {
  clase: 'regalo';
  /** `que`: lo que llegó, si son cosas con nombre; `cuanto`: cuánto de cada una */
  llega(que: string[], cuanto: number): Frase;
}
export interface TextosDeAmenaza {
  clase: 'amenaza';
  titulo: string;
  aviso(): Frase;
  /** en una línea, para tener a la vista mientras está anunciada */
  queHacer(): string;
  paso(g: Golpe): Frase;
  /** lo que queda en el diario de cada planta a la que le pegó */
  enLaPlanta(): Frase;
}

// ── regalos ──
export const kitDeSemillas = (especies: string[], porEspecie: number): Frase =>
  frase(
    'sorpresa.kit-de-semillas',
    'Llegó el kit de semillas de estación de la huerta comunitaria: sobres para ' +
      porEspecie +
      ' siembras de ' +
      lista(especies) +
      '. Están todas en fecha de siembra: sembrar en fecha es media huerta.',
  );
export const bolsasDeHojas = (carga: number): Frase =>
  frase(
    'sorpresa.bolsas-de-hojas',
    'Un vecino barrió las hojas de la vereda y te dejó las bolsas: +' +
      n(carga) +
      ' de secos. Guardadas, tapan el compost y hacen mulch hasta la primavera.',
  );
export const lombrices = (avance: number): Frase =>
  frase(
    'sorpresa.lombrices',
    'Una vecina te trajo un puñado de lombrices rojas para la compostera: comen los restos y las tandas en marcha ' +
      'se adelantan ' +
      avance +
      ' décadas. Lo que dejan es lombricompuesto, de lo mejor para la tierra.',
  );

// ── granizo ──
export const avisoDeGranizo = (): Frase =>
  frase(
    'sorpresa.granizo-aviso',
    'El pronóstico anuncia tormenta con granizo para la década que viene. Lo que está a cielo abierto se lastima: ' +
      'la manta o el microtúnel encima lo frenan.',
  );
export const granizoQueHacer = (): string => 'Tapá con manta o microtúnel lo que está a cielo abierto.';
export function granizo(g: Golpe): Frase {
  if (g.cuantas)
    return frase(
      'sorpresa.granizo',
      'Cayó granizo y lastimó ' +
        plantas(g.cuantas) +
        ' a cielo abierto (' +
        lista(g.especies) +
        '). Con la manta o el microtúnel encima no les habría pasado nada.' +
        (g.protegidas ? ' Las que estaban tapadas, ni se enteraron.' : ''),
    );
  if (g.protegidas)
    return frase(
      'sorpresa.granizo-evitado',
      'Cayó granizo, pero lo que estaba a cielo abierto estaba tapado: la manta y el microtúnel lo frenaron.',
    );
  return frase('sorpresa.granizo-nada', 'Cayó granizo; en el patio no había nada a cielo abierto que lastimar.');
}
export const granizoEnLaPlanta = (): Frase =>
  frase('sorpresa.granizo-planta', 'La lastimó el granizo: estaba a cielo abierto, sin manta ni microtúnel.');

// ── sudestada ──
export const avisoDeSudestada = (): Frase =>
  frase(
    'sorpresa.sudestada-aviso',
    'Se anuncia sudestada para la década que viene: viento fuerte del sudeste. Lo que pide tutor y no lo tiene ' +
      'se voltea: tutoralo antes.',
  );
export const sudestadaQueHacer = (): string => 'Poné tutor a lo que lo pide.';
export function sudestada(g: Golpe): Frase {
  if (g.cuantas)
    return frase(
      'sorpresa.sudestada',
      'La sudestada volteó ' +
        plantas(g.cuantas) +
        ' sin tutor (' +
        lista(g.especies) +
        '). Con el tutor puesto a tiempo habrían aguantado.',
    );
  if (g.protegidas)
    return frase(
      'sorpresa.sudestada-evitada',
      'Pasó la sudestada y todo lo que pedía tutor lo tenía: no se volteó nada.',
    );
  return frase('sorpresa.sudestada-nada', 'Pasó la sudestada; no había nada alto que voltear.');
}
export const sudestadaEnLaPlanta = (): Frase =>
  frase('sorpresa.sudestada-planta', 'La volteó la sudestada: pedía tutor y no lo tenía.');

// ── mariposa blanca ──
export const avisoDeMariposas = (): Frase =>
  frase(
    'sorpresa.mariposa-blanca-aviso',
    'Andan mariposas blancas sobre el patio: la década que viene ponen huevos en las brasicáceas (repollo, ' +
      'rúcula, kale, rabanito). Una manta o el microtúnel encima les cierran el paso, y las flores y aromáticas ' +
      'cerca traen quien controle las orugas.',
  );
export const mariposasQueHacer = (): string => 'Tapá las brasicáceas con manta o microtúnel.';
export function mariposas(g: Golpe): Frase {
  if (g.cuantas)
    return frase(
      'sorpresa.mariposa-blanca',
      'Las mariposas blancas pusieron huevos: orugas en ' +
        plantas(g.cuantas) +
        ' (' +
        lista(g.especies) +
        '). Tapadas con manta o microtúnel no habrían llegado. Revisá el envés de las hojas.',
    );
  if (g.expuestas)
    return frase(
      'sorpresa.mariposa-blanca-zafaron',
      'Las mariposas blancas anduvieron por el patio y esta vez no dejaron orugas en las brasicáceas sin tapar: ' +
        'las flores y aromáticas cerca traen quien las controle, pero una manta o el microtúnel es lo seguro.',
    );
  if (g.protegidas)
    return frase(
      'sorpresa.mariposa-blanca-evitada',
      'Las mariposas blancas no encontraron dónde poner: las brasicáceas estaban tapadas.',
    );
  return frase(
    'sorpresa.mariposa-blanca-nada',
    'Las mariposas blancas anduvieron por el patio, pero esta vez no dejaron orugas.',
  );
}
export const mariposasEnLaPlanta = (): Frase =>
  frase('sorpresa.mariposa-blanca-planta', 'Orugas de la mariposa blanca anunciada: estaba sin tapar.');

/** Las frases de cada fila de `datos/juego/sorpresas.ts`, por id. */
export const TEXTOS: Record<string, TextosDeRegalo | TextosDeAmenaza> = {
  'kit-de-semillas': { clase: 'regalo', llega: kitDeSemillas },
  'bolsas-de-hojas': { clase: 'regalo', llega: (_q, carga) => bolsasDeHojas(carga) },
  lombrices: { clase: 'regalo', llega: (_q, avance) => lombrices(avance) },
  granizo: {
    clase: 'amenaza',
    titulo: 'Granizo',
    aviso: avisoDeGranizo,
    queHacer: granizoQueHacer,
    paso: granizo,
    enLaPlanta: granizoEnLaPlanta,
  },
  sudestada: {
    clase: 'amenaza',
    titulo: 'Sudestada',
    aviso: avisoDeSudestada,
    queHacer: sudestadaQueHacer,
    paso: sudestada,
    enLaPlanta: sudestadaEnLaPlanta,
  },
  'mariposa-blanca': {
    clase: 'amenaza',
    titulo: 'Mariposas blancas',
    aviso: avisoDeMariposas,
    queHacer: mariposasQueHacer,
    paso: mariposas,
    enLaPlanta: mariposasEnLaPlanta,
  },
};
