---
name: mapa-de-pendientes
description: Ordena los pendientes de un proyecto (Issues de GitHub, TODO, backlog, ideas sueltas) en un cuadro de dos ejes, costo de implementación contra mejora del producto, con cuadrantes Rabanitos, Zapallos, Aromáticas y Yuyos, y lo entrega como página web interactiva. Usar cuando pidan priorizar, "mapa de ideas", "cuadro costo/impacto", "qué hago primero" o "organizame los issues".
---

# Mapa de pendientes

Convierte una lista de pendientes en una decisión: qué se hace ya, qué se planifica, qué se intercala y qué se deja. El entregable es una página visual interactiva, no un texto largo. La respuesta en el chat son pocas líneas.

## 1. Juntar los pendientes

Usar lo que la persona indique. Si no indica nada, buscar en este orden y combinar:

1. Issues de GitHub abiertos: `gh issue list --state open --limit 200 --json number,title,body,labels,milestone,url,updatedAt`. Si `gh` no está o no tiene acceso, usar el conector de GitHub si existe, o el navegador. Si nada de eso alcanza, pedir que peguen la lista. No insistir con métodos alternativos ante un rechazo de permisos.
2. Archivos de pendientes del repo: `TODO.md`, `ROADMAP.md`, `BACKLOG.md`, `docs/` con nombres parecidos, secciones "Pendiente" o "Próximos pasos" de README, CHANGELOG y CLAUDE.md.
3. `TODO`, `FIXME` y `HACK` en el código (agrupar por tema, no un punto por comentario).
4. Documentos del proyecto de Claude o de la conversación actual.

Después: unir duplicados, partir lo que sea en realidad varias cosas, y agrupar menudencias parecidas en un solo punto. Apuntar a entre 8 y 40 puntos; con más, el cuadro deja de leerse. Conservar el número del issue como `n` y su `url`. Lo que no tenga número recibe uno correlativo a partir de 900 para no chocar.

Si además se van a proponer ideas propias, van en el mismo cuadro con un grupo aparte ("idea de Claude"), nunca mezcladas sin marcar.

## 2. Entender contra qué se mide el impacto

El eje vertical es cuánto mejora el producto **para su objetivo**. Leer README, CLAUDE.md y documentos del proyecto para encontrar ese objetivo en palabras de su dueño. Si no está escrito en ningún lado, hacer una sola pregunta; si no hay quien conteste, inferirlo y dejarlo dicho en la `nota` de la página.

## 3. Puntuar

Dos números de 1 a 10 por punto, con medios para desempatar.

**Costo de implementación (eje horizontal)**

| Valor | Significa |
|---|---|
| 1–2 | Un rato. Cambio local, sin riesgo. |
| 3–4 | Uno o dos días. Toca pocas piezas conocidas. |
| 5–6 | Alrededor de una semana, o toca varias capas. |
| 7–8 | Varias semanas, toca el corazón del sistema o pide rebalancear o migrar. |
| 9–10 | Un mes o más, infraestructura nueva, o incógnitas sin investigar. |

Suben el costo: migración de datos, falta de tests en la zona, dependencia de terceros, necesidad de contenido o arte, investigación previa. Leer el código que toca antes de estimar; no estimar por el título.

**Mejora del producto (eje vertical)**

| Valor | Significa |
|---|---|
| 1–2 | Casi nadie lo notaría. |
| 3–4 | Agradable, no cambia para qué sirve el producto. |
| 5–6 | Mejora clara para parte de la gente o parte del uso. |
| 7–8 | Se nota en el uso de todos los días, o destraba varias otras cosas. |
| 9–10 | Cambia lo que el producto es capaz de hacer, o evita perder datos, usuarios o confianza. |

Para bugs: impacto = gravedad por frecuencia. Para deuda técnica: el impacto es lo que abarata o lo que evita, y se dice así en el texto. Nada de inflar.

**Reglas**

