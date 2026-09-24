/**
 * Las acciones son reglas (src/dominio/acciones): `puede` dice si se puede y por qué no, sin tocar
 * nada, y `despachar` hace exactamente lo que `puede` permite. La interfaz muestra los botones que
 * `puede` deja, así que si estas dos cosas no coinciden, la interfaz miente.
 */
import { describe, expect, it } from 'vitest';
import * as M from '../src/dominio';
import { jugarUnAnio } from '../tools/jugador';
import type { Accion, Estado } from '../src/dominio';

const copia = (E: Estado): Estado => JSON.parse(JSON.stringify(E));

/** Un surtido de acciones para probar sobre una partida: buenas, malas y absurdas. */
function candidatas(E: Estado): Accion[] {
  const out: Accion[] = [];
  const celdas = Object.keys(E.mundo.celdas),
    libres = celdas.filter((c) => !E.mundo.celdas[c].planta);
  for (const pl of Object.values(E.mundo.plantas)) {
    for (const tipo of ['cosechar', 'semillar', 'ralear', 'arrancar', 'tutorar', 'tratar'] as const)
      out.push({ tipo, planta: pl.id });
    for (const c of [...libres.slice(0, 3), celdas[0]]) out.push({ tipo: 'trasplantar', planta: pl.id, celda: c });
  }
  for (const c of celdas.filter((_, i) => i % 3 === 0)) {
    out.push({ tipo: 'mulch', celda: c }, { tipo: 'compost', celda: c });
    for (const slug of ['rabanito', 'tomate', 'zapallo', 'no-existe']) out.push({ tipo: 'sembrar', slug, celda: c });
  }
  for (const z of M.idsDeZonas(E)) {
    for (const nivel of [0, 1, 2, 3, 7]) out.push({ tipo: 'riego', zona: z, nivel });
    out.push({ tipo: 'manta', zona: z }, { tipo: 'tunel', zona: z });
  }
  out.push({ tipo: 'tunel' }, { tipo: 'manta', zona: 'no-existe' }, { tipo: 'cosechar', planta: 'p999' });
  return out;
}

describe('puede() y despachar() dicen lo mismo', () => {
  for (const patio of Object.keys(M.PLANTILLAS))
    for (const decadas of [3, 9, 15, 21, 27])
      it(`${patio}, después de ${decadas} décadas del bot`, () => {
        const E = jugarUnAnio(M, 5, undefined, { patio, decadas }) as Estado;
        const antes = JSON.stringify(E),
          distintas: string[] = [];
        for (const a of candidatas(E)) {
          const razon = M.puede(E, a),
            r = M.despachar(copia(E), a);
          if ((razon === null) !== r.ok || (!r.ok && r.error !== razon))
            distintas.push(`${JSON.stringify(a)}: puede=${razon} despachar=${r.ok ? 'ok' : r.error}`);
        }
        expect(distintas).toEqual([]);
        expect(JSON.stringify(E), 'puede() no puede cambiar la partida').toBe(antes);
      });
});

describe('lo que la interfaz ya no dejaba hacer, ahora lo decide el dominio', () => {
  const partida = (): Estado => {
    const E = M.crearPartida(8, { decInicio: 30 });
    for (const s of ['tomate', 'lechuga', 'rabanito']) E.recursos.sobres[s] = 9;
    return E;
  };
  const CRIA = '0,7',
    TIERRA = '0,4';
  it('en la almaciguera no se ralea, se repica', () => {
    const E = partida();
    M.despachar(E, { tipo: 'sembrar', slug: 'lechuga', celda: CRIA });
    const pl = M.plantaEn(E, CRIA)!;
    Object.assign(pl, { etapa: 'plantin', n: 5, prog: 10 });
    expect(M.puede(E, { tipo: 'ralear', planta: pl.id })).toMatch(/se repican/);
    expect(M.puedeMoverse(E, pl)).toBeNull();
  });
  it('el tutor va en plantas que lo piden, ya germinadas y fuera de la almaciguera', () => {
    const E = partida();
    M.despachar(E, { tipo: 'sembrar', slug: 'lechuga', celda: TIERRA });
    M.despachar(E, { tipo: 'sembrar', slug: 'tomate', celda: '1,4' });
    const lechuga = M.plantaEn(E, TIERRA)!,
      tomate = M.plantaEn(E, '1,4')!;
    expect(M.puede(E, { tipo: 'tutorar', planta: lechuga.id })).toMatch(/no necesita tutor/);
    expect(M.puede(E, { tipo: 'tutorar', planta: tomate.id })).toMatch(/ya germinó/);
    Object.assign(tomate, { etapa: 'creciendo', n: 1, prog: 30 });
    expect(M.puede(E, { tipo: 'tutorar', planta: tomate.id })).toBeNull();
  });
  it('el compost va en los canteros, no en la almaciguera', () => {
    const E = partida();
    expect(M.puede(E, { tipo: 'compost', celda: CRIA })).toMatch(/almaciguera/);
    expect(M.puede(E, { tipo: 'compost', celda: TIERRA })).toBeNull();
  });
  it('se trasplanta un plantín o una planta que crece; una hecha o pasada, no', () => {
    const E = partida();
    M.despachar(E, { tipo: 'sembrar', slug: 'tomate', celda: CRIA });
    const pl = M.plantaEn(E, CRIA)!;
    expect(M.puedeMoverse(E, pl)).toMatch(/no germinó/);
    Object.assign(pl, { etapa: 'plantin', n: 1, prog: 30 });
    expect(M.puedeMoverse(E, pl)).toBeNull();
    pl.etapa = 'pasada';
    expect(M.puedeMoverse(E, pl)).toMatch(/plantín o una planta que está creciendo/);
  });
  it('sin ratos, la razón es la falta de ratos', () => {
    const E = partida();
    E.recursos.ratosGastados = M.RATOS;
    expect(M.puede(E, { tipo: 'sembrar', slug: 'rabanito', celda: TIERRA })).toBe('No te quedan ratos esta década.');
    expect(M.puede(E, { tipo: 'tunel' })).toBe('Armar o sacar el microtúnel lleva 2 ratos.');
  });
});
