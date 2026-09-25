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
import { quitarPlanta } from '../src/dominio/estado';
import { DESEO_AGUA, humedad } from '../src/dominio/factores';
import {
  abrir,
  alSembrar,
  cumplirPedidos,
  decadasHastaCosecha,
  deUnPedido,
  diasHastaCosecha,
  hayFechaDeSiembra,
  limiteDe,
  llegaA,
  llegabaJusto,
  tardaba,
  pedidoQueLlega,
  ultimaSiembra,
  vencidos,
} from '../src/dominio/pedidos';
import { enTramo } from '../src/dominio/region';
import { crearContexto } from '../src/dominio/sistemas/contexto';
import { puedeEspigar } from '../src/dominio/sistemas/madurar';
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
    return fechaDe(M.decadaDelTurno(E, limiteDe(pd)!));
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
    expect(ultimaSiembra(E, pd, pedido(pd.id))).not.toBe(limiteDe(pd));
    avanzar(E, pd.vence - E.tiempo.turno);
    expect(vencidos(E)[0].texto).toContain('a más tardar a ' + lim);
  });
  it('si ninguna siembra llega, no hay límite que dar', () => {
    const E = partida(5),
      p = pedido('albahaca-de-la-pizzeria');
    expect(ultimaSiembra(E, { desde: E.tiempo.turno, vence: E.tiempo.turno + 1 }, p)).toBeNull();
  });
  it('si se sembró después del límite, dice que fue sin margen o que ya era tarde, según llegaba o no', () => {
    const p = pedido('acelga-del-comedor'),
      vence = (sembrar: (pd: M.PedidoAbierto) => number) => {
        const E = partida(5),
          pd = abierto(E, p.id),
          s = sembrar(pd);
        avanzar(E, s - E.tiempo.turno);
        alSembrar(E, 'acelga');
        expect(pd.sembrado).toBe(s);
        avanzar(E, pd.vence - E.tiempo.turno);
        return vencidos(E)[0];
      };
    const E = partida(5),
      pd = abierto(E, p.id);
    expect(limiteDe(pd)).toBe(ultimaSiembra(E, pd, p));
    expect(llegabaJusto(pd, limiteDe(pd)! + 1)).toBe(true);
    const justo = vence((pd) => limiteDe(pd)! + 1);
    expect(justo.codigo).toBe('pedido.tarde');
    expect(justo.texto).toMatch(/pasado el límite: en un año normal llegaba, pero sin margen/);
    const tarde = vence((pd) => {
      let s = pd.vence;
      while (!llegabaJusto(pd, s)) s--;
      return s + 1;
    });
    expect(tarde.codigo).toBe('pedido.tarde');
    expect(tarde.texto).toMatch(/ya era tarde: en un año normal no llegaba/);
  });
  it('la cuenta dice lo que tarda en un año normal: el margen se deja al leerla, no se suma', () => {
    // la albahaca que llega a fines de agosto al fondo: sembrada a fines de septiembre llega justo
    const E = partida(24),
      pd = abierto(E, 'albahaca-de-la-pizzeria'),
      s = limiteDe(pd)! + 1;
    expect(llegabaJusto(pd, s)).toBe(true);
    expect(tardaba(pd, s)).toBeLessThan(15);
    avanzar(E, s - E.tiempo.turno);
    alSembrar(E, 'albahaca');
    avanzar(E, pd.vence - E.tiempo.turno);
    const [f] = vencidos(E);
    expect(f.codigo).toBe('pedido.tarde');
    expect(f.texto).toMatch(/sin margen/);
    expect(f.texto).not.toMatch(/ya era tarde/);
  });
  it('si ninguna siembra llegaba con margen, lo dice y no inventa un límite', () => {
    // la lechuga que llega a fines de agosto al balcón: con el calor, espiga; no llega como pedido nuevo
    const E = M.crearPartida(1, { decInicio: 24, patio: 'balcon' }),
      p = pedido('ensalada-de-rosa');
    expect(hayFechaDeSiembra(E, p.especie, E.tiempo.turno, E.tiempo.turno + p.plazo)).toBe(false);
    const pd = abierto(E, p.id);
    expect(limiteDe(pd)).toBeNull();
    alSembrar(E, 'lechuga');
    avanzar(E, pd.vence - E.tiempo.turno);
    const [f] = vencidos(E);
    expect(f.codigo).toBe('pedido.sin-fecha');
    expect(f.texto).toMatch(/ninguna siembra de lechuga llegaba con margen/);
    expect(f.texto).not.toMatch(/a más tardar/);
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
  it('sembrar justo en el límite, en los mejores lugares, cuenta como a tiempo: lo sembrado no cambia la cuenta', () => {
    for (const [patio, id, dec] of [
      ['balcon', 'albahaca-de-la-pizzeria', 22],
      ['fondo', 'acelga-del-comedor', 9],
    ] as const) {
      const E = M.crearPartida(1, { decInicio: dec, patio }),
        p = pedido(id),
        pd = abierto(E, id),
        lim = limiteDe(pd)!,
        antes = pd.cuenta[lim - pd.desde];
      E.recursos.sobres[p.especie] = 20;
      avanzar(E, lim - E.tiempo.turno);
      const mejores = Object.keys(E.mundo.celdas)
        .filter((c) => !E.mundo.celdas[c].planta && !M.zonasDe(E).find((z) => z.id === E.mundo.celdas[c].zona)!.cria)
        .sort((a, b) => M.evaluarCelda(E, p.especie, b)!.puntaje - M.evaluarCelda(E, p.especie, a)!.puntaje)
        .slice(0, 5);
      for (const c of mejores) expect(M.despachar(E, { tipo: 'sembrar', slug: p.especie, celda: c }).ok, c).toBe(true);
      expect(pd.sembrado).toBe(lim);
      avanzar(E, pd.vence - E.tiempo.turno);
      const [f] = vencidos(E);
      expect(f.codigo, id).toBe('pedido.no-alcanzo');
      expect(pd.cuenta[lim - pd.desde], id).toBe(antes);
    }
  });
  it('si se sembró antes del límite pero en mala época, dice que con ese tiempo no llegaba', () => {
    const E = partida(22),
      pd = abierto(E, 'albahaca-de-la-pizzeria');
    expect(llegaA(E, 'albahaca', E.tiempo.turno, pd.vence)).toBe(false);
    expect(limiteDe(pd)).toBeGreaterThan(E.tiempo.turno);
    alSembrar(E, 'albahaca');
    avanzar(E, pd.vence - E.tiempo.turno);
    const [f] = vencidos(E);
    expect(f.codigo).toBe('pedido.a-destiempo');
    expect(f.texto).toMatch(
      /Sembraste albahaca a principios de agosto, pero con el tiempo de esa época no llegaba a dar cosecha/,
    );
    expect(f.texto).toMatch(/crece más lento: un año normal son unas \d+ décadas/);
    const c = { dias: 94, decadas: 14, masLento: true, limite: 'fines de septiembre', llevas: 0 };
    const de = deUnPedido(E, pd, pedido(pd.id)),
      s = { cuando: 'agosto', decadas: 20, justo: false, puedeEspigar: false };
    expect(pedidoADestiempo(de, c, s).texto).toMatch(/tardaba unas 20 décadas y no llegaba/);
    expect(pedidoADestiempo(de, c, { ...s, decadas: 16, justo: true }).texto).toMatch(
      /tardaba unas 16 décadas, y en un año normal llegaba, pero sin margen/,
    );
    expect(pedidoADestiempo(de, c, { ...s, decadas: Infinity, puedeEspigar: true }).texto).toMatch(
      /no llegaba a dar cosecha, o se arriesgaba a espigar antes/,
    );
  });
  it('el límite es el último turno que llega: después ya no llega ninguno', () => {
    for (const p of M.PEDIDOS)
      for (const [d] of p.cuando) {
        const E = partida(d),
          pd = abierto(E, p.id),
          u = ultimaSiembra(E, pd, p)!;
        expect(limiteDe(pd), p.id).toBe(u);
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
 * La cuenta, contra el juego de verdad: desde el momento en que llega el pedido, alguien que planifica
 * siembra cinco lugares, riega según el pronóstico, cubre, trata, raleá, tutora, trasplanta cuando es época y
 * vuelve a sembrar si pierde la siembra. Dice si llega a la primera cosecha antes de la fecha.
 */
function primeraCosechaATiempo(E0: Estado, p: M.Pedido, cuando: 'temprano' | 'limite' | 'tarde'): boolean | null {
  const E = structuredClone(E0),
    R = M.regionDe(E),
    sp = M.ESPECIES[p.especie];
  E.recursos.sobres[p.especie] = 20;
  // en una partida jugada: lo que ya estaba plantado no cuenta, se prueba la siembra nueva
  E.progreso.pedidos.abiertos = [];
  const ajenas = new Set(Object.keys(E.mundo.plantas)),
    pd = abierto(E, p.id);
  // tarde: una década después de la última siembra que llega en un año normal, sin el margen. Si ahí
  // el cuaderno solo dice que una hoja se arriesgaba a espigar, no dice que no llegaba: no se cuenta
  let siembra = limiteDe(pd)!;
  if (cuando === 'tarde') {
    siembra = pd.vence;
    while (!llegabaJusto(pd, siembra)) siembra--;
    siembra++;
    if (!Number.isFinite(tardaba(pd, siembra)) && puedeEspigar(sp)) return null;
  }
  if (cuando === 'temprano')
    for (let s = pd.desde; s <= pd.vence; s++)
      if (M.ventana(R, p.especie, M.decadaDelTurno(E, s)) === 'ideal' && llegaA(E, p.especie, s, pd.vence)) {
        siembra = s;
        break;
      }
  // si el año termina antes de la fecha, se sigue otro año en el mismo patio
  const pasar = (): void => {
    if (E.tiempo.terminado) M.despachar(E, { tipo: 'seguir' });
    M.pasarDecada(E);
  };
  while (E.tiempo.turno < siembra) pasar();
  const zonas = M.zonasDe(E),
    cria = zonas.find((z) => z.cria),
    deCria = (c: string): boolean => E.mundo.celdas[c].zona === cria?.id,
    puntaje = (c: string): number => M.evaluarCelda(E, p.especie, c)!.puntaje,
    /** las n mejores celdas de la almaciguera o de la tierra; si están ocupadas, se hace lugar, como en la cuenta */
    lugares = (n: number, enCria: boolean): string[] => {
      const cs = Object.keys(E.mundo.celdas)
        .filter((c) => deCria(c) === enCria && !esNuestra(E.mundo.celdas[c].planta))
        .sort((a, b) => puntaje(b) - puntaje(a))
        .slice(0, n);
      for (const c of cs) {
        const id = E.mundo.celdas[c].planta;
        if (id && E.mundo.plantas[id]) quitarPlanta(E, E.mundo.plantas[id], false);
      }
      return cs;
    },
    esNuestra = (id: string | null): boolean => !!id && !ajenas.has(id),
    nuestras = () => Object.values(E.mundo.plantas).filter((pl) => esNuestra(pl.id)),
    almacigo = !!(sp.dt && cria && /almacigo/.test(M.metodoDe(p.especie, E.tiempo.dec) || ''));
  const sembrar = (): void => {
    for (const c of lugares(5, almacigo)) M.despachar(E, { tipo: 'sembrar', slug: p.especie, celda: c });
  };
  sembrar();
  while (E.tiempo.turno <= pd.vence) {
    // si una primavera fría se llevó la siembra, se vuelve a sembrar
    if (!nuestras().length) sembrar();
    for (const pl of nuestras()) {
      if (pl.etapa === 'cosechable') return true;
      if (deCria(pl.celda)) {
        if (pl.avisoListo && M.ventana(R, pl.slug, E.tiempo.dec, 'trasplante') !== 'fuera')
          for (let i = 0; i < 6 && E.mundo.plantas[pl.id]; i++) {
            const [c] = lugares(1, false);
            if (!c || !M.despachar(E, { tipo: 'trasplantar', planta: pl.id, celda: c }).ok) break;
          }
        continue;
      }
      if (pl.n > 1) M.despachar(E, { tipo: 'ralear', planta: pl.id });
      if (sp.cuidados.includes('tutorado') && !pl.tutor) M.despachar(E, { tipo: 'tutorar', planta: pl.id });
      if (pl.plaga) M.despachar(E, { tipo: 'tratar', planta: pl.id });
    }
    if (E.tiempo.pronostico.pHelada > 40) for (const z of zonas) M.despachar(E, { tipo: 'manta', zona: z.id });
    for (const a of M.prevenciones(E)) M.despachar(E, a);
    // la almaciguera, bajo techo y abrigada, se riega a fondo para que nazca
    for (const z of zonas)
      M.despachar(E, { tipo: 'riego', zona: z.id, nivel: z.cria ? 3 : riegoCuidadoso(E, z.id, p.especie) });
    pasar();
  }
  return false;
}

const SEMILLAS = Array.from({ length: 16 }, (_, i) => i + 1);
/** Las décadas del año en que puede llegar un pedido. */
const decadasDe = (p: M.Pedido): number[] =>
  Array.from({ length: 36 }, (_, i) => i + 1).filter((d) => p.cuando.some(([a, b]) => enTramo(d, a, b)));
const puedeCumplirse = (E: Estado, p: M.Pedido): boolean =>
  hayFechaDeSiembra(E, p.especie, E.tiempo.turno, E.tiempo.turno + p.plazo);

/**
 * «A más tardar» es verdad si la mayoría de los años alcanza con sembrar temprano o justo en el límite,
 * y no alcanza con sembrar una década después de lo que da la cuenta sin margen. La cuenta es la de un
 * año normal: en un año fresco o caluroso la cosecha se adelanta o se atrasa, así que no se pide todos
 * los años.
 */
function esVerdad(llegadas: Estado[], p: M.Pedido, que: string): void {
  const temprano = llegadas.filter((E) => primeraCosechaATiempo(E, p, 'temprano')).length,
    enElLimite = llegadas.filter((E) => primeraCosechaATiempo(E, p, 'limite')).length,
    tarde = llegadas.map((E) => primeraCosechaATiempo(E, p, 'tarde')).filter((x) => x !== null);
  expect(temprano, `${que}: sembrando temprano`).toBeGreaterThan(llegadas.length / 2);
  expect(enElLimite, `${que}: sembrando en el límite`).toBeGreaterThan(llegadas.length / 2);
  expect(tarde.filter(Boolean).length, `${que}: sembrando tarde`).toBeLessThan(tarde.length / 2 || 1);
}

describe.each(Object.keys(M.PLANTILLAS))('la cuenta es verdad en el patio %s', (patio) => {
  it('en una partida nueva, llegue el pedido en la década que llegue', () => {
    for (const p of M.PEDIDOS)
      for (const d of decadasDe(p)) {
        const llegadas = SEMILLAS.map((s) => M.crearPartida(s, { decInicio: d, patio })).filter((E) =>
          puedeCumplirse(E, p),
        );
        if (llegadas.length) esVerdad(llegadas, p, `${p.id}, década ${d}`);
      }
  });
  it('en el segundo año de una partida jugada, con el patio ocupado y la tierra trabajada', () => {
    const llegadas = new Map<string, [M.Pedido, Estado[]]>();
    for (const s of SEMILLAS)
      jugarUnAnio(M, s, undefined, {
        patio,
        decadas: 72,
        alEmpezarLaDecada: (E: Estado) => {
          if (E.tiempo.turno < 36) return;
          for (const p of M.PEDIDOS)
            if (decadasDe(p).includes(E.tiempo.dec) && puedeCumplirse(E, p)) {
              const k = `${p.id}, década ${E.tiempo.dec}`;
              llegadas.set(k, [p, [...(llegadas.get(k)?.[1] ?? []), structuredClone(E)]]);
            }
        },
      });
    for (const [k, [p, Es]] of llegadas) esVerdad(Es, p, k);
  });
  it('en una partida nueva, cada pedido llega en alguna década: en cada patio hay dónde hacerle lugar', () => {
    for (const p of M.PEDIDOS)
      expect(
        decadasDe(p).some((d) => SEMILLAS.some((s) => puedeCumplirse(M.crearPartida(s, { decInicio: d, patio }), p))),
        p.id,
      ).toBe(true);
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
