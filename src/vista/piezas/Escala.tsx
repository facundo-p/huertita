/**
 * Indicador de escala: el eje va de min a max, las bandas marcan lo que pide la especie (clara =
 * tolera, fuerte = ideal) y la marca es el valor actual. El color de la marca dice qué tan bien
 * cumple; la posición dice por qué.
 */
import type { Especie } from '../../dominio';
import type { TempCrecimiento } from '../../../datos/contrato';
import { DESEO_AGUA } from '../../dominio/factores';

export type Banda = [desde: number, hasta: number, clase: 'tol' | 'ideal'];
const pct = (min: number, max: number, v: number): number =>
  Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
/** qué tan bien cumple, para el color: bien, más o menos, mal */
export const nivel = (f: number): 'ok' | 'med' | 'bad' => {
  if (f >= 0.85) return 'ok';
  return f >= 0.6 ? 'med' : 'bad';
};

interface Props {
  min: number;
  max: number;
  bandas: Banda[];
  valor: number | null;
  f: number;
  izq?: string;
  der?: string;
  /** un rango fino encima de las bandas (en temperatura: de la mínima a la máxima) */
  rango?: [number, number];
}

export function Escala({ min, max, bandas, valor, f, izq, der, rango }: Props) {
  const pc = (v: number) => pct(min, max, v);
  return (
    <>
      <span class="hz-esc">
        {bandas.map(([a, b, clase], i) => (
          <b key={i} class={clase} style={{ left: pc(a) + '%', width: Math.max(1.5, pc(b) - pc(a)) + '%' }} />
        ))}
        {rango && <u style={{ left: pc(rango[0]) + '%', width: pc(rango[1]) - pc(rango[0]) + '%' }} />}
        {valor != null && <i class={nivel(f)} style={{ left: pc(valor) + '%' }} />}
      </span>
      <span class="hz-esc-eje">
        <small>{izq ?? min}</small>
        <small>{der ?? max}</small>
      </span>
    </>
  );
}

export const EscalaDeLuz = ({ sp, horas, f }: { sp: Especie; horas: number | null; f: number }) => (
  <Escala
    min={0}
    max={12}
    bandas={[
      [sp.hmin, sp.hideal, 'tol'],
      [sp.hideal, 12, 'ideal'],
    ]}
    valor={horas}
    f={f}
    izq="0 h"
    der="12 h"
  />
);
export function EscalaDeAgua({ sp, H, f }: { sp: Especie; H: number | null; f: number }) {
  const d = DESEO_AGUA[sp.riego];
  return (
    <Escala min={0} max={4.5} bandas={[[d - 0.6, d + 0.8, 'ideal']]} valor={H} f={f} izq="seco" der="encharcado" />
  );
}
export const EscalaDeTemperatura = ({
  tc,
  t,
  f,
  rango,
}: {
  tc: TempCrecimiento<number>;
  t: number;
  f: number;
  rango?: [number, number];
}) => (
  <Escala
    min={-5}
    max={40}
    bandas={[
      [tc.tolera_min, tc.tolera_max, 'tol'],
      [tc.ideal_min, tc.ideal_max, 'ideal'],
    ]}
    valor={t}
    f={f}
    izq="−5 °C"
    der="40 °C"
    rango={rango}
  />
);

/** Una barra de 0 a 1: salud, avance, suelo. */
export function Medidor({ f, clase }: { f: number; clase?: string }) {
  const v = Math.round(Math.max(0, Math.min(1, f)) * 100);
  return (
    <span class={'hz-bar ' + (clase ?? nivel(f))}>
      <i style={{ width: Math.min(100, v) + '%' }} />
    </span>
  );
}
