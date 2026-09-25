/**
 * #8: los pedidos de los vecinos. Llegan con fecha y sin decir cuándo sembrar; solo llega uno que se
 * puede cumplir; se cumplen cosechando y dan su premio; si vencen, el cuaderno dice por qué y hasta
 * cuándo había que sembrar, y es verdad.
 */
import { describe, expect, it } from 'vitest';
import { REGLAS } from '../datos/juego/reglas';
import { pedidos } from '../src/aplicacion/consultas';
import { hud } from '../src/aplicacion/consultas/hud';
import * as M from '../src/dominio';
import type { Estado, Evento } from '../src/dominio';
import { fechaDe } from '../src/dominio/calendario';
import { DESEO_AGUA, humedad } from '../src/dominio/factores';
import {
  abrir,
  alSembrar,
  cumplirPedidos,
  decadasHastaCosecha,
  deUnPedido,
  diasHastaCosecha,
  hayFechaDeSiembra,
  llegaA,
  pedidoQueLlega,
  ultimaSiembra,
  vencidos,
} from '../src/dominio/pedidos';
import { enTramo } from '../src/dominio/region';
import { crearContexto } from '../src/dominio/sistemas/contexto';
import { llegaPedido } from '../src/dominio/sistemas/pedidos';
import { pedidoADestiempo } from '../src/dominio/textos/pedidos';
import { jugarUnAnio } from '../tools/jugador';
import v4 from './fixtures/partida-v4-fondo.json';

const P = REGLAS.pedidos;
const pedido = (id: string): M.Pedido => M.pedidoPorId(id)!;
/** Una partida en una década dada, con logros de sobra para que lleguen pedidos. */
function partida(dec: number, semilla = 1): Estado {
  const E = M.crearPartida(semilla, { decInicio: dec });
  for (const m of M.MISIONES.slice(0, P.desdeLogros)) E.progreso.misiones[m.id] = 0;
  return E;
}
/** Abre un pedido a mano, sin tirada. */
function abierto(E: Estado, id: string) {
  abrir(E, pedido(id));
  return E.progreso.pedidos.abiertos.find((pd) => pd.id === id)!;
}
/** Hace pasar décadas sin jugar: lo que se prueba es la cuenta, no el crecimiento. */
function avanzar(E: Estado, n: number): void {
  for (let i = 0; i < n; i++) {
    E.tiempo.turno++;
    E.tiempo.dec = (E.tiempo.dec % 36) + 1;
  }
}

describe('la tabla de pedidos', () => {
  it('cada fila nombra especies del catálogo y un id que no se repite', () => {
    const ids = M.PEDIDOS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of M.PEDIDOS) {
      expect(M.ESPECIES[p.especie], p.id).toBeTruthy();
      expect(p.porciones, p.id).toBeGreaterThan(0);
      if (p.premio.tipo === 'sobres')
        for (const s in p.premio.sobres) expect(M.ESPECIES[s], p.id + ' ' + s).toBeTruthy();
      for (const [d, h] of p.cuando) for (const x of [d, h]) expect(x >= 1 && x <= 36, p.id).toBe(true);
    }
  });
  it('cada fila se puede cumplir en cualquier década en que llega: hay una siembra ideal con tiempo para crecer', () => {
    for (const p of M.PEDIDOS)
      for (const [d, h] of p.cuando)
        for (let dec = d; dec !== (h % 36) + 1; dec = (dec % 36) + 1) {
          const E = partida(dec);
          expect(hayFechaDeSiembra(E, p.especie, E.tiempo.turno, E.tiempo.turno + p.plazo), p.id + ' @' + dec).toBe(
            true,
          );
        }
  });
  it('lo que se pide viene en los sobres del arranque', () => {
    const E = M.crearPartida(1);
    for (const p of M.PEDIDOS) expect(E.recursos.sobres[p.especie], p.id).toBeGreaterThan(0);
  });
});

