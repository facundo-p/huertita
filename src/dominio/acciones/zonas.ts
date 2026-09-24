import { REGLAS } from '../../../datos/juego/reglas';
import { ABRIGO, abrigo } from '../abrigo';
import { anotar, ratosLibres } from '../estado';
import { zona, zonaDeTunel } from '../patio';
import type { NivelRiego } from '../tipos';
import * as T from '../textos/acciones';
import { empiezaAnio } from '../textos/temporada';
import { type De, type Regla, gratis } from './regla';

/** El riego no se cobra al elegirlo: queda puesto y se come ratos cada década (ver `costoRiego`). */
export const riego: Regla<De<'riego'>> = {
  puede(E, a) {
    if (!(a.zona in E.riego) || a.nivel < 0 || a.nivel > 3) return T.riegoInvalido();
    const antes = E.riego[a.zona];
    E.riego[a.zona] = a.nivel as NivelRiego; // se prueba y se deja como estaba
    const alcanza = ratosLibres(E) >= 0;
    E.riego[a.zona] = antes;
    return alcanza ? null : T.riegoSinRatos();
  },
  costo: gratis,
  aplicar(E, a) {
    E.riego[a.zona] = a.nivel as NivelRiego;
  },
};

const zonaDelTunel = (E: Parameters<typeof zonaDeTunel>[0], a: De<'tunel'>): string | null => a.zona ?? zonaDeTunel(E);

export const tunel: Regla<De<'tunel'>> = {
  puede(E, a) {
    const z = zonaDelTunel(E, a);
    if (!z || !(z in E.riego) || !zona(E, z).admiteTunel) return T.tunelNoVa();
    return null;
  },
  costo: () => REGLAS.ratos.tunel,
  sinRatos: T.tunelLleva(REGLAS.ratos.tunel),
  aplicar(E, a, evs) {
    const z = zonaDelTunel(E, a)!;
    if (E.tunel[z]) delete E.tunel[z];
    else E.tunel[z] = true;
    const f = E.tunel[z] ? T.armasteTunel(zona(E, z), ABRIGO.tunel, REGLAS.temperatura.bajoTunel) : T.sacasteTunel();
    evs.push(anotar(E, 'info', f));
  },
};

export const manta: Regla<De<'manta'>> = {
  puede(E, a) {
    if (!(a.zona in E.riego)) return T.nadaQueTapar();
    if (E.manta[a.zona]) return T.yaTapado();
    return null;
  },
  costo: () => REGLAS.ratos.accion,
  aplicar(E, a, evs) {
    E.manta[a.zona] = true;
    evs.push(anotar(E, 'info', T.manta(zona(E, a.zona), ABRIGO.manta, abrigo(E, a.zona).aguanta)));
  },
};

/** Empezar otro año con la misma huerta. */
export const seguir: Regla<De<'seguir'>> = {
  puede: () => null,
  costo: gratis,
  aplicar(E, _a, evs) {
    E.terminado = false;
    E.anio++;
    evs.push(anotar(E, 'info', empiezaAnio(E.anio)));
  },
};
