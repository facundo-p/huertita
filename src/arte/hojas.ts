/**
 * Hojas con forma: un polígono con el perfil de la hoja (lanza, oval, ancha, redonda), base en un punto y
 * apuntando a un ángulo, pintado con volumen (`Pincel.volumen`). Y la nervadura: una central de un píxel
 * y laterales finas. Las formas de planta arman las hojas con esto.
 */
import type { Rampa } from './paleta';
import type { Color, Pincel } from './pincel';

/** Cómo se achica la hoja de la base a la punta: `p` redondea la base, `filo` afila la punta. */
export interface PerfilDeHoja {
  p: number;
  filo: number;
  /** cuántos festones lleva el borde (hojas rizadas), 0 = liso */
  festones?: number;
}

export const PERFIL: Record<'lanza' | 'oval' | 'ancha' | 'redonda' | 'fina', PerfilDeHoja> = {
  lanza: { p: 0.72, filo: 0.9 },
  oval: { p: 0.8, filo: 1 },
  ancha: { p: 0.9, filo: 0.55, festones: 6 },
  redonda: { p: 1, filo: 0.6 },
  fina: { p: 0.6, filo: 0.8 },
};

const aRad = (grados: number): number => (grados * Math.PI) / 180;

/** Los puntos del contorno de una hoja de `largo` y `ancho`, con la base en (bx, by) y la punta hacia `ang` grados. */
export function contornoDeHoja(
  bx: number,
  by: number,
  largo: number,
  ancho: number,
  ang: number,
  perfil: PerfilDeHoja,
  n = 18,
): [number, number][] {
  const ca = Math.cos(aRad(ang)),
    sa = Math.sin(aRad(ang)),
    arriba: [number, number][] = [],
    abajo: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n,
      w = (ancho / 2) * Math.sin(Math.PI * u ** perfil.p) ** perfil.filo,
      x = u * largo;
    arriba.push([bx + x * ca - w * sa, by + x * sa + w * ca]);
    abajo.push([bx + x * ca + w * sa, by + x * sa - w * ca]);
  }
  return [...arriba, ...abajo.reverse()];
}

/** Una hoja con volumen. `variar` (0..1) agranda un poco los festones, para que no salgan todos iguales. */
export function hojaV(
  B: Pincel,
  bx: number,
  by: number,
  largo: number,
  ancho: number,
  ang: number,
  rampa: Rampa,
  perfil: PerfilDeHoja = PERFIL.oval,
  variar = 0,
): void {
  const m = B.mascara().poligono(contornoDeHoja(bx, by, largo, ancho, ang, perfil));
  if (perfil.festones) {
    const ca = Math.cos(aRad(ang)),
      sa = Math.sin(aRad(ang));
    for (let k = 0; k < perfil.festones; k++) {
      const u = 0.5 + (0.46 * k) / Math.max(1, perfil.festones - 1),
        w = (ancho / 2) * Math.sin(Math.PI * u ** perfil.p) ** perfil.filo;
      for (const lado of [1, -1]) {
        const x = u * largo,
          y = lado * w * 0.96,
          r = Math.max(0.35, ancho * (0.12 + variar * ((k * 7 + 3) % 5) * 0.012));
        m.elipse(bx + x * ca - y * sa, by + x * sa + y * ca, r, r);
      }
    }
  }
  B.volumen(m, rampa);
}

/** Nervadura central y `laterales` pares de venas finas, de un píxel. */
export function nervadura(
  B: Pincel,
  bx: number,
  by: number,
  largo: number,
  ang: number,
  c: Color,
  laterales = 0,
): void {
  B.linea(bx, by, bx + Math.cos(aRad(ang)) * largo, by + Math.sin(aRad(ang)) * largo, c, 0.25);
  for (let k = 1; k <= laterales; k++) {
    const u = k / (laterales + 1),
      cx = bx + Math.cos(aRad(ang)) * largo * u,
      cy = by + Math.sin(aRad(ang)) * largo * u;
    for (const lado of [1, -1]) {
      const la = aRad(ang + lado * 48);
      B.linea(cx, cy, cx + Math.cos(la) * largo * 0.22, cy + Math.sin(la) * largo * 0.22, c, 0.25);
    }
  }
}
