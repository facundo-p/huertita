/**
 * El patio como dato.
 *
 * Un patio es un plano de celdas (el NORTE ESTÁ ARRIBA), las zonas de cultivo que hay en él y los
 * obstáculos que le hacen sombra. Todo es JSON: un patio nuevo es un archivo, y el día que haya
 * editor, lo que el editor guarde es esto mismo.
 *
 * Nada de acá viene de huertapp: es contenido propio del juego, y todos sus números son [SUPUESTO].
 */
import type { CategoriaSuelo } from '../contrato';

/** Cómo se comporta y cómo se dibuja una zona. El id es libre; el tipo no. */
export type TipoZona = 'suelo' | 'cajon' | 'macetas' | 'almaciguera';

export interface ZonaDePatio {
  /** identificador estable: queda escrito en las partidas guardadas */
  id: string;
  /** carácter que la marca en el plano */
  letra: string;
  tipo: TipoZona;
  nombre: string;
  /** para armar frases: "el bancal elevado", "las macetas" */
  conArticulo: string;
  desc: string;
  suelo: CategoriaSuelo;
  /** materia orgánica con la que arranca, 0..100 */
  mo: number;
  /** cuánto más rápido que la tierra pierde agua, 0..1 */
  drenaje: number;
  /** cm de tierra útil */
  hondo: number;
  /** ratos que cuesta cada régimen de riego: nada, espaciado, parejo, constante */
  riegoCosto: [number, number, number, number];
  /** solo para criar plantines: siembra densa, no se cosecha ni recibe trasplantes */
  cria?: boolean;
  /** solo en zonas de cría: cuántos plantines entran en cada bandeja (una celda del plano es una bandeja) */
  capacidad?: number;
  /** no le llega la lluvia */
  techo?: boolean;
  /** reparo fijo contra heladas, en grados que le suma a la mínima */
  abrigo?: { grados: number; nombre: string };
  /** grados que suma a la temperatura media (pared que irradia, rincón reparado) */
  calor?: number;
  /** se le puede armar un microtúnel */
  admiteTunel?: boolean;
  /** si las celdas son recipientes sueltos: tamaño de cada uno, por celda "x,y" */
  macetas?: Record<string, { litros: number; prof: number }>;
}

/** Coordenadas en celdas, con decimales. La celda (x,y) ocupa de x a x+1 y de y a y+1; y crece hacia el sur. Alturas en metros. */
export type Obstaculo =
  | {
      tipo: 'muro';
      nombre: string;
      desde: [number, number];
      hasta: [number, number];
      alto: number;
      /** 1 = ciego; una baranda de barrotes, 0.4 */ opacidad?: number;
    }
  | {
      tipo: 'arbol';
      nombre: string;
      en: [number, number];
      alto: number;
      /** radio de la copa, en celdas */ copa: number;
      /** altura donde empieza la copa */ fuste: number;
      caduco: boolean;
    }
  | { tipo: 'losa'; nombre: string; desde: [number, number]; hasta: [number, number]; alto: number };

export interface Patio {
  id: string;
  nombre: string;
  desc: string;
  /** lo que dice el cuaderno al arrancar una partida en este patio */
  bienvenida: string;
  /** metros de lado de una celda */
  celdaM: number;
  /** filas de norte a sur. Letras de zona, y además: P pared, H casa, T árbol, C compostera, '.' pasto, ':' sendero o baldosa */
  plano: string[];
  zonas: ZonaDePatio[];
  obstaculos: Obstaculo[];
  /** grados sobre el horizonte a partir de los que el sol cuenta: las casas de alrededor tapan el sol bajo */
  horizonte: number;
  /**
   * 'geometria': las horas de sol salen de los obstáculos, la latitud y la fecha.
   * 'v04': la fórmula a mano del prototipo. Solo la usa el patio original, para que el test dorado
   * siga protegiendo los refactors. Se va cuando se jubile el test dorado (paso 4 de los cimientos).
   */
  sol: 'geometria' | 'v04';
  /** puntos del balance de fin de año que dan una, dos y tres estrellas: un patio chico no compite con uno grande */
  estrellas: [number, number, number];
  /** solo para dibujar: el piso que no es cantero y lo que cierra el lado norte */
  aspecto: { piso: 'pasto' | 'baldosa'; norte: 'paredon' | 'baranda' };
}

