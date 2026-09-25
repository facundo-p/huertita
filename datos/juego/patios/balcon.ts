import type { Patio } from '../patio';

/**
 * Balcón de departamento en esquina: mira al norte y tiene el costado este abierto. [SUPUESTO] todo: contenido nuevo, pendiente de revisión.
 *
 * Plantea el problema inverso al del fondo: en invierno el sol bajo entra hasta la pared y en
 * verano, con el sol alto, el balcón de arriba deja casi todo a la sombra. No hay tierra:
 * todo es recipiente, así que el riego y el tamaño de la maceta mandan.
 */
export const balcon: Patio = {
  id: 'balcon',
  region: 'gba',
  nombre: 'Balcón en esquina',
  desc: 'Un balcón de departamento que mira al norte, con el costado este abierto. Sol de mañana todo el año, sombra del balcón de arriba en los mediodías de verano, y todo en recipientes.',
  bienvenida:
    'En el balcón no hay tierra: todo depende del tamaño de la maceta y del riego. Mirá la capa de sol antes de ubicar cada cosa: contra la baranda y contra la pared no es lo mismo.',
  celdaM: 0.5,
  plano: ['PPPPPP', 'mmmmmm', 'cc::::', 'cc:aa:', 'HHHHHH'],
  zonas: [
    {
      id: 'macetas',
      letra: 'm',
      tipo: 'macetas',
      nombre: 'Macetas de la baranda',
      conArticulo: 'las macetas de la baranda',
      suelo: 'FRANCO_FERTIL',
      mo: 55,
      drenaje: 0.7,
      hondo: 30,
      riegoCosto: [0, 1, 2, 3],
      abrigo: { grados: 1, nombre: 'la altura del balcón' },
      desc: 'En fila contra la baranda: las primeras en recibir sol, viento y lluvia.',
      macetas: {
        '0,1': { litros: 20, prof: 45 },
        '1,1': { litros: 20, prof: 45 },
        '2,1': { litros: 8, prof: 30 },
        '3,1': { litros: 8, prof: 30 },
        '4,1': { litros: 4, prof: 15 },
        '5,1': { litros: 4, prof: 15 },
      },
    },
    {
      id: 'cajon',
      letra: 'c',
      tipo: 'cajon',
      nombre: 'Cajón de verdulería',
      conArticulo: 'el cajón de verdulería',
      suelo: 'PROFUNDO_SUELTO',
      mo: 60,
      drenaje: 0.45,
      hondo: 25,
      riegoCosto: [0, 1, 1, 2],
      techo: true,
      abrigo: { grados: 2, nombre: 'el techo del balcón' },
      admiteTunel: true,
      desc: 'Cajones forrados, con sustrato suelto. Poco hondos: van bien hojas y raíces cortas. La lluvia no les llega.',
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
      abrigo: { grados: 5, nombre: 'la pared y el techo' },
      calor: 2,
      desc: 'Bandejas contra el ventanal: el rincón más reparado del balcón. Solo para criar plantines.',
    },
  ],
  estructuras: [{ tipo: 'compostera', en: '5,3' }],
  obstaculos: [
    { tipo: 'muro', nombre: 'Baranda', desde: [0, 1], hasta: [6, 1], alto: 1, opacidad: 0.4 },
    { tipo: 'muro', nombre: 'Baranda del costado este', desde: [6, 1], hasta: [6, 4], alto: 1, opacidad: 0.4 },
    { tipo: 'muro', nombre: 'Medianera oeste', desde: [0, 1], hasta: [0, 4], alto: 2.6 },
    { tipo: 'muro', nombre: 'Pared del departamento', desde: [0, 4], hasta: [6, 4], alto: 2.6 },
    { tipo: 'losa', nombre: 'Balcón de arriba', desde: [0, 0.6], hasta: [6, 4], alto: 2.6 },
  ],
  horizonte: 8,
  sol: 'geometria',
  estrellas: [10, 25, 45], // sin balancear: el bot saca entre 12 y 37 puntos
  aspecto: { piso: 'baldosa', norte: 'baranda' },
};
