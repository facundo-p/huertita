/**
 * Los eventos sorpresa, como filas: cuándo pueden pasar, a quién y qué hacen.
 *
 * Un evento nuevo de una clase que ya existe es una fila acá y sus frases en
 * `src/dominio/textos/sorpresas.ts` (un test exige las dos cosas). Una clase de efecto nueva se
 * programa una sola vez en `src/dominio/sorpresas.ts`.
 *
 * Reglas del juego (#6): todo evento tiene una respuesta que es una práctica real, y los malos
 * (`amenaza`) se anuncian una década antes, con tiempo para prevenirlos; los buenos (`regalo`) llegan
 * sin aviso. A quién le pega cada uno sale de huertapp ([REPO]: qué especies piden tutorado, qué
 * familia come la oruga, qué está en fecha de siembra). Que pasen, cuándo y cuánto es [SUPUESTO]:
 * todas las filas esperan la revisión de Facu.
 */

/** Lo que hace un evento. Cada `tipo` lo sabe aplicar el dominio; los números son de la fila. */
export type EfectoDeSorpresa =
  /** sobres de semillas de especies que están en fecha ideal de siembra */
  | { tipo: 'sobres'; especies: number; porEspecie: number }
  /** secos para la bolsa, en carga */
  | { tipo: 'secos'; carga: number }
  /** adelanta las tandas de compost en marcha, en décadas de avance */
  | { tipo: 'lombrices'; avance: number }
  /** lastima lo que está a cielo abierto: lo frena un techo, la manta o el microtúnel */
  | { tipo: 'granizo'; danio: number }
  /** voltea lo que pide tutor y no lo tiene */
  | { tipo: 'viento'; danio: number }
  /** pone una plaga en una familia: lo frenan la manta o el microtúnel encima, y los aliados cerca */
  | { tipo: 'plaga'; plaga: 'oruga' | 'pulgon' | 'babosa'; familia: string; prob: number };

export interface Sorpresa {
  id: string;
  clase: 'regalo' | 'amenaza';
  /** tramos [desde, hasta] de décadas estacionales (1 = principios de enero en el sur) en que puede pasar */
  cuando: [number, number][];
  /** cuánto más probable que las otras que pueden pasar esa década */
  peso: number;
  /** solo en estas regiones (`datos/juego/regiones`); si falta, en todas */
  regiones?: string[];
  efecto: EfectoDeSorpresa;
}

export const SORPRESAS: Sorpresa[] = [
  // ── regalos ──
  {
    // [SUPUESTO] la huerta comunitaria o el INTA reparten semillas de estación en marzo y septiembre
    id: 'kit-de-semillas',
    clase: 'regalo',
    cuando: [
      [7, 8],
      [25, 26],
    ],
    peso: 2,
    efecto: { tipo: 'sobres', especies: 3, porEspecie: 4 },
  },
  {
    // [SUPUESTO] en otoño los vecinos barren las hojas de la vereda y las embolsan
    id: 'bolsas-de-hojas',
    clase: 'regalo',
    cuando: [[13, 18]],
    peso: 2,
    efecto: { tipo: 'secos', carga: 4 },
  },
  {
    // [SUPUESTO] lombrices rojas para la compostera: comen restos y la tanda madura antes
    id: 'lombrices',
    clase: 'regalo',
    cuando: [[26, 33]],
    peso: 1,
    efecto: { tipo: 'lombrices', avance: 3 },
  },

  // ── amenazas ──
  {
    // [SUPUESTO] el granizo en el GBA cae sobre todo con las tormentas de primavera y verano
    id: 'granizo',
    clase: 'amenaza',
    cuando: [
      [28, 36],
      [1, 6],
    ],
    peso: 1,
    efecto: { tipo: 'granizo', danio: 30 },
  },
  {
    // [SUPUESTO] la sudestada es del Río de la Plata: viento fuerte del sudeste, de otoño a primavera
    id: 'sudestada',
    clase: 'amenaza',
    cuando: [[10, 30]],
    peso: 1,
    regiones: ['gba'],
    efecto: { tipo: 'viento', danio: 35 },
  },
  {
    // [REPO] la oruga de la mariposa blanca ataca brasicáceas (ver REGLAS.plagas.oruga); [SUPUESTO] la tanda
    id: 'mariposa-blanca',
    clase: 'amenaza',
    cuando: [[31, 14]],
    peso: 1,
    efecto: { tipo: 'plaga', plaga: 'oruga', familia: 'brasicacea', prob: 0.8 },
  },
];
