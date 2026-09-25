/**
 * #6: los eventos sorpresa son filas de una tabla. Todo evento tiene una respuesta que es una
 * práctica real; los malos se anuncian una década antes y lo que se previene a tiempo se salva; el
 * cuaderno dice a quién le pegó y qué lo habría evitado, y es verdad.
 */
import { describe, expect, it } from 'vitest';
import { REGLAS } from '../datos/juego/reglas';
import { hud } from '../src/aplicacion/consultas/hud';
import * as M from '../src/dominio';
import type { Estado, Planta } from '../src/dominio';
import { tirada } from '../src/dominio/azar';
import { crearContexto } from '../src/dominio/sistemas/contexto';
import { anunciarSorpresa, llegaSorpresa } from '../src/dominio/sistemas/sorpresas';
import { darRegalo } from '../src/dominio/sorpresas';
import { TEXTOS } from '../src/dominio/textos/sorpresas';
import { jugarUnAnio } from '../tools/jugador';
import v4 from './fixtures/partida-v4-fondo.json';

const S = REGLAS.sorpresas;
const SUELO = '1,1',
  ALMACIGO = '1,7';

/** Una planta ya crecida, puesta a mano: lo que se prueba es el evento, no la siembra. */
function crecida(E: Estado, slug: string, celda: string): Planta {
  E.recursos.sobres[slug] = 5;
  expect(M.despachar(E, { tipo: 'sembrar', slug, celda }).ok).toBe(true);
  const pl = M.plantaEn(E, celda)!;
  Object.assign(pl, { etapa: 'creciendo', n: 1, prog: 30, edad: 30, salud: 100 });
  return pl;
}
/** Corre el sistema que hace pasar la amenaza anunciada, y lo que quedó en el cuaderno. */
function pasa(E: Estado, id: string): string[] {
  E.tiempo.anunciada = { id, turno: E.tiempo.turno };
  const ctx = crearContexto(E);
  llegaSorpresa(ctx);
  ctx.anotarAvisos();
  return ctx.evs.map((e) => e.codigo ?? '');
}
const diario = (pl: Planta): string => (pl.hist || []).flatMap((r) => r.n.map((x) => x[1])).join(' | ');

describe('la tabla de sorpresas', () => {
  it('cada fila tiene sus frases, de su misma clase, y un id que no se repite', () => {
    const ids = M.SORPRESAS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of M.SORPRESAS) expect(TEXTOS[s.id]?.clase, s.id).toBe(s.clase);
    expect(Object.keys(TEXTOS).sort()).toEqual([...ids].sort());
  });
  it('cada fila dice en qué décadas puede pasar, dentro del año', () => {
    for (const s of M.SORPRESAS) {
      expect(s.cuando.length, s.id).toBeGreaterThan(0);
      for (const [d, h] of s.cuando) for (const x of [d, h]) expect(x >= 1 && x <= 36, s.id).toBe(true);
    }
  });
  it('cada aviso dice qué hacer, y el que pasa sin daño dice por qué', () => {
    for (const s of M.SORPRESAS) {
      const T = TEXTOS[s.id];
      if (T.clase !== 'amenaza') continue;
      expect(T.queHacer()).toMatch(/manta|tutor/);
      expect(T.aviso().texto).toMatch(/manta|tutor/);
      expect(T.paso({ cuantas: 2, especies: ['tomate'], expuestas: 2, protegidas: 0 }).texto).toMatch(/habría|habrían/);
    }
  });
});

describe('la tirada de las sorpresas', () => {
  it('es la misma con la misma semilla, turno y sal, y no gasta el azar de la partida', () => {
    const E = M.crearPartida(9),
      rng = E.meta.rng,
      u = tirada(E, 'granizo');
    expect(tirada(E, 'granizo')).toBe(u);
    expect(tirada(E, 'sudestada')).not.toBe(u);
    expect(u >= 0 && u < 1).toBe(true);
    expect(E.meta.rng).toBe(rng);
  });
});

