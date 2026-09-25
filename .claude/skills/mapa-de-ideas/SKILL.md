---
name: mapa-de-ideas
description: Pone al día el mapa de ideas de Huertita (cuadro costo/impacto con Rabanitos, Zapallos, Aromáticas y Yuyos) en docs/mapa-ideas.html y lo republica como artifact. Usar cuando pidan "actualizá el mapa de ideas", "mapa de pendientes", "qué sigue", "priorizá los issues", o después de mergear un PR que cierra issues del cuadro.
---

# Mapa de ideas de Huertita

El mapa es una página interactiva con cada idea del juego ubicada por costo e impacto. La fuente vive en el repo (`docs/mapa-ideas.html`) y se publica como artifact en **https://claude.ai/artifact/SeF5Jr9GeytaMYqMmzbkwQ**, siempre en esa misma URL.

La metodología general (escalas de costo e impacto, qué significa cada cuadrante, reglas para puntuar) está en `docs/traspaso/SKILL-mapa-de-pendientes.md`. Este skill es la versión de este repo: dónde están los datos y qué tocar.

## 1. Juntar lo que cambió

1. Issues abiertos y cerrados del repo (`facundo-p/huertita`) con el conector de GitHub: `list_issues` con `state: OPEN` y con `state: CLOSED`.
2. Leer `docs/mapa-ideas.html`: el arreglo `IDEAS` tiene una entrada por idea, `{ n, t, de, c, i, hecho?, por }`.
3. Comparar:
   - **Issue cerrado** por un PR mergeado → `hecho: 'v0.X'`, la versión del CHANGELOG en que entró. No se borra: queda tachado y sirve para ver el avance.
   - **Issue de idea nuevo** (label `enhancement`, o una idea de Facu o de Claude) que no está en `IDEAS` → se suma.
   - **No van al cuadro:** los cimientos y las deudas (labels `cimientos`, `deuda`, `bug`, `documentation`), la epic #39 y los issues de proceso. Se nombran en el encabezado, no se puntúan.
   - Idea que cambió de costo porque otra ya está hecha (por ejemplo, algo que dependía de #29 o de #8) → se re-estima y el `por` dice por qué.

## 2. Puntuar una idea nueva

- `n`: el número del issue. `t`: título corto. `de`: `'vos'` si es de Facu, `'yo'` si la propuso Claude.
- `c` e `i` de 1 a 10, con medios. Si el issue ya trae "**Cuadrante:** … · costo X · impacto Y", usar esos números: son los que Facu vio.
- El cuadrante **no se escribe**: la página lo calcula con el corte en 5,5 en los dos ejes. Si la etiqueta del issue no coincide con lo que da el corte, no se mueve el número: se avisa a Facu en el chat.
- `por`: una a tres oraciones con hechos del proyecto que justifican las dos notas.
- Leer el código que la idea toca antes de estimar, no estimar por el título.

## 3. El resto de la página

- **Encabezado** (`<p class="dim">`): la fecha de hoy y la versión del juego (la última del CHANGELOG).
- **`PROPS`** (las cinco propuestas de Claude): si una ya entró, se agrega la versión como quinto elemento y la tarjeta lo dice.
- **`EVS`** (catálogo de eventos sorpresa): los que ya están en `datos/juego/sorpresas.ts` llevan la versión en que entraron como sexto elemento.
- **`PASOS`** (en qué orden): reescribir para que diga lo que sigue de verdad. Primero lo que destraba a otros (cimientos), después la tanda de rabanitos pendientes, después los zapallos de a uno.
- `est.sel`: la idea que se muestra al abrir. Poner el próximo rabanito pendiente.
- La estética es la del juego (añil, maíz, ladrillo, acequia, hoja) y no se toca.

## 4. Verificar y publicar

1. Abrir la página en Chromium (Playwright, `executablePath: '/opt/pw-browsers/chromium'` si hace falta) envolviéndola en un HTML completo. Comprobar que no hay errores de consola, que todos los puntos se dibujan y que a 390 px de ancho no hay scroll horizontal.
2. El cambio va en un PR, como todo (`CLAUDE.md`, Proceso): un issue primero y un commit con `Closes #N`.
3. Republicar con la herramienta Artifact: `file_path: docs/mapa-ideas.html` y `url: https://claude.ai/artifact/SeF5Jr9GeytaMYqMmzbkwQ`. La página ya es un fragmento (sin doctype, html, head ni body) y no hay que envolverla. Antes, leer el artifact con `action: read`, porque la publicación exige haberlo leído en la sesión.
4. Anotar la versión nueva del artifact en `docs/traspaso/TRASPASO-huertita.md`, en la tabla de "Dónde está cada cosa".

## 5. Contestar

Cinco líneas como mucho:
- cuántas ideas pasaron a hechas y cuántas se sumaron;
- los dos o tres rabanitos para arrancar;
- el primer zapallo y por qué ese;
- los desacuerdos entre la etiqueta de un issue y su cuadrante.

No repetir la página en texto. No cambiar etiquetas de issues salvo que Facu lo pida.
