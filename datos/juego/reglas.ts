/**
 * Los números del juego: cuánto cuesta cada cosa, cuánto daña cada problema, cuánto rinde cada
 * cosecha. Todo el balance vive acá, con nombre, para que rebalancear sea editar este archivo y no
 * buscar decimales sueltos en las fórmulas.
 *
 * Marcas: [REPO] sale de huertapp; [SUPUESTO] lo puso el juego y es candidato a revisarse con
 * fuentes. Los valores que dicen "%" se usan como porcentaje a propósito: así el redondeo de las
 * cuentas es el mismo que tenía el prototipo (el test dorado lo exige, decimal por decimal).
 *
 * Lo que es de cada especie (marco de plantación, familias) está en `especies.ts`; lo que es de
 * cada patio, en `patios/`; el clima, en la región.
 */
import type { CategoriaSuelo, RegimenRiego } from '../contrato';

export const REGLAS = {
  /** [SUPUESTO] el tiempo del jugador */
  ratos: {
    /** ratos libres por década */
    porDecada: 14,
    /** lo que cuesta cada acción común */
    accion: 1,
    /** armar o sacar el microtúnel */
    tunel: 2,
    /** el goteo le ahorra un rato a cada zona regada */
    ahorroGoteo: 1,
  },

  /** [SUPUESTO] cómo arranca una partida */
  arranque: {
    decada: 22,
    riego: 2,
    dosisDeCompost: 2,
    sobres: {
      rabanito: 6,
      lechuga: 6,
      acelga: 4,
      arveja: 6,
      haba: 4,
      perejil: 3,
      calendula: 4,
      tomate: 4,
      albahaca: 4,
      zanahoria: 6,
      'cebolla-de-verdeo': 4,
      rucula: 4,
    } as Record<string, number>,
    /** cuántas anotaciones guarda el cuaderno */
    cuaderno: 400,
  },

  /** [SUPUESTO] el vigor con el que nace una siembra */
  siembra: {
    /** semillas por siembra: una tanda de celdas en la almaciguera, un golpe en directa (menos si son grandes) */
    semillas: { almacigo: 6, grandes: 3, resto: 4 },
    vigorPorVentana: { ideal: 1, posible: 0.85, fuera: 0.6 },
    /** cada generación de semilla propia suma, hasta la tercera */
    vigorPorGeneracion: 0.05,
    generacionesQueSuman: 3,
    /** repetir familia en la misma tierra */
    vigorRepitiendoFamilia: 0.85,
  },

  /** [REPO] dias_germinacion y temperaturas.germinacion; [SUPUESTO] el resto */
  germinacion: {
    /** humedad mínima del suelo para que arranque */
    humedadMinima: 1.2,
    /** fuera del rango ideal, la germinación avanza a este ritmo */
    ritmoFueraDeIdeal: 0.6,
    /** poder germinativo, en el rango ideal y fuera de él */
    poder: { ideal: 0.85, fueraDeIdeal: 0.55 },
    /** el vigor ajusta el poder germinativo: vigor + 0.1, entre 0.5 y 1 */
    vigorExtra: 0.1,
    vigorMin: 0.5,
    /** días sin germinar después de los que la semilla se pierde */
    diasHastaPerderse: 30,
  },

  /** [REPO] temperaturas.helada, umbral FAUBA; [SUPUESTO] el daño */
  helada: {
    /** hiela para la planta si la mínima más el abrigo no pasa de esto */
    umbral: 3,
    danioSensible: 45,
    /** error del pronóstico de mínima, para el riesgo que se muestra */
    desvioPronostico: 2.2,
    /**
     * [SUPUESTO] % de que hiele desde el que el riesgo de una zona se muestra medio (y se sugiere la
     * manta) o alto
     */
    riesgo: { medio: 15, alto: 50 },
  },

  /**
   * [SUPUESTO] El modelo de clima: cómo se sortea cada década alrededor de las normales de la región
   * (que están en `regiones/`). Es el mismo en todos lados; lo del lugar va en la región.
   */
  clima: {
    /** desvío de la anomalía de temperatura de la década (°C) */
    desvioAnomalia: 2.1,
    /** la máxima de la década es la del día más caluroso: la normal, más esto, más un extra al azar con este desvío (°C) */
    maxima: { sobreLaNormal: 1, desvio: 1.5 },
    /** la mínima es la de la noche más fría: la normal, menos esto, menos un extra al azar con este desvío (°C) */
    minima: { bajoLaNormal: 3, desvio: 1.8 },
    /**
     * dentro de la temporada de heladas, esta fracción de las décadas trae una noche helada: la
     * mínima baja hasta `hasta` menos un tanto al azar de hasta `rango` (°C)
     */
    helada: { enTemporada: 0.35, hasta: 2.5, rango: 3 },
    /** la lluvia del mes, repartida en sus décadas y multiplicada por exp(desvío·z − sesgo), con tope (adimensional) */
    lluvia: { desvio: 0.75, sesgo: 0.2, tope: 3.5 },
    /** ola de calor: una máxima de la década desde esto (°C) */
    olaDesde: 35,
    pronostico: {
      /** error del pronóstico de mínima y de máxima (°C) */
      errorMinima: 1.8,
      errorMaxima: 1.5,
      /** fracción de las veces que el pronóstico de lluvia acierta; si no, dice cualquier cosa */
      aciertoLluvia: 0.72,
      /** lo que dice el pronóstico de lluvia: seca por debajo de esto, llovedora por encima (mm en la década) */
      secaHasta: 12,
      llovedoraDesde: 45,
    },
  },

  /** [SUPUESTO] grados que suma cada abrigo a la mínima de la noche; el reparo fijo de cada zona está en el patio */
  abrigo: { manta: 4, tunel: 5 },

  /** [SUPUESTO] crecimiento */
  crecimiento: {
    conPlaga: 0.8,
    conShock: 0.5,
    /** a una planta que pide tutor le falta desde el 45 % del camino, y crece al 85 % */
    sinTutorDesde: 0.45,
    sinTutor: 0.85,
    /** cada planta de más en la celda le saca un 15 %, hasta un piso de 40 % */
    competenciaPorPlanta: 0.15,
    competenciaPiso: 0.4,
    /** el factor de crecimiento de una década no pasa de esto */
    factorMaximo: 1.25,
    /** un plantín listo que sigue en la almaciguera esta cantidad de días se pasa, y conserva este % de vigor */
    diasHastaPasarse: 30,
    vigorPlantinPasado: 80,
  },

  /** [SUPUESTO] lo que baja y sube la salud */
  estres: {
    /** con el agua por debajo de esto hay daño por sed, proporcional a lo que falta */
    sedDesde: 0.75,
    danioSed: 35,
    /** por debajo de esto la sed amerita aviso en el cuaderno, no solo en el diario */
    sedGrave: 0.5,
    /** exceso de agua dañino y su daño */
    excesoDesde: 1.4,
    danioExceso: 14,
    /** calor: el microtúnel suma de día, se tolera un margen, y el daño crece por grado */
    calorBajoTunel: 5,
    margenDeCalor: 2,
    danioCalorBase: 6,
    danioCalorPorGrado: 3,
    danioFrio: 12,
    /** con la luz por debajo de esto se avisa cada 30 días */
    pocaLuz: 0.5,
    avisoDeLuzCada: 30,
    /** crecer bien cura; crecer mal amerita explicar por qué */
    creceBien: 0.85,
    curaPorDecada: 5,
    creceLento: 0.6,
  },

  /** [REPO] qué plaga ataca qué y cuándo, del texto de cada ficha; [SUPUESTO] las probabilidades */
  plagas: {
    /** cada aliado cerca (flor o aromática a 2 celdas) protege un 22 %, hasta dejar el 25 % del riesgo */
    proteccionPorAliado: 0.22,
    proteccionMaxima: 0.25,
    radioDeAliados: 2,
    /** repetir familia multiplica el riesgo */
    riesgoRepitiendoFamilia: 1.5,
    /** una planta es joven hasta el 40 % del camino a la cosecha */
    jovenHasta: 0.4,
    /**
     * las épocas van en décadas estacionales (1 = principios de enero en el sur, ver `region.ts`),
     * como tramos [desde, hasta] que pueden cruzar el año nuevo; la lluvia, en mm de la década
     */
    oruga: { prob: 0.1, epocas: [[31, 12]] },
    babosa: { prob: 0.15, lluviaDesde: 40 },
    pulgon: {
      prob: 0.06,
      epocas: [
        [25, 33],
        [7, 12],
      ],
    },
    danioPorDecada: 12,
    /** con al menos 2 flores abiertas pueden llegar vaquitas */
    floresParaVaquitas: 2,
    probVaquitas: 0.35,
  },

  /** [REPO] riesgos de la ficha (subida a flor); [SUPUESTO] la probabilidad */
  espigado: {
    /** desde la mitad del camino a la cosecha */
    desde: 0.5,
    /** grados por encima del ideal máximo a partir de los que puede espigar */
    margen: 4,
    probPorGrado: 0.22,
    /** a media sombra espiga mucho menos */
    horasDeMediaSombra: 5.5,
    aMediaSombra: 0.4,
  },

  /** [SUPUESTO] madurar y pasarse */
  madurez: {
    reservaMaxima: 2,
    /** decadas que aguanta lista antes de pasarse, con calor y sin calor */
    calorDesde: 22,
    aguantaConCalor: 2,
    aguantaSinCalor: 4,
    /** décadas de flor */
    floracion: 12,
    /** una perenne que terminó de florecer vuelve a la mitad del camino */
    perenneVuelveA: 0.5,
    /** una pasada se seca después de esta cantidad de décadas */
    pasadaSeSeca: 3,
  },

  /** [SUPUESTO] la cosecha */
  cosecha: {
    /** [REPO] dias_a_cosecha; [SUPUESTO] se cosecha pasado el mínimo más este tanto del rango */
    objetivo: 0.35,
    porcionesPorPlanta: { variasPasadas: 1, unaPasada: 2 },
    /** un fruto bajo microtúnel casi no se poliniza */
    polinizacionBajoTunel: 0.45,
    polinizacionBase: 0.55,
    polinizacionPorFlor: 0.12,
    /** debajo de esto se avisa que cuajó poco */
    polinizacionPobre: 0.8,
    sinTutor: 0.8,
    apretadas: 0.7,
    dulce: 1.2,
    /** la maceta chica rinde menos: ajuste de la maceta más esto */
    extraDeMaceta: 0.2,
    /** cosechar se lleva materia orgánica */
    moQueSeLleva: 2,
    /** después de cosechar vuelve este tanto atrás, en días de crecimiento */
    vuelveAtras: { perenne: 20, resto: 10 },
    /** décadas que ocupa el lugar una planta que semilla */
    decadasSemillando: { fruto: 1, bienal: 9, resto: 3 },
    sobresPorSemillar: 4,
  },

  /** [SUPUESTO] el raleo */
  raleo: {
    /** desde cuántos días de crecimiento lo raleado se come */
    seComeDesde: 18,
    porcionesPorPlanta: 0.2,
  },

  /** [SUPUESTO] el suelo */
  suelo: {
    moMin: 5,
    moMax: 100,
    /** materia orgánica desde la que un franco fértil pasa a húmedo y rico */
    moRica: 80,
    /** quitar una planta: los frutos se llevan más; las leguminosas devuelven nitrógeno */
    moQueSeLleva: { fruto: 6, resto: 4 },
    moQueDejaLeguminosa: 8,
    /** una dosis de compost */
    moPorCompost: 25,
    /** el mulch se hace tierra de a poco */
    moPorMulch: 1,
    /** cuánto le gusta a cada planta cada suelo; filas = lo que pide la planta */
    compatibilidad: {
      FRANCO_FERTIL: { FRANCO_FERTIL: 1, PROFUNDO_SUELTO: 0.95, ARENOSO_DRENANTE: 0.8, HUMEDO_RICO: 0.92 },
      PROFUNDO_SUELTO: { FRANCO_FERTIL: 0.72, PROFUNDO_SUELTO: 1, ARENOSO_DRENANTE: 0.9, HUMEDO_RICO: 0.75 },
      ARENOSO_DRENANTE: { FRANCO_FERTIL: 0.8, PROFUNDO_SUELTO: 0.95, ARENOSO_DRENANTE: 1, HUMEDO_RICO: 0.6 },
      HUMEDO_RICO: { FRANCO_FERTIL: 0.82, PROFUNDO_SUELTO: 0.8, ARENOSO_DRENANTE: 0.6, HUMEDO_RICO: 1 },
      RUSTICO_TOLERANTE: { FRANCO_FERTIL: 1, PROFUNDO_SUELTO: 1, ARENOSO_DRENANTE: 1, HUMEDO_RICO: 0.9 },
    } as Record<CategoriaSuelo, Partial<Record<CategoriaSuelo, number>>>,
    compatibilidadSinDato: 0.85,
    /** el factor de suelo va de 0.65 (sin materia orgánica) a 1 */
    factorBase: 0.65,
    factorPorMo: 0.35,
  },

  /** [SUPUESTO] la maceta */
  maceta: {
    /** si huertapp no dice cuánto pide la especie */
    litrosSinDato: 8,
    profundidadSinDato: 30,
    /** a media maceta (la mitad de los litros y 60 % del hondo) crece al 60 %; más chica, al 35 % */
    medianaLitros: 0.5,
    medianaHondo: 0.6,
    factorMediana: 0.6,
    factorChica: 0.35,
    /** una maceta de 4 L o menos se seca más */
    chicaLitros: 4,
    secadoExtra: 0.2,
  },

  /** [REPO] la escala de riego; [SUPUESTO] el balance hídrico simplificado, de 0 (seco) a 4,5 (encharcado) */
  agua: {
    deseo: { escaso: 0.6, espaciado: 1.4, parejo: 2.2, constante: 3.0 } as Record<RegimenRiego, number>,
    /** lluvia de la década (mm) → humedad que suma */
    lluvia: [
      { hasta: 8, suma: 0 },
      { hasta: 25, suma: 0.7 },
      { hasta: 50, suma: 1.4 },
    ],
    lluviaMucha: 2.2,
    /** por encima de 24 °C de máxima, cada grado seca esto */
    calorDesde: 24,
    secadoPorGrado: 0.09,
    mulch: 0.5,
    /** tolerancia: por debajo del deseo seca, por encima encharca */
    falta: 0.6,
    sobra: 0.8,
    pendienteSeco: 0.5,
    pendienteExceso: 0.35,
    pisoSeco: 0.15,
    pisoExceso: 0.4,
    maxima: 4.5,
  },

  /** [SUPUESTO] la luz */
  luz: {
    /** entre las horas mínimas y las ideales, el factor va de 0.7 a 1 (0.7 + 0.3) */
    enElMinimo: 0.7,
    subeHastaIdeal: 0.3,
    /** para no dividir por un rango de horas demasiado chico */
    rangoMinimo: 0.5,
    curvaDebajoDelMinimo: 1.5,
    piso: 0.08,
    /** a una planta de media sombra le pega el sol fuerte: más de 8 h con más de 28 °C */
    mediaSombraHoras: 8,
    mediaSombraCalor: 28,
    mediaSombraTope: 0.85,
  },

  /** [SUPUESTO] la temperatura */
  temperatura: {
    /** el microtúnel suma de día */
    bajoTunel: 3,
    frioBase: 0.2,
    frioRango: 0.8,
    frioPiso: 0.1,
    calorRango: 0.6,
    calorPiso: 0.3,
  },

  /** [REPO] asociaciones; [SUPUESTO] cuánto suma cada vecino, atenuado por la confianza del dato */
  vecinos: {
    buena: 0.08,
    mala: 0.12,
    confianzaPlena: 8,
    confianzaMin: 0.4,
    piso: 0.65,
    techo: 1.25,
  },

  /** [SUPUESTO] el fantasma de siembra: qué tan bien le iría a una especie en una celda */
  fantasma: {
    /** la luz se mira ahora y dentro de 6 décadas: la planta va a vivir ahí */
    decadasAdelante: 5,
    temperaturaDeReferencia: 20,
    avisoPocaLuz: 0.75,
    avisoMalSuelo: 0.7,
    sueloFrio: 0.3,
    enAlmacigoSinTrasplante: 0.4,
    bien: 0.72,
    regular: 0.45,
    techo: 1.2,
  },

  /**
   * [REPO] compostaje.json: la receta (1 a 3 secos por cada verde; la más repetida, 2 a 1), qué es
   * verde y qué es seco, las señales (huele y hay mosquitas: faltan secos; no pasa nada: sobran) y
   * que está lista desde ~120 días, más rápido en verano. [SUPUESTO] las cantidades y los ritmos.
   * La unidad es la carga: más o menos un balde de restos de cocina.
   */
  compost: {
    /** lo que echa la cocina por década: yerba y cáscaras (verdes); cartón y papel (secos) */
    cocina: { verdes: 1, secos: 0.5 },
    /** lo que suma cada cosa que va a la compostera: una planta entera, los restos de una cosecha, un raleo */
    porPlanta: 1,
    porCosecha: 0.5,
    porRaleo: 0.5,
    /** [REPO] secos por cada verde: la receta. Al echar verdes se tapan con secos de la bolsa hasta `ideal` */
    receta: { min: 1, ideal: 2, max: 3 },
    /** verdes que cierran una tanda */
    tanda: 6,
    /** muy húmeda (menos secos que `receta.min`) se pudre y avanza a este ritmo; muy seca (más que `max`), a este */
    ritmoHumeda: 0.5,
    ritmoSeca: 0.6,
    /** avance por década según la temperatura media */
    avanceConCalor: 1.3,
    calorDesde: 20,
    avanceConFrio: 0.7,
    frioDesde: 12,
    madura: 12,
    dosisPorTanda: 3,
  },

  /**
   * [SUPUESTO] el patio como fuente de verdes y secos para el compost y el mulch. [REPO] compostaje.json:
   * el pasto recién cortado es verde; el pasto seco, las hojas secas y la poda picada son secos.
   * Los caducos pierden la hoja cuando la región dice que se les termina (`caducos.hasta`).
   * En carga, como el compost.
   */
  jardin: {
    /** pasto que crece por m² y década: el césped del GBA casi no crece con frío */
    pastoPorM2: { calor: 0.15, templado: 0.08, frio: 0.02 },
    pastoCalorDesde: 18,
    pastoFrioBajo: 12,
    /** sin cortar, el pasto llega como mucho a lo que crece en tantas décadas de calor */
    pastoTopeDecadas: 3,
    /** con menos pasto crecido que esto no hay nada que cortar */
    pastoMinimo: 0.5,
    /** lo que queda del pasto cuando se seca al sol */
    pastoSeco: 0.5,
    /** décadas que tardan en caer las hojas de los caducos */
    caidaDecadas: 5,
    /** hojas por década de caída: por cada celda de radio de copa de un caduco del patio, y de la vereda */
    hojasPorCopa: 1.2,
    hojasDeVereda: 2,
    /** las hojas que no se juntan se vuelan o se deshacen: lo que queda cada década fuera de la caída */
    hojasQuedan: 0.5,
    /** menos que esto ya no se junta: se deshizo */
    hojasMinimas: 0.2,
    /** ramas de la poda de invierno, por celda de radio de copa */
    podaPorCopa: 1,
    /** ratos: cortar el pasto, juntar hojas, podar */
    ratosCortar: 1,
    ratosJuntar: 1,
    ratosPodar: 2,
    /** los secos con los que arranca la bolsa */
    bolsaInicial: 6,
    /** secos que se lleva cubrir una celda de mulch */
    secosPorMulch: 1,
  },

  /** [SUPUESTO] polinizadores */
  polinizadores: {
    /** una aromática abierta cuenta media flor */
    aromatica: 0.5,
    visitasConCalor: 3,
    calorDesde: 14,
  },

  /** [SUPUESTO] cuánto lugar ocupa y cuánto sombrea una planta (ver `src/dominio/espacio.ts`) */
  espacio: {
    /** en directa se siembra el marco y un tercio más, para ralear */
    extraParaRalear: 3,
    /** una planta recién nacida ya levanta este tanto de su alto de grande */
    altoInicial: 0.15,
    /** lo que levanta menos que esto no le hace sombra a nadie (m) */
    sombreaDesde: 0.4,
  },

  /** [SUPUESTO] lo que piden los logros (`src/dominio/misiones.ts`) */
  misiones: {
    /** especies distintas cosechadas para "Diversidad" */
    diversidad: 5,
    /** "Huerta de invierno": cosechar entre estas décadas estacionales (junio a agosto en el sur) */
    invierno: [16, 24],
  },

  /** [SUPUESTO] el puntaje de fin de año */
  balance: {
    porEspecie: 3,
    porSobreGuardado: 0.5,
    visitasPorPunto: 10,
    topeDeVisitas: 20,
  },

  /** [SUPUESTO] cada cuánto hay eventos sorpresa (las filas están en `sorpresas.ts`) */
  sorpresas: {
    /** probabilidad por década de que llegue un regalo, si hay alguno que pueda llegar */
    probRegalo: 0.3,
    /** probabilidad por década de que se anuncie una amenaza para la que viene, si hay alguna que pueda pasar */
    probAmenaza: 0.25,
    /** décadas sin amenazas después de una: nunca dos seguidas */
    respiro: 3,
    /** décadas antes de que el mismo evento pueda repetirse */
    mismaCada: 12,
    /** un golpe lastima pero no mata de una: la salud no baja de esto */
    saludMinima: 1,
  },

  /** [SUPUESTO] los pedidos de los vecinos (`datos/juego/pedidos.ts`) */
  pedidos: {
    /** probabilidad por década de que llegue un pedido, si hay alguno que pueda llegar */
    prob: 0.35,
    /** pedidos abiertos a la vez, como mucho */
    maxAbiertos: 2,
    /** logros cumplidos antes del primer pedido: los vecinos piden cuando ven que ya cosechás */
    desdeLogros: 2,
    /** décadas desde que se cerró antes de que el mismo pedido pueda volver: el año que viene, no antes */
    mismoCada: 24,
    /**
     * cuánto crece una huerta bien cuidada respecto de lo que da el tiempo, como factor de 0 a 1. Con
     * esto, la temperatura normal y la luz y el suelo del patio se cuenta hasta cuándo se puede sembrar
     * para llegar a la fecha. Es 1 porque quien riega según el pronóstico, trata y resiembra crece eso:
     * con menos, en el balcón se llegaba sembrando después de «a más tardar» (tests/pedidos.test.ts)
     */
    cuidado: 1,
    /** la máxima, en °C, con la que se cuenta la luz de media sombra al estimar */
    temperaturaDeReferencia: 20,
  },

  /** [SUPUESTO] el trasplante */
  trasplante: {
    /** se puede mover hasta esta cantidad de días de crecimiento después del máximo de trasplante */
    margenDeEdad: 40,
    danioSinTolerar: 40,
    vigorSinTolerar: 70,
    danioChico: 15,
    vigorFueraDeVentana: 88,
    vigorRepitiendoFamilia: 85,
  },
} as const;