describe('el granizo', () => {
  it('lastima lo que está a cielo abierto, y el cuaderno y el diario dicen qué lo habría evitado', () => {
    const E = M.crearPartida(4, { decInicio: 30 }),
      pl = crecida(E, 'lechuga', SUELO),
      codigos = pasa(E, 'granizo');
    expect(pl.salud).toBe(100 - 30);
    expect(codigos).toContain('sorpresa.granizo');
    const ev = E.progreso.cuaderno.find((e) => e.codigo === 'sorpresa.granizo')!;
    expect(ev.tipo).toBe('mal');
    expect(ev.texto).toMatch(/manta o el microtúnel/);
    expect(diario(pl)).toMatch(/granizo/);
    expect(E.tiempo.anunciada).toBeNull();
    expect(E.progreso.sorpresas.granizo).toBe(E.tiempo.turno);
  });
  it('con la manta puesta a tiempo no le pasa nada, y el cuaderno lo reconoce', () => {
    const E = M.crearPartida(4, { decInicio: 30 }),
      pl = crecida(E, 'lechuga', SUELO);
    E.tiempo.anunciada = { id: 'granizo', turno: E.tiempo.turno };
    expect(M.prevenciones(E)).toEqual([{ tipo: 'manta', zona: 'suelo' }]);
    expect(M.despachar(E, { tipo: 'manta', zona: 'suelo' }).ok).toBe(true);
    expect(pasa(E, 'granizo')).toEqual(['sorpresa.granizo-evitado']);
    expect(pl.salud).toBe(100);
  });
  it('bajo techo no es blanco, y si no hay nada a cielo abierto el cuaderno lo dice', () => {
    const E = M.crearPartida(4, { decInicio: 30 }),
      pl = crecida(E, 'lechuga', ALMACIGO);
    expect(M.blancos(E, M.sorpresaPorId('granizo')!.efecto).expuestas).toEqual([]);
    expect(pasa(E, 'granizo')).toEqual(['sorpresa.granizo-nada']);
    expect(pl.salud).toBe(100);
  });
  it('nunca mata: deja a la planta lastimada, no muerta', () => {
    const E = M.crearPartida(4, { decInicio: 30 }),
      pl = crecida(E, 'lechuga', SUELO);
    pl.salud = 5;
    pasa(E, 'granizo');
    expect(pl.salud).toBe(S.saludMinima);
  });
});

describe('la sudestada', () => {
  it('voltea lo que pide tutor y no lo tiene; con el tutor puesto, aguanta', () => {
    const E = M.crearPartida(4, { decInicio: 30 }),
      pl = crecida(E, 'tomate', SUELO);
    E.tiempo.anunciada = { id: 'sudestada', turno: E.tiempo.turno };
    expect(M.prevenciones(E)).toEqual([{ tipo: 'tutorar', planta: pl.id }]);
    const F = structuredClone(E),
      plF = M.plantaEn(F, SUELO)!;
    expect(pasa(E, 'sudestada')).toContain('sorpresa.sudestada');
    expect(pl.salud).toBeLessThan(100);
    expect(diario(pl)).toMatch(/tutor/);

    expect(M.despachar(F, { tipo: 'tutorar', planta: plF.id }).ok).toBe(true);
    expect(pasa(F, 'sudestada')).toEqual(['sorpresa.sudestada-evitada']);
    expect(plF.salud).toBe(100);
  });
  it('lo que no pide tutor no es blanco', () => {
    const E = M.crearPartida(4, { decInicio: 30 });
    crecida(E, 'lechuga', SUELO);
    expect(pasa(E, 'sudestada')).toEqual(['sorpresa.sudestada-nada']);
  });
});

describe('la mariposa blanca', () => {
  it('le pone orugas a las brasicáceas destapadas, y a las tapadas no', () => {
    const E = M.crearPartida(4, { decInicio: 30 }),
      pl = crecida(E, 'rucula', SUELO);
    const F = structuredClone(E),
      plF = M.plantaEn(F, SUELO)!;
    expect(pasa(E, 'mariposa-blanca')).toContain('sorpresa.mariposa-blanca');
    expect(pl.plaga).toBe('oruga');

    expect(M.despachar(F, { tipo: 'manta', zona: 'suelo' }).ok).toBe(true);
    expect(pasa(F, 'mariposa-blanca')).toEqual(['sorpresa.mariposa-blanca-evitada']);
    expect(plF.plaga).toBeFalsy();
  });
  it('si una destapada zafa, no dice que estaban tapadas', () => {
    let zafo = false;
    for (let semilla = 1; semilla < 200 && !zafo; semilla++) {
      const E = M.crearPartida(semilla, { decInicio: 30 }),
        pl = crecida(E, 'rucula', SUELO),
        [codigo] = pasa(E, 'mariposa-blanca');
      if (pl.plaga) continue;
      zafo = true;
      expect(codigo).toBe('sorpresa.mariposa-blanca-zafaron');
      const T = TEXTOS['mariposa-blanca'];
      if (T.clase === 'amenaza')
        expect(T.paso({ cuantas: 0, especies: [], expuestas: 1, protegidas: 1 }).texto).not.toMatch(/tapadas/);
    }
    expect(zafo).toBe(true);
  });
});

