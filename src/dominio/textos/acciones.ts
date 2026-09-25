/**
 * Lo que dicen las acciones del jugador: por qué no se puede (la razón que devuelve `puede`) y qué
 * pasó cuando se pudo (lo que queda en el cuaderno).
 */
import type { Especie, ZonaDePatio } from '../tipos';
import { nombreDe } from '../planta';
import { frase, type Frase } from './frase';

// ── por qué no se puede ──
export const sinRatos = (): string => 'No te quedan ratos esta década.';
export const tunelLleva = (ratos: number): string => 'Armar o sacar el microtúnel lleva ' + ratos + ' ratos.';
export const anioTerminado = (): string => 'El año terminó.';
export const anioSinTerminar = (): string => 'Todavía no terminó el año: seguí jugando este.';
export const desconocida = (tipo: string): string => 'Acción desconocida: ' + tipo;
export const noSeSiembraAhi = (): string => 'No se puede sembrar ahí.';
export const noEntra = (sp: Especie): string =>
  sp.nombre +
  ' hecha ocupa ' +
  sp.marco.huella +
  ' celdas y ahí no entran: probá más al norte o al oeste, en el mismo cantero.';
export const celdaOcupada = (): string => 'Esa celda está ocupada.';
export const laDeAlLadoOcupada = (sp: Especie): string =>
  sp.nombre + ' ocupa ' + sp.marco.huella + ' celdas y la de al lado está ocupada.';
export const sinSemillas = (sp: Especie): string => 'No te quedan semillas de ' + nombreDe(sp) + '.';
export const noSeTrasplantaAhi = (): string => 'No se puede trasplantar ahí.';
export const almacigueraNoRecibe = (): string => 'La almaciguera es para criar plantines, no para recibirlos.';
export const noGermino = (): string => 'Todavía no germinó.';
export const noToleraTrasplante = (sp: Especie): string =>
  sp.nombre + ' no tolera el trasplante: si salieron varias juntas, raleá.';
export const yaGrande = (): string => 'Ya está grande para moverla.';
export const noEsDeMover = (): string => 'Solo se trasplanta un plantín o una planta que está creciendo.';
export const noCosechable = (): string => 'Todavía no está para cosechar.';
export const floresSeDejan = (): string =>
  'Las flores se dejan: trabajan atrayendo polinizadores. Podés dejarla semillar.';
export const noSemilla = (): string => 'Solo una planta madura o pasada puede dar semilla.';
export const nadaQueRalear = (): string => 'No hay nada que ralear.';
export const enAlmacigoSeRepica = (): string =>
  'En la almaciguera no se ralea: los plantines de más se repican a su lugar.';
export const nadaAhi = (): string => 'No hay nada ahí.';
export const noHaceFalta = (): string => 'No hace falta.';
export const noPideTutor = (sp: Especie): string => sp.nombre + ' no necesita tutor.';
export const tutorEnAlmacigo = (): string =>
  'En la almaciguera no se tutora: el tutor va cuando la planta está en su lugar.';
export const tutorDespuesDeGerminar = (): string => 'El tutor se pone cuando la planta ya germinó.';
export const sinPlaga = (): string => 'No tiene plaga.';
export const mulchNoVa = (): string => 'Ahí no va mulch.';
export const yaTieneMulch = (): string => 'Ya tiene mulch.';
export const compostNoVa = (): string => 'Ahí no.';
export const compostEnAlmacigo = (): string => 'La almaciguera tiene su sustrato: el compost va en los canteros.';
export const sinCompost = (): string => 'No tenés compost maduro todavía.';
export const riegoInvalido = (): string => 'Riego inválido.';
export const riegoSinRatos = (): string => 'No te alcanzan los ratos para regar tanto esta década.';
export const tunelNoVa = (): string => 'Ahí no se puede armar un microtúnel.';
export const nadaQueTapar = (): string => 'Ahí no hay nada que tapar.';
export const yaTapado = (): string => 'Ya está tapado.';

// ── qué pasó ──
export function sembraste(
  sp: Especie,
  z: ZonaDePatio,
  semillas: number,
  bloque: number,
  fuera: boolean,
  repite: boolean,
): Frase {
  let cuantas = '.';
  if (semillas > 1)
    cuantas = z.cria ? ': una tanda de ' + semillas + ' celdas.' : ': ' + semillas + ' semillas juntas.';
  let txt = 'Sembraste ' + nombreDe(sp) + ' en ' + z.nombre.toLowerCase() + cuantas;
  if (bloque > 1) txt += ' Se guardó ' + bloque + ' celdas: cuando crezca las va a tapar.';
  if (fuera) txt += ' Está fuera de época: va a venir floja.';
  if (repite) txt += ' Repetís familia en la misma tierra: rinde menos y junta plagas.';
  return frase('accion.sembrar', txt);
}

