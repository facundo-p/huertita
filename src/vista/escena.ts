/**
 * La escena que ve el renderer, una sola por cambio. Armarla evalúa todo el patio (y en modo siembra
 * o trasplante, el fantasma en cada celda), así que se arma en una señal derivada y todos la leen de
 * acá: el lienzo, los botones de las zonas, la tira de una planta y las animaciones de las acciones.
 * Se vuelve a armar sola cuando cambia algo de lo que depende (la partida, la interacción, la
 * cámara, la capa, la zona que se mira de cerca, la animación del clima o el renderer montado).
 */
import { computed } from '@preact/signals';
import { escena as armarEscena, zonaCerca as elegirZonaCerca } from '../aplicacion/consultas';
import type { Escena } from '../render/contrato';
import { activo } from './efectos';
import { animar, camara, capa, interaccion, usarPartida, zonaCerca } from './estado';

function escenaDeAhora(): Escena {
  const E = usarPartida(),
    { modo, sel } = interaccion.value,
    cams = activo.value?.camaras;
  let fantasma: string | null = null;
  if (modo.modo === 'semillas') fantasma = modo.sobre;
  if (modo.modo === 'moviendo') fantasma = E.mundo.plantas[modo.planta]?.slug ?? null;
  return armarEscena(E, {
    fantasma,
    trasplantando: modo.modo === 'moviendo',
    seleccion: sel,
    zonaCerca: elegirZonaCerca(E, sel, zonaCerca.value),
    camara: cams ? cams[camara.value % cams.length][0] : 'cenital',
    capa: capa.value,
    animar: animar.value,
  });
}

export const escena = computed(escenaDeAhora);
