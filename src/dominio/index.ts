/** Puerta del motor. La interfaz y los tests entran por acá; adentro no hay DOM ni dibujo. */
export * from './tipos';
export {
  CARACTERES_DEL_ANIO,
  ETAPAS,
  NIVELES_DE_RIEGO,
  PLAGAS,
  TIPOS_DE_EVENTO,
  VENTANAS,
  idCelda,
  xy,
} from './vocabulario';
export { especieDe, nombreDe, vivas } from './planta';
export { ABRIGO, abrigo, enRiesgo, riesgoHelada } from './abrigo';
export { despachar, puede, puedeMoverse } from './acciones';
export { apuntar } from './diario';
export { balance } from './balance';
export { ESPECIES, META, metodoDe, objetivoCosecha, semillasPorSiembra, ventana } from './catalogo';
export { CARACTERES, estacionDe, fechaDe, invierno, pTemporadaHelada } from './clima';
export { RATOS, RIEGOS, costoRiego, crearPartida, plantaEn, puntoDeTrasplante, ratosLibres } from './estado';
export { altoDe, bloqueDe, celdasDePlanta, conEspacioReal, espacioReal, marco, porCelda } from './espacio';
export { bajoTunel, evaluarCelda, factoresPlanta, floresAbiertas, sueloDeCelda } from './factores';
export { MISIONES } from './misiones';
export {
  PATIOS,
  PATIO_INICIAL,
  celdasDe,
  horasSol,
  idsDeZonas,
  macetaDe,
  patioDe,
  zona,
  zonaDe,
  zonaDeCelda,
  zonaDeTunel,
  zonasDe,
} from './patio';
export type { Patio, ZonaDePatio } from './patio';
export { conHojas, horasSolGeometria, posicionSol } from './sol';
export { pasarDecada } from './tiempo';
export { VERSION, esPartidaValida, migrar } from './migraciones';
