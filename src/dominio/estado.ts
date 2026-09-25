import { REGLAS } from '../../datos/juego/reglas';
import { azar } from './azar';
import { fechaDe } from './calendario';
import { generarTiempo } from './clima';
import { regionPorId } from './region';
import { celdasDePlanta } from './espacio';
import { alCompost, estructurasIniciales } from './estructuras';
import { PLANTILLA_INICIAL, celdasDe, copiarPlantilla, zona, zonaDe, zonasDe } from './patio';
import type { CaracterId, CeldaId, Estado, Evento, Planta, Pronostico, Tiempo, TipoEvento } from './tipos';
import { clamp } from './util';
import { especieDe } from './planta';
import type { Frase } from './textos/frase';
import * as T from './textos/temporada';

export const RATOS = REGLAS.ratos.porDecada;
export const RIEGOS = ['nada', 'espaciado', 'parejo', 'constante'] as const;
const { arranque: ARRANQUE, suelo: SUELO } = REGLAS;

/** Anota una frase en el cuaderno de la partida y la devuelve como evento. */
export function anotar(E: Estado, tipo: TipoEvento, f: Frase, celda?: CeldaId | null): Evento {
  const ev: Evento = {
    turno: E.tiempo.turno,
    dec: E.tiempo.dec,
    tipo,
    texto: f.texto,
    celda: celda || null,
    codigo: f.codigo,
  };
  E.progreso.cuaderno.push(ev);
  if (E.progreso.cuaderno.length > ARRANQUE.cuaderno) E.progreso.cuaderno.shift();
  return ev;
}
export function moMedia(E: Estado): number {
  let t = 0,
    n = 0;
  for (const c in E.mundo.celdas)
    if (!zonaDe(E, c).cria) {
      t += E.mundo.celdas[c].mo;
      n++;
    }
  return t / n;
}
export function plantaEn(E: Estado, celda: CeldaId): Planta | null {
  const c = E.mundo.celdas[celda];
  return c && c.planta ? E.mundo.plantas[c.planta] : null;
}

const puntoEntre = (prog: number, min: number, max: number): 'chico' | 'listo' | 'pasado' => {
  if (prog < min) return 'chico';
  return prog < max ? 'listo' : 'pasado';
};

/** En qué punto está un plantín respecto del trasplante. `faltan` son días de buen crecimiento, no de calendario. */
export function puntoDeTrasplante(
  pl: Planta,
): { punto: 'chico' | 'listo' | 'pasado'; faltan: number; min: number; max: number } | null {
  const dt = especieDe(pl).dt;
  if (pl.etapa !== 'plantin' || !dt) return null;
  return {
    punto: puntoEntre(pl.prog, dt.min, dt.max),
    faltan: Math.max(0, Math.ceil(dt.min - pl.prog)),
    min: dt.min,
    max: dt.max,
  };
}

export function costoRiego(E: Estado): number {
  let t = 0;
  for (const z of zonasDe(E)) {
    const costo = z.riegoCosto[E.recursos.riego[z.id]];
    t += Math.max(0, costo - (E.recursos.goteo && costo > 0 ? REGLAS.ratos.ahorroGoteo : 0));
  }
  return t;
}
export const ratosLibres = (E: Estado): number => RATOS - costoRiego(E) - E.recursos.ratosGastados;

export function quitarPlanta(E: Estado, pl: Planta, vaAlCompost: boolean): void {
  const sp = especieDe(pl);
  for (const k of celdasDePlanta(pl)) {
    const c = E.mundo.celdas[k];
    if (!zona(E, c.zona).cria && pl.etapa !== 'semilla') {
      c.fam = sp.familia;
      const seLleva = sp.fruto ? SUELO.moQueSeLleva.fruto : SUELO.moQueSeLleva.resto,
        devuelve = sp.familia === 'leguminosa' ? SUELO.moQueDejaLeguminosa : 0;
      c.mo = clamp(c.mo - seLleva + devuelve, SUELO.moMin, SUELO.moMax);
    }
    c.planta = null;
  }
  delete E.mundo.plantas[pl.id];
  if (vaAlCompost) alCompost(E, REGLAS.compost.porPlanta);
}

export function crearPartida(
  semilla: number,
  opciones: { decInicio?: number; caracter?: CaracterId; patio?: string } = {},
): Estado {
  const plantilla = opciones.patio || PLANTILLA_INICIAL,
    patio = copiarPlantilla(plantilla);
  const E: Estado = {
    meta: { v: 4, semilla: semilla | 0, rng: (semilla | 0) ^ 0x9e3779b9, region: patio.region, plantilla },
    mundo: { patio, celdas: {}, plantas: {}, estructuras: estructurasIniciales(patio, ARRANQUE.dosisDeCompost) },
    tiempo: {
      dec: opciones.decInicio || ARRANQUE.decada,
      turno: 0,
      anio: 1,
      caracter: 'normal',
      // se llenan abajo, después de sortear el carácter del año: el orden del azar es parte del contrato
      clima: null as unknown as Tiempo,
      pronostico: null as unknown as Pronostico,
      terminado: false,
    },
    recursos: { ratosGastados: 0, riego: {}, tunel: {}, manta: {}, goteo: false, sobres: {}, gen: {} },
    progreso: {
      cosechado: {},
      porciones: 0,
      semillasGuardadas: 0,
      visitas: 0,
      moInicial: 0,
      misiones: {},
      cuaderno: [],
      nextId: 1,
    },
  };
  const R = regionPorId(patio.region),
    ks = Object.keys(R.caracteres);
  E.tiempo.caracter = opciones.caracter || ks[Math.floor(azar(E) * ks.length)];
  for (const s in ARRANQUE.sobres) E.recursos.sobres[s] = ARRANQUE.sobres[s];
  for (const z of zonasDe(E)) {
    E.recursos.riego[z.id] = ARRANQUE.riego;
    for (const c of celdasDe(E, z.id))
      E.mundo.celdas[c] = { zona: z.id, mo: z.mo, mulch: false, fam: null, planta: null };
  }
  E.progreso.moInicial = moMedia(E);
  const { real, pron } = generarTiempo(E, E.tiempo.dec);
  E.tiempo.clima = real;
  E.tiempo.pronostico = pron;
  anotar(E, 'info', T.arranca(fechaDe(E.tiempo.dec), R.caracteres[E.tiempo.caracter]));
  anotar(E, 'info', T.bienvenida(patio.bienvenida));
  return E;
}