export type ComoFueElTrasplante = 'bien' | 'no-tolera' | 'chico' | 'fuera-de-ventana';
export function trasplantaste(sp: Especie, como: ComoFueElTrasplante, repite: boolean): Frase {
  let txt = 'Trasplantaste ' + nombreDe(sp) + '.';
  if (como === 'no-tolera')
    txt += ' No tolera el trasplante: la raíz sufrió mucho. Esta especie va de siembra directa.';
  if (como === 'chico')
    txt += ' Era muy chico todavía (se trasplanta a los ' + sp.dt!.min + '–' + sp.dt!.max + ' días).';
  if (como === 'fuera-de-ventana') txt += ' Está fuera de la ventana de trasplante.';
  if (repite) txt += ' Repetís familia en esa tierra.';
  return frase('accion.trasplantar', txt);
}

export interface ComoFueLaCosecha {
  porciones: number;
  cuajoPoco: 'tunel' | 'sin-flores' | null;
  dulce: boolean;
  sinTutor: boolean;
  apretadas: boolean;
}
export function cosechaste(sp: Especie, c: ComoFueLaCosecha): Frase {
  let txt = 'Cosechaste ' + nombreDe(sp) + ': ' + c.porciones + ' porciones.';
  if (c.cuajoPoco === 'tunel') txt += ' Bajo el microtúnel no entran polinizadores: cuajó poco.';
  if (c.cuajoPoco === 'sin-flores') txt += ' Cuajó poco: faltan flores que atraigan polinizadores.';
  if (c.dulce) txt += ' La helada la endulzó.';
  if (c.sinTutor) txt += ' Sin tutor rindió menos.';
  if (c.apretadas) txt += ' Crecieron apretadas por no ralear: rindió menos.';
  return frase('accion.cosechar', txt);
}
export const terminoSuCiclo = (sp: Especie): Frase =>
  frase('accion.fin-de-ciclo', sp.nombre + ' terminó su ciclo. Los restos van a la compostera.');

export function dejasSemillar(sp: Especie, como: 'bienal' | 'fruto' | 'resto'): Frase {
  const cuanto = {
    bienal: 'Es bienal: florece recién después del frío, va a ocupar el lugar unos 3 meses.',
    fruto: 'Apartás el mejor fruto para semilla.',
    resto: 'Va a ocupar el lugar unas 3 décadas más.',
  }[como];
  return frase('accion.semillar', 'Dejás semillar ' + nombreDe(sp) + '. ' + cuanto);
}
export function raleaste(sp: Especie, dejo: number, saco: number, porcionesQueSeComen: number | null): Frase {
  let txt =
    'Raleaste ' +
    nombreDe(sp) +
    ': dejaste ' +
    (dejo === 1 ? 'la más fuerte' : 'las ' + dejo + ' más fuertes') +
    ' y sacaste ' +
    saco +
    '.';
  txt +=
    porcionesQueSeComen != null
      ? ' El raleo se come: +' + porcionesQueSeComen + ' porciones de hojitas tiernas.'
      : ' Van a la compostera.';
  return frase('accion.ralear', txt);
}
export const sacaste = (sp: Especie): Frase =>
  frase('accion.arrancar', 'Sacaste ' + nombreDe(sp) + '. Va a la compostera.');
export const tutor = (sp: Especie): Frase => frase('accion.tutorar', 'Le pusiste tutor a ' + nombreDe(sp) + '.');
export const mulch = (): Frase =>
  frase('accion.mulch', 'Cubriste el suelo con pasto seco. Guarda humedad, frena yuyos y de a poco se hace tierra.');
export const compost = (mo: number): Frase =>
  frase('accion.compost', 'Incorporaste compost: la materia orgánica sube a ' + Math.round(mo) + ' %.');
export const armasteTunel = (z: ZonaDePatio, grados: number, deDia: number): Frase =>
  frase(
    'accion.tunel',
    'Armaste el microtúnel sobre ' +
      z.conArticulo +
      ': unos ' +
      grados +
      ' °C de abrigo contra heladas y +' +
      deDia +
      ' °C de día, pero no entra lluvia ni polinizadores.',
  );
export const sacasteTunel = (): Frase => frase('accion.tunel-fuera', 'Sacaste el microtúnel.');
export const manta = (z: ZonaDePatio, grados: number, aguanta: number): Frase =>
  frase(
    'accion.manta',
    'Dejaste lista la manta antihelada para ' +
      z.nombre.toLowerCase() +
      '. Suma unos ' +
      grados +
      ' °C de abrigo y dura esta década: con lo que tiene puesto, ese cantero aguanta hasta ' +
      (aguanta + 0.1).toFixed(0) +
      ' °C de mínima.',
  );
