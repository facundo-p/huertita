# Huertita — reglas para trabajar en este repo

Juego de huerta urbana agroecológica del GBA. Objetivo: divertido, disfrutable, desafiante (recursos finitos) y fiel a la realidad, para que jugando se aprenda a tener una huerta.

## Innegociables
1. **huertapp es la única fuente de datos agronómicos.** Nunca editar `datos/catalogo.json` ni `datos/fuente.lock.json` a mano: se regeneran con `npm run datos:sync`. Si un dato está mal, se corrige en huertapp.
2. **El juego simplifica, nunca contradice.** Todo número va marcado `[REPO]` o `[SUPUESTO]`. Un supuesto nuevo se anota y, si completa un hueco de una especie, va en `datos/juego/especies.ts` para que aparezca en `sup`.
3. **Agroecológico:** ningún producto de síntesis, ni en mecánicas ni en textos.
4. **Dependencias en un sentido:** `datos → dominio → aplicacion → vista`, con `infra` como adaptadores; `arte → render → vista`; `sonido → vista`. El dominio (el motor del juego, `src/dominio`) no toca DOM. El renderer no importa el dominio. `tests/arquitectura.test.ts` lo vigila.
5. **El patio es un dato.** Nadie fuera de `datos/juego/patios/` nombra una zona o una celda concreta; el motor decide por propiedades de la zona (`cria`, `techo`, `abrigo`…), el renderer por su `tipo`. Hay un test que lo vigila.
6. **El estado es JSON y el azar tiene semilla.** Nada de `Math.random()` ni `Date.now()` en `src/dominio`. Si cambia la forma de `Estado`: subir `v` y escribir la migración.
7. **El orden de las llamadas a `azar` es parte del contrato:** el test dorado (`tests/fixtures/dorado.json`) lo vigila. Si una regla cambia a propósito, la foto se regenera en ese mismo PR (`npm run dorado -- --guardar`), el diff queda para revisar y el cambio se anota en CHANGELOG.
8. Textos en rioplatense, de vos. Cuando algo sale mal, el cuaderno dice por qué y qué lo habría evitado, y tiene que ser verdad (hay tests de eso).
9. Estética: añil, maíz, ladrillo, acequia, hoja. Nada desaturado ni genérico.
10. **Los textos viven en `src/dominio/textos/`.** Cada frase es una función con nombre que devuelve `{ codigo, texto }`; las reglas no arman frases.
11. **Los números del balance viven en `datos/juego/reglas.ts`**, con su unidad y su marca. Un número suelto en una regla es un bug.
12. **La vista pregunta `puede()`**, nunca repite una regla del dominio. Si un botón no debería estar, la condición va en la acción (`src/dominio/acciones/`).
13. **Una cámara nueva es un archivo** en `src/render/pixel/camaras/`; un patio, en `datos/juego/patios/`; una región, en `datos/juego/regiones/`. Si sumar uno obliga a tocar otro lado, algo está mal repartido.

## Proceso
- **Toda tarea es primero un issue**, aunque sea chica. Lo que aparece en el camino y no entra en el trabajo actual se anota como issue nuevo, no queda en un comentario.
- **Cada issue se cierra con un PR** que lo nombra (`Closes #N`) y lo cierra al mergearse. Un PR por issue cuando se puede; si varios van juntos, un commit por issue, cada uno con su `Closes #N`, y el PR los lista todos.
- Un issue que el PR no termina no se cierra: el PR dice qué queda y el issue sigue abierto.
- Mecánicas, eventos o números que no salen de huertapp llevan `[SUPUESTO]` y **necesitan la revisión de Facu antes de entrar**: el PR los lista en una sección aparte.
- El merge lo decide Facu.

## Antes de dar algo por hecho
`npm run tipos && npm run lint && npm test && npm run build:artifact && npm run humo`. Si el cambio no debería tocar la gráfica, además `npm run capturas -- --comparar`, con la referencia guardada con `--guardar` **antes** de tocar nada (queda en `.capturas/`, fuera de git). `npm run lint` tiene un tope de avisos que solo baja: si limpiás algo, bajalo en `package.json`. `npm run formato` antes de commitear.

## Dónde está cada cosa
README (mapa de carpetas), docs/ARQUITECTURA.md (capas, estado, dominio, vista, gráfica, qué vigila qué), docs/DATOS.md, docs/CIMIENTOS.md (lo que falta, en orden). docs/traspaso/TRASPASO-huertita.md: estado, forma de trabajo y pendientes, para arrancar una sesión nueva. docs/REESTRUCTURA.md: registro de la epic #39 (por qué el código quedó como quedó).
