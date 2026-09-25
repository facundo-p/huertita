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
import {
  abrir,
  alSembrar,
  cumplirPedidos,
  decadasHastaCosecha,
  diasHastaCosecha,
  hayFechaDeSiembra,
  pedidoQueLlega,
  ultimaSiembra,
  vencidos,
} from '../src/dominio/pedidos';
import { enTramo } from '../src/dominio/region';
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
    return fechaDe(M.decadaDelTurno(E, ultimaSiembra(pd, pedido(id))));
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
  it('si se sembró después del límite, dice que fue tarde', () => {
    const E = partida(5),
      pd = abierto(E, 'acelga-del-comedor'),
      p = pedido('acelga-del-comedor');
    avanzar(E, ultimaSiembra(pd, p) - E.tiempo.turno + 1);
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
  it('la cuenta es verdad: sembrando en el límite, con buen tiempo, se llega a la fecha', () => {
    for (const p of M.PEDIDOS) {
      const k = decadasHastaCosecha(p.especie);
      expect(k * 10, p.id).toBeGreaterThanOrEqual(diasHastaCosecha(p.especie));
      expect(k, p.id).toBeLessThan(p.plazo);
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
