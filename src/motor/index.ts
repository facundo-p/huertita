/** Puerta del motor. La interfaz y los tests entran por acá; adentro no hay DOM ni dibujo. */
export * from './tipos';
export { ABRIGO, abrigo, enRiesgo, riesgoHelada } from './abrigo';
export { despachar } from './acciones';
export { balance } from './balance';
export { ESPECIES, META, metodoDe, objetivoCosecha, semillasPorSiembra, ventana } from './catalogo';
export { CARACTERES, estacionDe, fechaDe, invierno, pTemporadaHelada } from './clima';
export { RATOS, RIEGOS, costoRiego, crearPartida, plantaEn, ratosLibres } from './estado';
export { evaluarCelda, factoresPlanta, floresAbiertas, sueloDeCelda } from './factores';
export { MISIONES } from './misiones';
export { ALTO, ANCHO, MACETAS, MAPA, ZONAS, ZONA_IDS, celdasDe, horasSol, zonaDeCelda } from './patio';
export { pasarDecada } from './tiempo';
export { esPartidaValida, migrar } from './migraciones';
