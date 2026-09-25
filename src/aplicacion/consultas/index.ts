/**
 * Consultas: lo que la interfaz necesita saber de la partida, ya calculado y tipado. Son funciones
 * puras sobre el estado; devuelven datos, nunca HTML. La vista no lee el estado directamente.
 */
export { escena, nombreCorto, zonaCerca, type VistaDeEscena } from './escena';
export { horasDeSol } from './sol';
export { hud, resumenDePartida, type Hud, type Rato } from './hud';
export { almanaque, sobresDisponibles, type EspecieEnLista } from './almanaque';
export { proteccion, type AbrigoMovil, type Proteccion, type ZonaAbrigada } from './abrigos';
export { fichaDeCelda, type AccionDePlanta, type FichaDeCelda, type PlantaEnFicha } from './celda';
export { fichaDeEspecie, type FichaDeEspecie, type Vecino } from './especie';
export { compost, type AccionDelCompost, type Compost } from './compost';
export { pedidos, type PedidoALaVista, type Pedidos } from './pedidos';
