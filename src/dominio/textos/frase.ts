/**
 * Lo que dice el juego. Cada frase del cuaderno, del diario y de los avisos es una función con
 * nombre que recibe lo que necesita y devuelve el texto junto con un código estable.
 *
 * El código sirve para que los tests, la interfaz y el día de mañana otras regiones o idiomas
 * reconozcan QUÉ pasó sin leer la prosa. El texto es para la persona: rioplatense, de vos, y cuando
 * algo sale mal dice por qué y qué lo habría evitado (innegociable 8).
 */
export interface Frase {
  /** qué pasó, estable: `sistema.cosa` */
  codigo: string;
  texto: string;
}
export const frase = (codigo: string, texto: string): Frase => ({ codigo, texto });
