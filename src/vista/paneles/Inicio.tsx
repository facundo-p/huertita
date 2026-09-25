/** Cómo se juega: el patio, el carácter del año y los cuatro pasos. */
import * as M from '../../dominio';
import { usarPartida } from '../estado';

export function Inicio() {
  const E = usarPartida(),
    R = M.regionDe(E),
    car = R.caracteres[E.tiempo.caracter];
  return (
    <>
      <h2>Tu patio en {R.textos.elLugar}</h2>
      <p>
        El norte está arriba: el paredón le hace sombra al bancal del fondo, y en invierno mucho más. El paraíso de la
        derecha da sombra solo cuando tiene hojas. Contra la casa, la almaciguera está reparada de las heladas.
      </p>
      <p>
        <b>{car.nombre}.</b> {car.texto}
      </p>
      <ol class="hz-pasos">
        <li>
          Elegí un sobre en <b>Sembrar</b>: el patio se pinta de verde, amarillo o rojo según cómo le iría ahí.
        </li>
        <li>Cada década tenés {M.RATOS} ratos. Regar también los gasta.</li>
        <li>
          Mirá el pronóstico, protegé si hiela y tocá <b>Pasar 10 días</b>.
        </li>
        <li>El cuaderno te explica todo lo que pasó y por qué.</li>
      </ol>
    </>
  );
}
