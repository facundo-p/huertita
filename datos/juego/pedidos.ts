/**
 * Los pedidos de los vecinos, como filas: quién pide qué, cuánto, para cuándo y qué da a cambio.
 *
 * Un pedido llega con una fecha (`plazo` décadas después de llegar) y se cumple cosechando lo pedido
 * antes de esa fecha. No dice cuándo sembrar: eso se cuenta para atrás con la ficha de la especie en
 * la mano, que es planificar una huerta (#8). Si no se llega, el cuaderno dice hasta cuándo había que
 * sembrar: con los días a cosecha de huertapp y lo que tarda de más fuera de su temperatura.
 *
 * Un pedido nuevo es una fila acá; sus frases son las mismas para todos (`src/dominio/textos/pedidos.ts`).
 * Qué especie y cuánto tarda es [REPO] (catálogo); quién, cuánto, cuándo llega, el plazo y el premio
 * son [SUPUESTO]: todas las filas esperan la revisión de Facu. Un test exige que cada fila se pueda
 * cumplir: que entre que llega y la fecha haya una década ideal de siembra desde la que, en un año
 * normal, se llegue a cosechar (`decadasHastaCosecha`), con margen para juntar las porciones. En un
 * patio donde no se llega (el tomate en el balcón, por la sombra), ese pedido no llega.
 */

/** Lo que da el vecino cuando le llevás lo que pidió. */
export type PremioDePedido =
  /** sobres de semillas que no vienen en el arranque */
  | { tipo: 'sobres'; sobres: Record<string, number> }
  /** dosis de compost maduro para la compostera */
  | { tipo: 'compost'; dosis: number }
  /** un kit de riego por goteo: regar cada zona lleva un rato menos (`REGLAS.ratos.ahorroGoteo`) */
  | { tipo: 'goteo' };

export interface Pedido {
  id: string;
  /** quién lo pide, como se nombra en una frase: "Rosa, la vecina de al lado" */
  quien: string;
  /** para qué, empezando con "para": "para la ensalada de las fiestas" */
  para: string;
  /** la especie, por su slug del catálogo */
  especie: string;
  /** porciones cosechadas desde que llega el pedido */
  porciones: number;
  /** tramos [desde, hasta] de décadas estacionales en que puede llegar */
  cuando: [number, number][];
  /** décadas desde que llega hasta la fecha */
  plazo: number;
  premio: PremioDePedido;
}

export const PEDIDOS: Pedido[] = [
  {
    // [SUPUESTO] las escuelas del barrio hacen huerta en otoño y en primavera
    id: 'rabanitos-de-la-escuela',
    quien: 'la maestra de la escuela del barrio',
    para: 'para que los chicos prueben algo que se siembra y se come en un mes',
    especie: 'rabanito',
    porciones: 6,
    cuando: [
      [4, 8],
      [25, 30],
    ],
    plazo: 8,
    premio: { tipo: 'compost', dosis: 2 },
  },
  {
    // [SUPUESTO]
    id: 'ensalada-de-rosa',
    quien: 'Rosa, la vecina de al lado',
    para: 'para las ensaladas de enero',
    especie: 'lechuga',
    porciones: 4,
    cuando: [[22, 24]],
    plazo: 16,
    premio: { tipo: 'sobres', sobres: { radicchio: 3, eneldo: 3 } },
  },
  {
    // [SUPUESTO]
    id: 'albahaca-de-la-pizzeria',
    quien: 'Tito, el de la pizzería de la esquina',
    para: 'para las pizzas del verano',
    especie: 'albahaca',
    porciones: 3,
    cuando: [[22, 25]],
    plazo: 20,
    premio: { tipo: 'goteo' },
  },
  {
    // [SUPUESTO] los comedores del barrio cocinan tartas de verdura en invierno
    id: 'acelga-del-comedor',
    quien: 'el comedor del barrio',
    para: 'para las tartas del invierno',
    especie: 'acelga',
    porciones: 6,
    cuando: [[7, 10]],
    plazo: 17,
    premio: { tipo: 'compost', dosis: 3 },
  },
  {
    // [SUPUESTO] la salsa se hace con el tomate de fin de verano
    id: 'salsa-de-ines',
    quien: 'doña Inés, la de enfrente',
    para: 'para hacer la salsa del año',
    especie: 'tomate',
    porciones: 6,
    cuando: [[22, 26]],
    plazo: 18,
    premio: { tipo: 'sobres', sobres: { melon: 3, sandia: 2 } },
  },
  {
    // [SUPUESTO] el puesto de la huerta comunitaria en la feria (la semilla de #13)
    id: 'verdeo-de-la-feria',
    quien: 'la huerta comunitaria',
    para: 'para el puesto de la feria del sábado',
    especie: 'cebolla-de-verdeo',
    porciones: 4,
    cuando: [[5, 8]],
    plazo: 18,
    premio: { tipo: 'sobres', sobres: { ciboulette: 2, oregano: 1, tomillo: 1 } },
  },
];
