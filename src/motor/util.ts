export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
export const r1 = (v: number): number => Math.round(v * 10) / 10;
export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** normal acumulada */
export function phi(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}
