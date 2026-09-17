// @ts-nocheck — arte portado tal cual del prototipo; se tipa en el paso 6 de los cimientos
/**
 * HUERTITA — ilustraciones pixel-art de las plantas (caja de 32 px).
 *
 * Capa de arte compartida: la usan el renderer del patio, la vista de cerca y la
 * tira de estadíos de las fichas. No sabe nada del motor: recibe una "planta de
 * escena" plana { slug, grupo, familia, etapa, avance, salud, plaga, tutor }.
 * Todo se dibuja con un pincel anclado en la base de la planta (0,0 = ras del
 * suelo, y negativo hacia arriba), así la misma planta sirve a cualquier escala.
 */
import { AZ, CANA, ESTILO, GR, MADERA, OS, PAJA, TIERRA, V, estiloDe } from './estilos';

  function mezcla(a, b, t) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), r = [16, 8, 0].map(function (s) { return Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); });
    return '#' + ((1 << 24) + (r[0] << 16) + (r[1] << 8) + r[2]).toString(16).slice(1);
  }
  /** Pincel: rectángulos, discos, elipses y líneas de píxel gordo, con origen y escala. */
  function pincel(g, ox, oy, s) {
    s = s || 1;
    function r(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(ox + x * s), Math.round(oy + y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))); }
    function elipse(cx, cy, rx, ry, c) { for (var y = -ry; y <= ry; y++) { var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01)))); if (ry === 0) w = rx; r(cx - w, cy + y, w * 2 + 1, 1, c); } }
    function disco(cx, cy, rad, c) { elipse(cx, cy, rad, rad, c); }
    function linea(x0, y0, x1, y1, c, gr) { var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (var i = 0; i <= n; i++) r(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), gr || 1, gr || 1, c); }
    return { r: r, elipse: elipse, disco: disco, linea: linea, s: s };
  }

  // ── piezas ──
  function hojaOval(B, x, y, rx, ry, pal, luzArriba) { B.elipse(x, y, rx, ry, pal.o); B.elipse(x, y - 1, Math.max(1, rx - 1), Math.max(1, ry - 1), pal.v); if (luzArriba !== false && rx > 1) B.r(x - Math.floor(rx / 2), y - ry + 1, Math.max(1, rx - 1), 1, pal.c); }
  function florcita(B, x, y, rad, c, centro, estrella) { if (estrella) { B.r(x - rad, y, rad * 2 + 1, 1, c); B.r(x, y - rad, 1, rad * 2 + 1, c); B.r(x - 1, y - 1, 3, 3, c); } else B.disco(x, y, rad, c); if (rad > 1) B.r(x, y, 1, 1, centro || '#ffd23f'); }

  var FORMAS = {
    roseta: function (B, a, e, pal, st) {
      var R = Math.round((3 + a * 10) * (e.alto ? 0.8 : 1)), H = Math.round((3 + a * (e.tipo === 'penca' ? 17 : e.tipo === 'pluma' ? 13 : 9)) * (e.alto || 1)), i, n;
      if (e.tipo === 'rizada') {
        B.elipse(0, -2, R, Math.max(2, Math.round(R * 0.45)), pal.oo);
        for (i = -2; i <= 2; i++) hojaOval(B, Math.round(i * R * 0.42) + st.dx(-H * 0.5), -Math.round(H * 0.45) + Math.abs(i), Math.max(2, Math.round(R * 0.5)), Math.max(2, Math.round(H * 0.5)), pal);
        B.elipse(st.dx(-H), -Math.round(H * 0.75), Math.max(1, Math.round(R * 0.4)), Math.max(1, Math.round(H * 0.3)), pal.c);
        for (i = -R + 1; i < R; i += 3) B.r(i + st.dx(-H), -Math.round(H * 0.6) - ((i + 40) % 2), 1, 1, pal.c);
      } else if (e.tipo === 'penca') {
        n = 2 + Math.round(a * 3);
        for (i = 0; i < n; i++) { var ang = (i - (n - 1) / 2) * 0.42, tx = Math.round(Math.sin(ang) * H * 0.9) + st.dx(-H), ty = -Math.round(Math.cos(ang) * H); B.linea(0, -1, Math.round(tx * 0.5), Math.round(ty * 0.55), e.tinta || pal.c, a > 0.5 ? 2 : 1); hojaOval(B, tx, ty + 2, Math.max(1, Math.round(2 + a * 2)), Math.max(2, Math.round(2 + a * 4)), pal); }
      } else if (e.tipo === 'lanza') {
        n = 3 + Math.round(a * 4);
        for (i = 0; i < n; i++) { var an = (i - (n - 1) / 2) * 0.5, x2 = Math.round(Math.sin(an) * R) + st.dx(-H), y2 = -Math.round(Math.cos(an) * H * 0.9) - 1; B.linea(0, -1, x2, y2, pal.o); hojaOval(B, x2, y2, Math.max(1, Math.round(1 + a * 2)), Math.max(1, Math.round(1 + a * 3)), pal); }
      } else { // pluma: tallitos finos con foliolos
        n = 4 + Math.round(a * 5);
        for (i = 0; i < n; i++) { var an2 = (i - (n - 1) / 2) * 0.36, x3 = Math.round(Math.sin(an2) * R * 0.9) + st.dx(-H), y3 = -Math.round(Math.cos(an2) * H); B.linea(0, -1, x3, y3, pal.o); for (var k = 0.45; k <= 1; k += 0.27) { var lx = Math.round(x3 * k), ly = Math.round(y3 * k); B.r(lx - 1, ly, 3, 2, i % 2 ? pal.v : pal.c); B.r(lx, ly - 1, 1, 1, pal.c); } }
      }
    },
    repollo: function (B, a, e, pal, st) {
      pal = e.pal || AZ; var R = Math.round(3 + a * 10), H = Math.round(3 + a * (e.rizado || e.tallo ? 20 : 10)), i;
      if (e.tallo || e.rizado) B.r(-1, -H + 2, 2, H - 2, pal.c);
      for (i = -2; i <= 2; i++) { if (!i && !e.rizado) continue; var yy = e.rizado || e.tallo ? -Math.round(H * (0.35 + 0.28 * (2 - Math.abs(i)))) : -Math.round(H * 0.35) - (2 - Math.abs(i)); hojaOval(B, Math.round(i * R * 0.45) + st.dx(yy), yy, Math.max(2, Math.round(R * 0.48)), Math.max(2, Math.round(R * 0.4)), pal); if (e.rizado) B.r(Math.round(i * R * 0.45) - 2 + st.dx(yy), yy - Math.round(R * 0.4), 5, 1, pal.c); }
      if (e.tallo && st.madura) for (i = 0; i < 4; i++) B.disco(i % 2 ? 2 : -2, -4 - i * 3, 1, e.cabeza);
      if (e.cabeza && !e.tallo && a > 0.55) { var rc = Math.max(2, Math.round(R * (st.madura ? 0.55 : 0.3))); B.disco(0, -Math.round(H * 0.55), rc, mezcla(e.cabeza, '#000000', 0.18)); B.disco(0, -Math.round(H * 0.55) - 1, rc - 1, e.cabeza); if (!e.lisa) for (i = -rc + 1; i < rc; i += 2) B.r(i, -Math.round(H * 0.55) - ((i + 20) % 3), 1, 1, mezcla(e.cabeza, '#ffffff', 0.4)); else B.linea(-1, -Math.round(H * 0.55) - rc + 1, 1, -Math.round(H * 0.55) + 1, mezcla(e.cabeza, '#3a9a3f', 0.4)); }
    },
    raiz: function (B, a, e, pal, st) {
      var H = Math.round(4 + a * 15), n = 3 + Math.round(a * 3), i;
      for (i = 0; i < n; i++) {
        var an = (i - (n - 1) / 2) * 0.4, x = Math.round(Math.sin(an) * H * 0.8) + st.dx(-H), y = -Math.round(Math.cos(an) * H);
        B.linea(0, -1, x, y, e.nervio || pal.o);
        if (e.tipo === 'pluma') for (var k = 0.4; k <= 1; k += 0.2) { B.r(Math.round(x * k) - 1, Math.round(y * k), 3, 1, pal.v); B.r(Math.round(x * k), Math.round(y * k) - 1, 1, 1, pal.c); }
        else hojaOval(B, x, y + 1, Math.max(1, Math.round(1 + a * 2)), Math.max(2, Math.round(2 + a * 3)), pal);
      }
      if (a > 0.55) { var w = Math.round(2 + (a - 0.5) * 6); B.elipse(0, 0, w, 2, mezcla(e.tinta, '#000000', 0.2)); B.elipse(0, -1, w - 1, 1, e.tinta); B.r(-w + 1, -2, 2, 1, mezcla(e.tinta, '#ffffff', 0.45)); }
    },
    varas: function (B, a, e, pal, st) {
      pal = AZ; var H = Math.round(4 + a * (e.fino ? 14 : 20)), n = e.fino ? 5 + Math.round(a * 5) : 3 + Math.round(a * 3), i;
      if (e.grueso && a > 0.4) B.r(-2, -Math.round(H * 0.4), 4, Math.round(H * 0.4), e.tinta);
      for (i = 0; i < n; i++) { var sp = (i - (n - 1) / 2), x1 = Math.round(sp * (e.fino ? 1.2 : 2.4)) + st.dx(-H) + Math.round(sp * a * 1.5), y1 = -H + Math.abs(Math.round(sp * 2)); B.linea(Math.round(sp * 0.6), -1, x1, y1, i % 2 ? pal.v : pal.c, e.fino || a < 0.5 ? 1 : 2); if (!e.fino && a > 0.6 && i % 2 === 0) B.linea(x1, y1, x1 + (sp < 0 ? -3 : 3), y1 + 4, pal.v); }
      if (e.bulbo && a > 0.6) { B.elipse(0, -1, 4, 3, mezcla(e.tinta, '#000000', 0.15)); B.elipse(0, -2, 3, 2, e.tinta); B.r(-2, -3, 2, 1, '#ffffff'); }
      if (e.fino && st.madura) for (i = -1; i <= 1; i++) B.disco(i * 4 + st.dx(-H), -H - 1 + Math.abs(i) * 2, 2, e.tinta);
    },
    mata: function (B, a, e, pal, st) {
      var H = Math.round(5 + a * 22), W = Math.round(3 + a * 8), i, y;
      if (st.tutor) { B.r(7, -30, 2, 30, MADERA); B.r(7, -30, 1, 30, CANA); }
      B.linea(0, 0, st.dx(-H), -H, pal.oo, a > 0.5 ? 2 : 1);
      for (i = 0, y = -4; y > -H; y -= 4, i++) { var lado = i % 2 ? 1 : -1, w = Math.round(W * (0.55 + 0.45 * Math.sin((-y / H) * 3.1))), x = lado * Math.round(w * 0.6) + st.dx(y); B.linea(st.dx(y), y, x, y - 1, pal.o); hojaOval(B, x, y - 2, Math.max(2, Math.round(w * 0.55)), Math.max(1, Math.round(1 + a * 2)), pal); if (st.tutor && i % 3 === 1) B.r(st.dx(y), y, 8, 1, PAJA); }
      hojaOval(B, st.dx(-H), -H - 1, Math.max(2, Math.round(W * 0.5)), 2, pal);
      if (a > 0.62 && !st.madura) for (i = 0; i < 3; i++) florcita(B, (i - 1) * 4 + st.dx(-H * 0.7), -Math.round(H * (0.55 + i * 0.13)), 1, e.florc || '#ffe34a', '#ffffff', true);
      if (st.madura && !e.sinfruto) [[-5, 0.35], [4, 0.5], [-2, 0.68], [6, 0.78]].forEach(function (q, j) {
        var fx = q[0] + st.dx(-H * q[1]), fy = -Math.round(H * q[1]), t = e.tinta, os = mezcla(t, '#000000', 0.25);
        if (e.fr === 'bola') { B.disco(fx, fy, 3, os); B.disco(fx, fy - 1, 2, t); B.r(fx - 1, fy - 2, 1, 1, '#ffffff'); B.r(fx, fy - 3, 1, 1, pal.o); }
        else if (e.fr === 'largo') { B.r(fx - 2, fy - 2, 4, 6, os); B.r(fx - 2, fy - 2, 3, 5, j % 2 ? t : '#d9482b'); B.r(fx - 1, fy - 3, 2, 1, pal.o); }
        else if (e.fr === 'fino') { B.linea(fx, fy - 2, fx + (j % 2 ? 1 : -1), fy + 4, t, 1); B.r(fx, fy - 3, 1, 1, pal.o); }
        else { B.elipse(fx, fy + 1, 2, 4, os); B.elipse(fx, fy, 2, 3, t); B.r(fx - 1, fy - 1, 1, 2, '#9a6ad0'); B.r(fx - 1, fy - 4, 3, 1, pal.o); }
      });
    },
    baja: function (B, a, e, pal, st) {
      var R = Math.round(3 + a * 9), i;
      for (i = -2; i <= 2; i++) { var x = Math.round(i * R * 0.45), y = -Math.round(2 + a * 5) + Math.abs(i); B.linea(0, -1, x, y, pal.o); B.disco(x - 1, y, Math.max(1, Math.round(1 + a * 1.5)), pal.v); B.disco(x + 1, y, Math.max(1, Math.round(1 + a * 1.5)), pal.o); B.disco(x, y - 1, Math.max(1, Math.round(1 + a * 1.5)), pal.c); }
      if (a > 0.6 && !st.madura) florcita(B, 3, -Math.round(3 + a * 6), 1, '#fff6e0', '#ffd23f', true);
      if (st.madura) [[-7, -2], [5, -1], [-1, -1], [9, -3]].forEach(function (q) { B.r(q[0] - 1, q[1] - 2, 3, 2, e.tinta); B.r(q[0], q[1], 1, 1, e.tinta); B.r(q[0] - 1, q[1] - 3, 3, 1, pal.o); B.r(q[0], q[1] - 2, 1, 1, '#ffd0a0'); });
    },
    rastrera: function (B, a, e, pal, st) {
      var R = Math.round(4 + a * 10), i, hc = e.hojac ? { v: e.hojac, c: mezcla(e.hojac, '#ffffff', 0.3), o: mezcla(e.hojac, '#000000', 0.3) } : pal;
      B.linea(-R, -2, R, -3, pal.oo);
      for (i = 0; i < 3 + Math.round(a * 3); i++) { var x = Math.round((i / (2 + a * 3) - 0.5) * 2 * R), y = -Math.round(3 + a * 6 * (0.6 + 0.4 * Math.sin(i * 2.1))) + (st.dx(-10) && i % 2 ? st.dx(-10) : 0), r2 = Math.max(2, Math.round(2 + a * 3)); B.linea(x, -2, x, y, pal.o); B.disco(x, y, r2, hc.o); B.disco(x, y - 1, r2 - 1, hc.v); B.r(x, y - 1, 1, r2, hc.c); B.r(x - r2 + 1, y - 1, r2, 1, hc.c); }
      if (a > 0.6) { florcita(B, R - 3, -Math.round(4 + a * 6), 2, '#ffd23f', '#f08a24', true); if (a > 0.8) B.linea(-R, -3, -R - 2, -8, pal.c); }
      if (st.madura && !e.sinfruto) { var t = e.tinta, os = mezcla(t, '#000000', 0.28); if (e.frl) { B.r(-9, -4, 10, 4, os); B.r(-9, -5, 10, 3, t); B.r(-8, -5, 7, 1, mezcla(t, '#ffffff', 0.35)); } else { var rr = e.frr; B.elipse(-5, -rr + 1, rr + 1, rr, os); B.elipse(-5, -rr, rr, rr - 1, t); if (e.raya) for (i = -rr + 1; i < rr; i += 2) B.r(-5 + i, -rr * 2 + 2, 1, rr * 2 - 3, e.raya); else { B.r(-5, -rr * 2 + 1, 1, rr * 2 - 2, os); B.r(-6 - Math.round(rr / 2), -rr - 1, 1, 2, mezcla(t, '#ffffff', 0.4)); } B.r(-5, -rr * 2, 2, 1, pal.o); } }
    },
    trepadora: function (B, a, e, pal, st) {
      pal = e.pal || pal; var H = Math.round(5 + a * (e.sincana ? 20 : 25)), y, i = 0;
      if (!e.sincana) { B.linea(-7, 0, 1, -31, CANA); B.linea(7, 0, -1, -31, MADERA); B.r(-2, -29, 4, 1, PAJA); }
      else B.r(-1, -H, 2, H, pal.o);
      for (y = -3; y > -H; y -= 3, i++) { var lado = i % 2 ? 1 : -1, x = e.sincana ? lado * 3 : Math.round(lado * 7 * (1 + y / 31)) + lado; x += st.dx(y); hojaOval(B, x + lado * 2, y, 2, 2, pal); if (!e.sincana) B.r(x, y, 1, 3, pal.o); if (a > 0.6 && !st.madura && i % 3 === 1) florcita(B, x - lado * 2, y - 1, 1, e.florc, '#1d1b4b'); if (st.madura && i % 2 === 1) { B.linea(x - lado * 2, y, x - lado * 2, y + 5, e.tinta); B.r(x - lado * 2 + 1, y + 1, 1, 3, mezcla(e.tinta, '#000000', 0.25)); } }
    },
    aromatica: function (B, a, e, pal, st) {
      var R = Math.round(3 + a * 9), H = Math.round(3 + a * (e.tipo === 'aguja' || e.tipo === 'arbolito' ? 22 : e.tipo === 'cojin' ? 7 : 14)), i, n;
      if (e.tipo === 'arbolito') { B.r(-1, -H, 2, H, MADERA); B.elipse(st.dx(-H), -H, Math.round(R * 0.8), Math.round(H * 0.45), pal.oo); B.elipse(st.dx(-H) - 1, -H - 1, Math.round(R * 0.65), Math.round(H * 0.38), pal.v); for (i = 0; i < 6; i++) B.r(Math.round(Math.sin(i * 2.4) * R * 0.5) + st.dx(-H), -H + Math.round(Math.cos(i * 1.7) * H * 0.3), 2, 1, pal.c); return; }
      if (e.tipo === 'aguja') { n = 3 + Math.round(a * 4); for (i = 0; i < n; i++) { var sx = (i - (n - 1) / 2) * 2.2, tx = Math.round(sx * 1.6) + st.dx(-H), ty = -H + Math.abs(Math.round(sx)); B.linea(Math.round(sx * 0.5), 0, tx, ty, MADERA); for (var k = 0.25; k <= 1; k += 0.15) { var px = Math.round(sx * 0.5 + (tx - sx * 0.5) * k), py = Math.round(ty * k); B.r(px - 2, py, 5, 1, k * 10 % 2 < 1 ? pal.v : pal.c); } if (st.madura && i % 2) B.r(tx, ty + 2, 2, 2, e.florc); } return; }
      B.elipse(0, -Math.round(H * 0.45), R, Math.max(2, Math.round(H * 0.5)), pal.oo);
      B.elipse(st.dx(-H * 0.5), -Math.round(H * 0.55), Math.max(2, R - 1), Math.max(2, Math.round(H * 0.45)), pal.v);
      n = 4 + Math.round(a * 8);
      for (i = 0; i < n; i++) { var lx = Math.round(Math.sin(i * 2.4) * R * 0.75) + st.dx(-H * 0.5), ly = -Math.round(H * 0.55 + Math.cos(i * 1.9) * H * 0.35); if (e.tipo === 'ancha') { B.r(lx - 1, ly, 3, 2, pal.c); B.r(lx, ly + 2, 1, 1, pal.o); } else B.r(lx, ly, 2, 1, pal.c); }
      if (e.tipo === 'espiga') for (i = -2; i <= 2; i++) { var ex = i * 4 + st.dx(-H - 6), eh = Math.round(a * 9); B.linea(i * 2, -H + 2, ex, -H - eh, pal.c); if (a > 0.7) B.r(ex - 1, -H - eh - 4, 2, 5, st.madura ? e.florc : pal.c); }
      else if (st.madura && e.florc) for (i = -1; i <= 1; i++) { var fx = i * Math.round(R * 0.55) + st.dx(-H); B.r(fx, -H - 3 + Math.abs(i), 1, 4, pal.c); B.r(fx - 1, -H - 4 + Math.abs(i), 3, 2, e.florc); }
    },
    alta: function (B, a, e, pal, st) {
      var H = Math.round(6 + a * 27), y, i = 0;
      B.linea(0, 0, st.dx(-H), -H, pal.o, 2); B.linea(1, 0, st.dx(-H) + 1, -H, pal.c, 1);
      for (y = -5; y > -H + 3; y -= 5, i++) { var lado = i % 2 ? 1 : -1, x0 = st.dx(y), L = Math.round(4 + a * 6); if (e.sol) hojaOval(B, x0 + lado * 5, y, 3, 3, pal); else { B.linea(x0, y, x0 + lado * L, y - 3, pal.v, 1); B.linea(x0 + lado * L, y - 3, x0 + lado * (L + 3), y + 2, pal.c, 1); B.linea(x0, y + 1, x0 + lado * (L - 1), y - 1, pal.o, 1); } }
      if (e.sol) { if (a > 0.7) { var cx = st.dx(-H), cy = -H - 2, rr = st.madura ? 6 : 3; if (st.madura) for (i = 0; i < 12; i++) B.r(cx + Math.round(Math.cos(i * 0.524) * 8) - 1, cy + Math.round(Math.sin(i * 0.524) * 8) - 1, 3, 3, i % 2 ? '#ffd23f' : '#ffb01f'); B.disco(cx, cy, rr, st.madura ? '#6b3a12' : pal.v); if (st.madura) { B.disco(cx, cy, 3, '#8a5526'); B.r(cx - 1, cy - 2, 2, 1, '#c98a3a'); } } }
      else { if (a > 0.7) for (i = -2; i <= 2; i++) B.linea(st.dx(-H), -H, st.dx(-H) + i * 2, -H - 5 + Math.abs(i), PAJA); if (st.madura) [[3, 0.45], [-4, 0.6]].forEach(function (q) { var ex = q[0] + st.dx(-H * q[1]), ey = -Math.round(H * q[1]); B.elipse(ex, ey, 2, 4, pal.c); B.elipse(ex, ey, 1, 3, e.tinta); B.r(ex, ey - 6, 1, 2, '#c9603a'); }); }
    },
    flor: function (B, a, e, pal, st) {
      pal = e.pal || pal; var H = Math.round((4 + a * 15) * (e.alto || 1)), n = e.n || 3, i;
      if (e.escudo) { for (i = -2; i <= 2; i++) { var lx = Math.round(i * (2 + a * 3)), ly = -Math.round(2 + a * 7 * (1 - Math.abs(i) * 0.25)); B.linea(0, -1, lx, ly, pal.c); B.disco(lx, ly, Math.max(1, Math.round(1 + a * 2)), pal.v); B.r(lx, ly, 1, 1, pal.c); } if (st.madura) [[-6, -9], [3, -11], [8, -5]].forEach(function (q) { florcita(B, q[0] + st.dx(q[1]), q[1], 2, e.tinta, e.centro); }); return; }
      for (i = 0; i < n; i++) {
        var sp = (i - (n - 1) / 2), tx = Math.round(sp * (3 + a * 3)) + st.dx(-H), ty = -H + Math.abs(Math.round(sp * 2)); B.linea(Math.round(sp), -1, tx, ty, pal.o);
        for (var k = 0.3; k < 0.85; k += 0.27) { var mx = Math.round(sp + (tx - sp) * k), my = Math.round(ty * k); if (e.pluma) { B.r(mx - 2, my, 5, 1, pal.v); B.r(mx - 1, my - 1, 3, 1, pal.c); } else hojaOval(B, mx + (i % 2 ? 2 : -2), my, 2, 1, pal, false); }
        if (st.madura) { if (e.pompon) { B.disco(tx, ty - 1, 3, mezcla(e.tinta, '#000000', 0.2)); B.disco(tx, ty - 2, 2, e.tinta); B.r(tx - 1, ty - 3, 2, 1, e.centro); } else if (e.estrella) { florcita(B, tx, ty + 1, 2, e.tinta, e.centro, true); } else { for (var q = 0; q < 8; q++) B.r(tx + Math.round(Math.cos(q * 0.785) * 3), ty - 1 + Math.round(Math.sin(q * 0.785) * 3), 2, 2, q % 2 ? e.tinta : mezcla(e.tinta, '#ffffff', 0.25)); B.disco(tx, ty - 1, 1, e.centro); } }
        else if (a > 0.6) B.disco(tx, ty, 1, pal.c);
      }
    }
  };

  /**
   * Dibuja una planta. B = pincel anclado en su base; t = tiempo (para el viento y los bichos).
   * p.escalaViva (0..1.2) permite animar el brote sin tocar el avance real.
   */
  function planta(B, p, t, fase) {
    t = t || 0; fase = fase || 0;
    var e = estiloDe(p), a = Math.max(0.1, Math.min(1, p.avance || 0)), salud = p.salud == null ? 100 : p.salud;
    var pal = e.pal || V;
    if (salud < 55) { var k = (55 - salud) / 55 * 0.75; pal = { v: mezcla(pal.v, '#c9a74a', k), c: mezcla(pal.c, '#e6cf6a', k), o: mezcla(pal.o, '#8a6a3a', k), oo: mezcla(pal.oo || pal.o, '#6b4a2a', k) }; }
    if (!pal.oo) pal.oo = pal.o;
    var viento = Math.sin(t * 0.55 + fase) * (0.6 + 0.4 * Math.sin(t * 0.13 + fase * 2));
    var st = { madura: p.etapa === 'cosechable', tutor: p.tutor, dx: function (y) { return Math.round(viento * Math.min(2.2, -y / 11)); } };

    if (p.etapa === 'semilla') { B.elipse(0, -1, 5, 2, TIERRA); B.elipse(0, -2, 4, 1, '#6b4326'); B.r(-2, -3, 1, 1, PAJA); B.r(1, -2, 1, 1, PAJA); B.r(3, -3, 1, 1, '#fff1d0'); return; }
    if (p.etapa === 'plantin') {
      var h = Math.round(3 + a * 7), x = st.dx(-h * 2); B.linea(0, 0, x, -h, pal.c, 1);
      B.elipse(x - 3, -h, 2, 1, pal.v); B.elipse(x + 3, -h - 1, 2, 1, pal.v); B.r(x - 3, -h - 1, 2, 1, pal.c); B.r(x + 2, -h - 2, 2, 1, pal.c);
      if (a > 0.55) { B.elipse(x - 1, -h - 3, 1, 2, pal.c); B.elipse(x + 2, -h - 4, 1, 2, pal.v); } return;
    }
    if (p.etapa === 'pasada' || p.etapa === 'semillando') {
      var sec = p.etapa === 'pasada', tallo = sec ? '#b89a4a' : pal.o, xx = st.dx(-26);
      B.elipse(0, -3, 7, 3, sec ? '#8a7a3a' : pal.oo); B.elipse(0, -4, 5, 2, sec ? '#b8a04a' : pal.v);
      B.linea(0, -3, xx, -27, tallo, 2);
      [[-5, -16], [5, -20], [-4, -24], [3, -12]].forEach(function (q) { B.linea(Math.round(xx * (-q[1] / 27)), q[1] + 3, q[0] + xx, q[1], tallo); B.disco(q[0] + xx, q[1] - 1, 2, sec ? '#f2e27a' : PAJA); B.r(q[0] + xx, q[1] - 2, 1, 1, sec ? '#fff6c0' : '#8a5526'); });
      B.disco(xx, -28, 2, sec ? '#f2e27a' : PAJA); return;
    }
    (FORMAS[e.f] || FORMAS.roseta)(B, a, e, pal, st);

    if (p.plaga) {
      var col = p.plaga === 'pulgon' ? '#16161a' : p.plaga === 'oruga' ? '#d6ff3a' : '#c58a5a', alto = Math.round(4 + a * 12);
      for (var b = 0; b < 5; b++) { var bx = Math.round(Math.sin(t * 0.4 + b * 1.7) * 5), by = -Math.round(2 + (b / 5) * alto); if (p.plaga === 'pulgon') B.r(bx, by, 1, 1, col); else if (p.plaga === 'oruga') { if (b < 2) { B.r(bx - 1, by, 4, 1, col); B.r(bx + (Math.floor(t) % 2), by - 1, 2, 1, col); } } else if (b < 2) { B.r(bx * 2 - 2, -1, 5, 2, col); B.r(bx * 2 + 2, -3, 1, 2, '#e0b080'); } }
    }
    if (p.dulce) { B.r(-8, -Math.round(6 + a * 10), 1, 1, '#ffffff'); B.r(6, -Math.round(4 + a * 8), 1, 1, '#d6f0ff'); B.r(0, -Math.round(8 + a * 12), 1, 1, '#ffffff'); }
  }

  /** Lo que pasa bajo tierra, para la vista de cerca. B anclado al ras del suelo; prof = px de tierra disponibles. */
  function raiz(B, p, prof) {
    var e = estiloDe(p), a = Math.max(0.1, Math.min(1, p.avance || 0)), c = '#e9d2a8', c2 = '#c9a878', i;
    if (p.etapa === 'semilla') { B.r(-1, 3, 2, 2, PAJA); return { pide: 0 }; }
    var pide = e.f === 'raiz' ? (e.largo ? 30 : 16) : e.f === 'mata' || e.f === 'alta' || e.f === 'rastrera' ? 34 : e.f === 'trepadora' || e.f === 'repollo' ? 26 : e.f === 'aromatica' ? 24 : 14;
    var d = Math.min(prof - 2, Math.round(pide * (0.25 + 0.75 * a))), tope = pide * (0.25 + 0.75 * a) > prof - 2;
    if (e.f === 'raiz' && a > 0.3) {
      var t = e.tinta, w = Math.round(2 + a * (e.largo ? 3 : 3.5)), L = Math.min(prof - 3, Math.round((e.largo ? 6 + a * 22 : 3 + a * 6)));
      if (e.largo) for (i = 0; i < L; i++) { var ww = Math.max(1, Math.round(w * (1 - i / L * 0.85))); B.r(-ww, i, ww * 2, 1, i % 5 === 4 ? mezcla(t, '#000000', 0.18) : t); B.r(-ww, i, 1, 1, mezcla(t, '#ffffff', 0.35)); }
      else { B.elipse(0, Math.round(L / 2), w, Math.round(L / 2), mezcla(t, '#000000', 0.2)); B.elipse(-1, Math.round(L / 2) - 1, w - 1, Math.round(L / 2) - 1, t); B.r(-w + 2, 2, 2, 2, mezcla(t, '#ffffff', 0.45)); }
      B.linea(0, L, 0, Math.min(prof - 1, L + 6), c2); for (i = 0; i < 4; i++) B.linea(i % 2 ? w : -w, 3 + i * 2, (i % 2 ? w + 4 : -w - 4), 5 + i * 3, c2);
      return { pide: pide, tope: tope };
    }
    B.linea(0, 0, 0, d, c);
    for (i = 1; i <= 5; i++) { var y = Math.round(d * i / 6), s = i % 2 ? 1 : -1, l = Math.round((3 + a * 9) * (1 - i / 8)); B.linea(0, y, s * l, Math.min(prof - 1, y + Math.round(l * 0.7)), i % 3 ? c : c2); B.linea(0, y + 1, -s * Math.round(l * 0.6), Math.min(prof - 1, y + 3 + Math.round(l * 0.4)), c2); }
    if (tope) B.linea(-7, prof - 2, 7, prof - 2, c); // la raíz topa y se enrula contra el fondo
    if (e.tuber && a > 0.6) [[-7, 8], [5, 11], [-2, 15], [9, 6]].forEach(function (q) { if (q[1] + 3 < prof) { B.elipse(q[0], q[1], 3, 2, mezcla(e.tuber, '#000000', 0.2)); B.elipse(q[0], q[1] - 1, 2, 1, e.tuber); } });
    if (e.bulbo && a > 0.6) { B.elipse(0, 3, 4, 3, e.tinta); B.r(-2, 1, 2, 1, '#ffffff'); }
    return { pide: pide, tope: tope };
  }

  /** Tira de estadíos para la ficha: semilla → plantín → creciendo → cosecha/flor → semilla. */
  var ETAPAS = [['semilla', 0, 'semilla'], ['plantin', 0.8, 'plantín'], ['creciendo', 0.45, 'crece'], ['creciendo', 0.8, 'florece'], ['cosechable', 1, 'cosecha'], ['semillando', 1, 'da semilla']];
  function tira(cv, esp, opciones) {
    opciones = opciones || {};
    var S = opciones.escala || 2, ancho = 36, alto = 50, n = ETAPAS.length, dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = ancho * n * S * dpr; cv.height = alto * S * dpr; cv.style.width = '100%'; cv.style.maxWidth = (ancho * n * S) + 'px'; cv.style.aspectRatio = (ancho * n) + ' / ' + alto;
    var g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(S * dpr, 0, 0, S * dpr, 0, 0);
    g.fillStyle = '#9fd8f0'; g.fillRect(0, 0, ancho * n, alto); g.fillStyle = '#c6ecf8'; g.fillRect(0, 22, ancho * n, 16);
    g.fillStyle = '#7a4a2c'; g.fillRect(0, 38, ancho * n, 12); g.fillStyle = '#5e3a22'; g.fillRect(0, 38, ancho * n, 2);
    for (var k = 0; k < ancho * n; k += 7) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(k + (k % 3), 42 + (k % 5), 2, 1); }
    ETAPAS.forEach(function (et, i) {
      var actual = opciones.actual === i, x = i * ancho + ancho / 2;
      if (actual) { g.fillStyle = 'rgba(255,194,51,0.45)'; g.fillRect(i * ancho, 0, ancho, 38); }
      if (i) { g.fillStyle = 'rgba(29,27,75,0.35)'; g.fillRect(i * ancho - 3, 30, 2, 1); g.fillRect(i * ancho - 2, 29, 1, 3); g.fillRect(i * ancho - 6, 30, 3, 1); }
      var p = { slug: esp.slug, grupo: esp.grupo, familia: esp.familia, etapa: et[0], avance: et[1], salud: 100, tutor: et[1] >= 0.8 && esp.tutor };
      if (et[0] === 'semilla') { var Bs = pincel(g, x, 39, 1); Bs.r(-2, 4, 1, 1, '#f0d071'); Bs.r(1, 5, 1, 1, '#f0d071'); Bs.r(3, 3, 1, 1, '#fff1d0'); Bs.elipse(0, 0, 5, 1, '#5e3a22'); }
      else planta(pincel(g, x, 39, 1), p, opciones.t || 0, i);
    });
    return ETAPAS.map(function (e) { return e[2]; });
  }
  /** A qué columna de la tira corresponde una planta viva. */
  function etapaDeTira(p) { return p.etapa === 'semilla' ? 0 : p.etapa === 'plantin' ? 1 : p.etapa === 'cosechable' ? 4 : p.etapa === 'semillando' || p.etapa === 'pasada' ? 5 : p.avance < 0.62 ? 2 : 3; }


export { pincel, planta, raiz, tira, etapaDeTira, mezcla, estiloDe, ETAPAS, ESTILO };
