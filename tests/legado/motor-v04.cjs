/* ORÁCULO: el motor del prototipo v0.4, tal cual, para el test dorado.
 * No se usa en el juego. Un solo parche respecto del original: factoresPlanta ahora expone agua.diff,
 * sin el cual el daño por exceso de riego nunca se disparaba (bug que encontró el tipado).
 * Recibe el catálogo por globalThis.Huertita.DATOS, así los dos motores ven los mismos datos.
 * Se jubila cuando el tic diario cambie la conducta a propósito. */
/**
 * HUERTITA — motor de simulación.
 *
 * Capa pura: no toca DOM, no dibuja, no sabe que existe una pantalla.
 * Todo el estado de una partida es un objeto JSON serializable, y el azar sale
 * de un generador con semilla guardada en el estado: misma semilla + mismas
 * acciones = misma partida. Corre igual en el navegador y en Node.
 *
 * API:
 *   crearPartida(semilla)            → estado
 *   despachar(estado, accion)        → { ok, eventos } | { ok:false, error }
 *   pasarDecada(estado)              → eventos[]
 *   consultas: horasSol, evaluarCelda, factoresPlanta, costoRiego, ratosLibres,
 *              ventana, fechaDe, celdasDe, plantaEn, balance
 *
 * Convención de fuentes: lo que sale del repo info-huerta está marcado [REPO];
 * lo que es un supuesto del juego, [SUPUESTO], igual que en clima-gba.mjs.
 */
