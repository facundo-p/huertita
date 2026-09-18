# Traspaso: Huertita (juego de huerta agroecológica) — para seguir en otra sesión

Escrito el 18 de septiembre de 2026 por Claude, al cierre de una sesión larga de Cowork con Facu. Todo lo de abajo es lo que hace falta para retomar sin volver a explicar nada.

**Todo lo de este traspaso vive en el repo, en `docs/traspaso/`:**

| Archivo | Qué es |
| --- | --- |
| `TRASPASO-huertita.md` | Este documento |
| `GDD-documento-de-diseno.md` | El documento de diseño del juego, exportado del Claude Doc (concepto, comparación con Minecraft, loops, sistemas, ideas, eventos sorpresa, tiempo, cimientos) |
| `huertita-v0.7-artifact.html` | El juego tal cual está publicado en Claude (build de una sola página, versión 0.7). Se regenera con `npm run build:artifact` |
| `../mapa-ideas.html` (o sea `docs/mapa-ideas.html`) | El mapa de ideas interactivo (cuadro 2×2), fuente del artifact publicado |
| `issues.json` | Los 38 issues planificados: número, título, cuerpo, etiquetas, cuáles cerrar |
| `crear-issues.sh` | Script `gh` que los crea en orden y cierra los ya hechos |
| `SKILL-mapa-de-pendientes.md` | El skill global del cuadro costo/impacto, listo para proponer o pegar como skill de usuario |

Para que una instancia nueva arranque con todo: "Leé `docs/traspaso/TRASPASO-huertita.md` del repo facundo-p/huertita y seguí desde §7".

## 1. Quién es quién y cómo se trabaja