describe('el anuncio', () => {
  it('se anuncia para la década que empieza, se ve en el hud y dice qué hacer', () => {
    // una semilla y una década en que la tirada anuncia granizo sobre una lechuga destapada
    let E: Estado | null = null;
    for (let semilla = 1; semilla < 400 && !E?.tiempo.anunciada; semilla++) {
      E = M.crearPartida(semilla, { decInicio: 32 });
      crecida(E, 'lechuga', SUELO);
      const ctx = crearContexto(E);
      anunciarSorpresa(ctx);
      ctx.anotarAvisos();
    }
    const a = E!.tiempo.anunciada!;
    expect(a).toBeTruthy();
    expect(a.turno).toBe(E!.tiempo.turno);
    const aviso = E!.progreso.cuaderno.at(-1)!;
    expect(aviso.codigo).toBe('sorpresa.' + a.id + '-aviso');
    expect(aviso.tipo).toBe('mal');
    expect(hud(E!).amenaza).toMatchObject({ titulo: expect.any(String), queHacer: expect.stringMatching(/manta/) });
  });
  it('no anuncia nada si no hay a quién pegarle', () => {
    for (let semilla = 1; semilla < 200; semilla++) {
      const E = M.crearPartida(semilla, { decInicio: 32 }),
        ctx = crearContexto(E);
      anunciarSorpresa(ctx);
      expect(E.tiempo.anunciada).toBeNull();
    }
  });
});

describe('en partidas jugadas', () => {
  const partidas = [1, 2, 3, 4, 5, 6, 7, 8].flatMap((s) =>
    ['fondo', 'balcon'].map((patio) => jugarUnAnio(M, s, undefined, { patio }) as Estado),
  );
  const amenazas = new Set(M.SORPRESAS.filter((s) => s.clase === 'amenaza').map((s) => s.id));
  const idDe = (codigo: string): string =>
    codigo.replace(/^sorpresa\./, '').replace(/-(aviso|evitad[oa]|nada|planta)$/, '');

  it('toda amenaza que pasa se anunció antes, en el mismo cuaderno', () => {
    let pasaron = 0;
    for (const E of partidas) {
      // el cuaderno guarda lo último: lo del primer turno que quedó puede haber perdido su aviso
      const desde = E.progreso.cuaderno[0].turno,
        avisados = new Map<string, number>();
      for (const e of E.progreso.cuaderno) {
        const c = e.codigo ?? '';
        if (!c.startsWith('sorpresa.') || !amenazas.has(idDe(c)) || e.turno === desde) continue;
        if (c.endsWith('-aviso')) avisados.set(idDe(c), e.turno);
        else {
          expect(avisados.get(idDe(c)), c).toBe(e.turno);
          pasaron++;
        }
      }
    }
    expect(pasaron).toBeGreaterThan(0);
  });
  it('nunca dos amenazas seguidas', () => {
    for (const E of partidas) {
      const turnos = E.progreso.cuaderno.filter((e) => e.codigo?.endsWith('-aviso')).map((e) => e.turno);
      for (let i = 1; i < turnos.length; i++) expect(turnos[i] - turnos[i - 1]).toBeGreaterThanOrEqual(S.respiro);
    }
  });
  it('llegan regalos', () => {
    const regalos = partidas.flatMap((E) =>
      E.progreso.cuaderno.filter((e) =>
        ['sorpresa.kit-de-semillas', 'sorpresa.bolsas-de-hojas', 'sorpresa.lombrices'].includes(e.codigo ?? ''),
      ),
    );
    expect(regalos.length).toBeGreaterThan(0);
  });
});

describe('los regalos', () => {
  it('el kit trae semillas de lo que está en fecha ideal de siembra', () => {
    const E = M.crearPartida(3, { decInicio: 25 }),
      R = M.regionDe(E),
      antes = { ...E.recursos.sobres },
      r = darRegalo(E, M.sorpresaPorId('kit-de-semillas')!);
    expect(r.que.length).toBeGreaterThan(0);
    const suben = Object.keys(E.recursos.sobres).filter((s) => (E.recursos.sobres[s] || 0) > (antes[s] || 0));
    expect(suben).toHaveLength(r.que.length);
    for (const s of suben) expect(M.ventana(R, s, E.tiempo.dec)).toBe('ideal');
  });
  it('las bolsas de hojas suman secos', () => {
    const E = M.crearPartida(3),
      antes = E.recursos.secos;
    darRegalo(E, M.sorpresaPorId('bolsas-de-hojas')!);
    expect(E.recursos.secos).toBeGreaterThan(antes);
  });
});

describe('las partidas guardadas', () => {
  it('una partida v4 migra sin amenaza anunciada y sin sorpresas pasadas', () => {
    const E = M.migrar(structuredClone(v4)) as Estado;
    expect(E.tiempo.anunciada).toBeNull();
    expect(E.progreso.sorpresas).toEqual({});
    expect(M.esPartidaValida(E)).toBe(true);
  });
});
