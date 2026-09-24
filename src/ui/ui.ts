// @ts-nocheck — interfaz portada tal cual del prototipo; el paso 6 de los cimientos la reescribe por componentes
/**
 * HUERTITA — interfaz: paneles, flujo y armado de la escena.
 * Habla con el motor solo por acciones y consultas, y con el renderer solo por
 * su contrato de cuatro métodos. No dibuja plantas ni calcula agronomía.
 */
import * as M from '../dominio';
import * as C from '../aplicacion/consultas';
import * as SP from '../arte/sprites';
import { RenderPixel } from '../render/pixel';
import { RenderTexto } from '../render/texto';
  var root = window, ESP = M.ESPECIES, META = M.META;
  var RENDERERS = [RenderPixel, RenderTexto];
  var CLAVE = 'huertita-v1';
  var ui = { E: null, modo: 'inicio', sel: null, sobre: null, moviendo: null, capa: null, animar: null, ultimos: [], aviso: '', fichaSlug: null, almTodas: false, rIdx: 0, r: null, cam: 0, zonaCerca: null, cola: [] };
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function corto(n) { return n.split(' (')[0].split(' / ')[0]; }

  // ── guardado local: comodidad, nunca requisito ──
  function valida(E) { return !!M.migrar(E); }
  function guardar() { ui.E.guardado = Date.now(); try { root.localStorage.setItem(CLAVE, JSON.stringify(ui.E)); ui.sinStorage = false; } catch (e) { ui.sinStorage = true; /* sin storage se juega igual */ } }
  function cargar() { try { var t = root.localStorage.getItem(CLAVE); var E = t && JSON.parse(t); return valida(E) ? E : null; } catch (e) { ui.sinStorage = true; return null; } }
  var resumenDe = C.resumenDePartida;
  function cuando(t) { if (!t) return ''; var d = new Date(t), p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function usar(E, aviso) { ui.E = E; ui.modo = E.terminado ? 'fin' : 'partidas'; ui.sel = null; ui.sobre = null; ui.moviendo = null; ui.ultimos = []; ui.aviso = ''; ui.nota = aviso || ''; guardar(); }

  // ranuras: copias a mano, además del autoguardado
  function ranura(n) { try { var t = root.localStorage.getItem(CLAVE + '-ranura-' + n); var o = t && JSON.parse(t); return o && valida(o.E) ? o : null; } catch (e) { return null; } }
  function guardarRanura(n) { try { root.localStorage.setItem(CLAVE + '-ranura-' + n, JSON.stringify({ t: Date.now(), E: ui.E })); ui.nota = 'Guardada en la ranura ' + n + '.'; } catch (e) { ui.aviso = 'Este navegador no deja guardar acá. Usá el código o la nube.'; } }

  // código para llevar la partida a otro dispositivo (los artifacts no pueden bajar archivos por su cuenta)
  function aCodigo(E) { var c = JSON.parse(JSON.stringify(E)); c.cuaderno = c.cuaderno.slice(-40); return 'HUERTITA1:' + root.btoa(unescape(encodeURIComponent(JSON.stringify(c)))); }
  function deCodigo(txt) { try { txt = String(txt || '').trim(); var E = JSON.parse(txt.indexOf('HUERTITA1:') === 0 ? decodeURIComponent(escape(root.atob(txt.slice(10).replace(/\s+/g, '')))) : txt); return valida(E) ? E : null; } catch (e) { return null; } }

  // nube: carpeta privada de cada persona en el artifact; si no está disponible, todo lo demás funciona igual
  var nube = { estado: 'buscando', db: null, uid: null, remota: null, bajar: null };
  function docNube() { return nube.db.doc('data/users/' + nube.uid + '/auto'); }
  function subirNube(aMano) {
    if (nube.estado !== 'lista') return;
    docNube().set({ t: Date.now(), resumen: resumenDe(ui.E), json: JSON.stringify(ui.E) }).then(function () { nube.remota = { t: Date.now(), resumen: resumenDe(ui.E) }; nube.error = ''; if (aMano) { ui.nota = 'Subida a la nube.'; pintar(); } else if (ui.modo === 'partidas') pintar(); })
      .catch(function (e) { nube.error = e && e.code === 'quota_exceeded' ? 'La nube está llena.' : 'No se pudo subir a la nube ahora.'; if (aMano || ui.modo === 'partidas') pintar(); });
  }
  function traerNube() {
    if (nube.estado !== 'lista') return;
    docNube().get().then(function (snap) { var d = snap.exists && snap.data(), E = d && deCodigo(d.json); if (E) { usar(E, 'Traje la partida de la nube.'); } else ui.aviso = 'No hay partida en la nube todavía.'; pintar(); }).catch(function () { ui.aviso = 'No se pudo leer la nube ahora.'; pintar(); });
  }
  function conectarNube(sinLocal) {
    var cl = root.claude; if (!cl || !cl.use) { nube.estado = 'no'; return; }
    cl.use('downloads').then(function (d) { nube.bajar = d; if (ui.modo === 'partidas') pintar(); }, function () {});
    Promise.all([cl.use('db'), cl.use('user')]).then(function (r) {
      if (!r[0] || !r[1]) { nube.estado = 'no'; return; }
      return r[1].id().then(function (id) {
        if (!id) { nube.estado = 'no'; return; }
        nube.db = r[0]; nube.uid = id; nube.estado = 'lista';
        return docNube().get().then(function (snap) {
          var d = snap.exists && snap.data(); if (d) nube.remota = { t: d.t, resumen: d.resumen };
          if (d && sinLocal && ui.E.turno === 0) { var E = deCodigo(d.json); if (E) usar(E, 'Seguís la partida que tenías en la nube.'); }
        });
      });
    }).catch(function () { nube.estado = 'no'; }).then(function () { if (ui.modo === 'partidas' || ui.nota) pintar(); });
  }
  function descargar() {
    var nombre = 'huertita-año' + ui.E.anio + '-' + M.fechaDe(ui.E.dec).replace(/ /g, '-') + '.json', data = JSON.stringify(ui.E);
    if (nube.bajar) return nube.bajar.save({ filename: nombre, data: data }).then(function () { ui.nota = 'Archivo guardado.'; pintar(); }, function (e) { if (!e || e.code !== 'declined') { ui.aviso = 'No se pudo bajar el archivo acá. Usá el código.'; pintar(); } });
    try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = nombre; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { ui.aviso = 'No se pudo bajar el archivo acá. Usá el código.'; }
  }

  // ── escena: la foto plana que recibe cualquier renderer ──
  function escena() {
    var E = ui.E, fantasma = ui.sobre || (ui.moviendo && E.plantas[ui.moviendo] ? E.plantas[ui.moviendo].slug : null), cams = ui.r && ui.r.camaras;
    ui.zonaCerca = C.zonaCerca(E, ui.sel, ui.zonaCerca);
    return C.escena(E, { fantasma: fantasma, trasplantando: !!ui.moviendo, seleccion: ui.sel, zonaCerca: ui.zonaCerca, camara: cams ? cams[ui.cam % cams.length][0] : 'cenital', capa: ui.capa, animar: ui.animar });
  }

  function vistaDe(k) { var c = escena().celdas[k]; return c && c.planta; }
  function fx(tipo, datos) { ui.cola.push([tipo, datos]); }

  // ── acciones ──
  function hacer(accion) {
    var r = M.despachar(ui.E, accion);
    ui.aviso = r.ok ? '' : r.error;
    if (r.ok) { if (r.eventos.length) ui.ultimos = r.eventos; guardar(); }
    return r.ok;
  }
  function pasar() {
    var w = ui.E.prox.real;
    ui.ultimos = M.pasarDecada(ui.E); ui.sobre = null; ui.moviendo = null; ui.aviso = '';
    ui.modo = ui.E.terminado ? 'fin' : 'resumen';
    ui.animar = w.helada ? 'helada' : w.lluvia > 30 ? 'lluvia' : w.ola ? 'calor' : null;
    if (ui.sel && !ui.E.celdas[ui.sel]) ui.sel = null;
    ui.ultimos.forEach(function (e) { if (e.tipo === 'logro') fx('logro'); else if (e.tipo === 'mal' && e.celda && /murió|se perdió|se secó/.test(e.texto)) fx('morir', { celda: e.celda }); });
    guardar(); subirNube(false); pintar();
    if (ui.animar) setTimeout(function () { ui.animar = null; ui.r.dibujar(escena()); }, 2100);
  }
  function tocarCelda(k) {
    var E = ui.E; if (!E.celdas[k]) { ui.sel = null; if (ui.modo === 'celda') ui.modo = 'inicio'; return pintar(); }
    if (ui.moviendo) { var de = E.plantas[ui.moviendo] && E.plantas[ui.moviendo].celda, vis = de && vistaDe(de); if (hacer({ tipo: 'trasplantar', planta: ui.moviendo, celda: k })) { fx('trasplantar', { de: de, celda: k, planta: vis }); ui.moviendo = null; ui.sel = k; ui.modo = 'celda'; } return pintar(); }
    if (ui.sobre && ui.modo === 'semillas' && !E.celdas[k].planta) {
      if (ui.sel === k) { if (hacer({ tipo: 'sembrar', slug: ui.sobre, celda: k })) fx('sembrar', { celda: k }); if (!(E.sobres[ui.sobre] > 0)) ui.sobre = null; ui.sel = null; }
      else ui.sel = k;
      return pintar();
    }
    ui.sel = k; ui.modo = 'celda'; ui.sobre = null; pintar();
  }

  // ── piezas de HTML ──
  function barra(f, clase) { var v = Math.round(Math.max(0, Math.min(1, f)) * 100); return '<span class="hz-bar ' + (clase || (f >= 0.85 ? 'ok' : f >= 0.6 ? 'med' : 'bad')) + '"><i style="width:' + Math.min(100, v) + '%"></i></span>'; }
  /**
   * Indicador de escala: el eje va de min a max, las bandas marcan lo que pide la especie
   * (clara = tolera, fuerte = ideal) y la marca es el valor actual. El color de la marca dice
   * qué tan bien cumple; la posición dice por qué.
   */
  function escala(min, max, bandas, valor, f, opc) {
    opc = opc || {}; var pc = function (v) { return Math.max(0, Math.min(100, (v - min) / (max - min) * 100)); };
    var h = '<span class="hz-esc">' + bandas.map(function (b) { return '<b class="' + b[2] + '" style="left:' + pc(b[0]) + '%;width:' + Math.max(1.5, pc(b[1]) - pc(b[0])) + '%"></b>'; }).join('');
    if (opc.rango) h += '<u style="left:' + pc(opc.rango[0]) + '%;width:' + (pc(opc.rango[1]) - pc(opc.rango[0])) + '%"></u>';
    if (valor != null) h += '<i class="' + (f >= 0.85 ? 'ok' : f >= 0.6 ? 'med' : 'bad') + '" style="left:' + pc(valor) + '%"></i>';
    return h + '</span><span class="hz-esc-eje"><small>' + (opc.izq != null ? opc.izq : min) + '</small><small>' + (opc.der != null ? opc.der : max) + '</small></span>';
  }
  function escLuz(sp, horas, f) { return escala(0, 12, [[sp.hmin, sp.hideal, 'tol'], [sp.hideal, 12, 'ideal']], horas, f, { izq: '0 h', der: '12 h' }); }
  function escAgua(sp, H, f) { var d = { escaso: 0.6, espaciado: 1.4, parejo: 2.2, constante: 3.0 }[sp.riego]; return escala(0, 4.5, [[d - 0.6, d + 0.8, 'ideal']], H, f, { izq: 'seco', der: 'encharcado' }); }
  function escTemp(tc, t, f, rango) { return tc ? escala(-5, 40, [[tc.tolera_min, tc.tolera_max, 'tol'], [tc.ideal_min, tc.ideal_max, 'ideal']], t, f, { izq: '−5 °C', der: '40 °C', rango: rango }) : ''; }

  function eventosHTML(evs) {
    if (!evs.length) return '<p class="hz-dim">Sin novedades.</p>';
    return '<ul class="hz-evs">' + evs.map(function (e) { return '<li class="ev-' + e.tipo + '"' + (e.celda ? ' data-acc="ir" data-celda="' + e.celda + '"' : '') + '>' + esc(e.texto) + '</li>'; }).join('') + '</ul>';
  }
  function vent(slug, que) { var v = M.ventana(slug, ui.E.dec, que); return '<span class="hz-vent v-' + v + '">' + { ideal: 'época ideal', posible: 'época posible', fuera: 'fuera de época' }[v] + '</span>'; }
  function metodoTexto(slug) { var m = M.metodoDe(slug, ui.E.dec); return m ? { directa: 'siembra directa', almacigo: 'almácigo', almacigo_protegido: 'almácigo protegido', 'directa|almacigo': 'directa o almácigo' }[m] || m : null; }

  function tiraHTML(slug, actual) {
    var sp = ESP[slug], dias = ['día 0', sp.dg.min + '–' + sp.dg.max + ' d', '', '', sp.dc.min + '–' + sp.dc.max + ' d', ''];
    if (sp.dt) dias[2] = 'trasp. ' + sp.dt.min + '–' + sp.dt.max + ' d';
    var nombres = ['semilla', 'plantín', 'crece', 'florece', sp.flor ? 'en flor' : 'cosecha', 'da semilla'];
    return '<figure class="hz-tira"><canvas data-tira="' + slug + '"' + (actual != null ? ' data-actual="' + actual + '"' : '') + ' aria-label="Estadíos de ' + esc(sp.nombre) + '"></canvas><figcaption>' + nombres.map(function (n, i) { return '<span class="' + (actual === i ? 'on' : '') + '">' + n + (dias[i] ? '<small>' + dias[i] + '</small>' : '') + '</span>'; }).join('') + '</figcaption></figure>';
  }

  function hud() {
    var h = C.hud(ui.E), p = h.pronostico, pips = h.ratos.map(function (r) { return '<i class="' + r + '"></i>'; }).join('');
    return '<div class="hz-marca"><h1>Huertita</h1><span>' + esc(h.fecha) + ' · ' + h.estacion + ' · año ' + h.anio + '</span></div>' +
      '<button class="hz-guardada" data-acc="modo" data-modo="partidas" title="Guardar y cargar">' + (ui.sinStorage ? 'sin guardar' : 'guardada ' + cuando(ui.E.guardado).slice(6)) + (nube.estado === 'lista' ? ' · nube' : '') + '</button>' +
      '<div class="hz-ratos" title="Ratos libres esta década. Los celestes se van en regar."><b>' + h.libres + '</b> ratos<span class="hz-pips">' + pips + '</span></div>' +
      '<div class="hz-pron"><span class="hz-eti">Pronóstico de la década</span><span>' + p.tmin + '° / ' + p.tmax + '°</span>' +
      '<span class="' + ({ alta: 'alto', media: 'medio' }[h.alertaDeHelada] || '') + '">helada ' + p.pHelada + ' %</span><span>' + p.lluvia + '</span></div>';
  }

  function panelInicio() {
    var E = ui.E, car = M.CARACTERES[E.caracter];
    return '<h2>Tu patio en el conurbano</h2><p>El norte está arriba: el paredón le hace sombra al bancal del fondo, y en invierno mucho más. El paraíso de la derecha da sombra solo cuando tiene hojas. Contra la casa, la almaciguera está reparada de las heladas.</p>' +
      '<p><b>' + esc(car.nombre) + '.</b> ' + esc(car.texto) + '</p>' +
      '<ol class="hz-pasos"><li>Elegí un sobre en <b>Sembrar</b>: el patio se pinta de verde, amarillo o rojo según cómo le iría ahí.</li><li>Cada década tenés ' + M.RATOS + ' ratos. Regar también los gasta.</li><li>Mirá el pronóstico, protegé si hiela y tocá <b>Pasar 10 días</b>.</li><li>El cuaderno te explica todo lo que pasó y por qué.</li></ol>';
  }

  function panelSemillas() {
    var E = ui.E;
    var h = '<h2>Sobres de semillas</h2><div class="hz-sobres">' + C.sobresDisponibles(E).map(function (x) {
      return '<button class="hz-sobre' + (ui.sobre === x.slug ? ' on' : '') + ' v-' + x.ventana + '" data-acc="sobre" data-slug="' + x.slug + '"><b>' + esc(x.nombre) + '</b><span>×' + x.sobres + (x.gen ? ' · gen ' + x.gen : '') + '</span></button>';
    }).join('') + '</div>';
    if (!ui.sobre) return h + '<p class="hz-dim">Verde: época ideal ahora. Amarillo: posible. Gris: fuera de época en el GBA.</p>';
    var sp = ESP[ui.sobre], met = metodoTexto(ui.sobre);
    h += '<div class="hz-ficha"><h3>' + esc(sp.nombre) + ' ' + vent(ui.sobre) + '</h3>' + tiraHTML(ui.sobre) + '<dl class="hz-datos">' +
      '<dt>Ahora conviene</dt><dd>' + (met ? esc(met) : 'no es mes de siembra') + (sp.dt ? '' : ' · no se trasplanta') + '</dd>' +
      '<dt>Luz</dt><dd>' + esc(META.luces[sp.luz].nombre) + ' · ' + sp.hmin + '–' + sp.hideal + ' h</dd>' +
      '<dt>Suelo</dt><dd>' + esc(META.suelos[sp.suelo].nombre) + '</dd><dt>Riego</dt><dd>' + sp.riego + '</dd>' +
      '<dt>Tiempos</dt><dd>germina en ' + sp.dg.min + '–' + sp.dg.max + ' d' + (sp.dt ? ' · trasplante a los ' + sp.dt.min + '–' + sp.dt.max + ' d' : '') + ' · cosecha a los ' + sp.dc.min + '–' + sp.dc.max + ' d</dd>' +
      '<dt>Helada</dt><dd>' + { muere: 'la mata', sensible: 'la daña', tolera: 'la tolera', mejora: 'la mejora' }[sp.helada] + '</dd>' +
      (sp.buenas.length ? '<dt>Se lleva bien</dt><dd>' + sp.buenas.slice(0, 7).map(function (b) { return esc(corto(ESP[b] ? ESP[b].nombre : b)); }).join(', ') + '</dd>' : '') +
      (sp.malas.length ? '<dt>Se lleva mal</dt><dd>' + sp.malas.slice(0, 7).map(function (b) { return esc(corto(ESP[b] ? ESP[b].nombre : b)); }).join(', ') + '</dd>' : '') + '</dl>';
    if (ui.sel && E.celdas[ui.sel] && !E.celdas[ui.sel].planta) {
      var ev = M.evaluarCelda(E, ui.sobre, ui.sel);
      h += '<div class="hz-eval n-' + ev.nivel + '"><b>' + { bien: 'Buen lugar', regular: 'Lugar regular', mal: 'Mal lugar' }[ev.nivel] + '</b> · ' + esc(M.zonaDe(E, ui.sel).nombre) + ' · ' + ev.horas + ' h de sol' +
        (ev.razones.length ? '<ul>' + ev.razones.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '') +
        '<button class="hz-btn pri" data-acc="sembrar">Sembrar acá · 1 rato</button></div>';
    } else h += '<p class="hz-dim">Tocá una celda para ver cómo le iría. Tocala de nuevo para sembrar.' + (M.semillasPorSiembra(ui.sobre, true) > 1 ? ' En la almaciguera cada siembra es una tanda de ' + M.semillasPorSiembra(ui.sobre, true) + ' celdas; en tierra van ' + M.semillasPorSiembra(ui.sobre, false) + ' semillas juntas.' : '') + '</p>';
    h += '<div class="hz-fila"><button class="hz-btn sec" data-acc="ficha" data-slug="' + ui.sobre + '">Ficha completa</button></div>';
    return h + '</div>';
  }

  // diario de una planta: lo más nuevo arriba, con la salud de cada década y cuánto cambió
  function diarioHTML(pl) {
    var hist = pl.hist || [], ICONO = { bien: '+', mal: '−', info: '·', clima: '·', logro: '★' };
    if (!hist.length) return '<details class="hz-diario"><summary>Diario de esta planta</summary><p class="hz-dim">Todavía no le pasó nada. Se va llenando a medida que pasan los días.</p></details>';
    var ultimaMala = null; for (var i = hist.length - 1; i >= 0 && !ultimaMala; i--) hist[i].n.forEach(function (x) { if (x[0] === 'mal' && !ultimaMala) ultimaMala = x[1]; });
    var h = '<details class="hz-diario"' + (pl.salud < 70 ? ' open' : '') + '><summary>Diario de esta planta' + (pl.salud < 70 && ultimaMala ? ' · por qué está así' : '') + '</summary><ol>';
    for (var j = hist.length - 1; j >= 0; j--) {
      var r = hist[j], antes = j > 0 ? hist[j - 1].s : hist.length >= 16 ? r.s : 100, d = r.s - antes;
      h += '<li><b>' + esc(cap(M.fechaDe(r.dec))) + '</b><span class="hz-dsalud' + (d < 0 ? ' baja' : d > 0 ? ' sube' : '') + '">salud ' + r.s + (d ? ' (' + (d > 0 ? '+' : '−') + Math.abs(d) + ')' : '') + '</span><ul>' + r.n.map(function (x) { return '<li class="t-' + x[0] + '"><i>' + ICONO[x[0]] + '</i>' + esc(x[1]) + '</li>'; }).join('') + '</ul></li>';
    }
    return h + '</ol>' + (hist.length >= 16 ? '<p class="hz-dim">Se guardan las últimas 16 anotaciones.</p>' : '') + '</details>';
  }

  function panelCelda() {
    var E = ui.E, k = ui.sel, c = E.celdas[k]; if (!c) return panelInicio();
    var z = M.zona(E, c.zona), pl = M.plantaEn(E, k), mac = M.macetaDe(E, k);
    var pie = '<div class="hz-lugar"><b>' + esc(z.nombre) + (mac ? ' · ' + mac.litros + ' L, ' + mac.prof + ' cm' : '') + '</b> · ' + M.horasSol(E, k) + ' h de sol hoy · ' + esc(META.suelos[M.sueloDeCelda(E, k)].nombre) + ' · materia orgánica ' + Math.round(c.mo) + ' %' + (c.mulch ? ' · con mulch' : '') +
      '<div class="hz-fila">' + (!z.cria && !c.mulch ? '<button class="hz-btn" data-acc="mulch">Poner mulch · 1</button>' : '') + (!z.cria ? '<button class="hz-btn" data-acc="compost"' + (E.compost.dosis < 1 ? ' disabled' : '') + '>Compost · 1 (tenés ' + E.compost.dosis + ')</button>' : '') + '</div></div>';
    if (!pl) return '<h2>Celda libre</h2><p>' + esc(z.desc) + '</p>' + (c.fam ? '<p class="hz-dim">Lo último que hubo acá fue una ' + c.fam + '.</p>' : '') + '<div class="hz-fila"><button class="hz-btn pri" data-acc="modo" data-modo="semillas">Sembrar acá…</button></div>' + pie;

    var sp = ESP[pl.slug], F = M.factoresPlanta(E, pl), obj = M.objetivoCosecha(sp);
    var etapa = { semilla: 'semilla sin germinar', plantin: 'plantín', creciendo: 'creciendo', cosechable: sp.flor ? 'en flor' : 'para cosechar', pasada: 'pasada', semillando: 'semillando' }[pl.etapa];
    var pt = M.puntoDeTrasplante(pl);
    if (pt) etapa = pt.punto === 'listo' ? '<b class="hz-bien">plantín listo para trasplantar</b>' : pt.punto === 'pasado' ? '<b class="hz-mal">plantín que se está pasando: trasplantalo ya</b>' : 'plantín, todavía chico';
    var h = '<h2>' + esc(sp.nombre) + '</h2><p class="hz-sub">' + etapa + ' · sembrada hace ' + pl.edad + ' días' + ((pl.n || 1) > 1 ? ' · <b>' + pl.n + ' plantines</b>' : '') + (pl.gen ? ' · semilla propia gen ' + pl.gen : '') + (pl.plaga ? ' · <b class="hz-mal">' + { pulgon: 'pulgones', oruga: 'orugas', babosa: 'babosas' }[pl.plaga] + '</b>' : '') + '</p>';
    var vistaPl = vistaDe(k); h += tiraHTML(pl.slug, vistaPl ? SP.etapaDeTira(vistaPl) : null);
    h += '<div class="hz-medidor"><span>' + (pt ? 'Hacia el trasplante' : 'Avance') + '</span>' + barra(Math.min(1, pl.prog / (pt ? pt.min : obj)), 'avance') + '<span>Salud ' + Math.round(pl.salud) + '</span>' + barra(pl.salud / 100) + '</div>';
    if (pt && pt.punto === 'chico') h += '<p class="hz-dim">Le faltan unos ' + pt.faltan + ' días de buen crecimiento para el trasplante. Con frío o poca luz crece más lento y tarda más que eso.</p>';
    if (pl.etapa !== 'semilla') {
      h += '<table class="hz-factores"><tr><th>Luz</th><td>' + escLuz(sp, F.luz.horas, F.luz.f) + '</td><td>' + F.luz.horas + ' h · pide ' + F.luz.pide + '</td></tr>' +
        '<tr><th>Agua</th><td>' + escAgua(sp, F.agua.H, F.agua.f) + '</td><td>' + { bien: 'bien', seco: 'le falta', exceso: 'le sobra' }[F.agua.estado] + ' · pide riego ' + F.agua.pide + '</td></tr>' +
        '<tr><th>Temp.</th><td>' + escTemp(F.temp.tc, F.temp.t, F.temp.f, [F.temp.tmin, F.temp.tmax]) + '</td><td>media ' + F.temp.t + ' °C (' + Math.round(F.temp.tmin) + ' a ' + Math.round(F.temp.tmax) + ') · ideal ' + F.temp.pide + '</td></tr>' +
        '<tr><th>Suelo</th><td>' + barra(F.suelo.f) + '</td><td>' + (F.suelo.maceta < 1 ? 'maceta chica · ' : '') + 'pide ' + esc(META.suelos[sp.suelo].nombre.toLowerCase()) + '</td></tr>' +
        '<tr><th>Vecinos</th><td>' + barra(F.vecinos.f >= 1 ? 1 : F.vecinos.f - 0.2) + '</td><td>' + (F.vecinos.buenas.length ? '+ ' + esc(F.vecinos.buenas.map(corto).join(', ')) : '') + (F.vecinos.malas.length ? ' − ' + esc(F.vecinos.malas.map(corto).join(', ')) : '') + (!F.vecinos.buenas.length && !F.vecinos.malas.length ? 'neutros' : '') + '</td></tr></table>' +
        '<p class="hz-dim">La banda es lo que pide la especie según el catálogo (clara: tolera; fuerte: ideal). La marca es lo que va a tener esta década, y su color dice qué tan bien le viene. En temperatura, la línea fina va de la mínima a la máxima.</p>';
    } else h += '<p>Germina en ' + sp.dg.min + '–' + sp.dg.max + ' días si el suelo está entre ' + (sp.tg ? sp.tg.min + ' y ' + sp.tg.max + ' °C' : 'templado') + ' y húmedo.</p>';
    // qué botones hay lo decide el dominio: la interfaz no repite reglas
    var b = '', puede = C.fichaDeCelda(E, k).planta.acciones, se = function (a) { return puede.indexOf(a) >= 0; };
    var deCria = !!M.zona(E, c.zona).cria, varios = (pl.n || 1) > 1;
    if (se('cosechar')) b += '<button class="hz-btn pri" data-acc="cosechar">Cosechar</button>';
    if (se('semillar')) b += '<button class="hz-btn" data-acc="semillar">Dejar semillar</button>';
    if (se('mover')) b += '<button class="hz-btn' + (sp.dt && pl.prog >= sp.dt.min ? ' pri' : '') + '" data-acc="mover">' + (varios ? 'Trasplantar uno · 1 (hay ' + pl.n + ')' : 'Trasplantar · 1') + '</button>';
    if (se('ralear')) b += '<button class="hz-btn pri" data-acc="ralear">Ralear: dejar una · 1</button>';
    if (se('tutorar')) b += '<button class="hz-btn" data-acc="tutorar">Poner tutor · 1</button>';
    if (se('tratar')) b += '<button class="hz-btn pri" data-acc="tratar">Tratar plaga · 1</button>';
    b += '<button class="hz-btn sec" data-acc="arrancar">Arrancar</button>';
    h += '<div class="hz-fila">' + b + '</div>';
    if (deCria && sp.dt) h += '<p class="hz-dim">Se trasplanta con ' + sp.dt.min + '–' + sp.dt.max + ' días de crecimiento. ' + vent(pl.slug, 'trasplante') + '</p>';
    if (deCria && !sp.dt) h += '<p class="hz-dim">' + esc(corto(sp.nombre)) + ' no tolera el trasplante: va de siembra directa. Si lo movés, la raíz sufre.</p>';
    h += diarioHTML(pl);
    h += '<div class="hz-fila"><button class="hz-btn sec" data-acc="ficha" data-slug="' + pl.slug + '">Ficha completa</button></div>';
    if (sp.truco) h += '<p class="hz-cita"><span>Del catálogo</span>' + esc(sp.truco) + '</p>';
    if (sp.sup.length) h += '<p class="hz-dim">Dato supuesto por el juego (el catálogo no lo trae): ' + sp.sup.join(', ') + '.</p>';
    return h + pie;
  }

  function panelRiego() {
    var E = ui.E, h = '<h2>Riego por cantero</h2><p>Elegís un régimen y se mantiene solo, pero te come ratos cada década. Cada especie pide el suyo: al romero lo mata el exceso, a la lechuga la sed.</p>';
    M.idsDeZonas(E).forEach(function (z) {
      h += '<div class="hz-riego"><b>' + esc(M.zona(E, z).nombre) + '</b><div class="hz-seg">' + M.RIEGOS.map(function (n, i) { return '<button data-acc="riego" data-zona="' + z + '" data-nivel="' + i + '" class="' + (E.riego[z] === i ? 'on' : '') + '">' + n + '<small>' + M.zona(E, z).riegoCosto[i] + '</small></button>'; }).join('') + '</div></div>';
    });
    return h + '<p class="hz-dim">El número es el costo en ratos. La lluvia suma, el calor resta, las macetas se secan antes y el mulch ayuda.' + (function () { var t = M.zonasDe(E).filter(function (z) { return z.techo; }).map(function (z) { return z.conArticulo; }); return t.length ? ' Bajo techo no llueve: ' + esc(t.join(' y ')) + ' ' + (t.length > 1 ? 'dependen' : 'depende') + ' solo de tu riego.' : ''; })() + '</p>';
  }
  function panelProteger() {
    var E = ui.E, p = E.prox.pron, A = M.ABRIGO;
    var h = '<h2>Proteger de la helada</h2><p>Pronóstico: mínima <b>' + p.tmin + ' °C</b>. Hiela para la planta cuando la mínima, más el abrigo que tenga, no pasa de 3 °C. El pronóstico se equivoca un par de grados: es una apuesta.</p><div class="hz-abrigos">';
    C.riesgoPorZona(E).forEach(function (z) {
      var ab = z.abrigo;
      h += '<div class="hz-abrigo n-' + z.nivel + '"><div><b>' + esc(z.nombre) + '</b><span>' + (ab.grados ? ab.partes.join(' + ') + ': +' + ab.grados + ' °C, aguanta hasta ' + (ab.aguanta + 0.1).toFixed(0) + ' °C' : 'sin abrigo: se hiela con 3 °C o menos') + '</span>' +
        '<span>' + (z.sensibles.length ? '<i class="hz-riesgo">' + z.riesgo + ' % de que se hiele</i> · sensibles: ' + esc(z.sensibles.map(corto).join(', ').toLowerCase()) : 'nada sensible a la helada acá') + '</span></div>' +
        '<button class="hz-btn' + (z.conManta ? ' on' : z.sensibles.length && z.riesgo >= 15 ? ' pri' : '') + '" data-acc="manta" data-zona="' + z.id + '"' + (z.conManta ? ' disabled' : '') + '>' + (z.conManta ? 'Manta puesta' : 'Manta · 1') + '</button></div>';
    });
    h += '</div><div class="hz-fila">' + M.zonasDe(E).filter(function (z) { return z.admiteTunel; }).map(function (z) { return '<button class="hz-btn' + (E.tunel[z.id] ? ' on' : '') + '" data-acc="tunel" data-zona="' + z.id + '">' + (E.tunel[z.id] ? 'Sacar' : 'Armar') + ' microtúnel en ' + esc(z.conArticulo) + ' · 2</button>'; }).join('') + '</div>';
    return h + '<p class="hz-dim">Cada manta tapa un solo cantero, abriga unos ' + A.manta + ' °C y dura esta década. El microtúnel abriga ' + A.tunel + ' °C y queda puesto, pero no deja entrar lluvia ni polinizadores y en verano cocina. ' + M.zonasDe(E).filter(function (z) { return z.abrigo; }).map(function (z) { return esc(cap(z.conArticulo)) + (/^l[ao]s /.test(z.conArticulo) ? ' ya tienen ' : ' ya tiene ') + z.abrigo.grados + ' °C por ' + esc(z.abrigo.nombre) + '. '; }).join('') + 'Los abrigos se suman: manta sobre microtúnel aguanta hasta ' + (3 - A.manta - A.tunel) + ' °C. Una helada más fuerte que eso mata igual, y el cuaderno te lo va a decir.</p>';
  }
  function panelCuaderno() {
    var E = ui.E, por = {}, orden = [];
    E.cuaderno.slice().reverse().forEach(function (e) { if (!por[e.turno]) { por[e.turno] = []; orden.push(e.turno); } por[e.turno].unshift(e); });
    return '<h2>Cuaderno de huerta</h2>' + orden.slice(0, 12).map(function (t) { return '<h3>' + esc(cap(M.fechaDe(por[t][0].dec))) + '</h3>' + eventosHTML(por[t]); }).join('');
  }
  var LETRAS_MES = 'EFMAMJJASOND';
  function franja(slug, grande) {
    var d = ESP[slug].dec || {}, E = ui.E, h = '';
    for (var i = 1; i <= 36; i++) {
      var s = (d.siembra_ideal || []).indexOf(i) >= 0 ? 'si' : (d.siembra_posible || []).indexOf(i) >= 0 ? 'sp' : '', t = (d.trasplante_ideal || []).indexOf(i) >= 0 ? 'ti' : (d.trasplante_posible || []).indexOf(i) >= 0 ? 'tp' : '';
      h += '<span class="' + (i === E.dec ? 'hoy' : '') + (i % 3 === 1 ? ' m' : '') + '"><b class="' + s + '"></b><b class="' + t + '"></b></span>';
    }
    return '<span class="hz-franja' + (grande ? ' grande' : '') + '">' + h + '</span>';
  }
  function mesesHTML() { return '<span class="hz-meses">' + LETRAS_MES.split('').map(function (l) { return '<small>' + l + '</small>'; }).join('') + '</span>'; }
  function leyendaAlm() { return '<p class="hz-leyenda"><span><b class="si"></b>siembra ideal</span><span><b class="sp"></b>siembra posible</span><span><b class="ti"></b>trasplante ideal</span><span><b class="tp"></b>trasplante posible</span><span><b class="hoy"></b>hoy</span></p>'; }
  function panelAlmanaque() {
    var E = ui.E, lista = C.almanaque(E, ui.almTodas), slugs = lista.map(function (x) { return x.slug; });
    return '<h2>Almanaque de siembra</h2><p>Conurbano, por décadas de 10 días. Arriba la siembra, abajo el trasplante. Tocá una especie para ver su ficha.</p>' +
      '<div class="hz-seg dos"><button data-acc="alm" data-todas="0" class="' + (ui.almTodas ? '' : 'on') + '">Mis sobres</button><button data-acc="alm" data-todas="1" class="' + (ui.almTodas ? 'on' : '') + '">Las ' + Object.keys(ESP).length + ' especies</button></div>' + leyendaAlm() +
      '<div class="hz-alm"><div class="hz-alm-fila cab"><span></span>' + mesesHTML() + '</div>' + slugs.map(function (s) {
        return '<button class="hz-alm-fila v-' + M.ventana(s, E.dec) + '" data-acc="ficha" data-slug="' + s + '"><span class="nom">' + esc(corto(ESP[s].nombre)) + (E.sobres[s] > 0 ? ' <small>×' + E.sobres[s] + '</small>' : '') + '</span>' + franja(s) + '</button>';
      }).join('') + '</div>' + (slugs.length ? '' : '<p class="hz-dim">No te quedan sobres. Mirá las ' + Object.keys(ESP).length + ' especies.</p>');
  }
  function panelFicha() {
    var E = ui.E, s = ui.fichaSlug, sp = ESP[s]; if (!sp) return panelAlmanaque();
    var w = E.prox.real, met = metodoTexto(s), mac = sp.maceta || {}, nom = function (b) { return ESP[b] ? '<button class="hz-chip" data-acc="ficha" data-slug="' + b + '">' + esc(corto(ESP[b].nombre)) + '</button>' : ''; };
    var h = '<div class="hz-fila"><button class="hz-btn sec" data-acc="modo" data-modo="almanaque">← Almanaque</button>' + (E.sobres[s] > 0 ? '<button class="hz-btn pri" data-acc="sembrarDesdeFicha" data-slug="' + s + '">Sembrar (tenés ×' + E.sobres[s] + ')</button>' : '') + '</div>';
    h += '<h2>' + esc(sp.nombre) + '</h2><p class="hz-sub"><i>' + esc(sp.cient || '') + '</i> · ' + esc(sp.grupo.toLowerCase()) + ' · ' + sp.familia + ' ' + vent(s) + '</p>' + tiraHTML(s);
    h += '<h3>Cuándo</h3><div class="hz-alm solo"><div class="hz-alm-fila cab">' + mesesHTML() + '</div><div class="hz-alm-fila">' + franja(s, true) + '</div></div>' + leyendaAlm() +
      '<dl class="hz-datos"><dt>Este mes</dt><dd>' + (met ? esc(met) : 'no es mes de siembra') + '</dd><dt>Cómo</dt><dd>' + esc(sp.siembra) + '</dd>' +
      '<dt>Tiempos</dt><dd>germina en ' + sp.dg.min + '–' + sp.dg.max + ' días' + (sp.dt ? ' · trasplante a los ' + sp.dt.min + '–' + sp.dt.max : ' · no se trasplanta') + ' · cosecha a los ' + sp.dc.min + '–' + sp.dc.max + '</dd><dt>Vida</dt><dd>' + esc(sp.vida) + '</dd></dl>';
    h += '<h3>Qué pide</h3><table class="hz-factores"><tr><th>Luz</th><td>' + escLuz(sp, null, 1) + '</td><td>' + esc(META.luces[sp.luz].nombre) + ' · ' + sp.hmin + '–' + sp.hideal + ' h</td></tr>' +
      '<tr><th>Agua</th><td>' + escAgua(sp, null, 1) + '</td><td>riego ' + sp.riego + '</td></tr>' +
      (sp.tc ? '<tr><th>Crece</th><td>' + escTemp(sp.tc, w.tmed, 1) + '</td><td>ideal ' + sp.tc.ideal_min + '–' + sp.tc.ideal_max + ' °C · tolera ' + sp.tc.tolera_min + ' a ' + sp.tc.tolera_max + '</td></tr>' : '') +
      (sp.tg ? '<tr><th>Germina</th><td>' + escala(-5, 40, [[sp.tg.min, sp.tg.max, 'tol'], [sp.tg.ideal_min, sp.tg.ideal_max, 'ideal']], w.tmed, 1, { izq: '−5 °C', der: '40 °C' }) + '</td><td>suelo ideal ' + sp.tg.ideal_min + '–' + sp.tg.ideal_max + ' °C · mín ' + sp.tg.min + '</td></tr>' : '') + '</table>' +
      '<p class="hz-dim">La marca en temperatura es la media pronosticada para esta década en tu patio.</p>' +
      '<dl class="hz-datos"><dt>Suelo</dt><dd>' + esc(META.suelos[sp.suelo].nombre) + '. ' + esc(sp.sueloNo) + '</dd><dt>Poca luz</dt><dd>' + esc(sp.luzNo) + '</dd>' +
      '<dt>Helada</dt><dd>' + { muere: 'la mata', sensible: 'la daña', tolera: 'la tolera', mejora: 'la mejora: concentra azúcares' }[sp.helada] + '</dd>' +
      '<dt>Maceta</dt><dd>' + (mac.litros_min || mac.profundidad_min_cm ? (mac.litros_min ? mac.litros_min + ' L' : '') + (mac.litros_min && mac.profundidad_min_cm ? ' y ' : '') + (mac.profundidad_min_cm ? mac.profundidad_min_cm + ' cm de hondo' : '') + (mac.plantas_por_contenedor ? ' · ' + mac.plantas_por_contenedor + ' por maceta' : '') : 'sin dato en el catálogo') + '</dd></dl>';
    h += '<h3>Vecinos</h3>' + (sp.buenas.length ? '<p class="hz-chips"><b class="hz-bien">Se lleva bien</b>' + sp.buenas.map(nom).join('') + '</p>' : '') + (sp.malas.length ? '<p class="hz-chips"><b class="hz-mal">Se lleva mal</b>' + sp.malas.map(nom).join('') + '</p>' : '') + (!sp.buenas.length && !sp.malas.length ? '<p class="hz-dim">Sin asociaciones en el catálogo.</p>' : '');
    h += '<h3>Cuidados y problemas</h3><dl class="hz-datos">' + (sp.cuidados.length ? '<dt>Cuidados</dt><dd>' + sp.cuidados.join(', ') + '</dd>' : '') + '<dt>Cosecha</dt><dd>' + esc(sp.listo) + '</dd><dt>Plagas</dt><dd>' + esc(sp.plagas) + '</dd><dt>Riesgos</dt><dd>' + esc(sp.riesgos) + '</dd></dl>' +
      (sp.truco ? '<p class="hz-cita"><span>Truco del catálogo</span>' + esc(sp.truco) + '</p>' : '') + (sp.nota ? '<p class="hz-cita"><span>Temperatura</span>' + esc(sp.nota) + '</p>' : '');
    var cf = sp.conf || {}; h += '<p class="hz-dim">Confianza de los datos en huertapp (1 a 10): luz ' + cf.luz + ', suelo ' + cf.suelo + ', temperatura ' + cf.temp + ', calendario ' + cf.cal + ', asociaciones ' + cf.asoc + '.' + (sp.sup.length ? ' Supuesto por el juego: ' + sp.sup.join(', ') + '.' : '') + '</p>';
    return h;
  }

  function panelLogros() {
    var E = ui.E, b = M.balance(E);
    return '<h2>Logros y cosecha</h2><p class="hz-cifras"><b>' + b.porciones + '</b> porciones · <b>' + b.especies + '</b> especies · <b>' + b.semillas + '</b> sobres propios · <b>' + b.visitas + '</b> visitas de polinizadores</p><ul class="hz-logros">' +
      M.MISIONES.map(function (m) { var ok = m.id in E.misiones; return '<li class="' + (ok ? 'ok' : '') + '"><b>' + esc(m.titulo) + '</b><span>' + esc(m.texto) + '</span><small>Premio: ' + Object.keys(m.premio).map(function (s) { return esc(corto(ESP[s].nombre)); }).join(', ') + '</small></li>'; }).join('') + '</ul>';
  }
  function panelPartidas() {
    var E = ui.E, h = '<h2>Tu huerta guardada</h2>';
    h += '<p>' + (ui.sinStorage ? '<b class="hz-mal">Este navegador no está dejando guardar en el dispositivo.</b> Usá la nube o el código para no perder la partida.' : 'Se guarda sola en este dispositivo después de cada cosa que hacés. Última vez: ' + cuando(E.guardado) + '.') + '</p><p class="hz-sub">' + esc(resumenDe(E)) + '</p>';
    h += '<h3>En la nube</h3>';
    if (nube.estado === 'lista') h += '<p>Se sube sola cada vez que pasás 10 días, a una carpeta que solo vos podés leer. Sirve para seguir en el celular lo que empezaste en la compu.' + (nube.remota ? ' En la nube hay: <b>' + esc(nube.remota.resumen) + '</b>, del ' + cuando(nube.remota.t) + '.' : ' Todavía no hay nada subido.') + (nube.error ? ' <b class="hz-mal">' + esc(nube.error) + '</b>' : '') + '</p><div class="hz-fila"><button class="hz-btn" data-acc="subir">Subir ahora</button><button class="hz-btn" data-acc="traer"' + (nube.remota ? '' : ' disabled') + '>Traer de la nube</button></div>';
    else h += '<p class="hz-dim">' + (nube.estado === 'buscando' ? 'Buscando la nube…' : 'La nube no está disponible en esta vista (por ejemplo, si abriste el archivo suelto). Las ranuras y el código funcionan igual.') + '</p>';
    h += '<h3>Ranuras</h3><p class="hz-dim">Copias a mano, para probar algo arriesgado y poder volver.</p><div class="hz-ranuras">';
    for (var n = 1; n <= 3; n++) { var r = ranura(n); h += '<div class="hz-ranura"><div><b>Ranura ' + n + '</b><span>' + (r ? esc(resumenDe(r.E)) + ' · guardada el ' + cuando(r.t) : 'vacía') + '</span></div><button class="hz-btn" data-acc="ranuraGuardar" data-n="' + n + '">Guardar acá</button><button class="hz-btn" data-acc="ranuraCargar" data-n="' + n + '"' + (r ? '' : ' disabled') + '>Cargar</button></div>'; }
    h += '</div><h3>Llevarla a otro lado</h3><div class="hz-fila"><button class="hz-btn" data-acc="descargar">Bajar archivo</button><button class="hz-btn" data-acc="verCodigo">' + (ui.verCodigo ? 'Ocultar código' : 'Ver código de la partida') + '</button></div>';
    if (ui.verCodigo) h += '<textarea id="hz-codigo" class="hz-codigo" readonly rows="4" aria-label="Código de la partida">' + esc(aCodigo(E)) + '</textarea><div class="hz-fila"><button class="hz-btn" data-acc="copiar">Copiar</button></div>';
    h += '<label class="hz-dim" for="hz-importar">Pegá acá un código o el contenido de un archivo para cargarlo:</label><textarea id="hz-importar" class="hz-codigo" rows="3"></textarea><div class="hz-fila"><button class="hz-btn" data-acc="importar">Cargar lo pegado</button></div>';
    return h + '<h3>Empezar de cero</h3><div class="hz-fila"><button class="hz-btn sec" data-acc="modo" data-modo="patios">Elegir patio y empezar</button></div>';
  }
  function panelPatios() {
    var E = ui.E, h = '<h2>Elegí un patio</h2><p>Cada patio plantea un problema distinto de luz, espacio y agua. ' + (E.terminado ? '' : 'Empezar uno nuevo reemplaza la partida de ahora: si la querés conservar, guardala antes en una ranura.') + '</p><div class="hz-ranuras">';
    Object.keys(M.PATIOS).forEach(function (id) {
      var P = M.PATIOS[id];
      h += '<div class="hz-ranura"><div><b>' + esc(P.nombre) + (id === E.patio ? ' · el de ahora' : '') + (id !== M.PATIO_INICIAL ? ' · en prueba' : '') + '</b><span>' + esc(P.desc) + '</span><span class="hz-dim">' + P.zonas.map(function (z) { return esc(z.nombre); }).join(' · ') + '</span></div><button class="hz-btn' + (id === E.patio ? '' : ' pri') + '" data-acc="nueva" data-patio="' + id + '">Empezar acá</button></div>';
    });
    return h + '</div><div class="hz-fila"><button class="hz-btn sec" data-acc="modo" data-modo="partidas">Volver</button></div>';
  }
  function panelFin() {
    var b = M.balance(ui.E);
    return '<h2>Balance del año</h2><p class="hz-estrellas">' + '★★★'.slice(0, b.estrellas) + '<i>' + '★★★'.slice(b.estrellas) + '</i></p>' +
      '<dl class="hz-datos"><dt>Porciones cosechadas</dt><dd>' + b.porciones + '</dd><dt>Especies distintas</dt><dd>' + b.especies + '</dd><dt>Sobres de semilla propia</dt><dd>' + b.semillas + '</dd><dt>Materia orgánica del suelo</dt><dd>' + (b.dMo >= 0 ? '+' : '') + b.dMo + ' puntos</dd><dt>Visitas de polinizadores</dt><dd>' + b.visitas + '</dd><dt>Logros</dt><dd>' + b.logros + ' de ' + M.MISIONES.length + '</dd><dt>Puntaje</dt><dd>' + b.puntos + '</dd></dl>' +
      (b.dMo < 0 ? '<p>La tierra terminó más pobre de lo que empezó: cada cosecha se lleva nutrientes. Compost, mulch y legumbres la devuelven.</p>' : '<p>Dejaste la tierra mejor de lo que la encontraste. Esa es la huerta que dura.</p>') +
      '<div class="hz-fila"><button class="hz-btn pri" data-acc="seguir">Seguir otro año</button><button class="hz-btn" data-acc="modo" data-modo="patios">Patio nuevo</button></div>';
  }

  function pintar() {
    var E = ui.E;
    $('hz-hud').innerHTML = hud();
    var P = { inicio: panelInicio, semillas: panelSemillas, celda: panelCelda, riego: panelRiego, proteger: panelProteger, almanaque: panelAlmanaque, ficha: panelFicha, partidas: panelPartidas, patios: panelPatios, cuaderno: panelCuaderno, logros: panelLogros, fin: panelFin,
      resumen: function () { return '<h2>Pasaron 10 días</h2>' + eventosHTML(ui.ultimos); } };
    var cuerpo = (P[ui.modo] || panelInicio)();
    if (ui.moviendo) cuerpo = '<div class="hz-eval n-regular"><b>Trasplantando ' + esc(corto(ESP[E.plantas[ui.moviendo].slug].nombre)) + '.</b> Tocá la celda de destino. <button class="hz-btn sec" data-acc="cancelar">Cancelar</button></div>' + cuerpo;
    var notaHTML = ui.nota ? '<p class="hz-nota" role="status">' + esc(ui.nota) + '</p>' : ''; ui.nota = '';
    $('hz-panel').innerHTML = notaHTML + (ui.aviso ? '<p class="hz-aviso" role="alert">' + esc(ui.aviso) + '</p>' : '') + cuerpo;
    Array.prototype.forEach.call(document.querySelectorAll('#hz-barra [data-modo]'), function (b) { b.classList.toggle('on', b.getAttribute('data-modo') === ui.modo); });
    $('hz-capa').classList.toggle('on', ui.capa === 'sol');
    $('hz-pasar').disabled = E.terminado;
    $('hz-render').textContent = 'Gráfica: ' + ui.r.nombre;
    var cams = ui.r.camaras, es = escena();
    $('hz-camara').hidden = !cams; if (cams) $('hz-camara').textContent = 'Cámara: ' + cams[ui.cam % cams.length][1];
    $('hz-zonas').hidden = es.camara !== 'cerca';
    $('hz-zonas').innerHTML = M.idsDeZonas(E).map(function (z) { return '<button data-acc="zona" data-zona="' + z + '" class="' + (z === ui.zonaCerca ? 'on' : '') + '">' + esc(M.zona(E, z).nombre) + '</button>'; }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('canvas[data-tira]'), function (cv) { var s = cv.getAttribute('data-tira'), sp = ESP[s]; SP.tira(cv, { slug: s, grupo: sp.grupo, familia: sp.familia, tutor: sp.cuidados.indexOf('tutorado') >= 0 }, { actual: cv.hasAttribute('data-actual') ? +cv.getAttribute('data-actual') : -1 }); });
    ui.r.dibujar(es);
    var cola = ui.cola; ui.cola = []; if (ui.r.efecto) cola.forEach(function (c) { ui.r.efecto(c[0], c[1] || {}); });
  }

  function clic(e) {
    var t = e.target.closest('[data-acc]'); if (!t) return;
    var a = t.getAttribute('data-acc'), E = ui.E, pl = ui.sel ? M.plantaEn(E, ui.sel) : null;
    if (a === 'modo') { ui.modo = t.getAttribute('data-modo'); ui.aviso = ''; ui.moviendo = null; if (ui.modo !== 'semillas') ui.sobre = null; }
    else if (a === 'sobre') { var s = t.getAttribute('data-slug'); ui.sobre = ui.sobre === s ? null : s; if (ui.sel && E.celdas[ui.sel] && E.celdas[ui.sel].planta) ui.sel = null; }
    else if (a === 'sembrar') { if (hacer({ tipo: 'sembrar', slug: ui.sobre, celda: ui.sel })) fx('sembrar', { celda: ui.sel }); if (!(E.sobres[ui.sobre] > 0)) ui.sobre = null; ui.sel = null; }
    else if (a === 'ficha') { ui.fichaSlug = t.getAttribute('data-slug'); ui.modo = 'ficha'; ui.moviendo = null; var pn = $('hz-panel'); if (pn && pn.scrollIntoView && root.innerWidth < 860) pn.scrollIntoView({ block: 'start' }); }
    else if (a === 'alm') ui.almTodas = t.getAttribute('data-todas') === '1';
    else if (a === 'sembrarDesdeFicha') { ui.modo = 'semillas'; ui.sobre = t.getAttribute('data-slug'); ui.sel = null; }
    else if (a === 'ranuraGuardar') guardarRanura(+t.getAttribute('data-n'));
    else if (a === 'ranuraCargar') { var rr = ranura(+t.getAttribute('data-n')); if (rr) { if (t.getAttribute('data-ok')) usar(JSON.parse(JSON.stringify(rr.E)), 'Cargué la ranura ' + t.getAttribute('data-n') + '.'); else { t.setAttribute('data-ok', '1'); t.textContent = '¿Pisar la actual?'; return; } } }
    else if (a === 'subir') { subirNube(true); return; }
    else if (a === 'traer') { if (t.getAttribute('data-ok')) { traerNube(); return; } t.setAttribute('data-ok', '1'); t.textContent = '¿Pisar la actual?'; return; }
    else if (a === 'descargar') { descargar(); }
    else if (a === 'verCodigo') ui.verCodigo = !ui.verCodigo;
    else if (a === 'copiar') { var ta = $('hz-codigo'); if (ta) { ta.focus(); ta.select(); var okc = false; try { okc = document.execCommand('copy'); } catch (e2) {} if (!okc && navigator.clipboard) navigator.clipboard.writeText(ta.value).then(function () {}, function () {}); ui.nota = okc ? 'Código copiado.' : 'Quedó seleccionado: copialo con el menú del teléfono o Ctrl+C.'; if (!okc) { ui.aviso = ''; $('hz-panel').insertAdjacentHTML('afterbegin', '<p class="hz-nota">' + ui.nota + '</p>'); ui.nota = ''; return; } } }
    else if (a === 'importar') { var imp = deCodigo(($('hz-importar') || {}).value); if (imp) usar(imp, 'Partida cargada.'); else ui.aviso = 'Eso no parece una partida de Huertita. Pegá el código completo, desde HUERTITA1.'; }
    else if (a === 'capa') ui.capa = ui.capa === 'sol' ? null : 'sol';
    else if (a === 'pasar') return pasar();
    else if (a === 'ir') { ui.sel = t.getAttribute('data-celda'); if (E.celdas[ui.sel]) ui.modo = 'celda'; }
    else if (a === 'mover') { ui.moviendo = pl && pl.id; }
    else if (a === 'cancelar') ui.moviendo = null;
    else if (a === 'riego') { if (hacer({ tipo: 'riego', zona: t.getAttribute('data-zona'), nivel: +t.getAttribute('data-nivel') }) && +t.getAttribute('data-nivel') > 0) fx('regar', { zona: t.getAttribute('data-zona'), nivel: +t.getAttribute('data-nivel') }); }
    else if (a === 'manta') hacer({ tipo: 'manta', zona: t.getAttribute('data-zona') });
    else if (a === 'tunel') hacer({ tipo: 'tunel', zona: t.getAttribute('data-zona') });
    else if (a === 'mulch' || a === 'compost') { if (hacer({ tipo: a, celda: ui.sel })) fx(a, { celda: ui.sel }); }
    else if (a === 'camara') { ui.cam = (ui.cam + 1) % (ui.r.camaras ? ui.r.camaras.length : 1); }
    else if (a === 'zona') { ui.zonaCerca = t.getAttribute('data-zona'); ui.sel = null; if (ui.modo === 'celda') ui.modo = 'inicio'; }
    else if (a === 'render') { ui.r.desmontar(); ui.rIdx = (ui.rIdx + 1) % RENDERERS.length; montarRenderer(); }
    else if (a === 'nueva') { if (t.getAttribute('data-ok') || E.terminado) { nueva(t.getAttribute('data-patio')); } else { t.setAttribute('data-ok', '1'); t.textContent = '¿Seguro? Tocá de nuevo'; return; } }
    else if (a === 'seguir') { hacer({ tipo: 'seguir' }); ui.modo = 'inicio'; }
    else if (pl && /^(cosechar|semillar|arrancar|tutorar|tratar|ralear)$/.test(a)) { var vista = vistaDe(ui.sel), antes = E.porciones; if (hacer({ tipo: a, planta: pl.id })) fx(a === 'arrancar' || a === 'ralear' ? 'polvo' : a === 'semillar' ? 'brote' : a, { celda: ui.sel, planta: vista, texto: a === 'cosechar' ? '+' + String(Math.round((E.porciones - antes) * 10) / 10).replace('.', ',') : null }); if (!M.plantaEn(E, ui.sel) && ui.ultimos.length) ui.modo = 'resumen'; }
    pintar();
  }
  function montarRenderer() { ui.r = new RENDERERS[ui.rIdx](); ui.r.montar($('hz-lienzo')); ui.r.alTocar(tocarCelda); }
  function nueva(patio) { ui.E = M.crearPartida((Date.now() % 2147483647) | 0, { patio: patio || (ui.E && ui.E.patio) || M.PATIO_INICIAL }); ui.zonaCerca = null; ui.modo = 'inicio'; ui.sel = null; ui.sobre = null; ui.moviendo = null; ui.ultimos = []; guardar(); }

  function arrancar(previo) {
    ui.E = (valida(previo) ? previo : null) || cargar(); var sinLocal = !ui.E; if (!ui.E) nueva();
    if (ui.E.terminado) ui.modo = 'fin';
    montarRenderer(); $('hz').addEventListener('click', clic); pintar(); conectarNube(sinLocal);
  }
  // Si la página se republica con alguien jugando, la partida sigue.
  var hot = root.claude && root.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(function () { return ui.E; });
  if (hot && hot.ready) hot.ready(arrancar); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { arrancar(hot && hot.data); }); else arrancar(hot && hot.data);
  ui.pintar = function () { pintar(); }; window.Huertita = { ui: ui, Motor: M };