describe('cuándo llega un pedido', () => {
  it('no antes de los primeros logros', () => {
    for (let s = 1; s <= 40; s++) {
      const E = M.crearPartida(s, { decInicio: 5 });
      expect(pedidoQueLlega(E)).toBeNull();
    }
  });
  it('con logros, llega alguno en su época, y solo de los que se pueden cumplir', () => {
    let llegaron = 0;
    for (let s = 1; s <= 40; s++) {
      const E = partida(5, s),
        p = pedidoQueLlega(E);
      if (!p) continue;
      llegaron++;
      expect(
        p.cuando.some(([d, h]) => enTramo(5, d, h)),
        p.id,
      ).toBe(true);
    }
    expect(llegaron).toBeGreaterThan(0);
  });
  it('con el año terminado no llega ninguno: nadie lo vería llegar', () => {
    let probados = 0;
    for (let s = 1; s <= 40; s++) {
      const E = partida(5, s);
      if (!pedidoQueLlega(E)) continue;
      probados++;
      E.tiempo.terminado = true;
      const ctx = crearContexto(E);
      llegaPedido(ctx);
      expect(ctx.evs).toEqual([]);
      expect(E.progreso.pedidos.abiertos).toEqual([]);
    }
    expect(probados).toBeGreaterThan(0);
  });
  it('nunca más de los que caben abiertos, ni dos de la misma especie', () => {
    const E = partida(5);
    abierto(E, 'acelga-del-comedor');
    for (let s = 1; s <= 40; s++) {
      E.meta.semilla = s;
      expect(pedidoQueLlega(E)?.especie).not.toBe('acelga');
    }
    abierto(E, 'verdeo-de-la-feria');
    for (let s = 1; s <= 40; s++) {
      E.meta.semilla = s;
      expect(pedidoQueLlega(E)).toBeNull();
    }
  });
  it('el que llega dice fecha y cuánto, y no dice hasta cuándo sembrar: eso se cuenta con la ficha', () => {
    const E = partida(5),
      f = abrir(E, pedido('acelga-del-comedor'));
    expect(f.codigo).toBe('pedido.llega');
    expect(f.texto).toContain('6 porciones de acelga');
    expect(f.texto).toContain(fechaDe(M.decadaDelTurno(E, E.tiempo.turno + pedido('acelga-del-comedor').plazo)));
    expect(f.texto).toMatch(/ficha/);
    expect(f.texto).not.toMatch(/más tardar/);
  });
});

describe('cumplir un pedido', () => {
  it('cuenta lo cosechado desde que llegó, y al llegar a lo pedido da el premio', () => {
    const E = partida(5);
    E.progreso.cosechado.acelga = 10;
    const pd = abierto(E, 'acelga-del-comedor'),
      k = M.compostera(E)!,
      dosis = k.dosis,
      evs: Evento[] = [];
    expect(pd.base).toBe(10);
    E.progreso.cosechado.acelga = 15;
    cumplirPedidos(E, evs);
    expect(evs).toHaveLength(0);
    expect(pedidos(E).abiertos[0]).toMatchObject({ llevas: 5, porciones: 6 });
    E.progreso.cosechado.acelga = 16;
    cumplirPedidos(E, evs);
    expect(evs.map((e) => [e.tipo, e.codigo])).toEqual([['logro', 'pedido.cumplido']]);
    expect(k.dosis).toBe(dosis + 3);
    expect(E.progreso.pedidos).toMatchObject({ abiertos: [], cumplidos: 1 });
    expect(E.progreso.pedidos.cerrados['acelga-del-comedor']).toBe(E.tiempo.turno);
  });
  it('los sobres de premio se suman a la bolsa', () => {
    const E = partida(22);
    abierto(E, 'ensalada-de-rosa');
    E.progreso.cosechado.lechuga = 4;
    cumplirPedidos(E, []);
    expect(E.recursos.sobres.radicchio).toBeGreaterThanOrEqual(3);
    expect(E.recursos.sobres.eneldo).toBeGreaterThanOrEqual(3);
  });
  it('el goteo ahorra un rato por zona regada, y no vuelve a pedirse una vez que lo tenés', () => {
    const E = partida(21);
    abierto(E, 'albahaca-de-la-pizzeria');
    E.progreso.cosechado.albahaca = 3;
    const evs: Evento[] = [];
    cumplirPedidos(E, evs);
    expect(E.recursos.goteo).toBe(true);
    expect(evs[0].texto).toMatch(/goteo/);
    E.progreso.pedidos.cerrados = {};
    for (let s = 1; s <= 40; s++) {
      E.meta.semilla = s;
      expect(pedidoQueLlega(E)?.id).not.toBe('albahaca-de-la-pizzeria');
    }
  });
  it('el mismo pedido no vuelve antes de su tiempo', () => {
    const E = partida(5);
    abierto(E, 'acelga-del-comedor');
    E.progreso.cosechado.acelga = 6;
    cumplirPedidos(E, []);
    for (let s = 1; s <= 40; s++) {
      E.meta.semilla = s;
      expect(pedidoQueLlega(E)?.id).not.toBe('acelga-del-comedor');
    }
  });
});

