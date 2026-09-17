# Huertita — reglas para trabajar en este repo

Juego de huerta urbana agroecológica del GBA. Objetivo: divertido, disfrutable, desafiante (recursos finitos) y fiel a la realidad, para que jugando se aprenda a tener una huerta.

## Innegociables
1. **huertapp es la única fuente de datos agronómicos.** Nunca editar `datos/catalogo.json` ni `datos/fuente.lock.json` a mano: se regeneran con `npm run datos:sync`. Si un dato está mal, se corrige en huertapp.
2. **El juego simplifica, nunca contradice.** Todo número va marcado `[REPO]` o `[SUPUESTO]`. Un supuesto nuevo se anota y, si completa un hueco de una especie, va en `datos/juego/especies.ts` para que aparezca en `sup`.
3. **Agroecológico:** ningún producto de síntesis, ni en mecánicas ni en textos.
4. **Dependencias en un sentido:** `datos → motor → ui`; `arte → render → ui`. El motor no toca DOM. El renderer no importa el motor.
5. **El estado es JSON y el azar tiene semilla.** Nada de `Math.random()` ni `Date.now()` en `src/motor`. Si cambia la forma de `Estado`: subir `v` y escribir la migración.
6. **El orden de las llamadas a `azar` es parte del contrato** mientras viva el test dorado. Si una regla cambia a propósito, el test dorado se jubila en ese mismo PR y se anota en CHANGELOG.
7. Textos en rioplatense, de vos. Cuando algo sale mal, el cuaderno dice por qué y qué lo habría evitado, y tiene que ser verdad (hay tests de eso).
8. Estética: añil, maíz, ladrillo, acequia, hoja. Nada desaturado ni genérico.

## Antes de dar algo por hecho
`npm run tipos && npm test && npm run build:artifact && npm run humo`

## Dónde está cada cosa
README (mapa de carpetas), docs/ARQUITECTURA.md, docs/DATOS.md, docs/CIMIENTOS.md (lo que falta, en orden).
