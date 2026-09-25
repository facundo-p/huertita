# Traspaso: Huertita (juego de huerta agroecológica) — para seguir en otra sesión

Escrito el 18 de septiembre de 2026 por Claude, al cierre de una sesión larga de Cowork con Facu. Todo lo de abajo es lo que hace falta para retomar sin volver a explicar nada.

**Actualizado el 18 de septiembre de 2026, en una sesión de Claude Code en la nube**: se hizo el paso 3 de los cimientos (0.8.0) y se crearon los 38 issues. Los cambios de esa sesión están marcados abajo.

**Actualizado el 24 de septiembre de 2026**: se ejecutó la epic #39 entera (reestructura, 0.9.0). El código cambió de lugar y de forma sin cambiar cómo se juega; §4 lo resume y `docs/ARQUITECTURA.md` lo cuenta entero. Lo que sigue es #31 y el paso 4 (§7c).

**Actualizado el 25 de septiembre de 2026**: 0.10.0. Se sumó la sección Proceso a `CLAUDE.md` (toda tarea es un issue, cada issue se cierra con un PR), se jubiló el dorado v0.4 (#68) y entró la primera tanda del cuadro: compost con secos y verdes (#7), eventos sorpresa (#6), pedidos de vecinos (#8) y sonido (#9). Todo en un PR que espera la revisión de Facu (§7e).

**Todo lo de este traspaso vive en el repo, en `docs/traspaso/`:**

| Archivo | Qué es |
| --- | --- |
| `TRASPASO-huertita.md` | Este documento |
| `GDD-documento-de-diseno.md` | El documento de diseño del juego, exportado del Claude Doc (concepto, comparación con Minecraft, loops, sistemas, ideas, eventos sorpresa, tiempo, cimientos) |
| `huertita-v0.7-artifact.html` | El juego tal cual está publicado en Claude (build de una sola página, versión 0.7). Se regenera con `npm run build:artifact`. El artifact publicado sigue en 0.7: el 0.8 no cambia nada de lo que se ve, así que republicarlo puede esperar al paso 4 |
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
| Juego publicado (artifact de Claude) | https://claude.ai/artifact/4qfBdRJGaRFdEjczwVLq4q — versión 8 = v0.10 (25-9, desde la rama del PR #69). Capacidades `db`, `user`, `downloads` (guardado en la nube por persona). Se republica con `npm run build:artifact` y publicando `dist-artifact/huertita-artifact.html` pasando ese `url`; las capacidades se conservan si no se pasa el campo. |
| Mapa de ideas (cuadro 2×2 interactivo, 31 ideas) | https://claude.ai/artifact/SeF5Jr9GeytaMYqMmzbkwQ — versión 5, al día con 0.10 (25-9), con enlace al issue de cada idea. Fuente `docs/mapa-ideas.html` en el repo. Se pone al día con el skill `mapa-de-ideas` (`.claude/skills/mapa-de-ideas/SKILL.md`): ideas hechas, ideas nuevas, orden, y republicar con ese `url`. |
| GDD (Claude Docs) | https://claude.ai/code/artifact/19fb4257-8c56-40ea-97d5-f804bba4bde3 — exportado a `docs/traspaso/GDD-documento-de-diseno.md`. A Facu le resultó poco visible; no seguir engordándolo. |
| Doc de estado en el Project "Desarrollo De Soft" | `claude/huertita-juego-estado.md` (actualizado a v0.7) |

### Estado de git

`origin/main` está al día con todo lo anterior. El 18-9, una sesión de Claude Code en la nube dejó
pusheada la rama `claude/dazzling-wright-jghyog`, dos commits arriba de `main`:

1. `Cimientos, paso 3: cada planta ocupa lo que ocupa; 0.8.0`
2. `Traspaso al día: paso 3 hecho, issues todavía sin crear, skill con instalador`
3. `Los 38 issues, creados; el mapa de ideas enlaza a cada uno`
4. `El mapa de ideas marca los cimientos hechos` (y el artifact republicado)
5. `Análisis de arquitectura y epic #39 de reestructura` (21-9: `docs/arquitectura.html`, `docs/REESTRUCTURA.md`, issues #39 a #61)
6. La epic #39 (24-9): un commit por sub-issue, de `Herramientas que vigilan la arquitectura` (#40) a `Documentos y reglas al día; 0.9.0` (#56), más dos de apoyo (las capturas ampliadas y la manta de cerca). Cada commit dice `Closes #N`: los issues se cierran solos al mergear a `main`.

Falta mergearla a `main` (por PR o directo, como prefiera Facu).

## 3. Cómo trabaja Claude sobre el repo desde Cowork (el flujo que funcionó)

1. El repo es público: en la nube, `git clone https://github.com/facundo-p/huertita.git`, `npm ci`, trabajar y commitear ahí con autor `facundo-p <38925892+facundo-p@users.noreply.github.com>` y al pie `Co-Authored-By: Claude …`.
2. Antes de dar algo por hecho: `npm run tipos && npm test && npm run build:artifact && npm run humo` (humo necesita Playwright; en la nube alcanzó con un symlink de un playwright global dentro de `node_modules`, que está ignorado).
3. Exportar los commits nuevos: `git format-patch <base>..HEAD --stdout > x.patch`, dejar el archivo en la carpeta conectada (`~/Desarrollos/Personales/App-info-huerta/_parches/`) con `device_commit_files`, y aplicarlo en la Mac con `device_bash`: `git -c user.name=facundo-p -c user.email=… am ../_parches/x.patch`. Verificar que `git rev-parse 'HEAD^{tree}'` dé lo mismo en los dos lados. Borrar el parche después.
4. Desde Claude Code en la nube (sesión web) se puede clonar, trabajar, commitear, correr todo (tests, build y hasta el humo con Playwright), **pushear y crear issues**, siempre que el Claude GitHub App tenga acceso al repo. Si no lo tiene, push y API de issues dan 403 con el mismo mensaje ("Claude doesn't have GitHub access…") y hay que instalarlo o reconectarlo desde https://github.com/apps/claude/installations/select_target; mientras tanto, el trabajo sale por parche (`git format-patch main..HEAD --stdout`).
5. Desde Cowork, cosas que NO se pueden hacer: pushear; escribir `.github/workflows/*` (archivos protegidos; se dejan en `docs/workflows/` y Facu los mueve); crear repos o issues por la API de GitHub (403: la sesión solo tiene acceso a repos configurados). Crear el repo se hizo con el Chrome de Facu (extensión Claude in Chrome), y ese es el camino para issues si no se usa `gh`.
6. La VM de la Mac (`device_bash`) tiene git pero no credenciales; borrar archivos ahí pide permiso explícito (solo se pidió para lockfiles de git).
7. Para sesiones largas de puro código conviene Claude Code en la Mac: el `CLAUDE.md` del repo ya está pensado para eso. Cowork rinde cuando hay artifacts, docs y diseño de por medio.

## 4. Arquitectura, en una página

- TypeScript estricto, Vite 5, Vitest 2, tsx, Preact + signals, ESLint + Prettier. `npm run dev|build|build:artifact|test|tipos|lint|formato|bot|humo|capturas|datos:sync|datos:check`.
- Capas en un solo sentido: `datos → dominio → aplicacion → vista`, con `infra` como adaptadores (guardado, reloj); `arte → render → vista`. El dominio no toca DOM. El renderer no importa el dominio: recibe una `Escena` plana (`src/render/contrato.ts`). `tests/arquitectura.test.ts` lo vigila leyendo los `import`.
- **Estado v4**, JSON, azar con semilla (mulberry32): `meta` (v, semilla, rng, región, plantilla), `mundo` (el patio copiado de su plantilla, celdas, plantas, `estructuras` con la compostera), `tiempo` (década, turno, año, carácter, clima y pronóstico), `recursos` (ratos, riego, túnel, manta, sobres), `progreso` (cosechas, logros, cuaderno). Migra desde v1, v2 y v3; `tests/fixtures/` tiene una partida real de cada versión.
- **El orden de las llamadas a `azar` es contrato** y lo vigila el test dorado (`tests/dorado.test.ts`: el bot juega 8 años en cada patio y tiene que dar la foto guardada en `tests/fixtures/dorado.json`, balance y huella del estado). Si una regla cambia a propósito, `npm run dorado -- --guardar` y el diff va en el PR. El orden vive declarado en `src/dominio/sistemas/index.ts`. La comparación con el motor v0.4 se jubiló en la 0.10 (#68).
- `src/dominio/`: `acciones/` (cada acción es `puede / costo / aplicar`; la vista pregunta `puede()`), `sistemas/` (el paso del tiempo como dos tuberías: por planta y del patio), `textos/` (cada frase del cuaderno es una función con código), clima, región, patio, sol, espacio, factores, abrigo, diario, misiones, balance, migraciones. Los números del balance, en `datos/juego/reglas.ts`.
- `src/aplicacion/`: consultas para la pantalla (escena, HUD, fichas, almanaque) y casos de uso de la partida sobre el puerto `Almacen`. `src/infra/`: dispositivo (autoguardado y tres ranuras), nube del artifact, archivo, reloj.
- `src/vista/`: Preact. Máquina de modos (`modos.ts`, `transicion` pura), un componente por panel con su CSS al lado, tokens de color en `src/estilos/tokens.css`.
- `src/render/pixel/`: cámaras intercambiables (`camaras/`: cenital, oblicua, cerca); una cámara nueva es un archivo. `src/arte/`: una forma por archivo, estilos por especie. Nada con `@ts-nocheck`.
- **Cada planta ocupa lo que ocupa (0.8, paso 3):** el marco de plantación de cada especie vive en `datos/juego/especies.ts`. **Está apagado** hasta el paso 4: `conEspacioReal(fn)` lo prende (lo usan `tests/espacio.test.ts` y `npm run bot -- --espacio`).
- **Datos:** huertapp es la única fuente de verdad. `datos/catalogo.json` es un derivado con candado (`datos/fuente.lock.json`); `npm run datos:sync` lo regenera. Lo propio del juego vive en `datos/juego/`: `especies.ts`, `reglas.ts`, `patio.ts` + `patios/` (plantillas), `region.ts` + `regiones/` (hoy solo `gba.ts`: clima SMN Ezeiza, heladas FAUBA, años típicos, caducos, calendario de huertapp).
- **El patio y la región son datos.** Nadie fuera de `datos/juego/patios/` nombra una zona o celda concreta; nada fuera de `regiones/` supone el GBA ni el hemisferio sur (`tests/region.test.ts` juega un año en un GBA espejado en el norte).
- Redes para cambiar código sin cambiar el juego: el dorado, el bot, el humo y **las capturas** (`npm run capturas -- --guardar` antes, `--comparar` después: 293 huellas de píxeles de la gráfica, incluidos los efectos cuadro a cuadro).
- Balance actual: 14 ratos por década; riego por zona 0–3 con costo; arranque en década 22; estrellas por patio (fondo 30/70/120); abrigo manta +4, microtúnel +5, reparo fijo por zona.
- Tests: 468 verdes. `docs/ARQUITECTURA.md`, `docs/DATOS.md`, `docs/CIMIENTOS.md` y `CLAUDE.md` (13 innegociables) tienen el detalle.

## 5. Lo que se hizo en la sesión (para no repetirlo)

- **Paso 1 y 1b de los cimientos (0.5):** repo propio, TS, módulos, tests, sincronización con huertapp. El tipado destapó tres bugs del prototipo (temperaturas `null` que impedían germinar, `tolera_max` vacío que daba calor siempre, daño por exceso de riego que nunca disparaba).
- **Paso 2 (0.6):** patio como dato, sol por geometría, balcón en prueba, estado v2 con migración v1→v2, estrellas por patio, selector de patio en "Guardar y cargar".
- **0.7:** diario por planta (`pl.hist`, últimas 16 anotaciones; incluye lo que antes bajaba la salud en silencio: sed leve, plaga que sigue, y qué factor frenó el crecimiento); plantines con estado chico/listo/pasándose (`puntoDeTrasplante`) y flecha en el patio; la planta amarillea desde salud 80 y muestra una barrita bajo 60. Test: toda baja de salud de un año entero tiene explicación en el diario.
- Skill global `mapa-de-pendientes` propuesto (ver §7).
- **0.8 (sesión de Claude Code en la nube, 18-9):** paso 3 de los cimientos, con la regla de espacio apagada; `--espacio` en el bot; estado v3 con migración; `docs/traspaso/instalar-skill.sh`; `crear-issues.sh` regenerado desde `issues.json` (ahora también cierra el #27).
- **0.9 (24-9): la epic #39 entera**, #40 a #56. Registro, números de antes y después, y lo que quedó anotado para después, en `docs/REESTRUCTURA.md`. Se juega igual: el dorado siguió verde en cada commit y el bot da los mismos puntajes.
- **0.10 (25-9):** #63–#65 (arreglos de la revisión de la epic), #67 (Proceso en `CLAUDE.md`), #68 (dorado propio), y las ideas #7 compost, #6 sorpresas, #8 pedidos, #9 sonido. Estado v5 (migración desde v4). Detalle en el CHANGELOG.

## 6. Decisiones y deudas abiertas

- **Sol del patio original.** El fondo sigue con `sol: 'v04'` (la fórmula del prototipo). Con geometría real, un paredón de 1,8 m al norte deja sin sol directo en pleno invierno todo lo que esté a menos de ~2,6 m (cinco celdas): el bancal a suelo queda a oscuras de mayo a agosto, donde la fórmula vieja le daba 1 a 5 horas. **Decisión de Facu:** mover los canteros, bajar el paredón o aceptarlo. Va junto con el rebalanceo del paso 4.
- **Balcón:** todos sus números son supuestos de Claude, sin revisión ni balance (bot: 12–37 puntos; estrellas 10/25/45).
- **Almácigo protegido:** berenjena y batata no pueden germinar en su época (la almaciguera suma solo +2 °C y huertapp pide "almácigo protegido"). Test que documenta la contradicción.
- **Babosas bajo techo** (herencia del prototipo; corregirlo cambia el dorado).
- **Propiedad `movil`** no agregada hasta que haya mecánica de mover macetas.
- **Textos nuevos del diario (0.7)** redactados por Claude, pendientes de que Facu los revise.
- **83 huecos** en huertapp (`datos/HUECOS.md`).
- **GitHub Pages** hay que activarlo en Settings con fuente "GitHub Actions".

## 7. Lo que quedó a medio hacer (en este orden)

### a) Los Issues en GitHub — hecho el 18-9

Los **38 issues están creados**, en orden estricto y con la numeración del mapa de ideas: la idea 6
es el issue #6. Cerrados: #1 a #5 (hechos en v0.3 y v0.4) y #27 (paso 3, v0.8). El resto, abiertos.
https://github.com/facundo-p/huertita/issues

Se crearon por la API de GitHub desde la sesión en la nube. `docs/traspaso/crear-issues.sh` queda
como respaldo (se genera desde `issues.json`, no se edita a mano): **no volver a correrlo**, crearía
38 duplicados.

`docs/mapa-ideas.html` ya dice que los números son issues, cada punto enlaza al suyo y la sección
"En qué orden" marca los cimientos hechos. El artifact del mapa está republicado (versión 2).

Lo que quedó en los issues, para ubicarse:

| # | Título | Etiquetas | Estado |
|---|---|---|---|
| 1 | Almaciguera con varios plantines, raleo y repique | rabanito | cerrado (hecho v0.3) |
| 2 | Indicadores con el rango que pide cada especie | rabanito | cerrado (hecho v0.3) |
| 3 | Almanaque de siembra y ficha completa | rabanito | cerrado (hecho v0.3) |
| 4 | Guardar y cargar la huerta | rabanito | cerrado (hecho v0.4) |
| 5 | Protección de heladas que cumple lo que dice | rabanito | cerrado (hecho v0.4) |
| 6 | Eventos sorpresa | rabanito, enhancement | abierto (depende de #29) |
| 7 | Césped y poda como secos y verdes del compost | rabanito, enhancement | abierto |
| 8 | Pedidos de vecinos con fecha | rabanito, enhancement | abierto (depende de #29) |
| 9 | Sonido y ambiente | rabanito, enhancement | abierto |
| 10 | Patios prediseñados: balcón, terraza, fondo grande | rabanito, enhancement | abierto (avanzado: patio como dato + balcón) |
| 11 | Vacaciones de enero y otros desafíos anunciados | rabanito, enhancement | abierto (depende de #29) |
| 12 | Jugar de a 1 a 10 días | zapallo, enhancement | abierto (= paso 4, #28) |
| 13 | Feria vecinal: vender o trocar verdura | zapallo, enhancement | abierto |
| 14 | Editor del espacio | zapallo, enhancement | abierto |
| 15 | Tamaño real de cada planta y marcos de plantación | zapallo, enhancement | abierto (el motor ya lo hace desde v0.8 (#27); falta prenderlo en el paso 4) |
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
| 27 | Cimientos, paso 3: plantas con huella propia y contenedores con capacidad | cimientos, zapallo | cerrado (hecho v0.8, apagado hasta el paso 4) |
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

La idea 15 (tamaño real y marcos) sigue sin marcarse como hecha en el mapa: el motor ya lo hace, pero el juego lo va a mostrar recién en el paso 4.

### b) El skill global `mapa-de-pendientes` — Facu lo pidió dos veces y todavía no lo tiene

Pedido: *"quiero que este cuadro de dos ejes con 'impacto/costo de implementación' y 'impacto/ganancia en calidad del producto' forme parte de un skill global al que pueda invocar en otros proyectos. Que agarre la lista de pendientes (Issues por ejemplo) y me los organice así como hiciste acá, en un artifact así de maravilloso. La estética puede ser esta misma o adecuarse a la del proyecto (si eso no lo vuelve más costoso)."*

El SKILL.md completo está en `docs/traspaso/SKILL-mapa-de-pendientes.md`, con la plantilla HTML probada (30 puntos, celular y escritorio, tema claro y oscuro, puntos que se separan sin salirse de su cuadrante, enlace al issue, dependencias, marca de estimación floja).

**Lo más corto para que lo tenga:** en la Mac, desde el repo, `bash docs/traspaso/instalar-skill.sh`. Copia el archivo a `~/.claude/skills/mapa-de-pendientes/SKILL.md` y queda disponible en todos sus proyectos de Claude Code (`/mapa-de-pendientes`). La sesión de Claude Code en la nube no tiene `propose_skills`; si la sesión nueva sí lo tiene (Cowork), se puede volver a proponer con kind `new`, nombre `mapa-de-pendientes` y ese SKILL.md tal cual, avisándole que tiene que tocar "guardar" en la tarjeta.

Después de crear los issues, la primera prueba real del skill es correrlo sobre `facundo-p/huertita`: debería reproducir el mapa de ideas con los 38 issues.

### c) El paso 3 ya está hecho (0.8). Lo que sigue: decidir #31 y arrancar el paso 4 (#28)

Lo que quedó del paso 3, en `src/dominio/espacio.ts`, `datos/juego/especies.ts` y `tests/espacio.test.ts`: marco de plantación por especie, huella de 1, 2 o 4 celdas, densidad por celda (9 rabanitos, 4 lechugas, 1 tomate), `capacidad` de bandeja en las zonas de cría (50), sombra de las plantas altas y estado v3 con migración. **La regla está apagada**: prenderla cambia rendimientos, azar y balance, y va con el rebalanceo del paso 4.

Cuánto hay que rebalancear, medido con `npm run bot -- --espacio` (8 semillas, un año):

| Patio | Apagado (hoy) | Prendido |
| --- | --- | --- |
| fondo (3 estrellas = 120) | 112–141 puntos | 276–647 |
| balcón (3 estrellas = 45) | 12–37 | 87–175 |

O sea: con el espacio real, una celda de 9 rabanitos rinde 9 veces. Los números de estrellas, los ratos y el rendimiento por planta son todos del paso 4.

El orden que queda, entonces:

1. **#31, el sol del fondo** (decisión de diseño de Facu): fórmula v0.4, o geometría moviendo los canteros, o geometría bajando el paredón, o geometría y aguantarse el invierno oscuro. Con geometría, además, las plantas altas se sombrean entre sí. Todo el rebalanceo del paso 4 depende de esto.
2. **#28, paso 4:** tic diario y `avanzar(estado, días)` de 1 a 10 días, ratos por día con tope, pronóstico de 5 días. Ahí se regenera el dorado (y se anota en CHANGELOG, innegociable 7), se prende el espacio real, se arregla lo de las babosas bajo techo (#34) y se rebalancea todo junto.
3. Cuando el espacio real se prenda, dos cosas de interfaz que quedaron pendientes a propósito: mostrar el marco en la ficha ("ocupa 4 celdas", "entran 9 por celda") y dibujar una planta grande como una sola planta grande, no como la misma planta repetida — la escena ya marca cuál es la celda ancla (`ancla`), los renderers ya dibujan una sola vez, pero el sprite no crece con la huella. Va con #30.

### c bis) La reestructura: epic #39 — hecha (0.9, 24-9)

Facu pidió una epic para reestructurar el código y un análisis de arquitectura con alternativas
(artifact [Arquitectura de Huertita](https://claude.ai/artifact/Tn8F6G1vQ9qk2yUDK9kVS4), fuente
`docs/arquitectura.html`). Lo aprobó y se ejecutó entera: los 17 sub-issues, un commit cada uno, en la
rama de trabajo. Decisiones de Facu que se respetaron (no volver a preguntar): **Preact + signals**;
epic = solo reestructura; dominio antes del paso 4 y de #31, con el dorado como red; regiones sin
repetir lo universal de la especie.

Quedan fuera de la epic, como issues propios: #57 otras regiones, #58 pantalla de cosechado, #59
construir y quitar en la partida, #60 vista de cerca por celda, #61 dinero. La base para cada uno ya
está (región como dato, estado v4 con `estructuras`, cámaras como archivos, consultas).

### e) La primera tanda del cuadro: #6, #7, #8, #9 — hecha (0.10, 25-9), esperando revisión

Un PR con un commit por issue. Todo lo que no sale de huertapp va [SUPUESTO] y el PR lo lista aparte
para Facu: las filas de `datos/juego/sorpresas.ts` y `datos/juego/pedidos.ts`, `REGLAS.sorpresas`,
`REGLAS.pedidos` y `REGLAS.jardin` (cuántos secos y verdes da cada cosa). El bot todavía no mira los
pedidos. #29 (contenido como tablas) sigue abierto: faltan logros e ítems. Lo que sigue en el cuadro,
por costo e impacto: #11 vacaciones de enero y #10 patios prediseñados.

### d) Chequeos rápidos cuando se retome

- ¿Guardó el skill (§7b)? ¿Activó Pages (#37)? ¿Mergeó la rama del paso 3 a `main`?
- ¿Decidió el sol del fondo (#31)? Sin eso, el paso 4 no arranca bien.
- Reproducir el estado: clonar, `npm ci`, `npm run tipos && npm run lint && npm test` (590 tests) y
  `npm run humo` (necesita Playwright: se usa el del proyecto o, si no hay, el global; no hace falta
  symlink). Antes de tocar la gráfica, `npm run build:artifact && npm run capturas -- --guardar`.
- El juego publicado está en 0.10 (versión 8 del artifact, desde la rama del PR #69): Facu lo está
  probando. Si pide cambios de lo que ve, van en issues nuevos.

## 8. Cosas que Facu ya dijo y no hay que volver a preguntar

- Repo `huertita`, público, creado desde su Chrome el 17-9.
- No clonar bases de datos: huertapp es la única fuente; el juego guarda un derivado con candado. Extraer un paquete compartido solo si aparece un tercer consumidor.
- Quiere jugar de a 1 a 10 días (paso 4), con ratos por día con tope.
- Le gustó el mapa de ideas visual y el diario por planta. Pidió el mapa como skill reutilizable en todos sus proyectos.
- Bugs que reportó y ya están resueltos: manta que no protegía (v0.4), plantines "siempre plantín" (era falta de señal: v0.7), salud no visible en el dibujo (v0.7), falta de diario por planta (v0.7).