- Cada punto lleva un `por` de una a tres oraciones que justifica las dos notas con hechos del proyecto. Sin eso el número no vale.
- Si A abarata a B, anotarlo en `dep` de B y estimar el costo de B suponiendo A hecho; decirlo en la `nota`.
- Marcar `duda: true` cuando la estimación es floja (no se pudo leer el código, requisito ambiguo, incógnita técnica).
- Son estimaciones. Decirlo en la página, y si la persona corrige una nota, cambiarla y republicar sin discutir el decimal.
- El corte entre cuadrantes es 5,5 en ambos ejes. No mover el corte para que la distribución quede pareja: si todo es zapallo, esa es la noticia.

## 4. Los cuadrantes

| Cuadrante | Costo | Impacto | Qué se hace |
|---|---|---|---|
| **Rabanitos** | bajo | alto | Cuestan poco y rinden mucho. Se hacen ya, en tanda. |
| **Zapallos** | alto | alto | Tardan y ocupan lugar, pero llenan la mesa. Se planifican de a uno. |
| **Aromáticas** | bajo | bajo | Fáciles, dan sabor, no llenan la olla. Se intercalan cuando hay un hueco. |
| **Yuyos** | alto | bajo | Consumen recursos y dan poco. Se dejan, por ahora. |

Estos nombres son los de siempre y sirven para hablar ("eso es un rabanito"). Cambiarlos por otros del mundo del proyecto solo si la persona lo pide, manteniendo los cuatro significados.

## 5. El orden sugerido

1. Primero lo que destraba o abarata a otros, aunque solo no luzca (paso de clase `base`).
2. Tanda de rabanitos, de mayor a menor diferencia entre impacto y costo.
3. Zapallos de a uno, empezando por el que condiciona a los demás.
4. Aromáticas cuando haya un hueco.
5. Yuyos: no se hacen. Si alguno tiene un atajo barato que rescata casi todo el valor, proponerlo como punto nuevo.

Cada paso tiene que terminar con el producto andando.

## 6. Armar la página

Partir de la plantilla de abajo y **editar solo el objeto `DATOS`**. La plantilla ya resuelve: cuadro SVG con los cuatro cuadrantes, puntos que se separan sin salirse de su cuadrante, filtros por cuadrante, grupo, pendientes y estimación floja, panel de detalle con enlace al original y dependencias, lista por cuadrante ordenada por conveniencia, tarjetas de cuadrantes, orden sugerido, sección libre opcional, tema claro y oscuro, teclado y celular.

`grupos` colorea los puntos (hasta cuatro). Elegir el corte que más le sirva a quien decide: tipo (bug, mejora, deuda), origen (tuya, mía), área o milestone.

**Estética.** Por defecto, la de la plantilla (añil, maíz, ladrillo, acequia, hoja; Pixelify Sans y Atkinson Hyperlegible). Adaptarla al proyecto solo si es barato: si en una o dos búsquedas aparecen sus tokens (variables CSS, `tailwind.config`, archivo de tema, guía de marca), reemplazar los valores del bloque `:root` y sus dos variantes clara y oscura, y las dos fuentes si están en Google Fonts. Nada más se toca. Verificar contraste del número sobre el punto (`--sobre-color` contra `--g1`…`--g4`) y que los cuatro colores de cuadrante se distingan entre sí. Si no aparecen tokens enseguida, queda la estética por defecto. Nunca una paleta desaturada o genérica.

**Textos.** En el idioma de la persona; en castellano, rioplatense de vos. Tono sobrio, sin festejo. Títulos de punto cortos y concretos.

## 7. Publicar y contestar

- Con herramienta Artifact disponible: cargar primero el skill `artifact-design`, guardar la página como fragmento (sin doctype, html, head ni body, tal como está la plantilla) y publicarla. Es una página que se vuelve a abrir: se persiste. Al actualizarla, republicar en la misma URL.
- Sin Artifact (por ejemplo en Claude Code): envolver la plantilla en un documento HTML completo con `<meta charset>` y `<meta name="viewport">`, guardarla en `docs/mapa-pendientes.html` del repo y abrirla o indicar la ruta.
- Antes de entregar: abrir la página en un navegador si hay uno a mano y comprobar que no hay errores de consola, que ningún punto quedó fuera de su cuadrante y que en 390 px de ancho no hay scroll horizontal.
- En el chat, cinco líneas como mucho: cuántos puntos y de dónde salieron, los dos o tres rabanitos para arrancar, el primer zapallo y por qué ese, y qué estimaciones son flojas. No repetir la página en texto.
- Si el proyecto tiene memoria o documento de estado, anotar ahí la URL o la ruta del mapa.

