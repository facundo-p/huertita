/** Textos de las plagas. [REPO] qué ataca a qué, del texto de plagas de cada ficha. */
import { nombreDe } from '../planta';
import type { Especie, Plaga } from '../tipos';
import { frase, type Frase } from './frase';

const PLURAL: Record<Plaga, string> = { pulgon: 'pulgones', oruga: 'orugas', babosa: 'babosas' };
export const plural = (p: Plaga): string => PLURAL[p];

export const orugas = (sp: Especie, sinAliados: boolean): Frase =>
  frase(
    'plagas.oruga',
    'Orugas en ' +
      nombreDe(sp) +
      ': la mariposa blanca pone en las brasicáceas. ' +
      (sinAliados ? 'Sin flores ni aromáticas cerca no hay quien las controle.' : ''),
  );
export const babosas = (sp: Especie): Frase =>
  frase('plagas.babosa', 'Babosas en ' + nombreDe(sp) + ': con tanta lluvia salen de noche y se comen lo tierno.');
export const pulgones = (sp: Especie, sinAliados: boolean): Frase =>
  frase(
    'plagas.pulgon',
    'Pulgones en ' +
      nombreDe(sp) +
      '. ' +
      (sinAliados ? 'Flores y aromáticas cerca atraen vaquitas y crisopas que se los comen.' : ''),
  );
export const sigueConPlaga = (p: Plaga): Frase =>
  frase('plagas.sigue', 'Sigue con ' + plural(p) + ': pierde salud cada década hasta que la trates o lleguen aliados.');
export const llegaronVaquitas = (sp: Especie, p: Plaga): Frase =>
  frase(
    'plagas.vaquitas',
    'Llegaron vaquitas de San Antonio atraídas por tus flores: limpiaron ' +
      nombreDe(sp) +
      ' de ' +
      (p === 'pulgon' ? 'pulgones' : 'plaga') +
      '.',
  );
/** [REPO] el control agroecológico de cada plaga */
const COMO_TRATAR: Record<Plaga, string> = {
  pulgon: 'Rociaste jabón potásico: adiós pulgones.',
  oruga: 'Sacaste las orugas a mano, revisando el envés de las hojas.',
  babosa: 'Pusiste una trampa de cerveza: las babosas cayeron.',
};
export const tratada = (p: Plaga): Frase => frase('plagas.tratada', COMO_TRATAR[p]);