(function (root) {
  'use strict';
  var DATOS = (root.Huertita && root.Huertita.DATOS) || require('./datos.js');
  var ESP = DATOS.especies;

  // ── Clima del conurbano ────────────────────────────────────────────────────
  // [REPO] scripts/clima-gba.mjs · Ezeiza Aero, normales SMN 1991-2020 y heladas FAUBA (umbral 3 °C)
  var CLIMA = {
    media: [24.1, 23.0, 21.0, 17.1, 13.6, 10.8, 9.8, 11.8, 13.8, 16.8, 20.0, 22.7],
    maxima: [30.3, 28.8, 26.8, 22.9, 19.0, 15.9, 15.0, 17.5, 19.3, 22.2, 25.8, 29.0],
    minima: [17.9, 17.1, 15.4, 11.8, 8.9, 6.1, 5.2, 6.6, 8.3, 11.2, 13.8, 16.2],
    primeraHelada: 119, desvioPrimera: 16, // 29-abr
    ultimaHelada: 278, desvioUltima: 23,   // 5-oct
    // [SUPUESTO] lluvia mensual aproximada de Ezeiza, en mm. No está en el repo.
    lluvia: [110, 105, 115, 95, 75, 55, 55, 60, 65, 105, 100, 100]
  };
  var DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var TERCIOS = ['principios', 'mediados', 'fines'];
  var CARACTERES = {
    normal: { nombre: 'Año normal', dT: 0, lluvia: 1, helada: 0, texto: 'Sin señales fuertes: un año parecido al promedio.' },
    nina: { nombre: 'Año Niña', dT: 0.7, lluvia: 0.62, helada: 0, texto: 'Se espera menos lluvia que lo normal y un verano caluroso. El riego va a pesar.' },
    nino: { nombre: 'Año Niño', dT: -0.2, lluvia: 1.45, helada: 0, texto: 'Se espera más lluvia que lo normal: ojo con babosas y encharcamientos.' },
    tardia: { nombre: 'Año de heladas tardías', dT: -0.8, lluvia: 1, helada: 0.18, texto: 'Primavera fría: las heladas pueden estirarse hasta fines de octubre.' }
  };

  function mesDe(dec) { return Math.floor((dec - 1) / 3) + 1; }
  function diaCentral(dec) {
    var mes = mesDe(dec), t = (dec - 1) % 3, d = t === 0 ? 5 : t === 1 ? 15 : Math.round((21 + DIAS_MES[mes - 1]) / 2);
    for (var m = 1; m < mes; m++) d += DIAS_MES[m - 1];
    return d;
  }
  function interp(vals, dia) {
    var centros = [], acc = 0;
    for (var i = 0; i < 12; i++) { centros.push(acc + 15); acc += DIAS_MES[i]; }
    for (var j = 0; j < 12; j++) {
      var a = centros[j], b = j === 11 ? centros[0] + 365 : centros[j + 1];
      var d = (dia < centros[0]) ? dia + 365 : dia;
      if (d >= a && d <= b) return vals[j] + (d - a) / (b - a) * (vals[(j + 1) % 12] - vals[j]);
    }
    return vals[0];
  }
  function phi(z) { // normal acumulada
    var t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }
  /** [REPO] P(estar dentro de la temporada de heladas), modelo FAUBA de dos normales. */
  function pTemporadaHelada(dec) {
    var d = diaCentral(dec);
    return phi((d - CLIMA.primeraHelada) / CLIMA.desvioPrimera) * (1 - phi((d - CLIMA.ultimaHelada) / CLIMA.desvioUltima));
  }
  function fechaDe(dec) { return TERCIOS[(dec - 1) % 3] + ' de ' + MESES[mesDe(dec) - 1]; }
  function estacionDe(dec) { return dec >= 34 || dec <= 8 ? 'verano' : dec <= 17 ? 'otoño' : dec <= 26 ? 'invierno' : 'primavera'; }

  // ── Azar con semilla ───────────────────────────────────────────────────────
  function azar(E) {
    E.rng = (E.rng + 0x6D2B79F5) | 0;
    var t = Math.imul(E.rng ^ (E.rng >>> 15), 1 | E.rng);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function gauss(E) { return Math.sqrt(-2 * Math.log(azar(E) + 1e-9)) * Math.cos(6.2831853 * azar(E)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function r1(v) { return Math.round(v * 10) / 10; }

  // ── El patio ───────────────────────────────────────────────────────────────
  // El norte está ARRIBA: en el hemisferio sur el sol anda por el norte, así que
  // el paredón de arriba sombrea el patio, y más en invierno, con el sol bajo.
  var ANCHO = 8, ALTO = 9;
  var MAPA = [
    'PPPPPPPP',
    'ssssss.T',
    'ssssss.T',
    '........',
    'eeee.mm.',
    'eeee.mm.',
    '........',
    'aaaa.C..',
    'HHHHHHHH'
  ];
  var ZONAS = {
    suelo: { nombre: 'Bancal a suelo', suelo: 'FRANCO_FERTIL', mo: 42, drenaje: 0, riegoCosto: [0, 1, 2, 3], desc: 'Tierra del lugar, profunda y algo pesada. El paredón norte le saca sol en invierno.' },
    elevado: { nombre: 'Bancal elevado', suelo: 'PROFUNDO_SUELTO', mo: 60, drenaje: 0.3, riegoCosto: [0, 1, 2, 3], desc: 'Cajón con sustrato mullido. Drena rápido, calienta antes y admite microtúnel.' },
    macetas: { nombre: 'Macetas', suelo: 'FRANCO_FERTIL', mo: 55, drenaje: 0.7, riegoCosto: [0, 1, 1, 2], desc: 'Se secan mucho antes que la tierra. El tamaño decide qué entra.' },
    almacigo: { nombre: 'Almaciguera', suelo: 'FRANCO_FERTIL', mo: 70, drenaje: 0.5, riegoCosto: [0, 0, 1, 1], desc: 'Contra la casa, mirando al norte y bajo alero: reparada de heladas y de la lluvia. Solo para criar plantines.' }
  };
  var LETRA_ZONA = { s: 'suelo', e: 'elevado', m: 'macetas', a: 'almacigo' };
  var MACETAS = { '5,4': { litros: 4, prof: 15 }, '6,4': { litros: 8, prof: 30 }, '5,5': { litros: 8, prof: 30 }, '6,5': { litros: 20, prof: 45 } };
  var RIEGOS = ['nada', 'espaciado', 'parejo', 'constante'];
  var DESEO_AGUA = { escaso: 0.6, espaciado: 1.4, parejo: 2.2, constante: 3.0 }; // [REPO] la escala; [SUPUESTO] los números
  var RATOS = 14;
  // [SUPUESTO] cuántas semillas van por siembra: una tanda de celdas en la almaciguera, un golpe o chorrillo en directa
  var VEGETATIVAS = 'ajo papa batata frutilla romero menta lavanda laurel'.split(' ');
  function semillasPorSiembra(slug, enAlmacigo) { var sp = ESP[slug]; if (VEGETATIVAS.indexOf(slug) >= 0) return 1; if (enAlmacigo) return 6; return (sp.familia === 'leguminosa' || sp.familia === 'cucurbitacea' || slug === 'choclo' || slug === 'girasol') ? 3 : 4; }
  var RALEO_SE_COME = 'rabanito zanahoria remolacha nabo lechuga rucula espinaca acelga kale cebolla-de-verdeo perejil cilantro'.split(' ');
  var BIENALES = 'zanahoria remolacha acelga cebolla puerro perejil apio repollo kale nabo repollitos-de-bruselas'.split(' ');

  var SOBRES_INICIO = { rabanito: 6, lechuga: 6, acelga: 4, arveja: 6, haba: 4, perejil: 3, calendula: 4, tomate: 4, albahaca: 4, zanahoria: 6, 'cebolla-de-verdeo': 4, rucula: 4 };
  var MISIONES = [
    { id: 'germina', titulo: 'Que algo nazca', texto: 'Lográ que germine tu primera semilla.', premio: { copete: 4, chaucha: 6 } },
    { id: 'cosecha1', titulo: 'Primera cosecha', texto: 'Cosechá cualquier cosa. El rabanito es el más rápido: 25 días.', premio: { 'zapallito-de-tronco': 3, pepino: 3, borraja: 3 } },
    { id: 'plantin', titulo: 'Del almácigo al bancal', texto: 'Trasplantá un plantín listo a su lugar definitivo.', premio: { pimiento: 3, berenjena: 3, brocoli: 4 } },
    { id: 'socios', titulo: 'Buenos vecinos', texto: 'Tené dos plantas que se asocien bien, una al lado de la otra.', premio: { remolacha: 6, espinaca: 6, kale: 4 } },
    { id: 'ensalada', titulo: 'Ensalada del patio', texto: 'Cosechá lechuga, tomate y albahaca en la misma partida.', premio: { 'aji-picante': 3, choclo: 6, zapallo: 2 } },
    { id: 'semillas', titulo: 'Semilla propia', texto: 'Dejá semillar una planta y guardá tus sobres.', premio: { ajo: 6, puerro: 4, romero: 1, menta: 1, lavanda: 1 } },
    { id: 'cinco', titulo: 'Diversidad', texto: 'Cosechá 5 especies distintas.', premio: { frutilla: 4, girasol: 3, capuchina: 3, cilantro: 4 } },
    { id: 'invierno', titulo: 'Huerta de invierno', texto: 'Cosechá algo entre junio y agosto.', premio: { repollo: 4, coliflor: 4, cebolla: 6, papa: 4 } }
  ];

  function celdasDe(zona) {
    var out = [];
    for (var y = 0; y < ALTO; y++) for (var x = 0; x < ANCHO; x++) if (LETRA_ZONA[MAPA[y][x]] === zona) out.push(x + ',' + y);
    return out;
  }
  function zonaDeCelda(c) { var p = c.split(','); return LETRA_ZONA[MAPA[+p[1]][+p[0]]] || null; }
  function xy(c) { var p = c.split(','); return { x: +p[0], y: +p[1] }; }

  function invierno(dec) { return (Math.cos(6.2831853 * (diaCentral(dec) - 172) / 365) + 1) / 2; }
  /** [SUPUESTO] Horas de sol directo de una celda en una década: geometría del patio. */
  function horasSol(E, celda, dec) {
    dec = dec || E.dec;
    var p = xy(celda), dia = diaCentral(dec);
    var inv = (Math.cos(6.2831853 * (dia - 172) / 365) + 1) / 2; // 1 en el solsticio de invierno
    var base = 10 - 3.5 * inv;
    var pared = [0, 2 + 3.5 * inv, 3 * inv, 1.2 * inv, 0.5 * inv][p.y] || 0;
    var conHojas = dec >= 28 || dec <= 12; // el paraíso es caduco
    var dist = Math.max(Math.abs(p.x - 7), Math.min(Math.abs(p.y - 1), Math.abs(p.y - 2)));
    var arbol = (dist <= 1 ? 4.5 : dist === 2 ? 3 : dist === 3 ? 1.5 : 0) * (conHojas ? 1 : 0.3);
    return r1(clamp(base - pared - arbol, 0, 12));
  }

  // ── Tiempo (clima de cada década) ──────────────────────────────────────────
  function generarTiempo(E, dec) {
    var car = CARACTERES[E.caracter], dia = diaCentral(dec), est = estacionDe(dec);
    var anom = gauss(E) * 2.1 + car.dT; // [SUPUESTO] desvío de la anomalía decádica
    var tmed = interp(CLIMA.media, dia) + anom;
    var tmax = interp(CLIMA.maxima, dia) + anom + 1 + Math.abs(gauss(E)) * 1.5; // el día más caluroso de los 10
    var tmin = interp(CLIMA.minima, dia) + anom - 3 - Math.abs(gauss(E)) * 1.8; // la noche más fría
    var pTemp = clamp(pTemporadaHelada(dec) + (dec >= 25 && dec <= 31 ? car.helada : 0), 0, 1);
    if (azar(E) < pTemp * 0.35) tmin = Math.min(tmin, 2.5 - azar(E) * 3); // [SUPUESTO] frecuencia dentro de la temporada
    var lluvia = CLIMA.lluvia[mesDe(dec) - 1] / 3 * car.lluvia * clamp(Math.exp(gauss(E) * 0.75 - 0.2), 0, 3.5);
    var real = { dec: dec, tmed: r1(tmed), tmax: r1(tmax), tmin: r1(tmin), lluvia: Math.round(lluvia), helada: tmin <= 3, ola: tmax >= 35, estacion: est };
    // El pronóstico es la realidad con ruido: informa, no garantiza.
    var ftmin = tmin + gauss(E) * 1.8, ftmax = tmax + gauss(E) * 1.5;
    var pron = {
      tmin: Math.round(ftmin), tmax: Math.round(ftmax),
      pHelada: Math.round(clamp(phi((3 - ftmin) / 2.2), 0, 1) * 100),
      lluvia: azar(E) < 0.72 ? (lluvia < 12 ? 'seca' : lluvia > 45 ? 'llovedora' : 'normal') : ['seca', 'normal', 'llovedora'][Math.floor(azar(E) * 3)]
    };
    return { real: real, pron: pron };
  }

  // ── Partida ────────────────────────────────────────────────────────────────
  function crearPartida(semilla, opciones) {
    opciones = opciones || {};
    var E = {
      v: 1, semilla: semilla | 0, rng: (semilla | 0) ^ 0x9E3779B9,
      dec: opciones.decInicio || 22, turno: 0, anio: 1, caracter: 'normal',
      ratosGastados: 0, riego: { suelo: 2, elevado: 2, macetas: 2, almacigo: 2 },
      tunel: false, manta: {}, goteo: false,
      celdas: {}, plantas: {}, nextId: 1,
      sobres: {}, gen: {}, compost: { dosis: 2, carga: 0, tandas: [] },
      cosechado: {}, porciones: 0, semillasGuardadas: 0, visitas: 0, moInicial: 0,
      misiones: {}, cuaderno: [], prox: null, terminado: false
    };
    var ks = Object.keys(CARACTERES);
    E.caracter = opciones.caracter || ks[Math.floor(azar(E) * ks.length)];
    for (var s in SOBRES_INICIO) E.sobres[s] = SOBRES_INICIO[s];
    ['suelo', 'elevado', 'macetas', 'almacigo'].forEach(function (z) {
      celdasDe(z).forEach(function (c) { E.celdas[c] = { zona: z, mo: ZONAS[z].mo, mulch: false, fam: null, planta: null }; });
    });
    E.moInicial = moMedia(E);
    E.prox = generarTiempo(E, E.dec);
    anotar(E, 'info', 'Arranca la huerta a ' + fechaDe(E.dec) + '. ' + CARACTERES[E.caracter].nombre + ': ' + CARACTERES[E.caracter].texto);
    anotar(E, 'info', 'Todavía hiela. El bancal elevado es el que más sol tiene ahora; la almaciguera está reparada. El tomate se arranca en almácigo protegido.');
    return E;
  }
  function moMedia(E) { var t = 0, n = 0; for (var c in E.celdas) if (E.celdas[c].zona !== 'almacigo') { t += E.celdas[c].mo; n++; } return t / n; }
  function anotar(E, tipo, texto, celda) { var ev = { turno: E.turno, dec: E.dec, tipo: tipo, texto: texto, celda: celda || null }; E.cuaderno.push(ev); if (E.cuaderno.length > 400) E.cuaderno.shift(); return ev; }
  function plantaEn(E, celda) { var c = E.celdas[celda]; return c && c.planta ? E.plantas[c.planta] : null; }

  function costoRiego(E) {
    var t = 0;
    for (var z in E.riego) t += Math.max(0, ZONAS[z].riegoCosto[E.riego[z]] - (E.goteo && ZONAS[z].riegoCosto[E.riego[z]] > 0 ? 1 : 0));
    return t;
  }
  function ratosLibres(E) { return RATOS - costoRiego(E) - E.ratosGastados; }

  /** [REPO] calendario.decadas.conurbano → 'ideal' | 'posible' | 'fuera' */
  function ventana(slug, dec, que) {
    var d = ESP[slug].dec || {}, k = que || 'siembra';
    if ((d[k + '_ideal'] || []).indexOf(dec) >= 0) return 'ideal';
    if ((d[k + '_posible'] || []).indexOf(dec) >= 0) return 'posible';
    return 'fuera';
  }
  function metodoDe(slug, dec) { return (ESP[slug].metodo || {})[String(mesDe(dec))] || null; }

  // ── Factores de crecimiento ────────────────────────────────────────────────
  var SUELO_COMPAT = { // [SUPUESTO] cuánto pesa cada desajuste; filas = lo que pide la planta
    FRANCO_FERTIL: { FRANCO_FERTIL: 1, PROFUNDO_SUELTO: 0.95, ARENOSO_DRENANTE: 0.8, HUMEDO_RICO: 0.92 },
    PROFUNDO_SUELTO: { FRANCO_FERTIL: 0.72, PROFUNDO_SUELTO: 1, ARENOSO_DRENANTE: 0.9, HUMEDO_RICO: 0.75 },
    ARENOSO_DRENANTE: { FRANCO_FERTIL: 0.8, PROFUNDO_SUELTO: 0.95, ARENOSO_DRENANTE: 1, HUMEDO_RICO: 0.6 },
    HUMEDO_RICO: { FRANCO_FERTIL: 0.82, PROFUNDO_SUELTO: 0.8, ARENOSO_DRENANTE: 0.6, HUMEDO_RICO: 1 },
    RUSTICO_TOLERANTE: { FRANCO_FERTIL: 1, PROFUNDO_SUELTO: 1, ARENOSO_DRENANTE: 1, HUMEDO_RICO: 0.9 }
  };
  function sueloDeCelda(E, celda) { var c = E.celdas[celda]; return c.mo >= 80 && ZONAS[c.zona].suelo === 'FRANCO_FERTIL' ? 'HUMEDO_RICO' : ZONAS[c.zona].suelo; }

  function fLuz(sp, h, tmax) {
    var f = h >= sp.hideal ? 1 : h >= sp.hmin ? 0.7 + 0.3 * (h - sp.hmin) / Math.max(0.5, sp.hideal - sp.hmin) : 0.7 * Math.pow(h / Math.max(1, sp.hmin), 1.5);
    if (sp.luz === 'MEDIA_SOMBRA' && h > 8 && tmax > 28) f = Math.min(f, 0.85);
    return clamp(f, 0.08, 1);
  }
  function fSuelo(E, sp, celda) {
    var c = E.celdas[celda];
    return ((SUELO_COMPAT[sp.suelo] || {})[sueloDeCelda(E, celda)] || 0.85) * (0.65 + 0.35 * c.mo / 100);
  }
  function fMaceta(sp, celda) {
    var m = MACETAS[celda]; if (!m) return 1;
    var pide = sp.maceta || {}, l = pide.litros_min || 8, p = pide.profundidad_min_cm || 30; // [SUPUESTO] 8 L / 30 cm si el repo no dice
    return (m.litros >= l && m.prof >= p) ? 1 : (m.litros >= l * 0.5 && m.prof >= p * 0.6) ? 0.6 : 0.35;
  }
  function humedad(E, celda, w) {
    var c = E.celdas[celda], z = ZONAS[c.zona];
    var cubierta = c.zona === 'almacigo' || (c.zona === 'elevado' && E.tunel);
    var ll = cubierta ? 0 : w.lluvia < 8 ? 0 : w.lluvia < 25 ? 0.7 : w.lluvia < 50 ? 1.4 : 2.2;
    var calor = w.tmax > 24 ? (w.tmax - 24) * 0.09 : 0;
    var dren = z.drenaje + (MACETAS[celda] && MACETAS[celda].litros <= 4 ? 0.2 : 0);
    return E.riego[c.zona] + ll - calor - dren + (c.mulch ? 0.5 : 0);
  }
  function fAgua(sp, H) {
    var diff = H - DESEO_AGUA[sp.riego];
    if (diff < -0.6) return { f: clamp(1 - (-0.6 - diff) * 0.5, 0.15, 1), estado: 'seco', diff: diff };
    if (diff > 0.8) return { f: clamp(1 - (diff - 0.8) * 0.35, 0.4, 1), estado: 'exceso', diff: diff };
    return { f: 1, estado: 'bien', diff: diff };
  }
  function tempEfectiva(E, celda, w) { var z = E.celdas[celda].zona; return w.tmed + (z === 'almacigo' ? 2 : 0) + (z === 'elevado' && E.tunel ? 3 : 0); }
  function fTemp(sp, t) {
    var c = sp.tc; if (!c) return 1;
    if (t >= c.ideal_min && t <= c.ideal_max) return 1;
    if (t < c.ideal_min) return clamp(0.2 + 0.8 * (t - c.tolera_min) / Math.max(1, c.ideal_min - c.tolera_min), 0.1, 1);
    return clamp(1 - 0.6 * (t - c.ideal_max) / Math.max(1, c.tolera_max - c.ideal_max), 0.3, 1);
  }
  function vecinas(celda) {
    var p = xy(celda), out = [];
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) if (dx || dy) out.push((p.x + dx) + ',' + (p.y + dy));
    return out;
  }
  function relacion(a, b) { // 'mala' | 'buena' | null — lo malo pesa más que lo bueno
    var A = ESP[a], B = ESP[b];
    if (A.malas.indexOf(b) >= 0 || B.malas.indexOf(a) >= 0) return 'mala';
    if (A.buenas.indexOf(b) >= 0 || B.buenas.indexOf(a) >= 0) return 'buena';
    return null;
  }
  /** [REPO] asociaciones; [SUPUESTO] +8 % / −12 % por vecino, atenuado por la confianza del dato. */
  function fVecinos(E, slug, celda, ignorarId) {
    var f = 1, buenas = [], malas = [], sp = ESP[slug];
    vecinas(celda).forEach(function (v) {
      var pl = plantaEn(E, v); if (!pl || pl.id === ignorarId || pl.etapa === 'semilla') return;
      var r = relacion(slug, pl.slug);
      if (r === 'buena') { f += 0.08 * clamp(sp.confB / 8, 0.4, 1); buenas.push(ESP[pl.slug].nombre); }
      if (r === 'mala') { f -= 0.12 * clamp(sp.confM / 8, 0.4, 1); malas.push(ESP[pl.slug].nombre); }
    });
    return { f: clamp(f, 0.65, 1.25), buenas: buenas, malas: malas };
  }
  function aliadosCerca(E, celda) { // flores y aromáticas a 2 celdas: refugio de enemigos naturales
    var p = xy(celda), n = 0;
    for (var id in E.plantas) {
      var pl = E.plantas[id], q = xy(pl.celda), sp = ESP[pl.slug];
      if (pl.celda === celda || pl.etapa === 'semilla' || pl.etapa === 'plantin') continue;
      if ((sp.flor || sp.grupo === 'Aromática') && Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) <= 2) n++;
    }
    return n;
  }
  function floresAbiertas(E) {
    var n = 0;
    for (var id in E.plantas) { var pl = E.plantas[id], sp = ESP[pl.slug]; if (pl.etapa === 'cosechable' && (sp.flor || sp.familia === 'lamiacea')) n += sp.flor ? 1 : 0.5; }
    return n;
  }
  function objetivoCosecha(sp) { return sp.dc.min + (sp.dc.max - sp.dc.min) * 0.35; }

  /** Lo que la UI muestra como barritas: por qué esta planta crece como crece. */
  function factoresPlanta(E, pl, w) {
    w = w || E.prox.real;
    var sp = ESP[pl.slug], h = horasSol(E, pl.celda, w.dec), H = humedad(E, pl.celda, w), ag = fAgua(sp, H), ve = fVecinos(E, pl.slug, pl.celda, pl.id);
    var t = tempEfectiva(E, pl.celda, w);
    return {
      luz: { f: fLuz(sp, h, w.tmax), horas: h, pide: (sp.hmin === sp.hideal ? sp.hmin + ' h o más' : sp.hmin + '–' + sp.hideal + ' h'), min: sp.hmin, ideal: sp.hideal },
      agua: { f: ag.f, estado: ag.estado, diff: ag.diff, pide: sp.riego, H: r1(clamp(H, 0, 4.5)), lo: DESEO_AGUA[sp.riego] - 0.6, hi: DESEO_AGUA[sp.riego] + 0.8 },
      temp: { f: fTemp(sp, t), t: r1(t), pide: sp.tc ? sp.tc.ideal_min + '–' + sp.tc.ideal_max + ' °C' : '', tc: sp.tc || null, tmin: w.tmin, tmax: w.tmax },
      suelo: { f: clamp(fSuelo(E, sp, pl.celda) * fMaceta(sp, pl.celda), 0, 1), mo: Math.round(E.celdas[pl.celda].mo), maceta: fMaceta(sp, pl.celda) },
      vecinos: { f: ve.f, buenas: ve.buenas, malas: ve.malas }
    };
  }

  /** El "fantasma de siembra": qué tan bien le iría HOY a esta especie en esta celda. */
  function evaluarCelda(E, slug, celda) {
    var sp = ESP[slug], c = E.celdas[celda]; if (!c) return null;
    var w = E.prox.real, razones = [], h = horasSol(E, celda, E.dec);
    // la luz se mira también a 6 décadas: la planta va a vivir ahí
    var h2 = horasSol(E, celda, ((E.dec + 5) % 36) + 1);
    var l = (fLuz(sp, h, 20) + fLuz(sp, h2, 20)) / 2, s = fSuelo(E, sp, celda), m = fMaceta(sp, celda), ve = fVecinos(E, slug, celda);
    var enAlm = c.zona === 'almacigo', vent = ventana(slug, E.dec), vig = vent === 'ideal' ? 1 : vent === 'posible' ? 0.85 : 0.6;
    if (l < 0.75) razones.push('Poca luz: ' + h + ' h ahora, pide ' + sp.hmin + '–' + sp.hideal + ' h. ' + sp.luzNo);
    if (s < 0.7) razones.push('El suelo no le gusta (' + DATOS.meta.suelos[sueloDeCelda(E, celda)].nombre + ', pide ' + DATOS.meta.suelos[sp.suelo].nombre + '). ' + sp.sueloNo);
    if (m < 1) razones.push('La maceta le queda chica: pide ' + ((sp.maceta || {}).litros_min || 8) + ' L y ' + ((sp.maceta || {}).profundidad_min_cm || 30) + ' cm de hondo.');
    if (ve.malas.length) razones.push('Mal vecino: ' + ve.malas.join(', ') + '.');
    if (ve.buenas.length) razones.push('Buen vecino: ' + ve.buenas.join(', ') + '.');
    if (c.fam && c.fam === sp.familia) razones.push('Acá recién hubo otra ' + sp.familia + ': conviene rotar.');
    if (vent === 'fuera') razones.push('Fuera de época de siembra en el GBA.');
    else if (vent === 'posible') razones.push('Época posible, no ideal.');
    var tg = sp.tg, ts = tempEfectiva(E, celda, { tmed: interp(CLIMA.media, diaCentral(E.dec)) });
    if (tg && ts < tg.min) razones.push('Suelo frío para germinar (~' + Math.round(ts) + ' °C, necesita ' + tg.min + ' °C)' + (enAlm ? '.' : ': probá en la almaciguera.'));
    if (tg && ts > tg.max) razones.push('Suelo demasiado caliente para germinar.');
    if (enAlm && !sp.dt) razones.push(sp.nombre + ' no tolera el trasplante: va de siembra directa.');
    var germ = tg ? (ts < tg.min || ts > tg.max ? 0.3 : 1) : 1;
    var p = l * s * m * ve.f * vig * germ * (c.fam === sp.familia ? 0.85 : 1) * (enAlm && !sp.dt ? 0.4 : 1);
    return { puntaje: clamp(p, 0, 1.2), nivel: p >= 0.72 ? 'bien' : p >= 0.45 ? 'regular' : 'mal', razones: razones, horas: h };
  }

  // ── Abrigo contra heladas ──────────────────────────────────────────────────
  // [SUPUESTO] grados que suma cada protección a la mínima de la noche. Se acumulan.
  // Hay helada para la planta si mínima + abrigo ≤ 3 °C (el umbral agrometeorológico de FAUBA).
  var ABRIGO = { manta: 4, tunel: 5, alero: 5 };
  function abrigo(E, zona) {
    var g = 0, partes = [];
    if (zona === 'almacigo') { g += ABRIGO.alero; partes.push('alero y pared'); }
    if (zona === 'elevado' && E.tunel) { g += ABRIGO.tunel; partes.push('microtúnel'); }
    if (E.manta[zona]) { g += ABRIGO.manta; partes.push('manta'); }
    return { grados: g, partes: partes, aguanta: 3 - g }; // aguanta: mínima más baja sin daño (exclusiva)
  }
  /** % de que la helada le llegue a esa zona esta década, con el abrigo que tiene puesto y el pronóstico a la vista. */
  function riesgoHelada(E, zona) { return Math.round(clamp(phi((3 - abrigo(E, zona).grados - E.prox.pron.tmin) / 2.2), 0, 1) * 100); }
  function enRiesgo(E, zona) { var out = []; for (var id in E.plantas) { var pl = E.plantas[id], sp = ESP[pl.slug]; if (E.celdas[pl.celda].zona === zona && pl.etapa !== 'semilla' && (sp.helada === 'muere' || sp.helada === 'sensible') && out.indexOf(sp.nombre) < 0) out.push(sp.nombre); } return out; }

  // ── Acciones del jugador ───────────────────────────────────────────────────
  function gastar(E, n) { if (ratosLibres(E) < n) return false; E.ratosGastados += n; return true; }
  function quitarPlanta(E, pl, alCompost) {
    var c = E.celdas[pl.celda], sp = ESP[pl.slug];
    if (c.zona !== 'almacigo' && pl.etapa !== 'semilla') { c.fam = sp.familia; c.mo = clamp(c.mo - (sp.fruto ? 6 : 4) + (sp.familia === 'leguminosa' ? 8 : 0), 5, 100); }
    c.planta = null; delete E.plantas[pl.id];
    if (alCompost) E.compost.carga += 1;
  }
  function sumarSobres(E, premio) { for (var s in premio) E.sobres[s] = (E.sobres[s] || 0) + premio[s]; }
  function cumplir(E, id, evs) {
    if (E.misiones[id]) return;
    var m = MISIONES.filter(function (x) { return x.id === id; })[0]; if (!m) return;
    E.misiones[id] = E.turno; sumarSobres(E, m.premio);
    evs.push(anotar(E, 'logro', 'Logro: ' + m.titulo + '. Una vecina te pasa sobres de ' + Object.keys(m.premio).map(function (s) { return ESP[s].nombre.toLowerCase(); }).join(', ') + '.'));
  }

  var ACCIONES = {
    sembrar: function (E, a, evs) {
      var sp = ESP[a.slug], c = E.celdas[a.celda];
      if (!sp || !c) return 'No se puede sembrar ahí.';
      if (c.planta) return 'Esa celda está ocupada.';
      if (!(E.sobres[a.slug] > 0)) return 'No te quedan semillas de ' + sp.nombre.toLowerCase() + '.';
      if (!gastar(E, 1)) return 'No te quedan ratos esta década.';
      E.sobres[a.slug]--;
      var vent = ventana(a.slug, E.dec), gen = E.gen[a.slug] || 0;
      var vigor = (vent === 'ideal' ? 1 : vent === 'posible' ? 0.85 : 0.6) * (1 + 0.05 * Math.min(gen, 3)) * (c.fam === sp.familia ? 0.85 : 1);
      var id = 'p' + (E.nextId++);
      E.plantas[id] = { id: id, slug: a.slug, celda: a.celda, etapa: 'semilla', edad: 0, prog: 0, germ: 0, salud: 100, vigor: r1(vigor * 100) / 100, gen: gen, cosechas: 0, listoHace: 0, plaga: null, tutor: false, shock: 0, dulce: false, semillar: 0, pote: fMaceta(sp, a.celda), reserva: 0, n: 0, semillas: semillasPorSiembra(a.slug, c.zona === 'almacigo') };
      c.planta = id;
      var ns = E.plantas[id].semillas, txt = 'Sembraste ' + sp.nombre.toLowerCase() + ' en ' + ZONAS[c.zona].nombre.toLowerCase() + (ns > 1 ? (c.zona === 'almacigo' ? ': una tanda de ' + ns + ' celdas.' : ': ' + ns + ' semillas juntas.') : '.');
      if (vent === 'fuera') txt += ' Está fuera de época: va a venir floja.';
      if (c.fam === sp.familia) txt += ' Repetís familia en la misma tierra: rinde menos y junta plagas.';
      evs.push(anotar(E, 'info', txt, a.celda));
    },
    trasplantar: function (E, a, evs) {
      var pl = E.plantas[a.planta], dest = E.celdas[a.celda];
      if (!pl || !dest) return 'No se puede trasplantar ahí.';
      if (dest.planta) return 'Esa celda está ocupada.';
      if (dest.zona === 'almacigo') return 'La almaciguera es para criar plantines, no para recibirlos.';
      if (pl.etapa === 'semilla') return 'Todavía no germinó.';
      var sp0 = ESP[pl.slug], zo = E.celdas[pl.celda].zona;
      if (zo !== 'almacigo' && !sp0.dt) return sp0.nombre + ' no tolera el trasplante: si salieron varias juntas, raleá.';
      if (zo !== 'almacigo' && !((pl.n || 1) > 1) && !(sp0.dt && pl.prog < sp0.dt.max + 40)) return 'Ya está grande para moverla.';
      if (!gastar(E, 1)) return 'No te quedan ratos esta década.';
      if ((pl.n || 1) > 1) { // del grupo sale un plantín; el resto queda esperando
        pl.n--; var nid = 'p' + (E.nextId++), hijo = JSON.parse(JSON.stringify(pl)); hijo.id = nid; hijo.n = 1; hijo.avisoRaleo = false; E.plantas[nid] = hijo; E.celdas[pl.celda].planta = pl.id; pl = hijo; pl._suelto = true;
      }
      var sp = ESP[pl.slug], origen = E.celdas[pl.celda], txt = 'Trasplantaste ' + sp.nombre.toLowerCase() + '.', tipo = 'info';
      if (!sp.dt) { pl.salud -= 40; pl.vigor = r1(pl.vigor * 70) / 100; tipo = 'mal'; txt += ' No tolera el trasplante: la raíz sufrió mucho. Esta especie va de siembra directa.'; }
      else if (pl.prog < sp.dt.min) { pl.salud -= 15; tipo = 'mal'; txt += ' Era muy chico todavía (se trasplanta a los ' + sp.dt.min + '–' + sp.dt.max + ' días).'; }
      else if (ventana(pl.slug, E.dec, 'trasplante') === 'fuera') { pl.vigor = r1(pl.vigor * 88) / 100; txt += ' Está fuera de la ventana de trasplante.'; }
      if (pl._suelto) delete pl._suelto; else origen.planta = null;
      dest.planta = pl.id; pl.celda = a.celda; pl.shock = 1; pl.pote = fMaceta(sp, a.celda);
      if (pl.etapa === 'plantin') pl.etapa = 'creciendo';
      if (dest.fam === sp.familia) { pl.vigor = r1(pl.vigor * 85) / 100; txt += ' Repetís familia en esa tierra.'; }
      evs.push(anotar(E, tipo, txt, a.celda));
      if (sp.dt && pl.prog >= sp.dt.min) cumplir(E, 'plantin', evs);
    },
    cosechar: function (E, a, evs) {
      var pl = E.plantas[a.planta]; if (!pl || pl.etapa !== 'cosechable') return 'Todavía no está para cosechar.';
      var sp = ESP[pl.slug], c = E.celdas[pl.celda];
      if (sp.flor) return 'Las flores se dejan: trabajan atrayendo polinizadores. Podés dejarla semillar.';
      var pol = sp.fruto ? ((c.zona === 'elevado' && E.tunel) ? 0.45 : clamp(0.55 + 0.12 * floresAbiertas(E), 0, 1)) : 1;
      var tut = (sp.cuidados.indexOf('tutorado') >= 0 && !pl.tutor) ? 0.8 : 1;
      var apret = (pl.n || 1) > 1 ? 0.7 : 1;
      var n = r1(apret * (sp.pasadas > 1 ? 1 : 2) * (pl.salud / 100) * pol * tut * (pl.dulce ? 1.2 : 1) * clamp(pl.pote + 0.2, 0, 1) * Math.max(1, pl.reserva));
      E.porciones = r1(E.porciones + n); E.cosechado[pl.slug] = r1((E.cosechado[pl.slug] || 0) + n);
      pl.cosechas++; pl.reserva = 0; pl.listoHace = 0; c.mo = clamp(c.mo - 2, 5, 100); E.compost.carga += 0.5;
      var txt = 'Cosechaste ' + sp.nombre.toLowerCase() + ': ' + n + ' porciones.';
      if (sp.fruto && pol < 0.8) txt += (c.zona === 'elevado' && E.tunel) ? ' Bajo el microtúnel no entran polinizadores: cuajó poco.' : ' Cuajó poco: faltan flores que atraigan polinizadores.';
      if (pl.dulce) txt += ' La helada la endulzó.';
      if (tut < 1) txt += ' Sin tutor rindió menos.';
      if (apret < 1) txt += ' Crecieron apretadas por no ralear: rindió menos.';
      evs.push(anotar(E, 'bien', txt, pl.celda));
      if (sp.pasadas <= 1 || (pl.cosechas >= sp.pasadas && !sp.perenne)) { quitarPlanta(E, pl, true); evs.push(anotar(E, 'info', sp.nombre + ' terminó su ciclo. Los restos van a la compostera.', c ? pl.celda : null)); }
      else pl.etapa = 'creciendo', pl.prog = objetivoCosecha(sp) - (sp.perenne ? 20 : 10);
      cumplir(E, 'cosecha1', evs);
      if (E.cosechado.lechuga && E.cosechado.tomate && E.cosechado.albahaca) cumplir(E, 'ensalada', evs);
      if (Object.keys(E.cosechado).length >= 5) cumplir(E, 'cinco', evs);
      if (E.dec >= 16 && E.dec <= 24) cumplir(E, 'invierno', evs);
    },
    semillar: function (E, a, evs) {
      var pl = E.plantas[a.planta]; if (!pl || (pl.etapa !== 'cosechable' && pl.etapa !== 'pasada')) return 'Solo una planta madura o pasada puede dar semilla.';
      var sp = ESP[pl.slug];
      pl.etapa = 'semillando'; pl.semillar = (sp.fruto || sp.familia === 'leguminosa') ? 1 : BIENALES.indexOf(pl.slug) >= 0 ? 9 : 3;
      evs.push(anotar(E, 'info', 'Dejás semillar ' + sp.nombre.toLowerCase() + '. ' + (pl.semillar >= 9 ? 'Es bienal: florece recién después del frío, va a ocupar el lugar unos 3 meses.' : pl.semillar === 1 ? 'Apartás el mejor fruto para semilla.' : 'Va a ocupar el lugar unas 3 décadas más.'), pl.celda));
    },
    ralear: function (E, a, evs) {
      var pl = E.plantas[a.planta]; if (!pl || !((pl.n || 1) > 1)) return 'No hay nada que ralear.';
      if (!gastar(E, 1)) return 'No te quedan ratos esta década.';
      var sp = ESP[pl.slug], saco = pl.n - 1, come = RALEO_SE_COME.indexOf(pl.slug) >= 0 && pl.prog > 18, txt = 'Raleaste ' + sp.nombre.toLowerCase() + ': dejaste la más fuerte y sacaste ' + saco + '.';
      pl.n = 1;
      if (come) { var por = r1(0.2 * saco); E.porciones = r1(E.porciones + por); txt += ' El raleo se come: +' + por + ' porciones de hojitas tiernas.'; } else { E.compost.carga += 0.5; txt += ' Van a la compostera.'; }
      evs.push(anotar(E, 'bien', txt, pl.celda));
    },
    arrancar: function (E, a, evs) {
      var pl = E.plantas[a.planta]; if (!pl) return 'No hay nada ahí.';
      evs.push(anotar(E, 'info', 'Sacaste ' + ESP[pl.slug].nombre.toLowerCase() + '. Va a la compostera.', pl.celda)); quitarPlanta(E, pl, pl.etapa !== 'semilla');
    },
    tutorar: function (E, a, evs) {
      var pl = E.plantas[a.planta]; if (!pl || pl.tutor) return 'No hace falta.';
      if (!gastar(E, 1)) return 'No te quedan ratos esta década.';
      pl.tutor = true; evs.push(anotar(E, 'info', 'Le pusiste tutor a ' + ESP[pl.slug].nombre.toLowerCase() + '.', pl.celda));
    },
    tratar: function (E, a, evs) {
      var pl = E.plantas[a.planta]; if (!pl || !pl.plaga) return 'No tiene plaga.';
      if (!gastar(E, 1)) return 'No te quedan ratos esta década.';
      var como = { pulgon: 'Rociaste jabón potásico: adiós pulgones.', oruga: 'Sacaste las orugas a mano, revisando el envés de las hojas.', babosa: 'Pusiste una trampa de cerveza: las babosas cayeron.' }[pl.plaga];
      pl.plaga = null; evs.push(anotar(E, 'bien', como, pl.celda));
    },
    mulch: function (E, a, evs) {
      var c = E.celdas[a.celda]; if (!c || c.zona === 'almacigo') return 'Ahí no va mulch.'; if (c.mulch) return 'Ya tiene mulch.';
      if (!gastar(E, 1)) return 'No te quedan ratos esta década.';
      c.mulch = true; evs.push(anotar(E, 'info', 'Cubriste el suelo con pasto seco. Guarda humedad, frena yuyos y de a poco se hace tierra.', a.celda));
    },
    compost: function (E, a, evs) {
      var c = E.celdas[a.celda]; if (!c) return 'Ahí no.'; if (E.compost.dosis < 1) return 'No tenés compost maduro todavía.';
      if (!gastar(E, 1)) return 'No te quedan ratos esta década.';
      E.compost.dosis--; c.mo = clamp(c.mo + 25, 0, 100); evs.push(anotar(E, 'bien', 'Incorporaste compost: la materia orgánica sube a ' + Math.round(c.mo) + ' %.', a.celda));
    },
    riego: function (E, a, evs) {
      if (!(a.zona in E.riego) || a.nivel < 0 || a.nivel > 3) return 'Riego inválido.';
      var antes = E.riego[a.zona]; E.riego[a.zona] = a.nivel;
      if (ratosLibres(E) < 0) { E.riego[a.zona] = antes; return 'No te alcanzan los ratos para regar tanto esta década.'; }
    },
    tunel: function (E, a, evs) {
      if (!gastar(E, 2)) return 'Armar o sacar el microtúnel lleva 2 ratos.';
      E.tunel = !E.tunel; evs.push(anotar(E, 'info', E.tunel ? 'Armaste el microtúnel sobre el bancal elevado: unos ' + ABRIGO.tunel + ' °C de abrigo contra heladas y +3 °C de día, pero no entra lluvia ni polinizadores.' : 'Sacaste el microtúnel.'));
    },
    manta: function (E, a, evs) {
      if (!(a.zona in E.riego)) return 'Ahí no hay nada que tapar.'; if (E.manta[a.zona]) return 'Ya está tapado.';
      if (!gastar(E, 1)) return 'No te quedan ratos esta década.';
      E.manta[a.zona] = true; evs.push(anotar(E, 'info', 'Dejaste lista la manta antihelada para ' + ZONAS[a.zona].nombre.toLowerCase() + '. Suma unos ' + ABRIGO.manta + ' °C de abrigo y dura esta década: con lo que tiene puesto, ese cantero aguanta hasta ' + (abrigo(E, a.zona).aguanta + 0.1).toFixed(0) + ' °C de mínima.'));
    }
  };

  function despachar(E, accion) {
    if (E.terminado && accion.tipo !== 'seguir') return { ok: false, error: 'El año terminó.' };
    if (accion.tipo === 'seguir') { E.terminado = false; E.anio++; return { ok: true, eventos: [anotar(E, 'info', 'Empieza el año ' + E.anio + '. La tierra y las semillas que guardaste siguen con vos.')] }; }
    var f = ACCIONES[accion.tipo]; if (!f) return { ok: false, error: 'Acción desconocida: ' + accion.tipo };
    var evs = [], err = f(E, accion, evs);
    return err ? { ok: false, error: err } : { ok: true, eventos: evs };
  }

  // ── El paso del tiempo ─────────────────────────────────────────────────────
  function pasarDecada(E) {
    if (E.terminado) return [];
    var evs = [], w = E.prox.real, flores = floresAbiertas(E), salvadas = {};
    var pend = [];
    function ev(tipo, txt, celda) { pend.push({ tipo: tipo, texto: txt, celda: celda || null }); }
    function volcar() { // junta los avisos idénticos: "(×6)"
      var vistos = {};
      pend.forEach(function (p) { var k = p.tipo + p.texto; if (vistos[k]) { vistos[k].n++; } else { vistos[k] = p; p.n = 1; } });
      pend.forEach(function (p) { if (p.n) evs.push(anotar(E, p.tipo, p.texto + (p.n > 1 ? ' (×' + p.n + ')' : ''), p.celda)); });
      pend = [];
    }
    ev('clima', cap(fechaDe(w.dec)) + ': máx ' + w.tmax + ' °C, mín ' + w.tmin + ' °C, ' + (w.lluvia < 8 ? 'casi sin lluvia' : w.lluvia + ' mm de lluvia') + (w.helada ? '. HELÓ.' : w.ola ? '. Ola de calor.' : '.'));

    Object.keys(E.plantas).forEach(function (id) {
      var pl = E.plantas[id]; if (!pl) return;
      var sp = ESP[pl.slug], c = E.celdas[pl.celda], nom = sp.nombre, z = c.zona;
      var cubierta = z === 'almacigo' || (z === 'elevado' && E.tunel) || E.manta[z];
      var t = tempEfectiva(E, pl.celda, w), H = humedad(E, pl.celda, w);
      pl.edad += 10;

      // 1. germinación — [REPO] dias_germinacion + temperaturas.germinacion
      if (pl.etapa === 'semilla') {
        var tg = sp.tg || { min: 8, ideal_min: 15, ideal_max: 25, max: 32 };
        if (H < 1.2) { if (pl.edad === 10) ev('mal', nom + ': la semilla está en tierra seca y no arranca. Necesita humedad pareja para germinar.', pl.celda); }
        else if (t < tg.min || t > tg.max) { if (pl.edad === 10) ev('mal', nom + ' no germina: el suelo está a ~' + Math.round(t) + ' °C y necesita entre ' + tg.min + ' y ' + tg.max + ' °C.' + (z !== 'almacigo' && t < tg.min ? ' En la almaciguera reparada habría arrancado.' : ''), pl.celda); }
        else pl.germ += 10 * ((t >= tg.ideal_min && t <= tg.ideal_max) ? 1 : 0.6);
        var necesita = (sp.dg.min + sp.dg.max) / 2;
        if (pl.germ >= necesita) {
          // [SUPUESTO] poder germinativo: 85 % en condiciones ideales, 55 % si el suelo está fuera del rango ideal; la época floja también resta
          var ideal = t >= tg.ideal_min && t <= tg.ideal_max, pg = (ideal ? 0.85 : 0.55) * clamp(pl.vigor + 0.1, 0.5, 1), S = pl.semillas || 1, nacieron = 0;
          for (var si = 0; si < S; si++) if (azar(E) < pg) nacieron++;
          if (S === 1) nacieron = 1;
          if (!nacieron) { ev('mal', 'No germinó ninguna de las ' + S + ' semillas de ' + nom.toLowerCase() + '. ' + (ideal ? 'A veces pasa: por eso se siembra de más.' : 'El suelo a ~' + Math.round(t) + ' °C está fuera del rango ideal (' + tg.ideal_min + '–' + tg.ideal_max + ' °C).'), pl.celda); quitarPlanta(E, pl, false); return; }
          pl.n = nacieron; pl.etapa = (z === 'almacigo') ? 'plantin' : 'creciendo'; pl.prog = Math.round(necesita);
          ev('bien', '¡Germinó ' + nom.toLowerCase() + '!' + (S > 1 ? ' Nacieron ' + nacieron + ' de ' + S + (ideal ? '.' : ': con el suelo fuera del rango ideal nacen menos.') : ''), pl.celda); cumplir(E, 'germina', evs);
        }
        else if (pl.edad >= 30) { ev('mal', 'La semilla de ' + nom.toLowerCase() + ' se perdió: pasaron 30 días sin condiciones para germinar.', pl.celda); quitarPlanta(E, pl, false); }
        return;
      }

      // 2. helada — [REPO] temperaturas.helada
      var ab = abrigo(E, z), hiela = w.helada && w.tmin + ab.grados <= 3;
      if (w.helada && !hiela && (sp.helada === 'muere' || sp.helada === 'sensible')) { (salvadas[z] = salvadas[z] || []).push(nom); }
      if (hiela) {
        var tapada = ab.grados > 0, conQue = ab.partes.join(' y '), falta;
        if (!tapada) falta = w.tmin + ABRIGO.manta > 3 ? 'Una manta antihelada (+' + ABRIGO.manta + ' °C) la habría salvado.' : (z === 'elevado' && w.tmin + ABRIGO.manta + ABRIGO.tunel > 3) ? 'Fue una helada fuerte: hacían falta manta y microtúnel juntos.' : 'Fue una helada muy fuerte: con ' + w.tmin + ' °C una manta sola no alcanzaba.';
        else falta = 'Estaba con ' + conQue + ', que abriga unos ' + ab.grados + ' °C y aguanta hasta ' + (ab.aguanta + 0.1).toFixed(0) + ' °C. ' + (z === 'elevado' && !(E.tunel && E.manta[z]) ? 'Manta y microtúnel juntos suman ' + (ABRIGO.manta + ABRIGO.tunel) + ' °C.' : z !== 'almacigo' && !E.manta[z] ? 'Con una manta encima sumaba ' + ABRIGO.manta + ' °C más.' : 'En pleno invierno esta especie no tiene lugar afuera.');
        if (sp.helada === 'muere') { ev('mal', nom + ' murió: heló (mín ' + w.tmin + ' °C) y no tolera heladas. ' + falta, pl.celda); quitarPlanta(E, pl, true); return; }
        if (sp.helada === 'sensible') { pl.salud -= 45; ev('mal', nom + ' se quemó con la helada (mín ' + w.tmin + ' °C). ' + falta, pl.celda); }
        if (sp.helada === 'mejora' && !pl.dulce) { pl.dulce = true; ev('bien', nom + ': la helada le concentra azúcares. Va a estar más rica.', pl.celda); }
      }

      // 3. semillando
      if (pl.etapa === 'semillando') {
        if (--pl.semillar <= 0) {
          E.gen[pl.slug] = Math.max(E.gen[pl.slug] || 0, pl.gen + 1); E.sobres[pl.slug] = (E.sobres[pl.slug] || 0) + 4; E.semillasGuardadas += 4;
          ev('bien', 'Guardaste 4 sobres de ' + nom.toLowerCase() + ' (generación ' + (pl.gen + 1) + '). Semilla criada en tu patio: se adapta un poco más cada año.', pl.celda);
          cumplir(E, 'semillas', evs); quitarPlanta(E, pl, true);
        }
        return;
      }
      if (pl.etapa === 'pasada') { if (++pl.listoHace > 3) { ev('info', nom + ' pasada se secó. Al compost.', pl.celda); quitarPlanta(E, pl, true); } return; }

      // 4. crecimiento
      var F = factoresPlanta(E, pl, w);
      var g = F.luz.f * F.agua.f * F.temp.f * F.suelo.f * F.vecinos.f * pl.vigor * (pl.plaga ? 0.8 : 1) * (pl.shock ? 0.5 : 1);
      if (sp.cuidados.indexOf('tutorado') >= 0 && !pl.tutor && pl.prog > objetivoCosecha(sp) * 0.45) g *= 0.85;
      if (z !== 'almacigo' && (pl.n || 1) > 1) { g *= Math.max(0.4, 1 - 0.15 * (pl.n - 1)); if (!pl.avisoRaleo) { pl.avisoRaleo = true; ev('info', nom + ': salieron ' + pl.n + ' juntas y compiten por luz y agua. ' + (sp.dt ? 'Podés repicar las que sobran a otro lugar o ralear.' : 'Hay que ralear y dejar una.'), pl.celda); } }
      pl.shock = 0;
      var enAlm = z === 'almacigo';
      if (!(enAlm && sp.dt && pl.prog >= sp.dt.max)) pl.prog += 10 * clamp(g, 0, 1.25);
      if (enAlm && sp.dt && pl.prog >= sp.dt.max && pl.edad > sp.dt.max + 30 && !pl.avisoPasado) { pl.avisoPasado = true; pl.vigor = r1(pl.vigor * 80) / 100; ev('mal', 'El plantín de ' + nom.toLowerCase() + ' se pasó en la almaciguera: raíces enruladas. Ya tendría que estar en su lugar.', pl.celda); }
      if (enAlm && sp.dt && pl.prog >= sp.dt.min && !pl.avisoListo) { pl.avisoListo = true; ev('bien', 'Plantín de ' + nom.toLowerCase() + ' listo para trasplantar.', pl.celda); }

      // 5. estrés y salud
      if (F.agua.estado === 'seco' && F.agua.f < 0.75) { pl.salud -= (1 - F.agua.f) * 35; if (F.agua.f < 0.5) ev('mal', nom + ' pasa sed' + (MACETAS[pl.celda] ? ': las macetas se secan mucho más rápido que la tierra.' : ': subí el riego o poné mulch.'), pl.celda); }
      if (F.agua.estado === 'exceso' && F.agua.diff > 1.4) { pl.salud -= 14; ev('mal', nom + ' tiene exceso de agua: pide riego ' + sp.riego + '. Con los pies mojados aparecen hongos y se pudre la raíz.', pl.celda); }
      if (sp.tc && w.tmax + (z === 'elevado' && E.tunel ? 5 : 0) > sp.tc.tolera_max + 2) { pl.salud -= 6 + (w.tmax - sp.tc.tolera_max) * 3; ev('mal', nom + ' sufrió el calor (máx ' + w.tmax + ' °C' + (z === 'elevado' && E.tunel ? ', y bajo el microtúnel es peor' : '') + ').', pl.celda); }
      if (sp.tc && !w.helada && w.tmin + ab.grados < sp.tc.tolera_min) { pl.salud -= 12; ev('mal', nom + ' sufrió el frío (mín ' + w.tmin + ' °C).', pl.celda); }
      if (F.luz.f < 0.5 && pl.edad % 30 === 0) ev('mal', nom + ' recibe ' + F.luz.horas + ' h de sol y pide ' + F.luz.pide + '. ' + sp.luzNo, pl.celda);
      if (g > 0.85 && !pl.plaga) pl.salud = Math.min(100, pl.salud + 5);

      // 6. plagas — [REPO] el texto de plagas; [SUPUESTO] las probabilidades
      if (!pl.plaga) {
        var prot = clamp(1 - 0.22 * aliadosCerca(E, pl.celda), 0.25, 1), joven = pl.prog < objetivoCosecha(sp) * 0.4, grupo = sp.grupo;
        var rot = c.fam === sp.familia ? 1.5 : 1, d = w.dec, p = azar(E);
        if (sp.familia === 'brasicacea' && (d >= 31 || d <= 12) && p < 0.10 * prot * rot) { pl.plaga = 'oruga'; ev('mal', 'Orugas en ' + nom.toLowerCase() + ': la mariposa blanca pone en las brasicáceas. ' + (prot === 1 ? 'Sin flores ni aromáticas cerca no hay quien las controle.' : ''), pl.celda); }
        else if (joven && w.lluvia > 40 && !MACETAS[pl.celda] && p < 0.15 * prot) { pl.plaga = 'babosa'; ev('mal', 'Babosas en ' + nom.toLowerCase() + ': con tanta lluvia salen de noche y se comen lo tierno.', pl.celda); }
        else if (/hoja|fruto|Legumbre/.test(grupo) && ((d >= 25 && d <= 33) || (d >= 7 && d <= 12)) && p < 0.06 * prot * rot) { pl.plaga = 'pulgon'; ev('mal', 'Pulgones en ' + nom.toLowerCase() + '. ' + (prot === 1 ? 'Flores y aromáticas cerca atraen vaquitas y crisopas que se los comen.' : ''), pl.celda); }
      } else {
        pl.salud -= 12;
        if (flores >= 2 && azar(E) < 0.35) { ev('bien', 'Llegaron vaquitas de San Antonio atraídas por tus flores: limpiaron ' + nom.toLowerCase() + ' de ' + (pl.plaga === 'pulgon' ? 'pulgones' : 'plaga') + '.', pl.celda); pl.plaga = null; }
      }

      // 7. espigado por calor en hojas — [REPO] riesgos de la ficha; [SUPUESTO] la probabilidad
      if (sp.grupo === 'Hortaliza de hoja' && sp.familia !== 'brasicacea' && sp.tc && pl.prog > objetivoCosecha(sp) * 0.5 && pl.etapa !== 'pasada') {
        var pe = (w.tmed - (sp.tc.ideal_max + 4)) * 0.22 * (F.luz.horas <= 5.5 ? 0.4 : 1);
        if (pe > 0 && azar(E) < pe) { pl.etapa = 'pasada'; pl.listoHace = 0; ev('mal', nom + ' se subió a flor por el calor (media ' + w.tmed + ' °C) y amargó. ' + (F.luz.horas > 5.5 ? 'A media sombra aguanta mucho más en verano.' : '') + ' Todavía podés dejarla semillar.', pl.celda); return; }
      }

      // 8. muerte y madurez
      if (pl.salud <= 0) { ev('mal', nom + ' murió. Revisá en el cuaderno qué le venía faltando.', pl.celda); quitarPlanta(E, pl, true); return; }
      if (pl.etapa === 'cosechable') {
        pl.listoHace++;
        if (sp.pasadas > 1) pl.reserva = Math.min(2, pl.reserva + 1);
        else if (!sp.flor && pl.listoHace > (w.tmed > 22 ? 2 : 4)) { pl.etapa = 'pasada'; pl.listoHace = 0; ev('mal', nom + ' se pasó: había que cosecharla antes. ' + sp.listo, pl.celda); }
        if (sp.flor && pl.listoHace > 12) { ev('info', nom + ' terminó de florecer.', pl.celda); if (sp.perenne) { pl.etapa = 'creciendo'; pl.prog = objetivoCosecha(sp) * 0.5; } else quitarPlanta(E, pl, true); }
      } else if (!enAlm && pl.prog >= objetivoCosecha(sp)) {
        pl.etapa = 'cosechable'; pl.listoHace = 0; pl.reserva = 1;
        ev('bien', sp.flor ? nom + ' abrió sus flores: empiezan a llegar polinizadores.' : nom + ' está para cosechar. ' + sp.listo, pl.celda);
      }
    });

    Object.keys(salvadas).forEach(function (zz) { var u = salvadas[zz].filter(function (x, i, a) { return a.indexOf(x) === i; }); ev('bien', 'Heló (mín ' + w.tmin + ' °C) pero ' + abrigo(E, zz).partes.join(' y ') + ' en ' + ZONAS[zz].nombre.toLowerCase() + ' aguantó: se salvaron ' + u.join(', ').toLowerCase() + '.'); });
    volcar();
    // vecinos bien asociados
    for (var id in E.plantas) { var a = E.plantas[id]; if (a.etapa !== 'semilla' && fVecinos(E, a.slug, a.celda, a.id).buenas.length) { cumplir(E, 'socios', evs); break; } }

    // suelo, mulch y compostera — [REPO] compostaje.json: listo desde ~120 días, más rápido en verano
    for (var cel in E.celdas) if (E.celdas[cel].mulch) E.celdas[cel].mo = clamp(E.celdas[cel].mo + 1, 0, 100);
    E.compost.carga += 1; // restos de cocina
    if (E.compost.carga >= 6) { E.compost.carga -= 6; E.compost.tandas.push({ avance: 0 }); ev('info', 'Cerraste una tanda de compost. En unos 4 meses va a estar madura.'); }
    E.compost.tandas = E.compost.tandas.filter(function (t) { t.avance += w.tmed > 20 ? 1.3 : w.tmed < 12 ? 0.7 : 1; if (t.avance >= 12) { E.compost.dosis += 3; ev('bien', 'Una tanda de compost maduró: huele a tierra de monte. +3 dosis.'); return false; } return true; });
    E.visitas += Math.round(floresAbiertas(E) * (w.tmed > 14 ? 3 : 1));

    volcar();
    // avanzar el calendario
    E.manta = {}; E.ratosGastados = 0; E.turno++; E.dec = E.dec % 36 + 1;
    if (E.turno % 36 === 0) { E.terminado = true; ev('logro', 'Pasó un año entero en la huerta. Mirá el balance.'); }
    volcar();
    E.prox = generarTiempo(E, E.dec);
    while (ratosLibres(E) < 0) { for (var zz in E.riego) if (E.riego[zz] > 0 && ratosLibres(E) < 0) E.riego[zz]--; }
    return evs;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function balance(E) {
    var especies = Object.keys(E.cosechado).length, dMo = r1(moMedia(E) - E.moInicial);
    var puntos = E.porciones + especies * 3 + E.semillasGuardadas * 0.5 + Math.max(0, dMo) + Math.min(20, E.visitas / 10);
    return { porciones: E.porciones, especies: especies, semillas: E.semillasGuardadas, dMo: dMo, visitas: E.visitas, logros: Object.keys(E.misiones).length, puntos: Math.round(puntos), estrellas: puntos >= 120 ? 3 : puntos >= 70 ? 2 : puntos >= 30 ? 1 : 0 };
  }

  var API = {
    DATOS: DATOS, ESPECIES: ESP, ZONAS: ZONAS, MAPA: MAPA, ANCHO: ANCHO, ALTO: ALTO, MACETAS: MACETAS, RIEGOS: RIEGOS, RATOS: RATOS, MISIONES: MISIONES, CARACTERES: CARACTERES,
    abrigo: abrigo, riesgoHelada: riesgoHelada, enRiesgo: enRiesgo, ABRIGO: ABRIGO, semillasPorSiembra: semillasPorSiembra, crearPartida: crearPartida, despachar: despachar, pasarDecada: pasarDecada,
    invierno: invierno, horasSol: horasSol, evaluarCelda: evaluarCelda, factoresPlanta: factoresPlanta, costoRiego: costoRiego, ratosLibres: ratosLibres,
    ventana: ventana, metodoDe: metodoDe, fechaDe: fechaDe, estacionDe: estacionDe, celdasDe: celdasDe, zonaDeCelda: zonaDeCelda, plantaEn: plantaEn,
    floresAbiertas: floresAbiertas, objetivoCosecha: objetivoCosecha, balance: balance, pTemporadaHelada: pTemporadaHelada, sueloDeCelda: sueloDeCelda
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.Huertita = root.Huertita || {}; root.Huertita.Motor = API;
})(typeof window !== 'undefined' ? window : globalThis);
