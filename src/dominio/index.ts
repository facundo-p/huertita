/** Puerta del motor. La interfaz y los tests entran por acá; adentro no hay DOM ni dibujo. */
export * from './tipos';
export { ETAPAS, NIVELES_DE_RIEGO, PLAGAS, TIPOS_DE_EVENTO, VENTANAS, idCelda, xy } from './vocabulario';
export { especieDe, nombreDe, vivas } from './planta';
export { compostera, dosisDeCompost, mezclaDe, secosParaEnderezar, secosPorVerde } from './estructuras';
export { faseDeCaducos, hayCaducos, jardinInicial, topeDePasto } from './jardin';
export type { FaseDeCaducos } from './jardin';
export { SORPRESAS, anunciada, blancos, prevenciones, sorpresaPorId } from './sorpresas';
export type { Sorpresa } from './sorpresas';
export { PEDIDOS, decadaDelTurno, llevas, pedidoPorId } from './pedidos';
export type { Pedido } from './pedidos';
export { ABRIGO, abrigo, aguantaCon, enRiesgo, riesgoHelada } from './abrigo';
export { costoDe, despachar, puede, puedeMoverse, recibeCompost } from './acciones';
export { apuntar } from './diario';
export { balance } from './balance';
export { ESPECIES, META, metodoDe, objetivoCosecha, semillasPorSiembra, ventana } from './catalogo';
export { estacionDe, fechaDe, invierno } from './calendario';
export { pTemporadaHelada } from './clima';
export { REGIONES, decadaEstacional, regionDe, regionDelPatio, regionPorId } from './region';
export type { Region } from './region';
export { RATOS, RIEGOS, costoRiego, crearPartida, plantaEn, puntoDeTrasplante, ratosLibres } from './estado';
export { altoDe, bloqueDe, celdasDePlanta, conEspacioReal, espacioReal, marco, porCelda } from './espacio';
export { bajoTunel, evaluarCelda, factoresPlanta, floresAbiertas, sueloDeCelda } from './factores';
export { MISIONES } from './misiones';
export {
  PLANTILLAS,
  PLANTILLA_INICIAL,
  celdasDe,
  copiarPlantilla,
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
export { esPerdida } from './textos/frase';
export { VERSION, esPartidaValida, migrar } from './migraciones';