- **Facu** (facundo-p en GitHub): analista de sistemas, docente de tecnología en Ituzaingó (GBA). Tiene una huerta agroecológica real y una app propia, **huertapp**, cuya base de conocimiento es la fuente de todos los datos agronómicos del juego. Usa Mac.
- **Tono:** rioplatense, de vos, conversacional y narrativo. Nada de festejo ni de condescendencia; el progreso se marca cuando es real. Sintético, sin palabras que no sumen. Le cuesta *arrancar* tareas más que hacerlas: conviene proponer el siguiente paso concreto y empezarlo, no abrir fases largas de planificación.
- **Estética acordada:** paleta con personalidad (añil #1d1b4b, maíz #ffc233, ladrillo #e0502f, acequia #1fc2b8, hoja #3fc25a, tiza #fff1d0), tipografías Pixelify Sans + Atkinson Hyperlegible. Nada desaturado ni genérico.
- **Para análisis y priorización prefiere una página visual** (artifact HTML) antes que texto largo o secciones dentro de un doc.
- **Regla de contenido:** el juego simplifica pero nunca contradice a huertapp. Todo número lleva marca `[REPO]` (sale de huertapp) o `[SUPUESTO]`. Ningún producto de síntesis. Las mecánicas y eventos que no salen de huertapp necesitan la revisión de Facu antes de entrar.
- **Cuadrantes para priorizar (nombres acordados):** Rabanitos (costo bajo, impacto alto) · Zapallos (alto, alto) · Aromáticas (bajo, bajo) · Yuyos (alto, bajo).

## 2. Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Repo del juego (público) | https://github.com/facundo-p/huertita |
| Copia local en la Mac | `~/Desarrollos/Personales/App-info-huerta/huertita/` (rama `main`, remoto HTTPS) |
| huertapp (fuente de datos) | https://github.com/facundo-p/huertapp · local: `~/Desarrollos/Personales/App-info-huerta/info-huerta/` |
| Prototipo viejo v0.4 (referencia, no se toca) | `~/Desarrollos/Personales/App-info-huerta/huertita-juego/` |
| Juego publicado (artifact de Claude) | https://claude.ai/artifact/4qfBdRJGaRFdEjczwVLq4q — versión 7 = v0.7. Capacidades `db`, `user`, `downloads` (guardado en la nube por persona). Se republica con `npm run build:artifact` y publicando `dist-artifact/huertita-artifact.html` pasando ese `url`; las capacidades se conservan si no se pasa el campo. |
| Mapa de ideas (cuadro 2×2 interactivo, 26 ideas) | https://claude.ai/artifact/SeF5Jr9GeytaMYqMmzbkwQ — fuente `docs/mapa-ideas.html` en el repo. Al cerrar una idea: marcarla `hecho: 'vX'` y republicar con ese `url`. |
| GDD (Claude Docs) | https://claude.ai/code/artifact/19fb4257-8c56-40ea-97d5-f804bba4bde3 — exportado a `docs/traspaso/GDD-documento-de-diseno.md`. A Facu le resultó poco visible; no seguir engordándolo. |
| Doc de estado en el Project "Desarrollo De Soft" | `claude/huertita-juego-estado.md` (actualizado a v0.7) |

### Estado de git, importante

En la Mac hay **cuatro commits sobre `main` sin pushear** (`origin/main` sigue en "Activar CI"; Facu creyó haber pusheado el 18-9 pero el remoto no los tiene, así que probablemente el push falló por credenciales):

1. `Motor: el patio es un dato`
2. `Interfaz y renderers leen el patio; balcón elegible; 0.6.0`
3. `Diario por planta, plantines que avisan y salud a la vista; 0.7.0`
4. `Traspaso: documentos, artifacts e issues planificados en docs/traspaso`

Lo primero es que Facu haga `git push` desde su terminal y confirme con `git status -sb` que dice `main...origin/main` sin `[ahead N]`. Ni la nube ni la VM de Cowork tienen credenciales de push. Hasta que pushee, GitHub y Pages no muestran nada de esto y una instancia nueva que clone el repo no va a encontrar `docs/traspaso/`.

## 3. Cómo trabaja Claude sobre el repo desde Cowork (el flujo que funcionó)

1. El repo es público: en la nube, `git clone https://github.com/facundo-p/huertita.git`, `npm ci`, trabajar y commitear ahí con autor `facundo-p <38925892+facundo-p@users.noreply.github.com>` y al pie `Co-Authored-By: Claude …`.
2. Antes de dar algo por hecho: `npm run tipos && npm test && npm run build:artifact && npm run humo` (humo necesita Playwright; en la nube alcanzó con un symlink de un playwright global dentro de `node_modules`, que está ignorado).
3. Exportar los commits nuevos: `git format-patch <base>..HEAD --stdout > x.patch`, dejar el archivo en la carpeta conectada (`~/Desarrollos/Personales/App-info-huerta/_parches/`) con `device_commit_files`, y aplicarlo en la Mac con `device_bash`: `git -c user.name=facundo-p -c user.email=… am ../_parches/x.patch`. Verificar que `git rev-parse 'HEAD^{tree}'` dé lo mismo en los dos lados. Borrar el parche después.
4. Cosas que NO se pueden hacer desde la nube: pushear; escribir `.github/workflows/*` (archivos protegidos; se dejan en `docs/workflows/` y Facu los mueve); crear repos o issues por la API de GitHub (403: la sesión solo tiene acceso a repos configurados). Crear el repo se hizo con el Chrome de Facu (extensión Claude in Chrome), y ese es el camino para issues si no se usa `gh`.
5. La VM de la Mac (`device_bash`) tiene git pero no credenciales; borrar archivos ahí pide permiso explícito (solo se pidió para lockfiles de git).
6. Para sesiones largas de puro código conviene Claude Code en la Mac: el `CLAUDE.md` del repo ya está pensado para eso. Cowork rinde cuando hay artifacts, docs y diseño de por medio.

## 4. Arquitectura, en una página

- TypeScript estricto, Vite 5, Vitest 2, tsx. `npm run dev|build|build:artifact|test|tipos|bot|humo|datos:sync|datos:check`.
- Capas en un solo sentido: `datos → motor → ui` y `arte → render → ui`. El motor no toca DOM. El renderer no importa el motor: recibe una `Escena` plana (`src/render/contrato.ts`) y cumple `montar / dibujar / alTocar / desmontar` (+ `camaras`, `efecto`). Hay dos renderers: pixel (3 cámaras: cenital, oblicua, cerca con corte de suelo) y texto.
- Estado JSON `v:2`, azar con semilla (mulberry32). **El orden de las llamadas a `azar` es contrato mientras viva el test dorado** (`tests/dorado.test.ts`: el motor nuevo juega 8 años con el motor v0.4 y exige estado idéntico; una proyección quita lo nuevo — `patio`, `tunel` por zona, `hist` — antes de comparar).
- `src/motor/`: tipos, azar, clima (SMN Ezeiza + heladas FAUBA umbral 3 °C, carácter del año normal/niña/niño/tardía), patio, sol, catalogo, estado, factores (luz, agua, temp, suelo, vecinos + fantasma de siembra), abrigo, misiones, acciones (`despachar`), tiempo (`pasarDecada` en fases: germinar → helar → semillar → crecer → estresar → plagas → espigar → madurar → suelos y compost), diario, balance, migraciones.
- **Datos:** huertapp es la única fuente de verdad. `datos/catalogo.json` es un derivado; `datos/fuente.lock.json` guarda el sha256 de `data/huerta_gba_enriquecido.json`. `npm run datos:sync` (o `-- --local ../info-huerta`) valida contra `datos/contrato.ts`, regenera y escribe `datos/CAMBIOS.md` y `datos/HUECOS.md` (83 huecos que el juego completa con supuestos). `datos:check` sale 1 si se rompe el contrato, 2 si hay cambios sin sincronizar. Lo propio del juego vive en `datos/juego/` (`especies.ts` con familias, emoji, defaults; `patio.ts`; `patios/`). Nunca editar el catálogo a mano.
- **El patio es un dato (0.6):** `datos/juego/patios/fondo.ts` y `balcon.ts`. Plano de letras con el norte arriba, zonas con propiedades (`cria`, `techo`, `abrigo`, `calor`, `admiteTunel`, `macetas`, suelo, mo, drenaje, hondo, riegoCosto, `tipo` para dibujar) y obstáculos (`muro` con opacidad, `arbol` caduco, `losa`). `src/motor/sol.ts` calcula horas de sol por geometría a 34,6° S. Nadie fuera de esos archivos nombra una zona o celda concreta: hay un test que lo vigila.
- `src/arte`, `src/render`, `src/ui` siguen con `// @ts-nocheck`, portados del prototipo (deuda del paso 6).
- Balance actual: 14 ratos por década; riego por zona 0–3 con costo; arranque en década 22; estrellas por patio (fondo 30/70/120); abrigo manta +4, microtúnel +5, reparo fijo por zona.
- Tests: 171 verdes (dorado, heladas, catálogo por especie con 2 contradicciones conocidas, regresiones, patio, sol, diario). `docs/ARQUITECTURA.md`, `docs/DATOS.md`, `docs/CIMIENTOS.md` y `CLAUDE.md` (9 innegociables) tienen el detalle.

## 5. Lo que se hizo en la sesión (para no repetirlo)

- **Paso 1 y 1b de los cimientos (0.5):** repo propio, TS, módulos, tests, sincronización con huertapp. El tipado destapó tres bugs del prototipo (temperaturas `null` que impedían germinar, `tolera_max` vacío que daba calor siempre, daño por exceso de riego que nunca disparaba).
- **Paso 2 (0.6):** patio como dato, sol por geometría, balcón en prueba, estado v2 con migración v1→v2, estrellas por patio, selector de patio en "Guardar y cargar".
- **0.7:** diario por planta (`pl.hist`, últimas 16 anotaciones; incluye lo que antes bajaba la salud en silencio: sed leve, plaga que sigue, y qué factor frenó el crecimiento); plantines con estado chico/listo/pasándose (`puntoDeTrasplante`) y flecha en el patio; la planta amarillea desde salud 80 y muestra una barrita bajo 60. Test: toda baja de salud de un año entero tiene explicación en el diario.
- Skill global `mapa-de-pendientes` propuesto (ver §7).

## 6. Decisiones y deudas abiertas

- **Sol del patio original.** El fondo sigue con `sol: 'v04'` (la fórmula del prototipo) para que el test dorado siga valiendo. Con geometría real, un paredón de 1,8 m al norte deja sin sol directo en pleno invierno todo lo que esté a menos de ~2,6 m (cinco celdas): el bancal a suelo queda a oscuras de mayo a agosto, donde la fórmula vieja le daba 1 a 5 horas. **Decisión de Facu:** mover los canteros, bajar el paredón o aceptarlo. Va junto con el rebalanceo del paso 4.
- **Balcón:** todos sus números son supuestos de Claude, sin revisión ni balance (bot: 12–37 puntos; estrellas 10/25/45).
- **Almácigo protegido:** berenjena y batata no pueden germinar en su época (la almaciguera suma solo +2 °C y huertapp pide "almácigo protegido"). Test que documenta la contradicción.
- **Babosas bajo techo** (herencia del prototipo; corregirlo cambia el dorado).
- **Propiedad `movil`** no agregada hasta que haya mecánica de mover macetas.
- **Textos nuevos del diario (0.7)** redactados por Claude, pendientes de que Facu los revise.
- **83 huecos** en huertapp (`datos/HUECOS.md`).
- **GitHub Pages** hay que activarlo en Settings con fuente "GitHub Actions".

## 7. Lo que quedó a medio hacer (en este orden)

### a) Crear los Issues en GitHub — pedido explícito de Facu, sin empezar

Facu pidió: *"Planificá y creá Issues para todas las tareas que estuvimos hablando. Mantené los números de tarea que me mostraste en el artifact. No implementes ninguna todavía."*

Estado: las **6 etiquetas ya están creadas** en el repo (rabanito #3fc25a, zapallo #ffc233, aromática #1fc2b8, yuyo #8a88c8, cimientos #e0502f, deuda #b85a38), además de las de GitHub por defecto (bug, enhancement…). **No hay ningún issue creado todavía.** El repo no tenía issues ni PRs al momento de mirar, así que la numeración de GitHub va a coincidir con la del mapa de ideas si se crean **en orden estricto, #1 a #38**, y antes de que el workflow semanal de datos abra un PR (los PRs comparten la numeración).

Cómo crearlos, de mejor a peor:

1. **`docs/traspaso/crear-issues.sh`** en la terminal de la Mac, con `gh` autenticado: crea los 38 en orden y cierra en el acto los #1 a #5 (ya hechos). Es lo más rápido y lo más seguro para la numeración.
2. Desde Cowork con la extensión de Chrome: abrir `https://github.com/facundo-p/huertita/issues/new?title=…&body=…&labels=…` (los `url` ya están armados en `issues.json`), clic en "Create", uno por uno en orden; después cerrar #1–#5. Facu interrumpió este camino cuando iba a arrancar: preguntarle antes de volver a usar su Chrome.
3. Si nada de eso: pasarle la tabla y que los cargue él.

Contenido de cada issue (títulos, cuerpos y etiquetas completos) en `issues.json`. Resumen:

| # | Título | Etiquetas | Estado |
|---|---|---|---|
| 1 | Almaciguera con varios plantines, raleo y repique | rabanito | cerrar (hecho v0.3) |
| 2 | Indicadores con el rango que pide cada especie | rabanito | cerrar (hecho v0.3) |
| 3 | Almanaque de siembra y ficha completa | rabanito | cerrar (hecho v0.3) |
| 4 | Guardar y cargar la huerta | rabanito | cerrar (hecho v0.4) |
| 5 | Protección de heladas que cumple lo que dice | rabanito | cerrar (hecho v0.4) |
| 6 | Eventos sorpresa | rabanito, enhancement | abierto (depende de #29) |
| 7 | Césped y poda como secos y verdes del compost | rabanito, enhancement | abierto |
| 8 | Pedidos de vecinos con fecha | rabanito, enhancement | abierto (depende de #29) |
| 9 | Sonido y ambiente | rabanito, enhancement | abierto |
| 10 | Patios prediseñados: balcón, terraza, fondo grande | rabanito, enhancement | abierto (avanzado: patio como dato + balcón) |
| 11 | Vacaciones de enero y otros desafíos anunciados | rabanito, enhancement | abierto (depende de #29) |
| 12 | Jugar de a 1 a 10 días | zapallo, enhancement | abierto (= paso 4, #28) |
| 13 | Feria vecinal: vender o trocar verdura | zapallo, enhancement | abierto |
| 14 | Editor del espacio | zapallo, enhancement | abierto |
| 15 | Tamaño real de cada planta y marcos de plantación | zapallo, enhancement | abierto (= paso 3, #27) |
| 16 | Diagnóstico por síntomas | zapallo, enhancement | abierto |
| 17 | Modo "mi patio" y puente con huertapp | zapallo, enhancement | abierto (depende de #14) |
| 18 | Fauna viva y álbum de bichos | aromática, enhancement | abierto |
| 19 | Preparados agroecológicos | aromática, enhancement | abierto |
| 20 | Tanque de lluvia y goteo como mejoras | aromática, enhancement | abierto |
| 21 | Recetas veganas de estación y conservas | aromática, enhancement | abierto |
| 22 | Variedades del repo | aromática, enhancement | abierto |
| 23 | Árboles frutales | yuyo, enhancement | abierto |
| 24 | Fotoperíodo detallado | yuyo, enhancement | abierto |
| 25 | Cámara isométrica o 3D | yuyo, enhancement | abierto |
| 26 | Feria de semillas en línea entre jugadores | yuyo, enhancement | abierto |
| 27 | Cimientos, paso 3: plantas con huella propia y contenedores con capacidad | cimientos, zapallo | abierto |
| 28 | Cimientos, paso 4: tic diario y avanzar(estado, días); ratos por día; pronóstico de 5 días | cimientos, zapallo | abierto |
| 29 | Cimientos, paso 5: contenido como tablas (eventos, logros, pedidos, ítems) | cimientos, zapallo | abierto |
| 30 | Cimientos, paso 6: interfaz por componentes, arte tipado y PWA | cimientos, zapallo | abierto |
| 31 | Decidir el sol del patio original: fórmula v0.4 o geometría | deuda, cimientos | abierto |
| 32 | Revisar y balancear el balcón (patio en prueba) | deuda | abierto |
| 33 | Almácigo protegido de verdad: berenjena y batata no pueden germinar en su época | bug, deuda | abierto |
| 34 | Babosas bajo techo | bug, deuda | abierto |
| 35 | Macetas móviles: mover recipientes a la sombra o al reparo | enhancement, aromática | abierto |
| 36 | Completar en huertapp los 83 huecos que el juego rellena con supuestos | deuda | abierto |
| 37 | Prender GitHub Pages y comprobar que el juego se publica en cada push | rabanito | abierto |
| 38 | Revisar los textos nuevos del diario por planta (0.7) | rabanito | abierto |

Cuando estén creados: anotar en `docs/mapa-ideas.html` (y republicar el artifact del mapa) que los números son ahora issues, y marcar `hecho` en las ideas 1–5 si no lo están.

### b) El skill global `mapa-de-pendientes` — Facu lo pidió dos veces y todavía no lo tiene

Pedido: *"quiero que este cuadro de dos ejes con 'impacto/costo de implementación' y 'impacto/ganancia en calidad del producto' forme parte de un skill global al que pueda invocar en otros proyectos. Que agarre la lista de pendientes (Issues por ejemplo) y me los organice así como hiciste acá, en un artifact así de maravilloso. La estética puede ser esta misma o adecuarse a la del proyecto (si eso no lo vuelve más costoso)."*

Se propuso una vez con `propose_skills` (tarjeta de revisión) pero Facu no llegó a guardarlo y volvió a preguntar. **El SKILL.md completo está en `docs/traspaso/SKILL-mapa-de-pendientes.md`**, con la plantilla HTML probada (30 puntos, celular y escritorio, tema claro y oscuro, puntos que se separan sin salirse de su cuadrante, enlace al issue, dependencias, marca de estimación floja). En la sesión nueva: volver a proponerlo con `propose_skills` (kind `new`, nombre `mapa-de-pendientes`, ese SKILL.md tal cual) y decirle a Facu que tiene que tocar "guardar" en la tarjeta. Si la sesión no tiene esa herramienta, indicarle dónde pegar el archivo como skill de usuario.

Después de crear los issues, la primera prueba real del skill es correrlo sobre `facundo-p/huertita`: debería reproducir el mapa de ideas con los 38 issues.

### c) Después: paso 3 de los cimientos (#27), pensado así

Objetivo: plantas con huella propia y contenedores con capacidad, para que el bancal sea un rompecabezas (#15) y la almaciguera críe de a 50.

- **Datos por especie** (en `datos/juego/especies.ts`, marcados `[SUPUESTO]` salvo que huertapp tenga marco de plantación): `huella` (celdas que ocupa: 1, 2 o 4) y `porCelda` (cuántas entran en una celda de 0,5 m: 9 rabanitos, 4 lechugas, 1 tomate) y `alto` (para que el choclo sombree al sur; el sol por geometría ya sabe de obstáculos: una planta alta puede ser un obstáculo temporal).
- **Zonas:** `capacidad` para la almaciguera (bandejas de 50 plantines en vez de celdas); macetas con volumen real ya está (`litros`, `prof`).
- **Estado:** una planta puede ocupar varias celdas (`celdas: CeldaId[]` con `celda` = ancla) y una celda puede tener varias plantas de especies chicas. Sube `v` a 3 con migración.
- **Cuidado con el test dorado:** el cambio de modelo altera rendimientos y azar. Dos caminos: (1) hacer el paso 3 con defaults que conserven la conducta (huella 1, porCelda 1 para todas) y prender los valores reales en el paso 4, cuando el dorado se jubila y se rebalancea todo; (2) juntar 3 y 4 en un solo arco de rebalanceo. Claude recomienda (1): mantiene el refactor protegido y deja el cambio de reglas para un solo momento.
- Antes de eso resolver #31 (sol del fondo), porque el rebalanceo del paso 4 depende de esa decisión.

### d) Chequeos rápidos cuando se retome

- ¿Pusheó Facu los tres commits? Si no, recordárselo sin insistir.
- ¿Guardó el skill? ¿Están los issues? ¿Activó Pages?
- Reproducir el estado de la nube: clonar, `npm ci`, `npm test` (171 tests) y `npm run humo`.

## 8. Cosas que Facu ya dijo y no hay que volver a preguntar

- Repo `huertita`, público, creado desde su Chrome el 17-9.
- No clonar bases de datos: huertapp es la única fuente; el juego guarda un derivado con candado. Extraer un paquete compartido solo si aparece un tercer consumidor.
- Quiere jugar de a 1 a 10 días (paso 4), con ratos por día con tope.
- Le gustó el mapa de ideas visual y el diario por planta. Pidió el mapa como skill reutilizable en todos sus proyectos.
- Bugs que reportó y ya están resueltos: manta que no protegía (v0.4), plantines "siempre plantín" (era falta de señal: v0.7), salud no visible en el dibujo (v0.7), falta de diario por planta (v0.7).
