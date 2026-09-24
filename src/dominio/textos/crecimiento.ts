/** Textos de cómo crece una planta, qué la estresa y cómo madura. */
import { nombreDe } from '../planta';
import type { Especie } from '../tipos';
import { frase, type Frase } from './frase';

export const compitenJuntas = (sp: Especie, n: number): Frase =>
  frase(
    'crecimiento.compiten',
    sp.nombre +
      ': salieron ' +
      n +
      ' juntas y compiten por luz y agua. ' +
      (sp.dt ? 'Podés repicar las que sobran a otro lugar o ralear.' : 'Hay que ralear y dejar una.'),
  );
export const plantinPasado = (sp: Especie): Frase =>
  frase(
    'crecimiento.plantin-pasado',
    'El plantín de ' + nombreDe(sp) + ' se pasó en la almaciguera: raíces enruladas. Ya tendría que estar en su lugar.',
  );
export const plantinListo = (sp: Especie): Frase =>
  frase('crecimiento.plantin-listo', 'Plantín de ' + nombreDe(sp) + ' listo para trasplantar.');

// ── estrés ──
export const faltoAgua = (sp: Especie): Frase =>
  frase('estres.sed-leve', 'Le faltó agua: pide riego ' + sp.riego + ' y tuvo menos. Perdió salud.');
export const pasaSed = (sp: Especie, enMaceta: boolean): Frase =>
  frase(
    'estres.sed',
    sp.nombre +
      ' pasa sed' +
      (enMaceta ? ': las macetas se secan mucho más rápido que la tierra.' : ': subí el riego o poné mulch.'),
  );
export const excesoDeAgua = (sp: Especie): Frase =>
  frase(
    'estres.exceso',
    sp.nombre +
      ' tiene exceso de agua: pide riego ' +
      sp.riego +
      '. Con los pies mojados aparecen hongos y se pudre la raíz.',
  );
export const sufrioCalor = (sp: Especie, tmax: number, bajoTunel: boolean): Frase =>
  frase(
    'estres.calor',
    sp.nombre + ' sufrió el calor (máx ' + tmax + ' °C' + (bajoTunel ? ', y bajo el microtúnel es peor' : '') + ').',
  );
export const sufrioFrio = (sp: Especie, tmin: number): Frase =>
  frase('estres.frio', sp.nombre + ' sufrió el frío (mín ' + tmin + ' °C).');
export const pocaLuz = (sp: Especie, horas: number, pide: string): Frase =>
  frase('estres.luz', sp.nombre + ' recibe ' + horas + ' h de sol y pide ' + pide + '. ' + sp.luzNo);
export const recuperoSalud = (): Frase => frase('estres.recupera', 'Creció a gusto y recuperó salud.');

/** Lo que más frenó el crecimiento, para "Creció lento: lo que más la frenó fue…". */
export const frenoLuz = (horas: number, pide: string): string => 'poca luz (' + horas + ' h, pide ' + pide + ')';
export const frenoAgua = (): string => 'el agua';
export const frenoTemperatura = (t: number, pide: string): string =>
  'la temperatura (media ' + t + ' °C, ideal ' + pide + ')';
export const frenoSuelo = (macetaChica: boolean): string => 'el suelo' + (macetaChica ? ' y la maceta chica' : '');
export const frenoVecinos = (): string => 'los vecinos';
export const crecioLento = (freno: string, conPlaga: boolean): Frase =>
  frase(
    'estres.lento',
    'Creció lento: lo que más la frenó fue ' + freno + (conPlaga ? ', además de la plaga' : '') + '.',
  );

// ── espigado y madurez ──
export const espigo = (sp: Especie, tmed: number, aMediaSombraAguanta: boolean): Frase =>
  frase(
    'madurez.espigo',
    sp.nombre +
      ' se subió a flor por el calor (media ' +
      tmed +
      ' °C) y amargó. ' +
      (aMediaSombraAguanta ? 'A media sombra aguanta mucho más en verano.' : '') +
      ' Todavía podés dejarla semillar.',
  );
export const murio = (sp: Especie): Frase =>
  frase('madurez.murio', sp.nombre + ' murió. Revisá en el cuaderno qué le venía faltando.');
export const sePaso = (sp: Especie): Frase =>
  frase('madurez.se-paso', sp.nombre + ' se pasó: había que cosecharla antes. ' + sp.listo);
export const terminoDeFlorecer = (sp: Especie): Frase => frase('madurez.fin-flor', sp.nombre + ' terminó de florecer.');
export const abrioFlores = (sp: Especie): Frase =>
  frase('madurez.flores', sp.nombre + ' abrió sus flores: empiezan a llegar polinizadores.');
export const paraCosechar = (sp: Especie): Frase =>
  frase('madurez.cosechable', sp.nombre + ' está para cosechar. ' + sp.listo);
export const pasadaSeSeco = (sp: Especie): Frase => frase('madurez.seca', sp.nombre + ' pasada se secó. Al compost.');
export const semillasGuardadas = (sp: Especie, sobres: number, generacion: number): Frase =>
  frase(
    'semillas.guardadas',
    'Guardaste ' +
      sobres +
      ' sobres de ' +
      nombreDe(sp) +
      ' (generación ' +
      generacion +
      '). Semilla criada en tu patio: se adapta un poco más cada año.',
  );

// ── diario ──
export const recuperoEnElDiario = (): Frase => frase('diario.recupero', 'Recuperó salud.');
export const perdioEnElDiario = (): Frase => frase('diario.perdio', 'Perdió salud.');
