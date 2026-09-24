import type { Patio } from '../patio';

/**
 * El patio original del juego: un fondo chico del conurbano, con paredón al norte,
 * la casa al sur y un paraíso en la esquina noreste.
 *
 * Las horas de sol de este patio todavía salen de la fórmula del prototipo (`sol: 'v04'`), para
 * que el test dorado siga protegiendo los refactors. Los obstáculos ya están cargados con medidas
 * reales, pero OJO: la geometría NO da lo mismo que la fórmula vieja. Un paredón de 1,8 m al norte
 * deja sin sol directo, en pleno invierno, todo lo que esté a menos de ~2,6 m (5 celdas); la fórmula
 * vieja era mucho más generosa. Pasar este patio a 'geometria' es una decisión de diseño (mover los
 * canteros, bajar el paredón o aceptarlo) que va junto con el rebalanceo del paso 4.
 */
export const fondo: Patio = {
  id: 'fondo',
  region: 'gba',
  nombre: 'Fondo con paredón',
  desc: 'Un fondo chico del conurbano. El paredón del norte le saca sol en invierno y el paraíso da sombra en verano.',
  bienvenida:
    'Todavía hiela. El bancal elevado es el que más sol tiene ahora; la almaciguera está reparada. El tomate se arranca en almácigo protegido.',
  celdaM: 0.5,
  plano: ['PPPPPPPP', 'ssssss:T', 'ssssss:T', '::::::::', 'eeee:mm.', 'eeee:mm.', '::::::::', 'aaaa:...', 'HHHHHHHH'],
  zonas: [
    {
      id: 'suelo',
      letra: 's',
      tipo: 'suelo',
      nombre: 'Bancal a suelo',
      conArticulo: 'el bancal a suelo',
      suelo: 'FRANCO_FERTIL',
      mo: 42,
      drenaje: 0,
      hondo: 60,
      riegoCosto: [0, 1, 2, 3],
      desc: 'Tierra del lugar, profunda y algo pesada. El paredón norte le saca sol en invierno.',
    },
    {
      id: 'elevado',
      letra: 'e',
      tipo: 'cajon',
      nombre: 'Bancal elevado',
      conArticulo: 'el bancal elevado',
      suelo: 'PROFUNDO_SUELTO',
      mo: 60,
      drenaje: 0.3,
      hondo: 32,
      riegoCosto: [0, 1, 2, 3],
      admiteTunel: true,
      desc: 'Cajón con sustrato mullido. Drena rápido, calienta antes y admite microtúnel.',
    },
    {
      id: 'macetas',
      letra: 'm',
      tipo: 'macetas',
      nombre: 'Macetas',
      conArticulo: 'las macetas',
      suelo: 'FRANCO_FERTIL',
      mo: 55,
      drenaje: 0.7,
      hondo: 30,
      riegoCosto: [0, 1, 1, 2],
      desc: 'Se secan mucho antes que la tierra. El tamaño decide qué entra.',
      macetas: {
        '5,4': { litros: 4, prof: 15 },
        '6,4': { litros: 8, prof: 30 },
        '5,5': { litros: 8, prof: 30 },
        '6,5': { litros: 20, prof: 45 },
      },
    },
    {
      id: 'almacigo',
      letra: 'a',
      tipo: 'almaciguera',
      nombre: 'Almaciguera',
      conArticulo: 'la almaciguera',
      suelo: 'FRANCO_FERTIL',
      mo: 70,
      drenaje: 0.5,
      hondo: 10,
      riegoCosto: [0, 0, 1, 1],
      cria: true,
      capacidad: 50,
      techo: true,
      abrigo: { grados: 5, nombre: 'alero y pared' },
      calor: 2,
      desc: 'Contra la casa, mirando al norte y bajo alero: reparada de heladas y de la lluvia. Solo para criar plantines.',
    },
  ],
  estructuras: [{ tipo: 'compostera', en: '5,7' }],
  obstaculos: [
    { tipo: 'muro', nombre: 'Paredón norte', desde: [-8, 1], hasta: [16, 1], alto: 1.8 },
    { tipo: 'muro', nombre: 'Casa', desde: [0, 8], hasta: [8, 8], alto: 3 },
    { tipo: 'arbol', nombre: 'Paraíso', en: [7.5, 2], alto: 7, copa: 5, fuste: 2, caduco: true },
  ],
  horizonte: 15,
  sol: 'v04',
  estrellas: [30, 70, 120],
  aspecto: { piso: 'pasto', norte: 'paredon' },
};
