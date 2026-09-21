# Reestructura: la epic #39

Versión corta y durable del análisis de arquitectura. La larga, con alternativas y pros y contras, es
`docs/arquitectura.html` (publicada como artifact; el enlace está en la epic). Escrito el 21 de
septiembre de 2026 sobre la versión 0.8.

## Por qué

El juego va a seguir sumando funcionalidades y el código de hoy no lo aguanta: la interfaz es un archivo
de 420 líneas sin tipos que arma HTML a mano y repite reglas del motor; el renderer tiene tres cámaras
en una clase; las reglas del motor traen la prosa y los números adentro; `Estado` es una bolsa plana de
30 campos; el patio es una referencia estática; el clima está clavado al GBA.

Lo que aguanta se conserva: motor puro en capas, estado JSON, azar con semilla, escena plana para el
renderer, el patio como dato, `[REPO]`/`[SUPUESTO]`, el test dorado.

## Diagnóstico (números del 21-9)

| Qué | Dónde |
| --- | --- |
| 5 archivos con `@ts-nocheck` | `src/ui`, `src/render`, `src/arte` |
| Líneas de más de 200 caracteres | `ui.ts` 98/420, `pixel.ts` 69/348, `sprites.ts` 35, `tiempo.ts` 21 |
| Ternarios | `ui.ts` 154, `pixel.ts` 103, `tiempo.ts` 36 |
| Literales sueltos de etapa/zona/evento | 127 (`tiempo.ts` 53, `pixel.ts` 41, `acciones.ts` 33) |
| `CeldaId` parseada o armada a mano | 25 |
| Mecanismos de guardado inline en la vista | 5 |
| Reglas repetidas en la vista | `movible` en `panelCelda` copia `trasplantar`; los botones de acción copian sus validaciones |
| Tubería de acciones repetida | 13 acciones, `return SIN_RATOS` ×8 |
| Campos planos en `Estado` | 30 |

## Adónde va

```
datos/            contenido validado: catálogo huertapp, especies, patios (plantillas), regiones, reglas (los números), textos
src/dominio/      hoy motor: vocabulario, sistemas del tiempo con orden declarado, acciones con puede / costo / aplicar
src/aplicacion/   casos de uso (partida, jugar, avanzar) y consultas (escena, hud, fichas), para que la vista sea tonta
src/infra/        adaptadores: puerto Almacen (local, ranuras, código, archivo, nube), reloj
src/vista/        Preact + signals: carcasa, máquina de modos, paneles, CSS con tokens
src/render/       renderers tipados (pixel por cámaras, texto) + src/arte tipado
```

`Estado` v4 con forma: `meta · mundo · tiempo · recursos · progreso`. El patio adentro de la partida
(copia editable, con `estructuras`); la región como dato (GBA única, por ahora).

Lo universal y lo regional: la especie (`tg`, `tc`, `dg`, `dc`, `helada`, familia, marco) viene de
huertapp y es la misma en todo el planeta. La región trae clima, heladas, latitud, hemisferio, caracteres
y textos; el calendario se deriva del clima y se valida contra el del GBA de huertapp; una capa regional
opcional (overrides, especies locales) tiene la misma forma parcial que huertapp.

## Decisiones tomadas (18-9, Facu)

- Vista nueva con **Preact + signals**.
- La epic es **solo reestructura**. Las features que habilita son issues aparte: #57 regiones, #58
  cosechado, #59 construir, #60 vista por celda, #61 dinero.
- **La fase de dominio va antes del paso 4 (#28) y de #31**: mientras viva el test dorado, cada
  sub-issue del motor se comprueba decimal por decimal. Vista y render, en paralelo.
- Regiones: derivar del clima lo que cambia; no repetir lo que no cambia.

## Alternativas descartadas, en una línea cada una

- **ECS puro:** sobra a 50 plantas y le cuesta legibilidad a un humano. Se toma solo la idea de
  sistemas con orden declarado.
- **Todo en un reducer estilo Redux:** el motor ya es el reducer de la partida. MVU solo para la vista.
- **Dominio con clases:** choca con "el estado es JSON" y con el dorado.
- **Lit, vanilla, Solid** para la vista: más pesado, reinventar Preact peor, o sin ventaja.
- **Patio como referencia más lista de cambios:** más código que la copia editable, para lo mismo.
- **Datasets completos por región:** duplica lo universal y contradice el innegociable 1.
- **#28 antes de la reestructura:** después el motor se ordena sin el dorado como red.

## Los issues

Epic **#39**. Cada sub-issue cierra sola, con el gate verde
(`npm run tipos && npm test && npm run build:artifact && npm run humo`, más `lint` desde #40). En la
fase 1, además, el dorado sigue verde.

| Fase | # | Qué | Cuadrante |
| --- | --- | --- | --- |
| 0 · Andamiaje | #40 | Herramientas que vigilan la arquitectura: ESLint, Prettier, test de capas y de deuda que solo baja | rabanito |
| | #41 | Vocabulario del dominio en un solo lugar: uniones con nombre, `celda(x,y)`/`xy()`, ayudantes de planta | rabanito |
| 1 · Dominio | #42 | Balance y supuestos como tabla (`datos/juego/reglas.ts`) | rabanito |
| | #43 | Textos fuera de las reglas (`src/dominio/textos/`, eventos con código) | zapallo |
| | #44 | Acciones como reglas: `puede / costo / aplicar`; la vista pregunta, no repite | zapallo |
| | #45 | El tiempo como sistemas: tubería declarada, `DIAS` en un solo lugar | zapallo |
| | #46 | Consultas para la vista (`src/aplicacion/consultas/`, memo del sol) | zapallo |
| | #47 | El estado con forma (v4) y el patio adentro de la partida | zapallo |
| | #48 | Región como dato (GBA única, conducta idéntica) | zapallo |
| 2 · Vista | #49 | Esqueleto con Preact + signals, mensajes tipados, strangler | zapallo |
| | #50 | La interfaz como máquina de modos | rabanito |
| | #51 | Persistencia como puerto (`Almacen`, cinco adaptadores) | rabanito |
| | #52 | Paneles, tanda 1: sembrar, celda, riego, proteger (espera #44) | zapallo |
| | #53 | Paneles, tanda 2: el resto; CSS con tokens; desaparece `ui.ts` | zapallo |
| 3 · Render | #54 | Arte tipado | rabanito |
| | #55 | Renderer pixel por cámaras | zapallo |
| 4 · Cierre | #56 | Documentos y reglas al día | rabanito |

Orden: los tres carriles (dominio, vista, render) avanzan a la vez; el único cruce es #52, que espera
a #44. Después de la fase 1: #31 y #28.

Features habilitadas, fuera de la epic: #57 otras regiones (depende de #48), #58 pantalla de cosechado
(#47, #53), #59 construir y quitar en la partida (#47, #44), #60 vista de cerca por celda (#55),
#61 dinero (#47).

## Relación con los cimientos

- #30 (paso 6) queda cubierto por #49–#55.
- #28 (paso 4) y #31 van después de la fase 1.
- #29 (paso 5) se achica: #42 y #43 ya llevan números y textos a datos.

## Lo que queda para Facu

Si huertapp crece con regiones a la larga; qué pasa con una partida cuando cambia su plantilla; un tope
de tamaño para el artifact; la PWA como issue propio.
