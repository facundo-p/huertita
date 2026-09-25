/** Piezas del almanaque: la ventana de época, el método de siembra, la franja de 36 décadas. */
import { usarPartida } from '../estado';
import * as M from '../../dominio';
import type { Ventana } from '../../dominio';

const VENTANA: Record<Ventana, string> = { ideal: 'época ideal', posible: 'época posible', fuera: 'fuera de época' };
export const Epoca = ({ v }: { v: Ventana }) => <span class={'hz-vent v-' + v}>{VENTANA[v]}</span>;

const METODO: Record<string, string> = {
  directa: 'siembra directa',
  almacigo: 'almácigo',
  almacigo_protegido: 'almácigo protegido',
  'directa|almacigo': 'directa o almácigo',
};
/** Cómo conviene sembrarla este mes, en palabras; null si no es mes de siembra. */
export const metodoEnPalabras = (metodo: string | null): string | null => (metodo ? (METODO[metodo] ?? metodo) : null);

const tiene = (lista: number[] | undefined, d: number): boolean => (lista ?? []).includes(d);

function claseDe(
  ideal: number[] | undefined,
  posible: number[] | undefined,
  x: number,
  si: string,
  sp: string,
): string {
  if (tiene(ideal, x)) return si;
  return tiene(posible, x) ? sp : '';
}

/** Las 36 décadas del año: arriba la siembra, abajo el trasplante, marcada la de hoy. */
export function Franja({ slug, hoy, grande }: { slug: string; hoy: number; grande?: boolean }) {
  const d = M.regionDe(usarPartida()).calendario[slug] ?? {};
  const decadas = Array.from({ length: 36 }, (_, i) => i + 1);
  const siembra = (x: number) => claseDe(d.siembra_ideal, d.siembra_posible, x, 'si', 'sp');
  const trasplante = (x: number) => claseDe(d.trasplante_ideal, d.trasplante_posible, x, 'ti', 'tp');
  return (
    <span class={'hz-franja' + (grande ? ' grande' : '')}>
      {decadas.map((x) => (
        <span key={x} class={(x === hoy ? 'hoy' : '') + (x % 3 === 1 ? ' m' : '')}>
          <b class={siembra(x)} />
          <b class={trasplante(x)} />
        </span>
      ))}
    </span>
  );
}
export const Meses = () => (
  <span class="hz-meses">
    {'EFMAMJJASOND'.split('').map((l, i) => (
      <small key={i}>{l}</small>
    ))}
  </span>
);
export const Leyenda = () => (
  <p class="hz-leyenda">
    <span>
      <b class="si" />
      siembra ideal
    </span>
    <span>
      <b class="sp" />
      siembra posible
    </span>
    <span>
      <b class="ti" />
      trasplante ideal
    </span>
    <span>
      <b class="tp" />
      trasplante posible
    </span>
    <span>
      <b class="hoy" />
      hoy
    </span>
  </p>
);
