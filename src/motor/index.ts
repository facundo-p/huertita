/** Puerta del motor. La interfaz y los tests entran por acá; adentro no hay DOM ni dibujo. */
export * from './tipos';
export { ABRIGO, abrigo, enRiesgo, riesgoHelada } from './abrigo';
export { despachar } from './acciones';
export { balance } from './balance';
export { ESPECIES, META, metodoDe, objetivoCosecha, semillasPorSiembra, ventana } from './catalogo';
export { CARACTERES, estacionDe, fechaDe, invierno, pTemporadaHelada } from './clima';
export { RATOS, RIEGOS, costoRiego, crearPartida, plantaEn, ratosLibres } from './estado';
export { bajoTunel, evaluarCelda, factoresPlanta, floresAbiertas, sueloDeCelda } from './factores';
export { MISIONES } from './misiones';
export { PATIOS, PATIO_INICIAL, celdasDe, horasSol, idsDeZonas, macetaDe, patioDe, zona, zonaDe, zonaDeCelda, zonaDeTunel, zonasDe } from './patio';
export type { Patio, ZonaDePatio } from './patio';
export { conHojas, horasSolGeometria, posicionSol } from './sol';
export { pasarDecada } from './tiempo';
export { VERSION, esPartidaValida, migrar } from './migraciones';