const RESERVADAS = 'PHTC.:';

/** Errores de armado de un patio. Lista vacía = patio válido. Lo corren los tests sobre todos los patios. */
export function validarPatio(p: Patio): string[] {
  const e: string[] = [];
  const ancho = p.plano[0]?.length ?? 0;
  if (!ancho || p.plano.length < 3) e.push('el plano está vacío o es muy chico');
  p.plano.forEach((f, y) => {
    if (f.length !== ancho) e.push(`la fila ${y} del plano mide ${f.length} y la primera mide ${ancho}`);
  });
  if (!(p.celdaM > 0.2 && p.celdaM <= 2)) e.push('celdaM fuera de rango');
  if (!(p.horizonte >= 0 && p.horizonte < 40)) e.push('horizonte fuera de rango');
  const ids = new Set<string>(),
    letras = new Set<string>();
  for (const z of p.zonas) {
    if (ids.has(z.id)) e.push(`zona repetida: ${z.id}`);
    ids.add(z.id);
    if (z.letra.length !== 1 || RESERVADAS.includes(z.letra))
      e.push(`${z.id}: la letra "${z.letra}" no sirve (reservadas: ${RESERVADAS})`);
    if (letras.has(z.letra)) e.push(`letra repetida: ${z.letra}`);
    letras.add(z.letra);
    const celdas: string[] = [];
    p.plano.forEach((f, y) =>
      [...f].forEach((ch, x) => {
        if (ch === z.letra) celdas.push(x + ',' + y);
      }),
    );
    if (!celdas.length) e.push(`${z.id}: no tiene ninguna celda en el plano`);
    if (z.mo < 5 || z.mo > 100) e.push(`${z.id}: mo fuera de 5..100`);
    if (
      z.riegoCosto.length !== 4 ||
      z.riegoCosto[0] !== 0 ||
      z.riegoCosto.some((c, i) => i > 0 && c < z.riegoCosto[i - 1])
    )
      e.push(`${z.id}: riegoCosto tiene que arrancar en 0 y no bajar`);
    if (z.tipo === 'macetas') {
      for (const c of celdas) if (!z.macetas?.[c]) e.push(`${z.id}: a la maceta ${c} le falta tamaño`);
    }
    for (const c in z.macetas ?? {})
      if (!celdas.includes(c)) e.push(`${z.id}: hay tamaño para ${c}, que no es una celda de la zona`);
    if (z.cria && z.admiteTunel) e.push(`${z.id}: una zona de cría no lleva microtúnel`);
    if (z.capacidad != null && !z.cria) e.push(`${z.id}: capacidad es solo de las zonas de cría`);
    if (z.capacidad != null && !(z.capacidad >= 1 && z.capacidad <= 200)) e.push(`${z.id}: capacidad fuera de 1..200`);
  }
  p.plano.forEach((f, y) =>
    [...f].forEach((ch, x) => {
      if (!RESERVADAS.includes(ch) && !letras.has(ch))
        e.push(`el plano usa "${ch}" en ${x},${y} y ninguna zona tiene esa letra`);
    }),
  );
  if (!p.zonas.some((z) => z.cria)) e.push('no hay ninguna zona de cría (almaciguera)');
  if (!p.zonas.some((z) => !z.cria)) e.push('no hay ninguna zona de cultivo');
  if (!(p.estrellas[0] > 0 && p.estrellas[0] < p.estrellas[1] && p.estrellas[1] < p.estrellas[2]))
    e.push('estrellas tiene que ser creciente');
  for (const o of p.obstaculos) if (!(o.alto > 0)) e.push(`${o.nombre}: alto inválido`);
  return e;
}
