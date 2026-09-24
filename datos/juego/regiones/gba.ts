/**
 * Gran Buenos Aires: el conurbano, donde se juega hoy.
 * [REPO] huertapp · scripts/clima-gba.mjs — Ezeiza Aero, normales SMN 1991-2020 y heladas FAUBA
 * (umbral 3 °C). El calendario es el de huertapp (`calendario.decadas.conurbano`).
 */
import catalogo from '../../catalogo.json';
import type { Catalogo } from '../../contrato';
import type { Region } from '../region';

const especies = (catalogo as unknown as Catalogo).especies;

export const gba: Region = {
  id: 'gba',
  nombre: 'Gran Buenos Aires',
  hemisferio: 'S',
  latitud: -34.6,
  clima: {
    media: [24.1, 23.0, 21.0, 17.1, 13.6, 10.8, 9.8, 11.8, 13.8, 16.8, 20.0, 22.7],
    maxima: [30.3, 28.8, 26.8, 22.9, 19.0, 15.9, 15.0, 17.5, 19.3, 22.2, 25.8, 29.0],
    minima: [17.9, 17.1, 15.4, 11.8, 8.9, 6.1, 5.2, 6.6, 8.3, 11.2, 13.8, 16.2],
    /** [SUPUESTO] lluvia mensual aproximada de Ezeiza, en mm. No está en huertapp. */
    lluvia: [110, 105, 115, 95, 75, 55, 55, 60, 65, 105, 100, 100],
  },
  // primera helada: 29 de abril; última: 5 de octubre. [SUPUESTO] las tardías, de septiembre a fines de octubre
  heladas: { primera: 119, desvioPrimera: 16, ultima: 278, desvioUltima: 23, tardias: [25, 31] },
  /** [SUPUESTO] los cuatro años típicos del GBA y cuánto mueven la temperatura, la lluvia y las heladas */
  caracteres: {
    normal: {
      nombre: 'Año normal',
      dT: 0,
      lluvia: 1,
      helada: 0,
      texto: 'Sin señales fuertes: un año parecido al promedio.',
    },
    nina: {
      nombre: 'Año Niña',
      dT: 0.7,
      lluvia: 0.62,
      helada: 0,
      texto: 'Se espera menos lluvia que lo normal y un verano caluroso. El riego va a pesar.',
    },
    nino: {
      nombre: 'Año Niño',
      dT: -0.2,
      lluvia: 1.45,
      helada: 0,
      texto: 'Se espera más lluvia que lo normal: ojo con babosas y encharcamientos.',
    },
    tardia: {
      nombre: 'Año de heladas tardías',
      dT: -0.8,
      lluvia: 1,
      helada: 0.18,
      texto: 'Primavera fría: las heladas pueden estirarse hasta fines de octubre.',
    },
  },
  /** [SUPUESTO] el paraíso y otros caducos del GBA tienen hoja de octubre a abril */
  caducos: { conHojasDesde: 28, hasta: 12 },
  textos: { enElLugar: 'en el GBA', elLugar: 'el conurbano' },
  calendario: Object.fromEntries(Object.entries(especies).map(([slug, e]) => [slug, e.dec])),
};