## 8. Mantenerlo

Cuando se cierra un punto: `hecho: 'v1.2'` (o la fecha) y republicar; queda tachado y con su color propio, que sirve para ver el avance. Al volver a correr el skill sobre el mismo proyecto, leer primero el mapa anterior, conservar números y notas que no cambiaron, y sumar lo nuevo. Escribir etiquetas de cuadrante en los issues de GitHub solo si la persona lo pide de forma explícita.

## Plantilla

```html
<title>Mapa de pendientes</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;600&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<style>
/* RE-ESTILAR = cambiar solo este bloque de tokens (y las dos fuentes). Nada más abajo lleva colores fijos. */
:root{--fondo:#1d1b4b;--fondo-2:#2a2869;--fondo-3:#3b3a8a;--sombra:#0e0d2e;--texto:#fff1d0;--texto-2:#cfc6e8;--titulo:#ffc233;--titulo-sombra:#e0502f;
  --q-rab:#3fc25a;--q-zap:#ffc233;--q-aro:#1fc2b8;--q-yuy:#8a88c8;--g1:#ffc233;--g2:#1fc2b8;--g3:#ff7aa8;--g4:#e0502f;--hecho:#fff1d0;--sobre-color:#1d1b4b;
  --f-titulo:'Pixelify Sans','Courier New',monospace;--f-texto:'Atkinson Hyperlegible','Trebuchet MS',Verdana,sans-serif}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--fondo:#fff4dc;--fondo-2:#ffe6b3;--fondo-3:#e9c987;--sombra:#d9b56a;--texto:#1d1b4b;--texto-2:#4a4880;--titulo:#c2361a;--titulo-sombra:#ffc233;--q-rab:#1f8f3a;--q-zap:#c98a00;--q-aro:#0f8f88;--q-yuy:#6a68a8;--g1:#e9a400;--g2:#12a59c;--g3:#e0457c;--g4:#d0452a;--hecho:#1d1b4b;--sobre-color:#fff4dc}}
:root[data-theme="light"]{--fondo:#fff4dc;--fondo-2:#ffe6b3;--fondo-3:#e9c987;--sombra:#d9b56a;--texto:#1d1b4b;--texto-2:#4a4880;--titulo:#c2361a;--titulo-sombra:#ffc233;--q-rab:#1f8f3a;--q-zap:#c98a00;--q-aro:#0f8f88;--q-yuy:#6a68a8;--g1:#e9a400;--g2:#12a59c;--g3:#e0457c;--g4:#d0452a;--hecho:#1d1b4b;--sobre-color:#fff4dc}
*{box-sizing:border-box}
body{background:var(--fondo);color:var(--texto);font-family:var(--f-texto);font-size:16px;line-height:1.5;margin:0}
.pg{max-width:1080px;margin:0 auto;padding:20px 16px 60px;display:flex;flex-direction:column;gap:34px}
h1{font-family:var(--f-titulo);font-size:clamp(30px,6vw,46px);line-height:1;margin:0;color:var(--titulo);text-shadow:3px 3px 0 var(--titulo-sombra);text-wrap:balance}
h2{font-family:var(--f-titulo);font-size:26px;margin:0 0 4px;color:var(--titulo);font-weight:600}
h3{font-family:var(--f-titulo);font-size:18px;margin:0;font-weight:400}
p{margin:6px 0;max-width:68ch}.dim{color:var(--texto-2);font-size:14px}header p{font-size:18px}
a{color:var(--q-aro)}
nav{display:flex;flex-wrap:wrap;gap:6px;position:sticky;top:0;z-index:5;background:var(--fondo);padding-block:8px}
nav a{font-family:var(--f-titulo);color:var(--texto);text-decoration:none;background:var(--fondo-2);padding:6px 10px;box-shadow:3px 3px 0 var(--sombra);font-size:15px}
nav a:hover,nav a:focus-visible{background:var(--q-aro);color:var(--sobre-color);outline:none}
button{font:inherit;color:inherit;cursor:pointer}button:focus-visible{outline:3px solid var(--titulo);outline-offset:2px}
.mapa{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:20px;align-items:start}
@media (max-width:820px){.mapa{grid-template-columns:minmax(0,1fr)}}
.lienzo{background:var(--fondo-2);box-shadow:6px 6px 0 var(--sombra);padding:8px}.lienzo svg{display:block;width:100%;height:auto}
.zona{opacity:.16}.zona.yuy{opacity:.3}.zona.rab,.qn.rab{fill:var(--q-rab)}.zona.zap,.qn.zap{fill:var(--q-zap)}.zona.aro,.qn.aro{fill:var(--q-aro)}.zona.yuy,.qn.yuy{fill:var(--q-yuy)}
.cruz{stroke:var(--fondo-3);stroke-width:2;stroke-dasharray:4 4}
.qn{font-family:var(--f-titulo);font-size:17px;font-weight:600;text-transform:uppercase}.qs{font-family:var(--f-texto);font-size:10.5px;fill:var(--texto-2)}
.eje{font-family:var(--f-titulo);font-size:12px;fill:var(--texto-2);letter-spacing:1px;text-transform:uppercase}
.punto{cursor:pointer}.punto text{font-family:var(--f-titulo);font-size:11px;font-weight:600;pointer-events:none;fill:var(--sobre-color)}
.punto circle{stroke:var(--fondo);stroke-width:2}.punto.on circle{stroke:var(--texto);stroke-width:3}.punto.apagado{opacity:.18}.punto.duda circle{stroke-dasharray:3 2;stroke:var(--texto-2)}
.c-g1{fill:var(--g1);background:var(--g1)}.c-g2{fill:var(--g2);background:var(--g2)}.c-g3{fill:var(--g3);background:var(--g3)}.c-g4{fill:var(--g4);background:var(--g4)}.c-hecho{fill:var(--hecho);background:var(--hecho)}
.filtros{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.filtros button{font-family:var(--f-titulo);font-size:14px;background:var(--fondo-2);border:0;padding:6px 10px;box-shadow:3px 3px 0 var(--sombra)}.filtros button.on{background:var(--q-aro);color:var(--sobre-color)}
.leyenda{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:13px;color:var(--texto-2);font-family:var(--f-titulo)}.leyenda i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.detalle{background:var(--fondo-2);padding:14px 16px;box-shadow:6px 6px 0 var(--sombra);min-height:170px}
.detalle .num{font-family:var(--f-titulo);color:var(--sobre-color);background:var(--titulo);padding:0 7px;margin-right:6px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.chip{font-family:var(--f-titulo);font-size:13px;padding:1px 8px;background:var(--fondo);white-space:nowrap}
.chip.rab{background:var(--q-rab);color:var(--sobre-color)}.chip.zap{background:var(--q-zap);color:var(--sobre-color)}.chip.aro{background:var(--q-aro);color:var(--sobre-color)}.chip.yuy{background:var(--q-yuy);color:var(--sobre-color)}.chip.hecho{background:var(--hecho);color:var(--sobre-color)}
.lista{list-style:none;padding:0;margin:12px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:4px 14px}
.lista button{display:grid;grid-template-columns:30px 1fr;gap:6px;width:100%;text-align:left;background:none;border:0;padding:3px 0;font-size:14.5px;align-items:baseline}
.lista button b{font-family:var(--f-titulo);text-align:center;color:var(--sobre-color);font-size:12px;padding:1px 0}.lista button.on span{color:var(--titulo)}.lista button.hecho span{text-decoration:line-through;color:var(--texto-2)}
.lista .grupo{grid-column:1/-1;font-family:var(--f-titulo);color:var(--texto-2);font-size:13px;letter-spacing:1px;text-transform:uppercase;margin-top:10px}
.cuadrantes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}@media (max-width:560px){.cuadrantes{grid-template-columns:1fr}}
.cuad{padding:12px 14px;border-left:8px solid;background:var(--fondo-2)}.cuad p{font-size:14.5px;margin:2px 0 0}
.cuad.rab{border-color:var(--q-rab)}.cuad.zap{border-color:var(--q-zap)}.cuad.aro{border-color:var(--q-aro)}.cuad.yuy{border-color:var(--q-yuy)}
.pasos{display:flex;flex-direction:column;margin-top:10px}.paso{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:10px 0}
.paso .n{font-family:var(--f-titulo);font-size:18px;width:34px;height:34px;display:grid;place-items:center;background:var(--fondo-3)}.paso.base .n{background:var(--g4);color:var(--sobre-color)}.paso.rab .n{background:var(--q-rab);color:var(--sobre-color)}.paso.zap .n{background:var(--q-zap);color:var(--sobre-color)}.paso.aro .n{background:var(--q-aro);color:var(--sobre-color)}
.paso h3{font-size:17px}.paso p{font-size:14.5px;margin:2px 0 0}
.extra{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px}.extra article{background:var(--fondo-2);padding:14px 16px;box-shadow:5px 5px 0 var(--sombra)}.extra p{font-size:15px;margin:4px 0 0}
</style>

<div class="pg">
  <header><h1 id="titulo"></h1><p id="bajada"></p><p class="dim" id="nota"></p></header>
  <nav aria-label="Secciones" id="nav"></nav>
  <section id="mapa">
    <h2>El cuadro</h2>
    <div class="filtros" id="filtros" role="group" aria-label="Filtrar"></div>
    <div class="mapa">
      <div><div class="lienzo"><svg id="svg" viewBox="0 0 600 600" role="img" aria-label="Pendientes ubicados por costo e impacto"></svg></div><p class="leyenda" id="leyenda"></p></div>
      <div><div class="detalle" id="detalle" aria-live="polite"></div><ul class="lista" id="lista"></ul></div>
    </div>
  </section>
  <section id="cuadrantes"><h2>Los cuatro cuadrantes</h2><div class="cuadrantes" id="cuads"></div></section>
  <section id="orden"><h2>En qué orden</h2><p id="orden-bajada"></p><div class="pasos" id="pasos"></div></section>
  <section id="extra" hidden><h2 id="extra-titulo"></h2><div class="extra" id="extra-cuerpo"></div></section>
</div>

<script>
(function () {
  'use strict';
  /* ====== LO ÚNICO QUE SE EDITA PARA UN PROYECTO NUEVO: este objeto ====== */
  var DATOS = {
    titulo: 'Mapa de pendientes de PROYECTO',
    bajada: 'Todo lo pendiente, ordenado por cuánto cuesta hacerlo y cuánto mejora el producto. Tocá un punto o un nombre para ver de qué se trata.',
    nota: 'Al FECHA. Fuente: ORIGEN. Costo e impacto son estimaciones de 1 a 10; SUPUESTOS.',
    ejeX: 'Cuesta más', ejeY: 'Mejora más el producto',
    corte: 5.5,
    // grupos: hasta 4, colorean los puntos. Elegir el corte que más le sirva a quien decide: origen, tipo, área, milestone.
    grupos: { g1: 'bug', g2: 'mejora', g3: 'deuda técnica' },
    cuadrantes: {
      rab: ['Rabanito', 'Rabanitos', 'Costo bajo · impacto alto', 'Cuestan poco y rinden mucho. Se hacen ya, en tanda.'],
      zap: ['Zapallo', 'Zapallos', 'Costo alto · impacto alto', 'Tardan y ocupan lugar, pero llenan la mesa. Se planifican de a uno.'],
      aro: ['Aromática', 'Aromáticas', 'Costo bajo · impacto bajo', 'Fáciles, dan sabor, no llenan la olla. Se intercalan cuando hay un hueco.'],
      yuy: ['Yuyo', 'Yuyos', 'Costo alto · impacto bajo', 'Consumen recursos y dan poco. Se dejan, por ahora.']
    },
    // n: número que se ve en el punto (usar el del issue si existe). c: costo, i: impacto (1–10, se admiten medios).
    // g: clave de grupo. hecho: versión o fecha si ya se hizo. duda: true si la estimación es floja. url: enlace al issue. dep: [n] de los que depende.
    items: [
      { n: 12, t: 'Ejemplo: el login falla con mails con mayúsculas', g: 'g1', c: 1.5, i: 8, url: '', por: 'Una línea de normalización. Hoy le pasa a cualquiera que escriba su mail con mayúscula: no puede entrar.' },
      { n: 15, t: 'Ejemplo: modo sin conexión', g: 'g2', c: 8, i: 8.5, duda: true, dep: [18], por: 'Pide cola de sincronización y resolver conflictos. Es lo más pedido, pero depende de ordenar antes la capa de datos.' },
      { n: 18, t: 'Ejemplo: separar la capa de datos', g: 'g3', c: 6, i: 6, por: 'Nadie lo ve, pero abarata el 15 y el 21.' },
      { n: 21, t: 'Ejemplo: tema oscuro', g: 'g2', c: 3, i: 4, por: 'Agradable, no cambia para qué sirve el producto.' },
      { n: 9, t: 'Ejemplo: exportar a PDF con diseño propio', g: 'g2', c: 8, i: 3, por: 'Lo pidió una sola persona y el navegador ya imprime.' }
    ],
    ordenBajada: 'Primero lo que abarata lo demás. Cada paso termina con el producto andando.',
    // clase: 'base' | 'rab' | 'zap' | 'aro' | ''
    pasos: [
      ['base', 'Primero: lo que destraba', 'Nº 18. Sin eso, el 15 cuesta el doble.'],
      ['rab', 'Tanda de rabanitos', 'Nº 12 y los que aparezcan parecidos.'],
      ['zap', 'Un zapallo por vez', 'Nº 15.'],
      ['aro', 'Aromáticas, cuando haya un hueco', 'Nº 21.']
    ],
    // opcional: una sección libre de tarjetas (propuestas propias, riesgos, preguntas abiertas). Dejar null si no hace falta.
    extra: null // { titulo: 'Preguntas abiertas', tarjetas: [['Título', 'Texto']] }
  };
  /* ====== fin de los datos ====== */

  var D = DATOS, Q = D.cuadrantes, K = D.corte, ORDEN_Q = ['rab', 'zap', 'aro', 'yuy'];
  function cuad(d) { return d.i >= K ? (d.c <= K ? 'rab' : 'zap') : (d.c <= K ? 'aro' : 'yuy'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function porN(n) { return D.items.filter(function (x) { return x.n === n; })[0]; }
  var pend = D.items.filter(function (x) { return !x.hecho; });
  var primero = pend.slice().sort(function (a, b) { return (b.i - b.c) - (a.i - a.c); })[0] || D.items[0];
  var est = { sel: primero ? primero.n : null, filtro: 'todas' };
  var FILTROS = [['todas', 'Todas']];
  if (pend.length !== D.items.length) FILTROS.push(['pend', 'Pendientes']);
  ORDEN_Q.forEach(function (q) { FILTROS.push([q, Q[q][1]]); });
  Object.keys(D.grupos).forEach(function (g) { FILTROS.push([g, D.grupos[g]]); });
  if (D.items.some(function (x) { return x.duda; })) FILTROS.push(['duda', 'Estimación floja']);
  function pasa(d) { var f = est.filtro; return f === 'todas' || (f === 'pend' && !d.hecho) || f === d.g || f === cuad(d) || (f === 'duda' && d.duda); }

  function X(c) { return 50 + (c - 0.5) / 9.5 * 520; } function Y(i) { return 560 - (i - 1) / 9 * 520; }
  // posiciones: separa los puntos encimados sin sacarlos nunca de su cuadrante
  var pos = D.items.map(function (d, k) { var a = k * 2.4; return { x: X(d.c) + Math.cos(a) * 0.5, y: Y(d.i) + Math.sin(a) * 0.5, q: cuad(d) }; });
  function encajar(p) { var mx = X(K), my = Y(K), izq = p.q === 'rab' || p.q === 'aro', arr = p.q === 'rab' || p.q === 'zap';
    p.x = Math.max(izq ? 46 : mx + 16, Math.min(izq ? mx - 16 : 564, p.x)); p.y = Math.max(arr ? 72 : my + 16, Math.min(arr ? my - 16 : 534, p.y)); }
  for (var it = 0; it < 200; it++) { for (var a = 0; a < pos.length; a++) for (var b = a + 1; b < pos.length; b++) { var dx = pos[b].x - pos[a].x, dy = pos[b].y - pos[a].y, dd = Math.sqrt(dx * dx + dy * dy); if (dd < 0.5) { dx = Math.cos((a * 7 + b) * 2.4); dy = Math.sin((a * 7 + b) * 2.4); dd = 1; } if (dd < 30) { var k = (30 - dd) / 2 / dd; pos[a].x -= dx * k; pos[a].y -= dy * k; pos[b].x += dx * k; pos[b].y += dy * k; } } pos.forEach(encajar); }

  function dibujar() {
    var mx = X(K), my = Y(K), s = '';
    s += '<rect class="zona rab" x="30" y="20" width="' + (mx - 30) + '" height="' + (my - 20) + '"/><rect class="zona zap" x="' + mx + '" y="20" width="' + (580 - mx) + '" height="' + (my - 20) + '"/>';
    s += '<rect class="zona aro" x="30" y="' + my + '" width="' + (mx - 30) + '" height="' + (580 - my) + '"/><rect class="zona yuy" x="' + mx + '" y="' + my + '" width="' + (580 - mx) + '" height="' + (580 - my) + '"/>';
    s += '<line class="cruz" x1="' + mx + '" y1="20" x2="' + mx + '" y2="580"/><line class="cruz" x1="30" y1="' + my + '" x2="580" y2="' + my + '"/>';
    [['rab', 40, 42, 'start'], ['zap', 570, 42, 'end'], ['aro', 40, 562, 'start'], ['yuy', 570, 562, 'end']].forEach(function (q) { s += '<text class="qn ' + q[0] + '" x="' + q[1] + '" y="' + q[2] + '" text-anchor="' + q[3] + '">' + esc(Q[q[0]][1]) + '</text><text class="qs" x="' + q[1] + '" y="' + (q[2] + 13) + '" text-anchor="' + q[3] + '">' + esc(Q[q[0]][2].toLowerCase()) + '</text>'; });
    s += '<text class="eje" x="305" y="597" text-anchor="middle">' + esc(D.ejeX) + ' →</text><text class="eje" transform="translate(16 300) rotate(-90)" text-anchor="middle">' + esc(D.ejeY) + ' →</text>';
    D.items.forEach(function (d, k) {
      var on = est.sel === d.n;
      s += '<g class="punto' + (on ? ' on' : '') + (pasa(d) ? '' : ' apagado') + (d.duda ? ' duda' : '') + '" data-n="' + d.n + '" tabindex="0" role="button" aria-label="' + esc(d.t) + '"><circle class="c-' + (d.hecho ? 'hecho' : d.g) + '" style="background:none" cx="' + pos[k].x.toFixed(1) + '" cy="' + pos[k].y.toFixed(1) + '" r="' + (on ? 15 : 13) + '"/><text x="' + pos[k].x.toFixed(1) + '" y="' + (pos[k].y + 4).toFixed(1) + '" text-anchor="middle">' + d.n + '</text></g>';
    });
    document.getElementById('svg').innerHTML = s;

    var d = porN(est.sel);
    if (d) {
      var q = cuad(d), deps = (d.dep || []).map(function (n) { var x = porN(n); return x ? '<button class="chip" data-n="' + n + '" style="border:0">antes: ' + n + '</button>' : ''; }).join('');
      document.getElementById('detalle').innerHTML = '<h3><span class="num">' + d.n + '</span>' + esc(d.t) + '</h3><p class="chips"><span class="chip ' + q + '">' + esc(Q[q][0]) + '</span><span class="chip">' + esc(D.grupos[d.g] || '') + '</span>' + (d.hecho ? '<span class="chip hecho">hecho en ' + esc(d.hecho) + '</span>' : '') + '<span class="chip">costo ' + d.c + ' · impacto ' + d.i + '</span>' + (d.duda ? '<span class="chip">estimación floja</span>' : '') + deps + '</p><p>' + esc(d.por) + '</p>' + (d.url ? '<p><a href="' + esc(d.url) + '" target="_blank" rel="noopener">Abrir el original</a></p>' : '');
    }
    var h = '';
    ORDEN_Q.forEach(function (qq) {
      var xs = D.items.filter(function (x) { return cuad(x) === qq && pasa(x); }).sort(function (x, y) { return (x.hecho ? 1 : 0) - (y.hecho ? 1 : 0) || (y.i - y.c) - (x.i - x.c); }); if (!xs.length) return;
      h += '<li class="grupo">' + esc(Q[qq][1]) + ' · ' + xs.length + '</li>' + xs.map(function (x) { return '<li><button data-n="' + x.n + '" class="' + (x.n === est.sel ? 'on ' : '') + (x.hecho ? 'hecho' : '') + '"><b class="c-' + (x.hecho ? 'hecho' : x.g) + '">' + x.n + '</b><span>' + esc(x.t) + '</span></button></li>'; }).join('');
    });
    document.getElementById('lista').innerHTML = h || '<li class="dim">Nada con ese filtro.</li>';
    document.getElementById('filtros').innerHTML = FILTROS.map(function (f) { return '<button data-f="' + f[0] + '" class="' + (est.filtro === f[0] ? 'on' : '') + '" aria-pressed="' + (est.filtro === f[0]) + '">' + esc(f[1]) + '</button>'; }).join('');
  }
  document.addEventListener('click', function (e) { var t = e.target.closest('[data-n],[data-f]'); if (!t) return; if (t.hasAttribute('data-f')) est.filtro = t.getAttribute('data-f'); else est.sel = +t.getAttribute('data-n'); dibujar(); });
  document.addEventListener('keydown', function (e) { var g = (e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('g[data-n]'); if (g) { e.preventDefault(); est.sel = +g.getAttribute('data-n'); dibujar(); } });

  document.title = D.titulo;
  document.getElementById('titulo').textContent = D.titulo; document.getElementById('bajada').textContent = D.bajada; document.getElementById('nota').textContent = D.nota;
  document.getElementById('orden-bajada').textContent = D.ordenBajada;
  document.getElementById('leyenda').innerHTML = Object.keys(D.grupos).map(function (g) { return '<span><i class="c-' + g + '"></i>' + esc(D.grupos[g]) + '</span>'; }).join('') + (pend.length !== D.items.length ? '<span><i class="c-hecho"></i>ya está hecho</span>' : '') + (D.items.some(function (x) { return x.duda; }) ? '<span>borde punteado: estimación floja</span>' : '');
  document.getElementById('cuads').innerHTML = ORDEN_Q.map(function (q) { return '<div class="cuad ' + q + '"><h3>' + esc(Q[q][1]) + '</h3><p>' + esc(Q[q][3]) + '</p></div>'; }).join('');
  document.getElementById('pasos').innerHTML = D.pasos.map(function (p, k) { return '<div class="paso ' + p[0] + '"><span class="n">' + (k + 1) + '</span><div><h3>' + esc(p[1]) + '</h3><p>' + esc(p[2]) + '</p></div></div>'; }).join('');
  var nav = [['#mapa', 'El cuadro'], ['#cuadrantes', 'Los 4 cuadrantes'], ['#orden', 'En qué orden']];
  if (D.extra) { document.getElementById('extra').hidden = false; document.getElementById('extra-titulo').textContent = D.extra.titulo; document.getElementById('extra-cuerpo').innerHTML = D.extra.tarjetas.map(function (t) { return '<article><h3>' + esc(t[0]) + '</h3><p>' + esc(t[1]) + '</p></article>'; }).join(''); nav.push(['#extra', D.extra.titulo]); }
  document.getElementById('nav').innerHTML = nav.map(function (n) { return '<a href="' + n[0] + '">' + esc(n[1]) + '</a>'; }).join('');
  dibujar();
})();
</script>
```
