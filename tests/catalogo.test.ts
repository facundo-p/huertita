/**
 * El juego nunca contradice a huertapp, y ningún hueco de huertapp rompe una regla.
 * Si `npm run datos:sync` trae algo que rompe esto, el problema se ve acá y no jugando.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import catalogo from '../datos/catalogo.json';
import candado from '../datos/fuente.lock.json';
import { derivarCatalogo, validarFuente } from '../datos/contrato';
import { ESPECIES, MISIONES, crearPartida, despachar, pasarDecada, ventana } from '../src/motor';
import { ESTILO } from '../src/arte/estilos';

const slugs = Object.keys(ESPECIES);

describe('catálogo traído de huertapp', () => {
  it('tiene las especies que dice el candado', () => {
    expect(slugs.length).toBe(candado.especies);
    expect(Object.keys(catalogo.especies).length).toBe(candado.especies);
  });
  it('si está la copia local de huertapp al lado, el catálogo sale de ella tal cual', () => {
    const ruta = new URL('../../info-huerta/data/huerta_gba_enriquecido.json', import.meta.url);
    if (!existsSync(ruta)) return; // en CI no está: lo cubre `npm run datos:check`
    const texto = readFileSync(ruta, 'utf8');
    if (createHash('sha256').update(texto).digest('hex') !== candado.sha256) return; // tu copia local va adelante: corré datos:sync
    expect(validarFuente(JSON.parse(texto)).errores).toEqual([]);
    expect(derivarCatalogo(JSON.parse(texto))).toEqual(catalogo);
  });
});

describe('ninguna especie queda con huecos para el motor', () => {
  it.each(slugs)('%s', (s) => {
    const sp = ESPECIES[s];
    for (const v of [
      sp.hmin,
      sp.hideal,
      sp.dg.min,
      sp.dg.max,
      sp.dc.min,
      sp.dc.max,
      ...Object.values(sp.tg),
      ...Object.values(sp.tc),
    ])
      expect(Number.isFinite(v)).toBe(true);
    expect(sp.hmin).toBeLessThanOrEqual(sp.hideal);
    expect(sp.tg.min).toBeLessThanOrEqual(sp.tg.ideal_min);
    expect(sp.tg.ideal_min).toBeLessThanOrEqual(sp.tg.ideal_max);
    expect(sp.tg.ideal_max).toBeLessThanOrEqual(sp.tg.max);
    expect(sp.tc.tolera_min).toBeLessThanOrEqual(sp.tc.ideal_min);
    expect(sp.tc.ideal_min).toBeLessThanOrEqual(sp.tc.ideal_max);
    expect(sp.tc.ideal_max).toBeLessThanOrEqual(sp.tc.tolera_max);
    for (const otra of [...sp.buenas, ...sp.malas])
      expect(ESPECIES[otra], `${s} se asocia con "${otra}", que no existe`).toBeDefined();
    expect(sp.familia).not.toBe('');
  });
  it('los premios de los logros son especies que existen', () => {
    for (const m of MISIONES)
      for (const s of Object.keys(m.premio)) expect(ESPECIES[s], `${m.id} premia "${s}"`).toBeDefined();
  });
  it('todas las especies con dibujo propio existen (si huertapp renombra una, se ve acá)', () => {
    for (const s of Object.keys(ESTILO))
      expect(ESPECIES[s], `hay dibujo para "${s}" y no está en el catálogo`).toBeDefined();
  });
});

/**
 * Contradicciones conocidas entre el juego y huertapp. Cada una es una deuda con nombre:
 * el test exige que SIGA fallando, así el día que se arregla avisa que hay que borrarla de acá.
 */
const CONTRADICCIONES_CONOCIDAS: Record<string, string> = {
  berenjena:
    'huertapp la siembra en julio-agosto en "almácigo protegido" y pide 15 °C de suelo; la almaciguera del juego (bajo alero, +2 °C) no llega. Falta modelar el almácigo de adentro o con cama caliente.',
  batata: 'igual que la berenjena: se arranca de guías en almácigo protegido a 15 °C o más.',
};

describe('el juego no contradice a huertapp', () => {
  it.each(slugs)('%s germina si se siembra en época ideal y bien regada', (s) => {
    const ideales = ESPECIES[s].dec.siembra_ideal ?? [];
    if (!ideales.length) return;
    const sp = ESPECIES[s],
      celda = sp.dt ? '0,7' : '0,4'; // con trasplante va a la almaciguera; si no, directa al bancal elevado
    // se prueba en cada década ideal con un año normal: en al menos una tiene que poder nacer
    const nacio = ideales.some((dec) => {
      const E = crearPartida(11, { decInicio: dec, caracter: 'normal' });
      E.sobres[s] = 3;
      E.riego.almacigo = 3;
      E.riego.elevado = 3;
      despachar(E, { tipo: 'sembrar', slug: s, celda });
      for (let i = 0; i < 4 && Object.values(E.plantas)[0]?.etapa === 'semilla'; i++) pasarDecada(E);
      const pl = Object.values(E.plantas)[0];
      return !!pl && pl.etapa !== 'semilla';
    });
    if (CONTRADICCIONES_CONOCIDAS[s])
      expect(nacio, `${s} ya germina: borrala de CONTRADICCIONES_CONOCIDAS`).toBe(false);
    else expect(nacio, `${s} no logra germinar en ninguna de sus décadas ideales (${ideales.join(',')})`).toBe(true);
  });
  it('sembrar en década ideal nunca se marca como fuera de época', () => {
    for (const s of slugs) for (const d of ESPECIES[s].dec.siembra_ideal ?? []) expect(ventana(s, d)).toBe('ideal');
  });
});
