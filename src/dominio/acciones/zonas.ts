import { REGLAS } from '../../../datos/juego/reglas';
import { ABRIGO, abrigo } from '../abrigo';
import { anotar, ratosLibres } from '../estado';
import { zona, zonaDeTunel } from '../patio';
import type { NivelRiego } from '../tipos';
import { NIVELES_DE_RIEGO } from '../vocabulario';
import * as T from '../textos/acciones';
import { empiezaAnio } from '../textos/temporada';
import { type De, type Regla, gratis } from './regla';

/** El riego no se cobra al elegirlo: queda puesto y se come ratos cada década (ver `costoRiego`). */
export const riego: Regla<De<'riego'>> = {
  puede(E, a) {
    if (!(a.zona in E.recursos.riego) || !(NIVELES_DE_RIEGO as readonly number[]).includes(a.nivel))
      return T.riegoInvalido();
    const antes = E.recursos.riego[a.zona];
    E.recursos.riego[a.zona] = a.nivel as NivelRiego; // se prueba y se deja como estaba
    const alcanza = ratosLibres(E) >= 0;
    E.recursos.riego[a.zona] = antes;
    return alcanza ? null : T.riegoSinRatos();
  },
  costo: gratis,
  aplicar(E, a) {
    E.recursos.riego[a.zona] = a.nivel as NivelRiego;
  },
};

const zonaDelTunel = (E: Parameters<typeof zonaDeTunel>[0], a: De<'tunel'>): string | null => a.zona ?? zonaDeTunel(E);

export const tunel: Regla<De<'tunel'>> = {
  puede(E, a) {
    const z = zonaDelTunel(E, a);
    if (!z || !(z in E.recursos.riego) || !zona(E, z).admiteTunel) return T.tunelNoVa();
    return null;
  },
  costo: () => REGLAS.ratos.tunel,
  sinRatos: T.tunelLleva(REGLAS.ratos.tunel),
  aplicar(E, a, evs) {
    const z = zonaDelTunel(E, a)!;
    if (E.recursos.tunel[z]) delete E.recursos.tunel[z];
    else E.recursos.tunel[z] = true;
    const f = E.recursos.tunel[z]
      ? T.armasteTunel(zona(E, z), ABRIGO.tunel, REGLAS.temperatura.bajoTunel)
      : T.sacasteTunel();
    evs.push(anotar(E, 'info', f));
  },
};

export const manta: Regla<De<'manta'>> = {
  puede(E, a) {
    if (!(a.zona in E.recursos.riego)) return T.nadaQueTapar();
    if (E.recursos.manta[a.zona]) return T.yaTapado();
    return null;
  },
  costo: () => REGLAS.ratos.accion,
  aplicar(E, a, evs) {
    E.recursos.manta[a.zona] = true;
    evs.push(anotar(E, 'info', T.manta(zona(E, a.zona), ABRIGO.manta, abrigo(E, a.zona).aguanta)));
  },
};

/** Empezar otro año con la misma huerta. */
export const seguir: Regla<De<'seguir'>> = {
  puede: (E) => (E.tiempo.terminado ? null : T.anioSinTerminar()),
  costo: gratis,
  aplicar(E, _a, evs) {
    E.tiempo.terminado = false;
    E.tiempo.anio++;
    evs.push(anotar(E, 'info', empiezaAnio(E.tiempo.anio)));
  },
};
