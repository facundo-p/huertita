/**
 * #7: el compost lleva verdes y secos, y el patio da unos y otros. [REPO] compostaje.json: entre 1 y 3
 * secos por verde (lo más repetido, 2 a 1); con pocos secos la pila se pudre y tarda, con demasiados
 * no arranca; el pasto recién cortado es verde, el pasto seco, las hojas y la poda son secos.
 */
import { describe, expect, it } from 'vitest';
import { REGLAS } from '../datos/juego/reglas';
import * as M from '../src/dominio';
import type { Estado, Tiempo } from '../src/dominio';

const C = REGLAS.compost,
  J = REGLAS.jardin;
const R = M.regionPorId('gba');

/** Pasa una década con un clima parejo, sin plantas: solo corre el patio. */
function decada(E: Estado, tmed = 16): void {
  E.tiempo.clima = {
    ...E.tiempo.clima,
    tmed,
    tmin: tmed - 5,
    tmax: tmed + 5,
    lluvia: 20,
    helada: false,
    ola: false,
  } as Tiempo;
  M.pasarDecada(E);
}
const codigos = (E: Estado): string[] => E.progreso.cuaderno.map((e) => e.codigo ?? '');

describe('la mezcla de una tanda', () => {
  it('sigue la receta: menos de un seco por verde es húmeda, más de tres es seca', () => {
    expect(M.mezclaDe(6, 3)).toBe('humeda');
    expect(M.mezclaDe(6, 6)).toBe('pareja');
    expect(M.mezclaDe(6, 12)).toBe('pareja');
    expect(M.mezclaDe(6, 18)).toBe('pareja');
    expect(M.mezclaDe(6, 19)).toBe('seca');
    expect(M.mezclaDe(0, 0)).toBe('pareja');
  });
});

describe('la compostera en una partida', () => {
  it('arranca con la bolsa de secos, el jardín vacío y la tanda abierta en cero', () => {
    const E = M.crearPartida(1);
    expect(E.recursos.secos).toBe(J.bolsaInicial);
    expect(M.compostera(E)).toMatchObject({ verdes: 0, secos: 0, tandas: [] });
  });

  it('con secos en la bolsa, cada balde de la cocina se tapa y la tanda cierra pareja', () => {
    const E = M.crearPartida(1);
    E.recursos.secos = 100;
    for (let i = 0; i < C.tanda / C.cocina.verdes; i++) decada(E);
    const k = M.compostera(E)!;
    expect(k.tandas).toHaveLength(1);
    expect(k.tandas[0].mezcla).toBe('pareja');
    expect(codigos(E)).toContain('compost.tanda');
    expect(codigos(E)).not.toContain('compost.sin-secos');
  });

  it('sin secos, la tanda queda húmeda, el cuaderno dice por qué y qué la habría evitado, y tarda más', () => {
    const E = M.crearPartida(1);
    E.recursos.secos = 0;
    decada(E);
    const aviso = E.progreso.cuaderno.find((e) => e.codigo === 'compost.sin-secos')!;
    expect(aviso.texto).toMatch(/bolsa/);
    expect(aviso.texto).toMatch(/Juntá hojas/);
    for (let i = 1; i < C.tanda / C.cocina.verdes; i++) decada(E);
    const k = M.compostera(E)!;
    expect(k.tandas[0].mezcla).toBe('humeda');
    const cerrada = E.progreso.cuaderno.find((e) => e.codigo === 'compost.tanda-humeda')!;
    expect(cerrada.texto).toMatch(/faltan secos/);
    // [REPO] "Si huele mal o hay mosquitas: está muy húmedo; agregá secos"
    expect(cerrada.texto).toMatch(/revolvés/);
    const avance = k.tandas[0].avance;
    decada(E);
    expect(k.tandas[0].avance - avance).toBeCloseTo(C.ritmoHumeda, 5);
  });

  it('revolver una tanda húmeda con secos de la bolsa la endereza', () => {
    const E = M.crearPartida(1);
    E.recursos.secos = 0;
    for (let i = 0; i < C.tanda / C.cocina.verdes; i++) decada(E);
    expect(M.puede(E, { tipo: 'revolver' })).toMatch(/hacen falta/);
    E.recursos.secos = 10;
    expect(M.puede(E, { tipo: 'revolver' })).toBeNull();
    M.despachar(E, { tipo: 'revolver' });
    expect(M.compostera(E)!.tandas[0].mezcla).toBe('pareja');
    expect(E.recursos.secos).toBe(10 - M.secosParaEnderezar());
    expect(M.puede(E, { tipo: 'revolver' })).toMatch(/ninguna tanda húmeda/);
  });

  it('el mulch sale de la bolsa: sin secos no hay mulch', () => {
    const E = M.crearPartida(1),
      celda = Object.keys(E.mundo.celdas).find((c) => M.recibeCompost(E, c))!;
    E.recursos.secos = 0;
    expect(M.puede(E, { tipo: 'mulch', celda })).toMatch(/secos/);
    E.recursos.secos = 3;
    M.despachar(E, { tipo: 'mulch', celda });
    expect(E.recursos.secos).toBe(3 - J.secosPorMulch);
  });

  it('una planta pasada va como seco; una verde, como verde', () => {
    const E = M.crearPartida(1);
    E.recursos.sobres.rabanito = 9;
    M.despachar(E, { tipo: 'sembrar', slug: 'rabanito', celda: '0,1' });
    const pl = Object.values(E.mundo.plantas)[0];
    pl.etapa = 'pasada';
    M.despachar(E, { tipo: 'arrancar', planta: pl.id });
    expect(M.compostera(E)).toMatchObject({ verdes: 0, secos: C.porPlanta });
  });
});