describe('cuando vence', () => {
  const limite = (E: Estado, id: string): string => {
    const pd = E.progreso.pedidos.abiertos.find((x) => x.id === id)!;
    return fechaDe(M.decadaDelTurno(E, pd.limite));
  };
  it('no vence antes de la década de su fecha: lo cosechado esa década todavía cuenta', () => {
    const E = partida(5),
      pd = abierto(E, 'acelga-del-comedor');
    avanzar(E, pd.vence - E.tiempo.turno - 1);
    expect(vencidos(E)).toEqual([]);
    avanzar(E, 1);
    expect(vencidos(E)).toHaveLength(1);
    expect(E.progreso.pedidos.abiertos).toEqual([]);
  });
  it('si no se sembró, lo dice, y dice hasta cuándo había que sembrar con los días del catálogo', () => {
    const E = partida(5),
      pd = abierto(E, 'acelga-del-comedor'),
      lim = limite(E, 'acelga-del-comedor');
    avanzar(E, pd.vence - E.tiempo.turno);
    const [f] = vencidos(E);
    expect(f.codigo).toBe('pedido.sin-sembrar');
    expect(f.texto).toContain('unos ' + diasHastaCosecha('acelga') + ' días');
    expect(f.texto).toContain('a más tardar a ' + lim);
  });
  it('el límite es el que se contó cuando llegó el pedido, aunque después el patio cambie', () => {
    const E = partida(5),
      pd = abierto(E, 'acelga-del-comedor'),
      lim = limite(E, 'acelga-del-comedor');
    for (const c of Object.values(E.mundo.celdas)) c.mo = 0;
    expect(ultimaSiembra(E, pd, pedido(pd.id))).not.toBe(pd.limite);
    avanzar(E, pd.vence - E.tiempo.turno);
    expect(vencidos(E)[0].texto).toContain('a más tardar a ' + lim);
  });
  it('si ninguna siembra llega, no hay límite que dar', () => {
    const E = partida(5),
      p = pedido('albahaca-de-la-pizzeria');
    expect(ultimaSiembra(E, { desde: E.tiempo.turno, vence: E.tiempo.turno + 1 }, p)).toBeNull();
  });
  it('si se sembró después del límite, dice que fue tarde', () => {
    const E = partida(5),
      pd = abierto(E, 'acelga-del-comedor'),
      p = pedido('acelga-del-comedor');
    expect(pd.limite).toBe(ultimaSiembra(E, pd, p));
    avanzar(E, pd.limite - E.tiempo.turno + 1);
    alSembrar(E, 'acelga');
    expect(pd.sembrado).toBe(E.tiempo.turno);
    avanzar(E, pd.vence - E.tiempo.turno);
    const [f] = vencidos(E);
    expect(f.codigo).toBe('pedido.tarde');
    expect(f.texto).toMatch(/ya era tarde/);
  });
  it('si se sembró a tiempo y no alcanzó, dice cuánto se llevó y que conviene sembrar de más', () => {
    const E = partida(5),
      pd = abierto(E, 'acelga-del-comedor');
    alSembrar(E, 'acelga');
    E.progreso.cosechado.acelga = 2;
    avanzar(E, pd.vence - E.tiempo.turno);
    const [f] = vencidos(E);
    expect(f.codigo).toBe('pedido.no-alcanzo');
    expect(f.texto).toContain('cosechaste 2 de 6 porciones');
    expect(f.texto).toMatch(/sembrar de más/);
  });
  it('si se sembró antes del límite pero en mala época, dice que con ese tiempo no llegaba', () => {
    const E = partida(22),
      pd = abierto(E, 'albahaca-de-la-pizzeria');
    expect(llegaA(E, 'albahaca', E.tiempo.turno, pd.vence)).toBe(false);
    expect(pd.limite).toBeGreaterThan(E.tiempo.turno);
    alSembrar(E, 'albahaca');
    avanzar(E, pd.vence - E.tiempo.turno);
    const [f] = vencidos(E);
    expect(f.codigo).toBe('pedido.a-destiempo');
    expect(f.texto).toMatch(
      /Sembraste albahaca a principios de agosto, pero con el tiempo de esa época no llegaba a nacer/,
    );
    expect(f.texto).toMatch(/crece más lento: un año normal son unas \d+ décadas/);
    const c = { dias: 94, decadas: 14, masLento: true, limite: 'fines de septiembre', llevas: 0 };
    expect(pedidoADestiempo(deUnPedido(E, pd, pedido(pd.id)), c, 'agosto', 20).texto).toMatch(
      /tardaba unas 20 décadas y no llegaba/,
    );
  });
  it('el límite es el último turno que llega: después ya no llega ninguno', () => {
    for (const p of M.PEDIDOS)
      for (const [d] of p.cuando) {
        const E = partida(d),
          pd = abierto(E, p.id),
          u = ultimaSiembra(E, pd, p)!;
        expect(pd.limite, p.id).toBe(u);
        expect(llegaA(E, p.especie, u, pd.vence), p.id).toBe(true);
        for (let s = u + 1; s <= pd.vence; s++) expect(llegaA(E, p.especie, s, pd.vence), p.id + ' t' + s).toBe(false);
        expect(decadasHastaCosecha(E, p.especie, u) * 10, p.id).toBeGreaterThanOrEqual(diasHastaCosecha(p.especie));
      }
  });
});

