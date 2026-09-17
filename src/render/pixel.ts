// @ts-nocheck — renderer portado tal cual del prototipo; se tipa en el paso 6 de los cimientos
/**
 * HUERTITA — renderer pixel-art (canvas, baldosas de 32 px) con tres cámaras.
 *
 * Contrato de cualquier renderer (es todo lo que la UI conoce de él):
 *   montar(elemento)    crea su superficie dentro del elemento
 *   dibujar(escena)     pinta una foto del estado; la escena es un objeto plano
 *   alTocar(callback)   avisa qué celda "x,y" tocó la persona
 *   desmontar()         se va sin dejar rastros
 * Opcionales, que la UI usa solo si existen:
 *   camaras             lista de cámaras; la elegida llega en escena.camara
 *   efecto(tipo, datos) animación puntual: sembrar, cosechar, trasplantar, regar…
 *
 * Cámaras: 'cenital' (desde arriba), 'oblicua' (desde la galería, mirando al norte)
 * y 'cerca' (un cantero de frente, con el suelo cortado para ver las raíces).
 * No importa el motor ni lee el estado: solo la escena que le pasan.
 */
import * as SP from '../arte/sprites';
  var mez = SP.mezcla, root = window;
  var T = 32;
  var C = {
    pasto: '#4f9d3a', pasto2: '#62b548', pasto3: '#3f8531', sendero: '#dcbb7e', sendero2: '#c9a263', sendero3: '#ecd29a',
    ladrillo: '#c5482e', ladrillo2: '#9e3421', ladrillo3: '#dc6a48', junta: '#e8c9a0',
    tierra: ['#b07a4e', '#94613a', '#7a4d2e', '#603c23'], madera: '#b5793a', madera2: '#8a5526', madera3: '#d39a55',
    terracota: '#e0673a', terracota2: '#b84a25', terracota3: '#f08a5a', paja: '#f0d071', paja2: '#d9b04a',
    casa: '#f4e3b5', casa2: '#d9c48e', techo: '#2f8f9d', techo2: '#23707b', techo3: '#47adba', puerta: '#d9482b',
    tronco: '#6b4226', tronco2: '#8a5a36', copa: '#2f8f3f', copa2: '#46b04f', copa3: '#1f6e33', copa4: '#6fd060',
    blanco: '#fff6e0', anil: '#1d1b4b', maiz: '#ffc233', sombra: 'rgba(24,20,70,0.32)',
    bien: 'rgba(80,255,120,0.42)', regular: 'rgba(255,210,60,0.46)', mal: 'rgba(255,70,60,0.46)'
  };
  var CIELO = { verano: ['#58c4f0', '#a8e4f8'], otoño: ['#f0a868', '#f8d8a8'], invierno: ['#8fa8d8', '#d0dcf0'], primavera: ['#6fd0e8', '#c8f0f0'] };
  function ruido(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  function easeBack(u) { var c = 1.70158; u = u - 1; return 1 + (c + 1) * u * u * u + c * u * u; }

  function RenderPixel() { this.cb = null; this.escena = null; this.t = 0; this.parts = []; this.textos = []; this.vuelos = []; this.tw = {}; this.prev = {}; this.lluviaZona = {}; }
  RenderPixel.prototype.nombre = 'Pixel';
  RenderPixel.prototype.camaras = [['cenital', 'Desde arriba'], ['oblicua', 'Desde la galería'], ['cerca', 'Cantero de cerca']];

  RenderPixel.prototype.montar = function (el) {
    var self = this; this.el = el;
    this.cv = document.createElement('canvas'); this.cv.className = 'hz-canvas'; this.cv.setAttribute('role', 'img'); this.cv.setAttribute('aria-label', 'Patio de la huerta');
    el.appendChild(this.cv); this.ctx = this.cv.getContext('2d'); this.bg = document.createElement('canvas');
    this._click = function (e) { if (!self.G || !self.cb) return; var r = self.cv.getBoundingClientRect(); var k = self.G.hit((e.clientX - r.left) / r.width * self.G.W, (e.clientY - r.top) / r.height * self.G.H); if (k) self.cb(k); };
    this.cv.addEventListener('click', this._click);
    this._resize = function () { if (self.escena) self.dibujar(self.escena); }; root.addEventListener('resize', this._resize);
    var quieto = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._timer = setInterval(function () { self.t += quieto ? 0 : 0.5; if (self.escena) self._cuadro(); }, quieto ? 600 : 90);
  };
  RenderPixel.prototype.desmontar = function () { clearInterval(this._timer); root.removeEventListener('resize', this._resize); this.cv.removeEventListener('click', this._click); if (this.cv.parentNode) this.cv.parentNode.removeChild(this.cv); };
  RenderPixel.prototype.alTocar = function (cb) { this.cb = cb; };

  // ── geometría de cada cámara ──
  function geometria(es) {
    var cam = es.camara || 'cenital', G = { cam: cam, W: es.ancho * T };
    if (cam === 'cerca') {
      var ks = Object.keys(es.celdas).filter(function (k) { return es.celdas[k].zona === es.cerca.zona; }), xs = [], ys = [];
      ks.forEach(function (k) { var p = k.split(','); if (xs.indexOf(+p[0]) < 0) xs.push(+p[0]); if (ys.indexOf(+p[1]) < 0) ys.push(+p[1]); });
      xs.sort(function (a, b) { return a - b; }); ys.sort(function (a, b) { return a - b; });
      var i0 = Math.max(0, Math.min(xs.length - 4, xs.indexOf(es.cerca.col) - 1)); if (es.cerca.col == null || xs.indexOf(es.cerca.col) < 0) i0 = 0;
      var cols = xs.slice(i0, i0 + 4), cw = 60, x0 = Math.round((256 - cols.length * cw) / 2);
      G.H = 256; G.cols = cols; G.filas = ys; G.cw = cw; G.x0 = x0; G.yF = 170; G.yB = 132; G.zona = es.cerca.zona; G.tipo = es.cerca.tipo; G.masIzq = i0 > 0; G.masDer = i0 + 4 < xs.length;
      G.celda = function (k) { var p = k.split(','), ci = cols.indexOf(+p[0]), fi = ys.indexOf(+p[1]); if (ci < 0 || fi < 0 || es.celdas[k].zona !== G.zona) return null; var frente = fi === ys.length - 1; return { x: x0 + ci * cw, w: cw, bx: x0 + ci * cw + cw / 2, by: frente ? G.yF : G.yB, frente: frente, s: 2 }; };
      G.hit = function (px, py) { var ci = Math.floor((px - x0) / cw); if (ci < 0 || ci >= cols.length) return null; var fi = (ys.length > 1 && py < 140) ? 0 : ys.length - 1; return cols[ci] + ',' + ys[fi]; };
      return G;
    }
    var obl = cam === 'oblicua', TH = obl ? 22 : T, muro = obl ? 60 : T, pie = obl ? 26 : T;
    G.obl = obl; G.TH = TH; G.muro = muro; G.H = muro + (es.alto - 2) * TH + pie;
    G.fy = function (y) { return y === 0 ? 0 : muro + (y - 1) * TH; };
    G.fh = function (y) { return y === 0 ? muro : y === es.alto - 1 ? pie : TH; };
    G.celda = function (k) { var p = k.split(','), x = +p[0], y = +p[1]; return { x: x * T, y: G.fy(y), w: T, h: G.fh(y), bx: x * T + T / 2, by: G.fy(y) + G.fh(y) - (obl ? 4 : 3), s: 1 }; };
    G.hit = function (px, py) { var x = Math.floor(px / T); for (var y = 0; y < es.alto; y++) if (py >= G.fy(y) && py < G.fy(y) + G.fh(y)) return x + ',' + y; return null; };
    return G;
  }

  RenderPixel.prototype.dibujar = function (es) {
    var self = this, ahora = Date.now();
    // brotes y crecimiento: si el avance subió desde la última foto, se anima
    Object.keys(es.celdas).forEach(function (k) {
      var p = es.celdas[k].planta, id = p ? k + p.slug : null, ant = self.prev[k];
      if (p && ant && ant.id === id) { var de = ant.etapa === 'semilla' && p.etapa !== 'semilla' ? 0.02 : ant.a; if (p.avance > de + 0.015 || ant.etapa !== p.etapa) self.tw[k] = { de: de, a: p.avance, t0: ahora + Math.round(ruido(+k.split(',')[0], +k.split(',')[1]) * 500), dur: 900, brote: ant.etapa === 'semilla' && p.etapa !== 'semilla' }; }
      self.prev[k] = p ? { id: id, a: p.avance, etapa: p.etapa } : null;
    });
    this.escena = es; this.G = geometria(es);
    var G = this.G, cssW = this.el.clientWidth || 320, S = Math.max(1, Math.round(cssW * (root.devicePixelRatio || 1) / G.W));
    if (this.cv.width !== G.W * S || this.cv.height !== G.H * S) { this.cv.width = G.W * S; this.cv.height = G.H * S; }
    this.S = S; this.bg.width = G.W * S; this.bg.height = G.H * S;
    var bg = this.bg.getContext('2d'); bg.setTransform(S, 0, 0, S, 0, 0); bg.imageSmoothingEnabled = false;
    if (G.cam === 'cerca') this._fondoCerca(bg, es, G); else this._fondo(bg, es, G);
    this._cuadro();
  };

  // ── fondo del patio (cenital y oblicua): se pinta una vez por foto ──
  RenderPixel.prototype._fondo = function (g, es, G) {
    var B = SP.pincel(g, 0, 0, 1), r = B.r, x, y, i, obl = G.obl;
    for (y = 0; y < es.alto; y++) for (x = 0; x < es.ancho; x++) {
      var ch = es.plano[y][x], X = x * T, Y = G.fy(y), h = G.fh(y);
      if (ch === 'P' || ch === 'H') continue;
      var send = ch === ':' || (es.piso === 'baldosa' && ch !== 'T');
      r(X, Y, T, h, send ? C.sendero : C.pasto);
      for (i = 0; i < 12; i++) { var nx = Math.floor(ruido(x * 7 + i, y * 3) * 30), ny = Math.floor(ruido(x + i * 5, y * 11) * (h - 2)); if (send) r(X + nx, Y + ny, i % 3 ? 2 : 3, 1, i % 2 ? C.sendero2 : C.sendero3); else { r(X + nx, Y + ny, 1, 3, i % 2 ? C.pasto2 : C.pasto3); if (i % 5 === 0) r(X + nx + 1, Y + ny + 1, 1, 2, C.pasto2); } }
      if (!send && ruido(x * 3, y * 9) > 0.72) { r(X + 9, Y + Math.round(h / 2), 2, 2, '#fff6e0'); r(X + 22, Y + 5, 2, 2, '#ffd23f'); }
    }
    // paredón norte
    var m = G.muro, cielo = CIELO[es.estacion] || CIELO.primavera;
    if (obl) { r(0, 0, G.W, 10, cielo[0]); r(0, 6, G.W, 4, cielo[1]); }
    var y0 = obl ? 10 : 0;
    if (es.norte === 'baranda') { // baranda de barrotes: se ve el cielo y los techos de enfrente
      r(0, y0, G.W, m - y0, cielo[0]); r(0, y0 + Math.round((m - y0) * 0.45), G.W, m - y0 - Math.round((m - y0) * 0.45), cielo[1]);
      for (i = 0; i < 7; i++) { var ex = Math.floor(ruido(i, 21) * (G.W - 30)), eh = 5 + Math.floor(ruido(i, 23) * (m * 0.35)); r(ex, m - eh - 3, 22 + Math.floor(ruido(i, 25) * 16), eh, i % 2 ? '#8f86c8' : '#a59ad6'); }
      for (x = 3; x < G.W; x += 8) r(x, y0 + 4, 2, m - y0 - 4, '#2a2869');
      r(0, y0 + 2, G.W, 3, '#1d1b4b'); r(0, y0 + 2, G.W, 1, '#4a48a0'); r(0, m - 3, G.W, 3, '#1d1b4b');
    } else {
      r(0, y0, G.W, m - y0, C.ladrillo);
      for (var f = 0; y0 + f * 6 < m; f++) { var yy = y0 + f * 6; r(0, yy + 5, G.W, 1, C.junta); for (x = (f % 2) * 8; x < G.W; x += 16) { r(x, yy, 1, 5, C.junta); if (ruido(x, f) > 0.7) r(x + 2, yy + 1, 12, 3, C.ladrillo3); if (ruido(x + 1, f * 3) > 0.8) r(x + 2, yy + 1, 12, 3, C.ladrillo2); } }
      r(0, y0, G.W, 3, C.casa2); r(0, y0 + 3, G.W, 1, C.ladrillo2);
      for (i = 0; i < 9; i++) { var vx = Math.floor(ruido(i, 4) * (G.W - 60)), vl = 4 + Math.floor(ruido(i, 8) * (m * 0.4)); r(vx, m - vl, 2, vl, C.copa3); r(vx - 2, m - vl + 2, 3, 2, C.copa); r(vx + 1, m - Math.round(vl / 2), 3, 2, C.copa2); }
      r(0, m - 2, G.W, 2, 'rgba(0,0,0,0.25)');
    }
    // casa / galería
    var yc = G.fy(es.alto - 1), hc = G.fh(es.alto - 1);
    if (obl) { for (x = 0; x < G.W; x += 16) for (i = 0; i < 2; i++) r(x, yc + i * 13, 16, 13, ((x / 16 + i) % 2) ? '#d9704a' : '#f0d8a8'); r(0, yc, G.W, 2, C.casa2); r(0, yc + hc - 5, G.W, 5, C.techo2); r(0, yc + hc - 5, G.W, 1, C.techo3); }
    else { r(0, yc, G.W, hc, C.casa); r(0, yc, G.W, 11, C.techo); r(0, yc + 11, G.W, 2, C.techo2); for (x = 0; x < G.W; x += 8) { r(x, yc + 2, 5, 7, C.techo2); r(x, yc + 2, 5, 2, C.techo3); } var px = G.W - 56, vx2 = G.W - 88; r(px, yc + 14, 16, 18, C.puerta); r(px, yc + 14, 16, 2, '#a8341d'); r(px + 11, yc + 23, 2, 2, C.paja); r(vx2, yc + 16, 20, 12, '#7fd6e0'); r(vx2 + 9, yc + 16, 2, 12, C.casa2); r(vx2, yc + 21, 20, 2, C.casa2); r(vx2 + 2, yc + 17, 5, 3, '#c8f4f8'); }

    // canteros
    Object.keys(es.celdas).forEach(function (k) {
      var c = es.celdas[k], q = G.celda(k), X = q.x, Y = q.y, h = q.h, p = k.split(','), cx = +p[0], cy = +p[1];
      var t = c.mo >= 75 ? mez(C.tierra[Math.min(3, c.humedo)], '#2a160c', 0.45) : C.tierra[Math.min(3, c.humedo)], t2 = mez(t, '#000000', 0.22), t3 = mez(t, '#ffffff', 0.12);
      function grumos(x0, y0, w, hh) { for (var j = 0; j < 14; j++) { var gx = x0 + Math.floor(ruido(cx * 5 + j, cy * 7) * (w - 3)), gy = y0 + Math.floor(ruido(cx + j * 3, cy * 13 + j) * (hh - 2)); r(gx, gy, j % 3 ? 2 : 3, 1, j % 2 ? t2 : t3); } if (c.humedo >= 3) for (j = 0; j < 3; j++) r(x0 + 4 + j * 9, y0 + 3 + (j * 7) % (hh - 5), 2, 1, '#7fc8e8'); }
      if (c.tipo === 'macetas') {
        var R = c.maceta.litros >= 20 ? 14 : c.maceta.litros >= 8 ? 11 : 8;
        if (obl) { var ry = Math.round(R * 0.42), py = q.by - 1, alto = Math.round(R * 0.95); g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(q.bx + 3, py + alto, R, ry, 0, 0, 6.3); g.fill(); for (i = 0; i < alto; i++) { var w = Math.round(R - i * 0.28); r(q.bx - w, py + i, w * 2, 1, i < 3 ? C.terracota3 : C.terracota); r(q.bx + Math.round(w * 0.4), py + i, Math.round(w * 0.6), 1, C.terracota2); } B.elipse(q.bx, py, R, ry, C.terracota3); B.elipse(q.bx, py, R - 2, ry - 1, t); q.potTop = py; }
        else { B.disco(q.bx + 1, Y + 17, R, 'rgba(0,0,0,0.22)'); B.disco(q.bx, Y + 16, R, C.terracota2); B.disco(q.bx, Y + 15, R, C.terracota); B.disco(q.bx - 1, Y + 14, R - 1, C.terracota3); B.disco(q.bx, Y + 15, R - 3, t2); B.disco(q.bx, Y + 16, R - 4, t); r(q.bx - 3, Y + 12, 3, 1, t3); }
      } else if (c.tipo === 'almaciguera') {
        r(X, Y + 2, T, h - 3, '#2a2869'); r(X, Y + 2, T, 1, '#4a48a0'); var ph = Math.floor((h - 7) / 2);
        for (var a = 0; a < 3; a++) for (var b2 = 0; b2 < 2; b2++) { r(X + 2 + a * 10, Y + 4 + b2 * (ph + 1), 8, ph, t2); r(X + 2 + a * 10, Y + 5 + b2 * (ph + 1), 8, ph - 1, t); }
        if (obl) r(X, Y + h - 1, T, 4, '#1d1b4b');
      } else {
        r(X, Y, T, h, t); grumos(X, Y, T, h);
        for (i = 6; i < T; i += 10) r(X + i, Y + 1, 1, h - 2, 'rgba(0,0,0,0.10)');
        if (c.tipo === 'cajon') { if (c.borde.n) { r(X, Y, T, 3, C.madera2); r(X, Y, T, 1, C.madera3); } if (c.borde.o) { r(X, Y, 3, h, C.madera); r(X, Y, 1, h, C.madera3); } if (c.borde.e) r(X + T - 3, Y, 3, h, C.madera2); if (c.borde.s) { var fa = obl ? 9 : 4; r(X, Y + h - 2, T, fa, C.madera); r(X, Y + h - 2, T, 1, C.madera3); r(X, Y + h + fa - 4, T, 2, C.madera2); if (obl) { r(X + 15, Y + h - 1, 1, fa - 1, C.madera2); r(X, Y + h + fa - 2, T, 2, 'rgba(0,0,0,0.2)'); } } }
        else { if (c.borde.n) r(X, Y, T, 1, t2); if (c.borde.s) r(X, Y + h - 1, T, 1, t2); if (c.borde.o) r(X, Y, 1, h, t2); if (c.borde.e) r(X + T - 1, Y, 1, h, t2); }
      }
      if (c.mulch) for (i = 0; i < 16; i++) { var mx = X + 2 + Math.floor(ruido(i, cx + cy * 9) * 26), my = Y + 3 + Math.floor(ruido(cy + i * 3, cx) * (h - 8)); r(mx, my, 4, 1, i % 2 ? C.paja : C.paja2); if (i % 4 === 0) r(mx + 1, my + 1, 3, 1, C.paja2); }
    });

    // compostera
    if (es.compostera) {
    var qc = G.celda(es.compostera), cp = es.compost, ch2 = G.obl ? 24 : 26, cyy = qc.y + qc.h - ch2 - 2;
    r(qc.x + 3, cyy, 26, ch2, C.madera2); r(qc.x + 5, cyy + 2, 22, ch2 - 3, '#2f1c10');
    var niv = Math.min(ch2 - 6, Math.round(cp.carga * 2.5) + cp.tandas * 5); r(qc.x + 5, cyy + ch2 - 1 - niv, 22, niv, '#6b4a2a'); for (i = 0; i < 5; i++) r(qc.x + 7 + i * 4, cyy + ch2 - niv + (i % 2), 2, 1, i % 2 ? '#8fb04a' : '#c9803a');
    for (i = 0; i < 4; i++) { r(qc.x + 3, cyy + 3 + i * 6, 26, 2, C.madera); r(qc.x + 3, cyy + 3 + i * 6, 26, 1, C.madera3); }
    r(qc.x + 3, cyy, 2, ch2, C.madera3); r(qc.x + 27, cyy, 2, ch2, C.madera2);
    for (i = 0; i < Math.min(5, cp.dosis); i++) { r(qc.x + 2 + i * 6, qc.y + qc.h - 5, 5, 4, '#3d2617'); r(qc.x + 3 + i * 6, qc.y + qc.h - 6, 3, 1, '#5e3a22'); }
    }
    // sombra del paredón: se alarga en invierno
    if (es.sombraPared > 0) { g.fillStyle = C.sombra; g.fillRect(0, G.muro, G.W, Math.round(es.sombraPared * G.TH)); }
  };

  // ── un cuadro: fondo cacheado + todo lo que se mueve ──
  RenderPixel.prototype._cuadro = function () {
    var es = this.escena, G = this.G, g = this.ctx, S = this.S, self = this, t = this.t, ahora = Date.now();
    g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.drawImage(this.bg, 0, 0); g.setTransform(S, 0, 0, S, 0, 0);
    var B = SP.pincel(g, 0, 0, 1), r = B.r, claves = Object.keys(es.celdas).filter(function (k) { return G.celda(k); });
    claves.sort(function (a, b) { return (+a.split(',')[1] - +b.split(',')[1]) || (+a.split(',')[0] - +b.split(',')[0]); });

    this._bruma = 0;
    if (G.cam === 'cerca') this._raices(g, es, G);
    claves.forEach(function (k) {
      var c = es.celdas[k], p = c.planta, q = G.celda(k);
      if (G.cam === 'cerca' && q.frente && !self._bruma && G.filas.length > 1) { self._bruma = 1; g.fillStyle = 'rgba(190,225,250,0.30)'; g.fillRect(0, 58, G.W, 80); }
      if (!p || self._oculta === k) return;
      var tw = self.tw[k], a = p.avance, esc = q.s, salto = 0;
      if (tw) { var u = (ahora - tw.t0) / tw.dur; if (u >= 1) delete self.tw[k]; else if (u > 0) { a = tw.de + (tw.a - tw.de) * easeBack(u); if (tw.brote && !tw.hecho) { tw.hecho = 1; self.efecto('brote', { celda: k }); } } else a = tw.de; }
      if (p.etapa === 'cosechable' && !p.flor) salto = Math.max(0, Math.sin(t * 0.5 + q.bx) - 0.8) * 8;
      var by = (G.cam !== 'cerca' && c.tipo === 'macetas' && G.obl) ? q.by - 1 : (c.tipo === 'macetas' && G.cam !== 'cerca') ? q.by - 9 : q.by;
      var chico = c.tipo === 'almaciguera' && G.cam !== 'cerca';
      var vista = { slug: p.slug, grupo: p.grupo, familia: p.familia, etapa: tw && tw.brote && a < 0.05 ? 'semilla' : p.etapa, avance: a, salud: p.salud, plaga: p.plaga, tutor: p.tutor, dulce: p.dulce };
      if (G.cam !== 'cerca' && p.etapa !== 'semilla') { g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(q.bx + 2, by, 4 + a * 7, 2 + a, 0, 0, 6.3); g.fill(); }
      var nn = p.etapa === 'semilla' ? 1 : Math.min(6, p.n || 1);
      if (nn > 1) { // varios plantines juntos: en la bandeja, uno por celdita; en tierra, un manojo apretado
        var enBandeja = c.tipo === 'almaciguera', paso = enBandeja ? (G.cam === 'cerca' ? 9 : 5) : 6 * esc, ee = enBandeja ? (G.cam === 'cerca' ? 1.4 : 0.7) : esc * 0.78, m = enBandeja ? nn : Math.min(4, nn);
        for (var ni = 0; ni < m; ni++) SP.planta(SP.pincel(g, q.bx + Math.round((ni - (m - 1) / 2) * paso), by - Math.round(salto) - (ni % 2 && !enBandeja ? 2 : 0), ee), vista, t, q.bx * 0.13 + ni * 1.7);
        self._txt(g, q.bx + Math.round(q.w / 2) - 9, (G.cam === 'cerca' ? by + 4 : q.y + 2), String(nn), C.blanco, 1); 
      } else SP.planta(SP.pincel(g, q.bx, by - Math.round(salto), chico ? 0.8 : esc), vista, t, q.bx * 0.13 + by * 0.07);
      if (p.etapa === 'cosechable' && !p.flor) { var yy = by - Math.round((8 + a * 22) * esc) - 6 + Math.round(Math.sin(t * 0.4 + q.bx) * 1.5); r(q.bx - 3, yy, 7, 7, C.anil); r(q.bx - 2, yy + 1, 5, 5, C.maiz); r(q.bx - 1, yy + 2, 1, 2, C.blanco); r(q.bx, yy + 7, 1, 2, C.anil); }
      // plantín en su punto: flecha verde (listo) o ladrillo (se está pasando)
      if (p.trasplante) { var ty = by - Math.round((chico ? 14 : 20) * (G.cam === 'cerca' ? 1.6 : 1)) + Math.round(Math.sin(t * 0.4 + q.bx) * 1.5), tc = p.trasplante === 'listo' ? '#3fc25a' : '#e0502f'; r(q.bx - 4, ty, 9, 9, C.anil); r(q.bx - 3, ty + 1, 7, 7, tc); r(q.bx, ty + 2, 1, 5, C.blanco); r(q.bx - 1, ty + 3, 3, 1, C.blanco); r(q.bx - 2, ty + 4, 5, 1, C.blanco); }
      // salud baja: barrita bajo la planta, para verla sin abrir la ficha
      if (p.salud < 60 && p.etapa !== 'semilla') { var sw2 = 12, sx = q.bx - 6, sy2 = by + 2; r(sx - 1, sy2 - 1, sw2 + 2, 4, C.anil); r(sx, sy2, sw2, 2, '#4a2030'); r(sx, sy2, Math.max(1, Math.round(sw2 * p.salud / 100)), 2, p.salud < 30 ? '#ff5a4a' : '#ffc233'); }
      if (p.plaga && G.cam !== 'cerca') { var py2 = by - Math.round((8 + a * 20) * esc) - 5; r(q.bx + 6, py2, 7, 7, '#e0502f'); r(q.bx + 9, py2 + 1, 1, 3, C.blanco); r(q.bx + 9, py2 + 5, 1, 1, C.blanco); }
      // abejas en las flores abiertas
      if (p.flor && p.etapa === 'cosechable') for (var bb = 0; bb < 2; bb++) { var ax = q.bx + Math.round(Math.sin(t * 0.37 + bb * 3 + q.bx) * 11 * esc), ay = by - Math.round(16 * esc) + Math.round(Math.cos(t * 0.53 + bb * 2) * 6 * esc); r(ax, ay, 3, 2, '#ffd23f'); r(ax + 1, ay, 1, 2, '#16161a'); r(ax + (Math.floor(t * 2) % 2), ay - 1, 2, 1, 'rgba(255,255,255,0.85)'); }
    });

    if (G.cam !== 'cerca') this._frente(g, es, G, t);

    // capas de información
    claves.forEach(function (k) {
      var c = es.celdas[k], q = G.celda(k), X = q.x, Y = G.cam === 'cerca' ? (q.frente ? q.by - 52 : q.by - 50) : q.y, w = q.w, h = G.cam === 'cerca' ? 54 : q.h;
      if (es.capa === 'sol') { g.fillStyle = 'rgba(255,' + Math.round(120 + c.sol * 12) + ',0,' + (0.18 + c.sol / 18) + ')'; g.fillRect(X, Y, w, h); self._txt(g, X + Math.round(w / 2) - (c.sol >= 9.5 ? 7 : 3), Y + Math.round(h / 2) - 4, String(Math.round(c.sol)), c.sol >= 6 ? C.anil : C.blanco, 2); }
      if (c.tinte) { g.fillStyle = C[c.tinte]; g.fillRect(X, Y, w, h); var ic = c.tinte === 'bien' ? '#0c5a1c' : c.tinte === 'mal' ? '#7a0c0c' : '#6a4a00'; if (c.tinte === 'mal') { B.linea(X + w / 2 - 3, Y + h / 2 - 3, X + w / 2 + 3, Y + h / 2 + 3, ic, 2); B.linea(X + w / 2 + 3, Y + h / 2 - 3, X + w / 2 - 3, Y + h / 2 + 3, ic, 2); } else if (c.tinte === 'bien') { B.linea(X + w / 2 - 4, Y + h / 2, X + w / 2 - 1, Y + h / 2 + 3, ic, 2); B.linea(X + w / 2 - 1, Y + h / 2 + 3, X + w / 2 + 5, Y + h / 2 - 3, ic, 2); } }
      if (c.seleccion) { var on = Math.floor(t) % 2 ? C.blanco : C.maiz, L = 7; [[X, Y, 1, 1], [X + w - 1, Y, -1, 1], [X, Y + h - 1, 1, -1], [X + w - 1, Y + h - 1, -1, -1]].forEach(function (e) { r(e[2] > 0 ? e[0] : e[0] - L + 1, e[1] - (e[3] > 0 ? 0 : 1), L, 2, on); r(e[0] - (e[2] > 0 ? 0 : 1), e[3] > 0 ? e[1] : e[1] - L + 1, 2, L, on); }); }
    });

    this._particulas(g, r);
    this._clima(g, r, es, G, t);
  };

  // árbol, microtúnel y mantas: van delante de las plantas
  RenderPixel.prototype._frente = function (g, es, G, t) {
    var B = SP.pincel(g, 0, 0, 1), r = B.r, self = this;
    es.arboles.forEach(function (ar) { self._arbol(g, es, G, t, ar); });
    es.tuneles.forEach(function (zt) {
      var ks = Object.keys(es.celdas).filter(function (k) { return es.celdas[k].zona === zt; }); if (!ks.length) return;
      var x0 = 1e9, x1 = -1, top = 1e9, bot = -1;
      ks.forEach(function (k) { var q = G.celda(k); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x + q.w); top = Math.min(top, q.y - (G.obl ? 20 : 4)); bot = Math.max(bot, q.y + q.h + (G.obl ? 4 : 2)); });
      var w = x1 - x0; g.fillStyle = 'rgba(255,255,255,0.34)'; g.fillRect(x0, top, w, bot - top);
      for (var u = 0; u <= w; u += T) r(Math.min(x1 - 2, x0 + u), top, 2, bot - top, C.blanco);
      r(x0, top, w, 2, C.blanco); for (u = 0; u < w; u += 9) r(x0 + u, top + 5 + (u % 4), 5, 1, 'rgba(255,255,255,0.6)');
    });
    Object.keys(es.celdas).forEach(function (k) { var c = es.celdas[k]; if (!es.mantas[c.zona]) return; var q = G.celda(k), yy = q.y - (G.obl ? 6 : 0); g.fillStyle = 'rgba(255,255,255,0.46)'; g.fillRect(q.x, yy, q.w, q.h + (G.obl ? 6 : 0)); for (var i = 0; i < 4; i++) r(q.x + 3 + i * 8, yy + 4 + (i % 2) * 8, 3, 1, 'rgba(255,255,255,0.9)'); });
  };

  RenderPixel.prototype._arbol = function (g, es, G, t, ar) {
    var B = SP.pincel(g, 0, 0, 1), r = B.r, q = G.celda(Math.floor(ar.x) + ',' + ar.base), ax = Math.round(q.x + (ar.x - Math.floor(ar.x)) * T), ay = q.y + q.h - 4, alto = G.obl ? 58 : 40, sw = Math.round(Math.sin(t * 0.3) * 1.5), conHojas = es.arbolConHojas || !ar.caduco;
    if (conHojas) { g.fillStyle = C.sombra; g.beginPath(); g.ellipse(ax - 22, ay + 2, 44, G.obl ? 20 : 34, 0, 0, 6.3); g.fill(); }
    r(ax - 4, ay - alto, 8, alto, C.tronco); r(ax - 4, ay - alto, 3, alto, C.tronco2); r(ax - 7, ay - 3, 14, 3, C.tronco); B.linea(ax, ay - alto + 8, ax - 16, ay - alto - 8, C.tronco, 3); B.linea(ax, ay - alto + 4, ax + 12, ay - alto - 12, C.tronco, 3);
    var cy = ay - alto - 4;
    if (conHojas) {
      [[0, 0, 28, C.copa3], [-12, -8, 20, C.copa], [10, -4, 18, C.copa], [-4, -16, 14, C.copa2], [12, -14, 10, C.copa2], [-16, 2, 10, C.copa2]].forEach(function (b, i) { B.disco(ax + b[0] + (i > 2 ? sw : 0), cy + b[1], b[2], b[3]); });
      for (var i = 0; i < 26; i++) { var lx = ax + Math.round(Math.sin(i * 2.4) * 22) + sw, ly = cy - 6 + Math.round(Math.cos(i * 1.3) * 18); r(lx, ly, 3, 2, i % 3 ? C.copa4 : C.copa3); if (es.estacion === 'otoño' && i % 2) r(lx + 1, ly + 3, 3, 2, i % 4 ? '#ffc233' : '#e0702f'); if (es.estacion === 'primavera' && i % 5 === 0) r(lx, ly, 2, 2, '#e0c8ff'); }
    } else for (var j = 0; j < 7; j++) { var bx = ax + Math.round(Math.sin(j * 1.9) * 18), byy = cy - 4 + Math.round(Math.cos(j * 2.3) * 12); B.linea(ax + (j % 2 ? 10 : -14), cy + 2, bx, byy, C.tronco, 2); B.linea(bx, byy, bx + (j % 2 ? 5 : -5), byy - 7, C.tronco2, 1); }
  };

  // ── cámara de cerca ──
  var PX_POR_CM = 1 / 0.75; // escala del corte de suelo
  RenderPixel.prototype._fondoCerca = function (g, es, G) {
    var B = SP.pincel(g, 0, 0, 1), r = B.r, cielo = CIELO[es.estacion] || CIELO.primavera, i, z = G.tipo, n = G.cols.length, x0 = G.x0, x1 = x0 + n * G.cw;
    r(0, 0, 256, 60, cielo[0]); r(0, 44, 256, 30, cielo[1]);
    var inv = (es.sombraPared - 0.35) / 1.9, sy = Math.round(14 + inv * 26); B.disco(206, sy, 9, '#fff3b0'); B.disco(206, sy, 7, '#ffd23f');
    [[30, 18], [120, 30]].forEach(function (q) { B.elipse(q[0], q[1], 16, 4, '#ffffff'); B.elipse(q[0] + 8, q[1] - 4, 9, 4, '#ffffff'); });
    if (z === 'suelo' || z === 'cajon') { r(0, 58, 256, 50, C.ladrillo); for (var f = 0; f < 9; f++) { r(0, 58 + f * 6 + 5, 256, 1, C.junta); for (var x = (f % 2) * 10; x < 256; x += 20) r(x, 58 + f * 6, 1, 5, C.junta); } r(0, 58, 256, 3, C.casa2); if (z === 'suelo') { g.fillStyle = C.sombra; g.fillRect(0, 61, 256, 47); } }
    else { r(0, 70, 256, 40, C.copa3); for (i = 0; i < 40; i++) B.disco(Math.floor(ruido(i, 3) * 256), 72 + Math.floor(ruido(i, 5) * 10), 5, i % 2 ? C.copa : C.copa2); }
    if (es.piso === 'baldosa') { r(0, 108, 256, 148, '#d9b779'); for (i = 0; i < 256; i += 32) r(i, 108, 1, 148, C.sendero2); for (i = 108; i < 256; i += 24) r(0, i, 256, 1, C.sendero2); }
    else { r(0, 108, 256, 148, C.pasto); for (i = 0; i < 90; i++) r(Math.floor(ruido(i, 1) * 256), 110 + Math.floor(ruido(i, 2) * 60), 1, 3, i % 2 ? C.pasto2 : C.pasto3); }
    if (z === 'suelo' && es.sombraPared > 1) { g.fillStyle = C.sombra; g.fillRect(0, 108, 256, Math.round(30 * (es.sombraPared - 1))); }

    var c0 = es.celdas[G.cols[0] + ',' + G.filas[G.filas.length - 1]], hum = c0.humedo, t = C.tierra[Math.min(3, hum)];
    if (z === 'macetas') { r(0, 172, 256, 84, '#d9b779'); for (i = 0; i < 256; i += 32) r(i, 172, 1, 84, C.sendero2); r(0, 172, 256, 2, C.sendero2); return; }
    if (z === 'almaciguera') { r(x0 - 8, 146, n * G.cw + 16, 8, C.madera); r(x0 - 8, 146, n * G.cw + 16, 2, C.madera3); r(x0 - 2, 154, 6, 102, C.madera2); r(x1 - 4, 154, 6, 102, C.madera2); r(0, 236, 256, 20, '#d9704a'); for (i = 0; i < 256; i += 32) r(i, 236, 1, 20, '#b85a38'); return; }
    // cama de tierra: cara de arriba (dos hileras) y corte al frente
    var xa = z === 'cajon' ? x0 - 6 : 0, xb = z === 'cajon' ? x1 + 6 : 256;
    r(xa, 114, xb - xa, 58, mez(t, '#000000', 0.12)); r(xa, 118, xb - xa, 54, t);
    for (i = 0; i < 120; i++) r(xa + Math.floor(ruido(i, 7) * (xb - xa - 3)), 119 + Math.floor(ruido(i, 9) * 50), 3, 1, i % 2 ? mez(t, '#000000', 0.2) : mez(t, '#ffffff', 0.12));
    r(xa, 138, xb - xa, 2, mez(t, '#000000', 0.25));
    this._perfil(g, es, G, xa, xb, 172, Math.round(es.cerca.hondo * PX_POR_CM), z);
  };
  // corte de suelo: materia orgánica arriba, humedad, lombrices, regla de profundidad
  RenderPixel.prototype._perfil = function (g, es, G, xa, xb, y0, prof, z) {
    var B = SP.pincel(g, 0, 0, 1), r = B.r, i;
    if (z === 'cajon' && es.piso === 'baldosa') { r(0, y0 + prof, 256, 256 - y0 - prof, '#c9a25f'); for (i = 0; i < 256; i += 32) r(i, y0 + prof, 1, 256 - y0 - prof, C.sendero2); r(0, y0 + prof, 256, 2, C.sendero2); }
    else if (z === 'cajon') { r(0, y0 + prof, 256, 256 - y0 - prof, '#6b4a30'); for (i = 0; i < 40; i++) r(Math.floor(ruido(i, 31) * 250), y0 + prof + 3 + Math.floor(ruido(i, 33) * 36), 4, 2, '#5a3c26'); r(0, y0 + prof, 256, 1, C.pasto3); }
    G.cols.forEach(function (cx, ci) {
      var c = es.celdas[cx + ',' + G.filas[G.filas.length - 1]], X = G.x0 + ci * G.cw, t = C.tierra[Math.min(3, c.humedo)], capa = Math.round(4 + c.mo / 100 * prof * 0.55), osc = mez(t, '#1e0f08', 0.55);
      r(X, y0, G.cw, prof, mez(t, '#c9a070', 0.35)); r(X, y0, G.cw, capa, osc);
      for (i = 0; i < 6; i++) r(X + i * 10, y0 + capa - 1 + (i % 2), 10, 2, osc);
      for (i = 0; i < 26; i++) { var px = X + Math.floor(ruido(i + cx, 11) * (G.cw - 3)), py = y0 + 2 + Math.floor(ruido(i, 13 + cx) * (prof - 4)); r(px, py, i % 4 ? 2 : 3, i % 3 ? 1 : 2, py < y0 + capa ? mez(osc, '#000000', 0.3) : mez(t, '#ffffff', 0.25)); }
      for (i = 0; i < c.humedo * 3; i++) { var wx = X + 4 + Math.floor(ruido(i, 17 + cx) * (G.cw - 8)), wy = y0 + 4 + Math.floor(ruido(i + cx, 19) * (prof - 8)); r(wx, wy, 2, 3, '#6fc0e8'); r(wx, wy, 1, 1, '#c8f0ff'); }
      if (c.mulch) for (i = 0; i < 12; i++) r(X + i * 5, y0 - 3 + (i % 2), 6, 2, i % 2 ? C.paja : C.paja2);
      r(X + G.cw - 1, y0, 1, prof, 'rgba(0,0,0,0.15)');
    });
    if (z === 'cajon') { r(xa, 112, 6, prof + 60, C.madera); r(xa, 112, 2, prof + 60, C.madera3); r(xb - 6, 112, 6, prof + 60, C.madera2); r(xa, y0 + prof - 2, xb - xa, 4, C.madera2); for (i = 0; i < 3; i++) r(xa, y0 + 10 + i * 14, 6, 1, C.madera2); }
    else { r(0, y0 + prof, 256, 256 - y0 - prof, '#a8794e'); for (i = 0; i < 30; i++) r(Math.floor(ruido(i, 41) * 250), y0 + prof + 1 + Math.floor(ruido(i, 43) * 5), 5, 2, '#c9a070'); }
    r(xa, y0, xb - xa, 2, 'rgba(0,0,0,0.3)');
    // regla: una marca cada 15 cm
    for (i = 1; i * 20 <= prof; i++) { r(xb - 12, y0 + i * 20, 12, 1, C.blanco); this._txt(g, xb - 12, y0 + i * 20 - 7, String(i * 15), C.blanco, 1); }
  };
  RenderPixel.prototype._raices = function (g, es, G) {
    var self = this, B0 = SP.pincel(g, 0, 0, 1), r = B0.r, t = this.t, z = G.tipo;
    G.cols.forEach(function (cx, ci) {
      G.filas.forEach(function (fy, fi) {
        var k = cx + ',' + fy, c = es.celdas[k]; if (!c) return; var q = G.celda(k), frente = q.frente;
        if (z === 'macetas') { // maceta en corte (frente) o entera (fondo)
          var m = c.maceta, prof = Math.round(m.prof / 0.75), R = Math.round(10 + m.litros * 0.75), top = q.by, tt = C.tierra[Math.min(3, c.humedo)], i;
          if (!frente) { for (i = 0; i < Math.round(prof * 0.6); i++) { var w0 = Math.round((R - i * 0.22) * 0.8); r(q.bx - w0, top + i, w0 * 2, 1, i < 3 ? C.terracota3 : C.terracota); r(q.bx + Math.round(w0 * 0.4), top + i, Math.round(w0 * 0.6), 1, C.terracota2); } B0.elipse(q.bx, top, Math.round(R * 0.8), 3, tt); return; }
          for (i = 0; i < prof; i++) { var w = Math.round(R - i * 0.18); r(q.bx - w, top + i, w * 2, 1, C.terracota2); r(q.bx - w + 3, top + i, w * 2 - 6, 1, i < 4 + c.mo / 100 * prof * 0.5 ? mez(tt, '#1e0f08', 0.55) : mez(tt, '#c9a070', 0.3)); r(q.bx - w, top + i, 1, 1, C.terracota3); }
          r(q.bx - Math.round(R - prof * 0.18), top + prof, Math.round(R - prof * 0.18) * 2, 3, C.terracota2); r(q.bx - R - 2, top - 3, R * 2 + 4, 4, C.terracota3); r(q.bx - R + 1, top - 1, R * 2 - 2, 2, tt);
          for (i = 0; i < c.humedo * 2; i++) r(q.bx - R + 8 + Math.floor(ruido(i, cx) * (R * 2 - 16)), top + 6 + Math.floor(ruido(i, fy) * (prof - 10)), 2, 3, '#6fc0e8');
          self._txt(g, q.bx - 8, top + prof + 6, m.litros + 'L', C.anil, 1);
          if (c.planta) { var inf = SP.raiz(SP.pincel(g, q.bx, top + 1, 2), c.planta, Math.floor((prof - 2) / 2)); if (inf.tope) { r(q.bx + R + 1, top + prof - 9, 7, 7, '#e0502f'); r(q.bx + R + 4, top + prof - 8, 1, 3, C.blanco); r(q.bx + R + 4, top + prof - 4, 1, 1, C.blanco); } }
          return;
        }
        if (z === 'almaciguera') { var X = q.x + 3, W = q.w - 6, t2 = C.tierra[Math.min(3, c.humedo)]; r(X, 134, W, 14, '#2a2869'); r(X, 134, W, 2, '#4a48a0'); r(X + 2, 136, W - 4, 11, mez(t2, '#1e0f08', 0.4)); if (c.planta) SP.raiz(SP.pincel(g, q.bx, 137, 1), c.planta, 9); return; }
        if (frente && c.planta) SP.raiz(SP.pincel(g, q.bx, 173, 2), c.planta, Math.floor(es.cerca.hondo * PX_POR_CM / 2) + (z === 'cajon' ? 14 : 0));
        if (frente && c.mo >= 58) { var lx = q.x + 12 + Math.round(Math.sin(t * 0.2 + cx) * 6), ly = 180 + (cx * 7) % 14; for (var j = 0; j < 7; j++) r(lx + j * 2, ly + Math.round(Math.sin(t * 0.6 + j * 0.9) * 1.5), 2, 2, j % 3 ? '#f08aa0' : '#d06a80'); }
      });
    });
    if (z === 'almaciguera') { for (var ci2 = 0; ci2 < G.cols.length; ci2++) r(G.x0 + ci2 * G.cw + 3, 134, 1, 14, '#4a48a0'); }
    if (G.masIzq) { r(2, 150, 6, 2, C.blanco); r(2, 148, 2, 6, C.blanco); } if (G.masDer) { r(248, 150, 6, 2, C.blanco); r(252, 148, 2, 6, C.blanco); }
    if (z === 'cajon' && es.tuneles.indexOf(G.zona) >= 0) { g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(128, 172, 126, 100, 0, 3.14, 6.29); g.fill(); g.strokeStyle = C.blanco; g.lineWidth = 2; g.beginPath(); g.ellipse(128, 172, 126, 100, 0, 3.14, 6.29); g.stroke(); }
    if (es.mantas[z]) { g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(G.x0 - 4, 96, G.cols.length * G.cw + 8, 76); }
  };
  // en 'cerca' las plantas de almaciguera y macetas apoyan en su contenedor
  var _celdaCerca = geometria;
  geometria = function (es) { var G = _celdaCerca(es); if (G.cam === 'cerca') { var f = G.celda; G.celda = function (k) { var q = f(k); if (!q) return q; if (G.tipo === 'almaciguera') { q.by = 137; q.s = 2; } if (G.tipo === 'macetas') { q.by = q.frente ? 168 : 126; } return q; }; } return G; };

  // ── efectos ──
  RenderPixel.prototype.efecto = function (tipo, d) {
    var G = this.G, self = this, es = this.escena; if (!G || !es) return;
    function P(x, y, vx, vy, vida, col, tam, gr, espera) { self.parts.push({ x: x, y: y, vx: vx, vy: vy, vida: vida, v0: vida, col: col, tam: tam || 1, g: gr == null ? 0.25 : gr, espera: espera || 0 }); }
    var q = d && d.celda ? G.celda(d.celda) : null, s = q ? q.s : 1, i;
    if (tipo === 'sembrar' && q) { for (i = 0; i < 6; i++) P(q.bx - 5 + i * 2, q.by - 30 * s, (i - 2.5) * 0.12, 0.6, 16, i % 2 ? '#f0d071' : '#fff1d0', s, 0.3, i * 2); for (i = 0; i < 12; i++) P(q.bx, q.by - 1, (ruido(i, 1) - 0.5) * 3.2, -1.2 - ruido(i, 2) * 2, 12, i % 2 ? '#7a4d2e' : '#b07a4e', s + 1, 0.35, 12); }
    else if (tipo === 'brote' && q) for (i = 0; i < 8; i++) P(q.bx, q.by - 4, Math.cos(i * 0.785) * 1.6, Math.sin(i * 0.785) * 1.6 - 0.8, 12, i % 2 ? '#86db5c' : '#fff6e0', s, 0.05);
    else if (tipo === 'cosechar' && q) { if (d.planta) this.vuelos.push({ p: d.planta, x: q.bx, y: q.by, x1: q.bx, y1: q.by - 60 * s, u: 0, dur: 14, s: s, fuera: true }); for (i = 0; i < 14; i++) P(q.bx, q.by - 10 * s, Math.cos(i * 0.45) * 2.4, Math.sin(i * 0.45) * 2.4 - 1, 16, i % 3 ? '#ffc233' : '#fff6e0', s + 1, 0.12, 3); for (i = 0; i < 6; i++) P(q.bx, q.by, (ruido(i, 5) - 0.5) * 3, -1.5, 10, '#7a4d2e', s + 1, 0.35); if (d.texto) this.textos.push({ x: q.bx, y: q.by - 18 * s, txt: d.texto, vida: 26, col: C.maiz }); }
    else if (tipo === 'trasplantar' && q) { var o = G.celda(d.de); if (o && d.planta) { this._oculta = d.celda; this.vuelos.push({ p: d.planta, x: o.bx, y: o.by, x1: q.bx, y1: q.by, u: 0, dur: 12, s: s, arco: 26, fin: function () { self._oculta = null; self.efecto('polvo', { celda: d.celda }); } }); } else this.efecto('polvo', d); }
    else if (tipo === 'polvo' && q) for (i = 0; i < 10; i++) P(q.bx, q.by, (ruido(i, 3) - 0.5) * 3.4, -0.8 - ruido(i, 4) * 1.4, 11, i % 2 ? '#7a4d2e' : '#b07a4e', s + 1, 0.3);
    else if (tipo === 'morir' && q) for (i = 0; i < 12; i++) P(q.bx + (ruido(i, 6) - 0.5) * 12, q.by - ruido(i, 7) * 18 * s, (ruido(i, 8) - 0.5) * 1.2, 0.5, 20, i % 2 ? '#c9a74a' : '#8a6a3a', s + 1, 0.04, i);
    else if (tipo === 'tratar' && q) for (i = 0; i < 16; i++) P(q.bx - 14, q.by - 20 * s, 1.2 + ruido(i, 9) * 1.6, (ruido(i, 10) - 0.4) * 1.8, 12, i % 2 ? '#c8f4ff' : '#ffffff', s, 0.08, i % 5);
    else if ((tipo === 'mulch' || tipo === 'compost') && q) for (i = 0; i < 16; i++) P(q.bx - 12 + ruido(i, 11) * 24, q.by - 26 * s - ruido(i, 12) * 8, 0, 1.2, 14, tipo === 'mulch' ? (i % 2 ? '#f0d071' : '#d9b04a') : (i % 2 ? '#3d2617' : '#6b4a2a'), s + 1, 0.25, i);
    else if (tipo === 'tutorar' && q) for (i = 0; i < 6; i++) P(q.bx + 7, q.by - 28 * s, (ruido(i, 13) - 0.5) * 2, -0.6, 10, '#d9b779', s, 0.2);
    else if (tipo === 'regar') Object.keys(es.celdas).forEach(function (k, j) { var c = es.celdas[k], qq = G.celda(k); if (!qq || c.zona !== d.zona) return; for (i = 0; i < 2 + d.nivel * 2; i++) P(qq.bx - 10 + ruido(i, j) * 20, qq.by - 28 * qq.s, -0.3, 2.2, 10, i % 2 ? '#7fd0f0' : '#c8f4ff', qq.s, 0.2, Math.floor(ruido(j, i) * 10)); });
    else if (tipo === 'logro') for (i = 0; i < 40; i++) P(ruido(i, 14) * G.W, -4, (ruido(i, 15) - 0.5) * 1.5, 1 + ruido(i, 16) * 1.5, 40, ['#ffc233', '#e0502f', '#1fc2b8', '#ff7aa8', '#3fc25a'][i % 5], 2, 0.03, Math.floor(ruido(i, 17) * 14));
  };
  RenderPixel.prototype._particulas = function (g, r) {
    var self = this;
    this.vuelos = this.vuelos.filter(function (v) { v.u++; var u = Math.min(1, v.u / v.dur), e = u * u * (3 - 2 * u), x = v.x + (v.x1 - v.x) * e, y = v.y + (v.y1 - v.y) * e - (v.arco ? Math.sin(u * 3.14) * v.arco : 0); g.globalAlpha = v.fuera ? 1 - u * u : 1; SP.planta(SP.pincel(g, x, y, v.s), v.p, 0, 0); g.globalAlpha = 1; if (u >= 1) { if (v.fin) v.fin(); return false; } return true; });
    this.parts = this.parts.filter(function (p) { if (p.espera > 0) { p.espera--; return true; } p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vida--; g.globalAlpha = Math.min(1, p.vida / (p.v0 * 0.4)); r(p.x, p.y, p.tam, p.tam, p.col); g.globalAlpha = 1; return p.vida > 0; });
    this.textos = this.textos.filter(function (t) { t.y -= 0.9; t.vida--; g.globalAlpha = Math.min(1, t.vida / 8); self._txt(g, Math.round(t.x - t.txt.length * 4), Math.round(t.y), t.txt, C.anil, 2, 1); self._txt(g, Math.round(t.x - t.txt.length * 4), Math.round(t.y) - 1, t.txt, t.col, 2); g.globalAlpha = 1; return t.vida > 0; });
  };
  RenderPixel.prototype._clima = function (g, r, es, G, t) {
    var W = G.W, H = G.H, i;
    if (es.compostera && es.compost.tandas > 0 && G.cam !== 'cerca') { var q = G.celda(es.compostera); for (i = 0; i < 3; i++) { var u = ((t * 0.12 + i * 0.33) % 1); g.globalAlpha = 0.5 * (1 - u); r(q.bx - 4 + i * 4 + Math.sin(t * 0.3 + i) * 2, q.y + q.h - 28 - u * 14, 3, 3, '#ffffff'); g.globalAlpha = 1; } }
    if (es.animar === 'lluvia') { g.fillStyle = 'rgba(40,60,140,0.16)'; g.fillRect(0, 0, W, H); for (i = 0; i < 70; i++) { var rx = (ruido(i, 1) * W + t * 5) % W, ry = (ruido(i, 2) * H + t * 34 + i * 9) % H; r(rx, ry, 1, 6, '#bfeaff'); r(rx + 1, ry + 5, 1, 2, '#7fc8f0'); if (i % 6 === 0) { var sx = ruido(i, 3) * W, sy2 = ruido(i, 4) * H, f = Math.floor(t + i) % 3; r(sx - f, sy2, 1, 1, '#dff6ff'); r(sx + f + 1, sy2, 1, 1, '#dff6ff'); r(sx, sy2 - f, 1, 1, '#dff6ff'); } } }
    if (es.animar === 'helada') { g.fillStyle = 'rgba(200,228,255,0.34)'; g.fillRect(0, 0, W, H); for (i = 0; i < 80; i++) { var hx = (ruido(i, 7) * W + Math.sin(t * 0.2 + i) * 6) % W, hy = (ruido(i, 9) * H + t * 3) % H; r(hx, hy, i % 3 ? 1 : 2, i % 3 ? 1 : 2, '#ffffff'); if (i % 9 === 0) { r(hx - 1, hy, 3, 1, '#ffffff'); r(hx, hy - 1, 1, 3, '#ffffff'); } } }
    if (es.animar === 'calor') { g.fillStyle = 'rgba(255,120,20,' + (0.13 + Math.sin(t * 0.5) * 0.05) + ')'; g.fillRect(0, 0, W, H); for (i = 0; i < 9; i++) { var cy2 = (i * 37 + t * 2) % H; g.fillStyle = 'rgba(255,230,160,0.16)'; g.fillRect(Math.sin(t * 0.4 + i) * 8, cy2, W, 2); } }
    var tinte = { invierno: 'rgba(60,90,200,0.09)', otoño: 'rgba(255,140,40,0.07)', verano: 'rgba(255,220,80,0.05)' }[es.estacion];
    if (tinte) { g.fillStyle = tinte; g.fillRect(0, 0, W, H); }
  };

  // letras de píxel 3×5 para números y signos
  var GLI = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111', '+': '000010111010000', '-': '000000111000000', '.': '000000000000010', ',': '000000000010100', 'L': '100100100100111', ' ': '000000000000000', 'h': '100100111101101' };
  RenderPixel.prototype._txt = function (g, x, y, s, col, k, dy) {
    k = k || 1; g.fillStyle = col;
    String(s).split('').forEach(function (ch, i) { var m = GLI[ch] || GLI[' ']; for (var j = 0; j < 15; j++) if (m[j] === '1') g.fillRect(x + i * 4 * k + (j % 3) * k, y + Math.floor(j / 3) * k + (dy || 0), k, k); });
  };


export { RenderPixel };
