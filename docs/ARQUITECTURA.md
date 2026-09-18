# Arquitectura

Tres reglas sostienen todo lo demás.

1. **Las dependencias van en un solo sentido:** `datos → motor → ui`, y `arte → render → ui`. El motor no sabe que existe una pantalla. El renderer no conoce el motor: recibe una `Escena` plana (`src/render/contrato.ts`).
2. **El estado es un JSON y el azar tiene semilla.** De ahí salen gratis el guardado, las partidas reproducibles, los tests sin navegador y el bot. Todo cambio de forma del estado sube `v` y agrega un paso en `src/motor/migraciones.ts`.
3. **El juego puede simplificar, nunca contradecir a huertapp.** `[REPO]` y `[SUPUESTO]` marcan de dónde sale cada número, y `tests/catalogo.test.ts` lo vigila.

## El motor por dentro

| Módulo | Qué hace |
| --- | --- |
| `tipos.ts` | `Estado`, `Planta`, `Accion` (unión discriminada), `Evento` |
| `catalogo.ts` | Une `datos/catalogo.json` con `datos/juego/especies.ts`: especies sin huecos |
| `clima.ts` | Normales SMN, heladas FAUBA, carácter del año, tiempo de cada década y su pronóstico |
| `patio.ts` | Lo que el motor le pregunta al patio de la partida: qué zona es cada celda, qué propiedades tiene, cuánto sol le da |
| `sol.ts` | Horas de sol por geometría: latitud, fecha y obstáculos. Y la fórmula vieja del fondo, mientras viva el test dorado |
| `espacio.ts` | Cuánto lugar ocupa cada planta: huella en celdas, cuántas entran en una celda, qué sombra hace. Apagado hasta el paso 4 |
| `factores.ts` | Luz, agua, temperatura, suelo, vecinos; y el fantasma de siembra |
| `abrigo.ts` | Manta, microtúnel y el reparo fijo de cada zona: grados de abrigo y riesgo de helada |
| `acciones.ts` | `despachar(estado, accion)`: todo lo que hace el jugador |
| `tiempo.ts` | `pasarDecada`: germinar → helar → semillar → crecer → estresar → plagas → espigar → madurar |
| `diario.ts` | El diario de cada planta: lo que le pasó y por qué tiene la salud que tiene |
| `misiones.ts`, `balance.ts`, `migraciones.ts` | Logros, puntaje, partidas viejas |

## El patio es un dato

Un patio (`datos/juego/patio.ts`) es un plano de letras con el norte arriba, una lista de zonas y una lista de obstáculos. Los patios viven en `datos/juego/patios/`, uno por archivo, y `validarPatio` los revisa en los tests.

- **Zona:** un grupo de celdas que se riega y se tapa junto. Sus propiedades son lo único que el motor mira: `cria` (almaciguera), `techo` (no le llueve), `abrigo` (reparo fijo contra heladas), `calor`, `admiteTunel`, `macetas` (tamaño por celda), más suelo, materia orgánica, drenaje, hondo y costo de riego. El `id` es libre y queda escrito en las partidas; el `tipo` (`suelo`, `cajon`, `macetas`, `almaciguera`) decide cómo se dibuja.
- **Obstáculo:** `muro` (con `opacidad` para barandas), `arbol` (copa, fuste, caduco) o `losa` (el balcón de arriba). En celdas con decimales y alturas en metros.
- **Sol:** `sol.ts` recorre el día cada 10 minutos, calcula dónde está el sol a 34,6° S y ve si algún obstáculo lo tapa. Cuenta desde que supera el `horizonte` del patio. `tests/sol.test.ts` comprueba que se porte como el sol de verdad: mediodía al norte, paredón norte que sombrea más en invierno, techo que tapa el sol alto del verano.
- **Regla:** ni el motor, ni los renderers, ni la interfaz nombran una zona o una celda de un patio en particular. Hay un test que lo vigila. Las frases se arman con `nombre` y `conArticulo`.
- **Estado:** `E.patio` guarda el id. Si un patio cambia su plano o sus ids de zona, las partidas guardadas en él necesitan una migración, igual que si cambiara `Estado`.

Sumar un patio: crear el archivo, anotarlo en `patios/index.ts`, correr `npm test` (lo valida y hace jugar al bot un año en él) y `npm run bot -- --patio <id>` para ver cómo rinde.

## Cada planta ocupa lo que ocupa

`datos/juego/especies.ts` guarda el marco de plantación de cada especie ([SUPUESTO]: los
centímetros entre plantas de la huerta agroecológica del GBA, que huertapp todavía no trae). De ahí
salen tres cosas: la **huella** (1, 2 o 4 celdas de 0,5 m que tapa una planta hecha), cuántas
**entran en una celda** —9 rabanitos, 4 lechugas, 1 tomate— y cuánto **levanta**, que es lo que le
sombrea a lo que tiene al lado. Las zonas de cría suman `capacidad`: los plantines de una bandeja.

El motor lo usa entero: sembrar y trasplantar toman el bloque de celdas y avisan cuando no entra,
el raleo deja las que caben, la cosecha rinde por planta, la competencia empieza cuando se pasa de
la densidad, y las plantas altas entran como obstáculos temporales en el cálculo de sol.

**Está apagado** (`src/motor/espacio.ts`): mientras viva el test dorado, el juego corre con huella 1
y una planta por celda, que es como venía jugando. Se prende en el paso 4 (ver `docs/CIMIENTOS.md`).
`conEspacioReal(fn)` lo prende para los tests.

## El test dorado

`tests/dorado.test.ts` hace jugar al bot un año entero con 8 semillas en el motor nuevo y en el del prototipo (`tests/legado/motor-v04.cjs`) y exige el mismo estado final, decimal por decimal. Mientras esté verde, mover código es seguro. Cuando una regla cambie a propósito (el tic diario, por ejemplo), el test se jubila en el mismo PR y el cambio se anota en el CHANGELOG.

## Lo que todavía no está tipado

`src/arte`, `src/render` y `src/ui` están portados tal cual del prototipo, con `// @ts-nocheck`. Funcionan y están probados en navegador (`npm run humo`), pero la interfaz arma HTML a mano en un solo archivo y no va a escalar: el paso 6 de los cimientos la reescribe por componentes.