/** Lo que un jardinero lee en el pronóstico de lluvia, en mm de la década. */
const MM_PRONOSTICO = { seca: 0, normal: 25, llovedora: 50 } as const;
/**
 * Cuánto riega una zona alguien que mira el pronóstico: el nivel que deja la tierra de sus plantas
 * más cerca de lo que pide la especie. Una maceta al sol se seca más que un cantero y pide más agua.
 */
function riegoCuidadoso(E: Estado, zona: string, slug: string): number {
  const deseo = DESEO_AGUA[M.ESPECIES[slug].riego],
    w = { tmax: E.tiempo.pronostico.tmax, lluvia: MM_PRONOSTICO[E.tiempo.pronostico.lluvia] },
    celdas = Object.values(E.mundo.plantas)
      .filter((pl) => pl.slug === slug && E.mundo.celdas[pl.celda].zona === zona)
      .map((pl) => pl.celda),
    antes = E.recursos.riego[zona];
  if (!celdas.length) return antes;
  let mejor: number = antes,
    menor = Infinity;
  for (const nivel of [0, 1, 2, 3] as const) {
    E.recursos.riego[zona] = nivel;
    const error = celdas.reduce((s, c) => s + Math.abs(humedad(E, c, w) - deseo), 0);
    if (error < menor) [mejor, menor] = [nivel, error];
  }
  E.recursos.riego[zona] = antes;
  return mejor;
}

/**
 * La cuenta, contra el juego de verdad y en cada patio: alguien que planifica siembra cinco lugares,
 * riega según el pronóstico, cubre, trata, raleá y trasplanta. Sembrando temprano, casi siempre llega
 * a la primera cosecha; sembrando una década después del límite, casi nunca. Así «a más tardar» es
 * verdad, también en el balcón.
 */
function primeraCosechaATiempo(p: M.Pedido, semilla: number, cuando: 'temprano' | 'tarde', patio: string): boolean {
  const [dec] = p.cuando[0],
    E = M.crearPartida(semilla, { decInicio: dec, patio }),
    R = M.regionDe(E),
    sp = M.ESPECIES[p.especie];
  E.recursos.sobres[p.especie] = 20;
  const pd = abierto(E, p.id);
  let siembra = pd.limite + 1;
  if (cuando === 'temprano')
    for (let s = pd.desde; s <= pd.vence; s++)
      if (M.ventana(R, p.especie, M.decadaDelTurno(E, s)) === 'ideal' && llegaA(E, p.especie, s, pd.vence)) {
        siembra = s;
        break;
      }
  while (E.tiempo.turno < siembra) M.pasarDecada(E);
  const zonas = M.zonasDe(E),
    cria = zonas.find((z) => z.cria),
    deCria = (c: string): boolean => E.mundo.celdas[c].zona === cria?.id,
    libres = (): string[] =>
      Object.keys(E.mundo.celdas)
        .filter((c) => !deCria(c) && !E.mundo.celdas[c].planta)
        .sort((a, b) => M.evaluarCelda(E, p.especie, b)!.puntaje - M.evaluarCelda(E, p.especie, a)!.puntaje),
    almacigo = !!(sp.dt && cria && /almacigo/.test(M.metodoDe(p.especie, E.tiempo.dec) || ''));
  const sembrar = (): void => {
    let n = 0;
    for (const c of almacigo ? Object.keys(E.mundo.celdas).filter(deCria) : libres())
      if (n < 5 && M.despachar(E, { tipo: 'sembrar', slug: p.especie, celda: c }).ok) n++;
  };
  sembrar();
  while (E.tiempo.turno <= pd.vence) {
    // si una primavera fría se llevó la siembra, se vuelve a sembrar
    if (!Object.values(E.mundo.plantas).some((pl) => pl.slug === p.especie)) sembrar();
    for (const pl of Object.values(E.mundo.plantas)) {
      if (pl.slug !== p.especie) continue;
      if (pl.etapa === 'cosechable') return true;
      if (deCria(pl.celda)) {
        if (pl.avisoListo && M.ventana(R, pl.slug, E.tiempo.dec, 'trasplante') !== 'fuera')
          for (let i = 0; i < 6 && E.mundo.plantas[pl.id]; i++) {
            const c = libres()[0];
            if (!c || !M.despachar(E, { tipo: 'trasplantar', planta: pl.id, celda: c }).ok) break;
          }
        continue;
      }
      if (pl.n > 1) M.despachar(E, { tipo: 'ralear', planta: pl.id });
      if (pl.plaga) M.despachar(E, { tipo: 'tratar', planta: pl.id });
    }
    if (E.tiempo.pronostico.pHelada > 40) for (const z of zonas) M.despachar(E, { tipo: 'manta', zona: z.id });
    for (const a of M.prevenciones(E)) M.despachar(E, a);
    // la almaciguera, bajo techo y abrigada, se riega a fondo para que nazca
    for (const z of zonas)
      M.despachar(E, { tipo: 'riego', zona: z.id, nivel: z.cria ? 3 : riegoCuidadoso(E, z.id, p.especie) });
    M.pasarDecada(E);
  }
  return false;
}

