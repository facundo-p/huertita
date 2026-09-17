// @ts-nocheck — renderer portado tal cual del prototipo
/**
 * HUERTITA — renderer de texto (grilla de emojis en DOM).
 * Existe para demostrar que la gráfica es intercambiable: cumple el mismo
 * contrato que render-pixel.js (montar, dibujar, alTocar, desmontar) y no
 * comparte una línea con él. Un renderer isométrico o 3D entra por la misma puerta.
 */
  var FONDO = { P: '🧱', H: '🏠', T: '🌳', C: '♻️', '.': '', ':': '' };
  var ETAPA = { semilla: '·', plantin: '🌱', pasada: '🥀', semillando: '🌾' };
  function RenderTexto() { this.cb = null; }
  RenderTexto.prototype.nombre = 'Texto';
  RenderTexto.prototype.montar = function (el) { this.el = el; this.grid = document.createElement('div'); this.grid.className = 'hz-texto'; el.appendChild(this.grid); };
  RenderTexto.prototype.desmontar = function () { if (this.grid.parentNode) this.grid.parentNode.removeChild(this.grid); };
  RenderTexto.prototype.alTocar = function (cb) { this.cb = cb; };
  RenderTexto.prototype.dibujar = function (es) {
    var self = this; this.grid.style.gridTemplateColumns = 'repeat(' + es.ancho + ', 1fr)'; this.grid.innerHTML = '';
    for (var y = 0; y < es.alto; y++) for (var x = 0; x < es.ancho; x++) {
      var k = x + ',' + y, c = es.celdas[k], b = document.createElement(c ? 'button' : 'div');
      b.className = 'hz-tcelda' + (c ? ' z-' + c.tipo : '') + (c && c.tinte ? ' t-' + c.tinte : '') + (c && c.seleccion ? ' sel' : '');
      if (!c) b.textContent = (FONDO[es.plano[y][x]] || '') === '🌳' && !es.arbolConHojas ? '🪾' : (FONDO[es.plano[y][x]] || '');
      else {
        var p = c.planta, t = '';
        if (p) t = ETAPA[p.etapa] || (p.avance < 0.5 ? '🌿' : p.emoji);
        if (es.capa === 'sol') t = Math.round(c.sol) + 'h';
        b.textContent = t;
        b.title = c.nombreZona + (p ? ' · ' + p.nombre + ' · ' + p.etapa : '');
        if (p && p.etapa === 'cosechable') b.className += ' lista';
        if (p && p.plaga) b.className += ' plaga';
        if (p && p.trasplante) { t = '⤴' + t; b.textContent = t; }
        if (p && p.salud < 60 && p.etapa !== 'semilla') b.className += ' floja';
        (function (k) { b.addEventListener('click', function () { if (self.cb) self.cb(k); }); })(k);
      }
      this.grid.appendChild(b);
    }
  };

export { RenderTexto };
