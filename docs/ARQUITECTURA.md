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
| `patio.ts` | El patio: mapa, zonas, macetas, horas de sol. Hoy escrito a mano; será un dato |
| `factores.ts` | Luz, agua, temperatura, suelo, vecinos; y el fantasma de siembra |
| `abrigo.ts` | Manta, microtúnel, alero: grados de abrigo y riesgo de helada |
| `acciones.ts` | `despachar(estado, accion)`: todo lo que hace el jugador |
| `tiempo.ts` | `pasarDecada`: germinar → helar → semillar → crecer → estresar → plagas → espigar → madurar |
| `misiones.ts`, `balance.ts`, `migraciones.ts` | Logros, puntaje, partidas viejas |

## El test dorado

`tests/dorado.test.ts` hace jugar al bot un año entero con 8 semillas en el motor nuevo y en el del prototipo (`tests/legado/motor-v04.cjs`) y exige el mismo estado final, decimal por decimal. Mientras esté verde, mover código es seguro. Cuando una regla cambie a propósito (el tic diario, por ejemplo), el test se jubila en el mismo PR y el cambio se anota en el CHANGELOG.

## Lo que todavía no está tipado

`src/arte`, `src/render` y `src/ui` están portados tal cual del prototipo, con `// @ts-nocheck`. Funcionan y están probados en navegador (`npm run humo`), pero la interfaz arma HTML a mano en un solo archivo y no va a escalar: el paso 6 de los cimientos la reescribe por componentes.
