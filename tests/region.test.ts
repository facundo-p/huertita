/**
 * La región como dato: el GBA está bien armado y nada del código supone el hemisferio sur. Para
 * probarlo, una región de mentira en el norte: el GBA espejado (misma latitud, medio año corrido).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Patio } from '../datos/juego/patio';
import { validarRegion, type Region } from '../datos/juego/region';
import * as M from '../src/dominio';

const medioAnio = <T>(xs: T[]): T[] => [...xs.slice(6), ...xs.slice(0, 6)];
const correr = (dec: number): number => ((dec + 17) % 36) + 1;
const GBA = M.REGIONES.gba;
const NORTE: Region = {
  ...GBA,
  id: 'espejo-norte',
  nombre: 'El GBA espejado',
  hemisferio: 'N',
  latitud: -GBA.latitud,
  clima: {
    media: medioAnio(GBA.clima.media),
    maxima: medioAnio(GBA.clima.maxima),
    minima: medioAnio(GBA.clima.minima),
    lluvia: medioAnio(GBA.clima.lluvia),
  },
  heladas: {
    ...GBA.heladas,
    primera: GBA.heladas.primera + 182,
    ultima: GBA.heladas.ultima + 182 - 365,
    tardias: [correr(GBA.heladas.tardias[0]), correr(GBA.heladas.tardias[1])],
  },
  caducos: { conHojasDesde: correr(GBA.caducos.conHojasDesde), hasta: correr(GBA.caducos.hasta) },
  textos: { enElLugar: 'en el espejo', elLugar: 'el espejo' },
};

describe('las regiones', () => {
  it.each(Object.keys(M.REGIONES))('%s está bien armada', (id) => {
    expect(validarRegion(M.REGIONES[id])).toEqual([]);
  });
  it('la región de mentira también, y una mal armada se nota', () => {
    expect(validarRegion(NORTE)).toEqual([]);
    expect(validarRegion({ ...NORTE, latitud: -40 })).toContain('la latitud no corresponde al hemisferio');
    expect(validarRegion({ ...NORTE, heladas: GBA.heladas }).join()).toMatch(/no corresponde al hemisferio/);
  });
  it('el calendario del GBA es el de huertapp', () => {
    for (const slug of Object.keys(M.ESPECIES)) expect(GBA.calendario[slug]).toEqual(M.ESPECIES[slug].dec);
  });
});

describe('en el hemisferio norte', () => {
  it('al mediodía el sol da al sur, alto a fines de junio y bajo a fines de diciembre', () => {
    const junio = M.posicionSol(NORTE.latitud, 172, 12),
      diciembre = M.posicionSol(NORTE.latitud, 355, 12);
    expect(junio.norte).toBeLessThan(0);
    expect(diciembre.norte).toBeLessThan(0);
    expect(junio.arriba).toBeGreaterThan(diciembre.arriba);
  });
  it('las estaciones se invierten', () => {
    expect(M.estacionDe(GBA, 2)).toBe('verano');
    expect(M.estacionDe(NORTE, 2)).toBe('invierno');
    expect(M.estacionDe(GBA, 20)).toBe('invierno');
    expect(M.estacionDe(NORTE, 20)).toBe('verano');
    expect(M.invierno(NORTE, 36)).toBeGreaterThan(0.95);
    expect(M.invierno(NORTE, 18)).toBeLessThan(0.05);
  });
  it('la primera helada cae en el otoño de cada hemisferio', () => {
    const primeraHelada = (R: Region, desde: number): number => {
      for (let i = 0; i < 36; i++) {
        const d = ((desde - 1 + i) % 36) + 1;
        if (M.pTemporadaHelada(R, d) > 0.5) return d;
      }
      throw new Error('no hiela nunca');
    };
    // se busca desde pleno verano de cada uno
    const sur = primeraHelada(GBA, 1),
      norte = primeraHelada(NORTE, 19);
    expect(M.estacionDe(GBA, sur)).toBe('otoño');
    expect(M.estacionDe(NORTE, norte)).toBe('otoño');
    expect(norte).toBe(correr(sur));
    expect(M.pTemporadaHelada(NORTE, 2)).toBeGreaterThan(0.9);
    expect(M.pTemporadaHelada(NORTE, 20)).toBeLessThan(0.01);
  });

  describe('un patio en el norte', () => {
    const ZONA = {
      id: 'z',
      letra: 'z',
      tipo: 'suelo',
      nombre: 'la z',
      conArticulo: 'la z',
      desc: '',
      suelo: 'FRANCO_FERTIL',
      mo: 50,
      drenaje: 0.2,
      hondo: 40,
      riegoCosto: [0, 1, 2, 3],
    } as const;
    // un paredón al sur del patio: en el norte es el que hace sombra
    const patio = (region: string): Patio => ({
      ...M.PLANTILLAS.fondo,
      id: 'prueba-' + region,
      region,
      sol: 'geometria',
      horizonte: 0,
      plano: ['zzzz', 'zzzz', 'zzzz', 'zzzz', 'aaaa'],
      zonas: [
        { ...ZONA, riegoCosto: [0, 1, 2, 3] },
        { ...ZONA, id: 'a', letra: 'a', cria: true, capacidad: 50, riegoCosto: [0, 1, 1, 1] },
      ],
      estructuras: [],
      obstaculos: [{ tipo: 'muro', nombre: 'paredón', desde: [0, 4], hasta: [4, 4], alto: 3 }],
    });
    beforeAll(() => {
      M.REGIONES[NORTE.id] = NORTE;
    });
    afterAll(() => {
      delete M.REGIONES[NORTE.id];
    });
    it('un paredón al sur tapa el sol en el norte y no en el sur', () => {
      const norte = patio(NORTE.id),
        sur = patio('gba');
      expect(M.horasSolGeometria(norte, 1, 3, 36)).toBeLessThan(2);
      expect(M.horasSolGeometria(sur, 1, 3, 18)).toBeGreaterThan(8);
    });
    it('se juega un año entero con su clima, sus años típicos y su calendario', () => {
      M.PLANTILLAS.espejo = { ...patio(NORTE.id), id: 'espejo' };
      try {
        const E = M.crearPartida(4, { patio: 'espejo' });
        expect(E.meta.region).toBe(NORTE.id);
        expect(Object.keys(NORTE.caracteres)).toContain(E.tiempo.caracter);
        const heladas: number[] = [];
        for (let i = 0; i < 36; i++) {
          if (E.tiempo.clima.helada) heladas.push(E.tiempo.clima.dec);
          M.pasarDecada(E);
        }
        expect(E.tiempo.terminado).toBe(true);
        expect(heladas.length).toBeGreaterThan(0);
        for (const d of heladas) expect(M.estacionDe(NORTE, d)).not.toBe('verano');
        expect(M.esPartidaValida(JSON.parse(JSON.stringify(E)))).toBe(true);
      } finally {
        delete M.PLANTILLAS.espejo;
      }
    });
  });
});