describe('el jardín', () => {
  it('los caducos del GBA tienen hoja, la largan y después descansan, en ese orden', () => {
    const fases = Array.from({ length: 36 }, (_, i) => M.faseDeCaducos(R, i + 1));
    expect(fases[R.caducos.hasta - 1]).toBe('hoja');
    expect(fases[R.caducos.hasta]).toBe('caida');
    expect(fases.filter((f) => f === 'caida')).toHaveLength(J.caidaDecadas);
    expect(fases[R.caducos.conHojasDesde - 2]).toBe('reposo');
  });

  it('en otoño caen hojas para juntar; si no se juntan, se vuelan', () => {
    const E = M.crearPartida(1, { decInicio: R.caducos.hasta + 1 });
    decada(E);
    const hojas = E.mundo.jardin.hojas;
    expect(hojas).toBeGreaterThan(0);
    const antes = E.recursos.secos;
    M.despachar(E, { tipo: 'juntarHojas' });
    expect(E.recursos.secos).toBeCloseTo(antes + hojas, 5);
    expect(E.progreso.cuaderno.at(-1)!.codigo).toBe('jardin.hojas');
    expect(M.puede(E, { tipo: 'juntarHojas' })).toMatch(/No hay hojas/);
    const F = M.crearPartida(1, { decInicio: R.caducos.hasta + J.caidaDecadas });
    decada(F);
    const caidas = F.mundo.jardin.hojas;
    decada(F);
    expect(F.mundo.jardin.hojas).toBeLessThan(caidas);
  });

  it('se poda en reposo, una vez por invierno; con hoja o mientras caen, no', () => {
    const E = M.crearPartida(1, { decInicio: 24 });
    expect(M.faseDeCaducos(R, 24)).toBe('reposo');
    expect(E.mundo.jardin.poda).toBeGreaterThan(0);
    M.despachar(E, { tipo: 'podar' });
    expect(M.puede(E, { tipo: 'podar' })).toMatch(/Ya podaste/);
    const F = M.crearPartida(1, { decInicio: 2 });
    expect(M.puede(F, { tipo: 'podar' })).toMatch(/tiene hoja/);
    const G = M.crearPartida(1, { decInicio: R.caducos.hasta + 1 });
    expect(M.puede(G, { tipo: 'podar' })).toMatch(/cayendo/);
  });
  it('la poda aparece con la primera década de reposo, y una partida que arranca ahí poda una sola vez', () => {
    const reposo = R.caducos.hasta + J.caidaDecadas + 1;
    expect(M.faseDeCaducos(R, reposo)).toBe('reposo');
    expect(M.faseDeCaducos(R, reposo - 1)).toBe('caida');
    const E = M.crearPartida(1, { decInicio: reposo - 1 });
    decada(E);
    expect(E.tiempo.dec).toBe(reposo);
    expect(M.puede(E, { tipo: 'podar' })).toBeNull();
    const F = M.crearPartida(1, { decInicio: reposo });
    expect(M.despachar(F, { tipo: 'podar' }).ok).toBe(true);
    decada(F);
    expect(M.puede(F, { tipo: 'podar' })).toMatch(/Ya podaste/);
  });

  it('el pasto crece con calor y se corta verde o se seca', () => {
    const E = M.crearPartida(1);
    expect(M.puede(E, { tipo: 'cortarPasto', destino: 'compost' })).toMatch(/corto/);
    for (let i = 0; i < 4; i++) decada(E, 24);
    expect(E.mundo.jardin.pasto).toBe(M.topeDePasto(E.mundo.patio));
    const pasto = E.mundo.jardin.pasto,
      bolsa = E.recursos.secos,
      verdes = M.compostera(E)!.verdes;
    const F: Estado = JSON.parse(JSON.stringify(E));
    M.despachar(E, { tipo: 'cortarPasto', destino: 'compost' });
    expect(M.compostera(E)!.verdes).toBeCloseTo(verdes + pasto, 5);
    M.despachar(F, { tipo: 'cortarPasto', destino: 'secar' });
    expect(F.recursos.secos).toBeCloseTo(bolsa + pasto * J.pastoSeco, 1);
    expect(E.mundo.jardin.pasto).toBe(0);
  });

  it('en el balcón no hay pasto ni árboles, pero sí las hojas de la vereda', () => {
    const E = M.crearPartida(1, { patio: 'balcon', decInicio: R.caducos.hasta + 1 });
    expect(M.puede(E, { tipo: 'cortarPasto', destino: 'secar' })).toMatch(/no hay pasto/);
    expect(M.puede(E, { tipo: 'podar' })).toMatch(/no hay árboles/);
    decada(E);
    expect(E.mundo.jardin.hojas).toBe(J.hojasDeVereda);
  });
});