describe.each(Object.keys(M.PLANTILLAS))('la cuenta es verdad en el patio %s', (patio) => {
  const SEMILLAS = [1, 2, 3, 4, 5, 6, 7, 8];
  /** Los pedidos que pueden llegar a este patio: los demás no se prueban acá. */
  const posibles = M.PEDIDOS.filter((p) => {
    const E = M.crearPartida(1, { decInicio: p.cuando[0][0], patio });
    return hayFechaDeSiembra(E, p.especie, E.tiempo.turno, E.tiempo.turno + p.plazo);
  });
  it('sembrando temprano, en la mayoría de los años se llega a la primera cosecha', () => {
    for (const p of posibles) {
      const llegan = SEMILLAS.filter((s) => primeraCosechaATiempo(p, s, 'temprano', patio)).length;
      expect(llegan, p.id).toBeGreaterThanOrEqual(SEMILLAS.length / 2);
    }
  });
  it('sembrando después del límite, casi nunca se llega', () => {
    for (const p of posibles) {
      const llegan = SEMILLAS.filter((s) => primeraCosechaATiempo(p, s, 'tarde', patio)).length;
      expect(llegan, p.id).toBeLessThanOrEqual(SEMILLAS.length / 4);
    }
  });
});

describe('en la partida', () => {
  it('sembrar la especie de un pedido abierto anota cuándo', () => {
    const E = partida(5),
      pd = abierto(E, 'acelga-del-comedor');
    M.despachar(E, { tipo: 'sembrar', slug: 'lechuga', celda: '1,1' });
    expect(pd.sembrado).toBeNull();
    expect(M.despachar(E, { tipo: 'sembrar', slug: 'acelga', celda: '1,2' }).ok).toBe(true);
    expect(pd.sembrado).toBe(E.tiempo.turno);
  });
  it('el hud muestra el pedido más cerca, sin la fecha de siembra', () => {
    const E = partida(5);
    expect(hud(E).pedido).toBeNull();
    abierto(E, 'acelga-del-comedor');
    abierto(E, 'verdeo-de-la-feria');
    const h = hud(E).pedido!;
    expect(h.abiertos).toBe(2);
    expect(h).toMatchObject({ especie: 'acelga', porciones: 6, llevas: 0 });
  });
  it('una partida v4 migra sin pedidos', () => {
    const E = M.migrar(structuredClone(v4)) as Estado;
    expect(E.progreso.pedidos).toEqual({ abiertos: [], cerrados: {}, cumplidos: 0 });
    expect(M.esPartidaValida(E)).toBe(true);
  });
  it('en partidas jugadas llegan pedidos, y cada uno se cumple o vence con su frase', () => {
    let llegaron = 0;
    for (const s of [1, 2, 3, 4, 5, 6, 7, 8])
      for (const patio of ['fondo', 'balcon']) {
        const E = jugarUnAnio(M, s, undefined, { patio }) as Estado,
          cs = E.progreso.cuaderno.map((e) => e.codigo ?? '');
        llegaron += cs.filter((c) => c === 'pedido.llega').length;
        for (const c of cs.filter((c) => c.startsWith('pedido.')))
          expect([
            'pedido.llega',
            'pedido.cumplido',
            'pedido.sin-sembrar',
            'pedido.tarde',
            'pedido.no-alcanzo',
          ]).toContain(c);
      }
    expect(llegaron).toBeGreaterThan(0);
  });
});
