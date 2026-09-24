# Arquitectura

Tres reglas sostienen todo lo demás.

1. **Las dependencias van en un solo sentido.** El juego va `datos → dominio → aplicacion → vista`, con `infra` como adaptadores que la vista enchufa. La gráfica va `arte → render → vista`. El dominio no sabe que existe una pantalla. El renderer no conoce el dominio: recibe una `Escena` plana (`src/render/contrato.ts`). `tests/arquitectura.test.ts` lee los `import` de cada archivo y falla si alguien cruza al revés.
2. **El estado es un JSON y el azar tiene semilla.** De ahí salen gratis el guardado, las partidas reproducibles, los tests sin navegador y el bot. Todo cambio de forma del estado sube `v` y agrega un paso en `src/dominio/migraciones.ts`.
3. **El juego puede simplificar, nunca contradecir a huertapp.** `[REPO]` y `[SUPUESTO]` marcan de dónde sale cada número, y `tests/catalogo.test.ts` lo vigila.

## Las capas

| Carpeta | Qué es | Puede importar |
| --- | --- | --- |
| `datos/` | El catálogo de huertapp y lo que agrega el juego: especies, reglas de balance, plantillas de patio, regiones | nada |
| `src/dominio/` | La simulación: estado, acciones, el paso del tiempo, textos del cuaderno. Sin DOM, sin reloj, sin `Math.random` | `datos/` |
| `src/aplicacion/` | Casos de uso de las partidas y consultas que arman lo que muestra la pantalla, como objetos planos | `datos/`, `dominio/` |
| `src/infra/` | Adaptadores: dónde se guarda (dispositivo, nube, archivo) y el reloj | `dominio/` |
| `src/vista/` | Componentes Preact con signals: los paneles, la barra, el patio | todo lo anterior, `render/`, `arte/` |
| `src/arte/` | Los dibujos pixel-art de cada especie y estadío | nada |
| `src/render/` | Renderers intercambiables. Reciben una escena plana, nunca el estado | `arte/` |

Los `import type` no cuentan: se borran al compilar y no acoplan nada en ejecución.

## El estado

`Estado` (`src/dominio/tipos.ts`, formato v4) tiene cinco partes y ningún campo suelto:

| Parte | Qué guarda |
| --- | --- |
| `meta` | versión, semilla y azar, región, de qué plantilla salió el patio, cuándo se guardó |
| `mundo` | el patio (una copia propia de la plantilla), las celdas, las plantas y lo construido (`estructuras`: hoy, la compostera) |
| `tiempo` | década, turno, año, carácter del año, el clima de la década y su pronóstico, si terminó |
| `recursos` | ratos gastados, riego, microtúneles, mantas, goteo, sobres de semilla, generaciones de semilla propia |
| `progreso` | lo cosechado, porciones, semillas guardadas, visitas de polinizadores, logros, el cuaderno |

Las partidas guardadas en v1, v2 y v3 migran solas al cargarse. `tests/fixtures/` tiene una partida real de cada versión, y los tests y el humo prueban que migran y siguen jugando.

## El dominio por dentro

| Módulo | Qué hace |
| --- | --- |
| `tipos.ts`, `vocabulario.ts` | `Estado`, `Planta`, `Accion` (unión discriminada), `Evento`; las listas cerradas (etapas, plagas, ventanas…) y el único que conoce el formato `"x,y"` de una celda |
| `planta.ts` | `especieDe`, `vivas`, `nombreDe`: lo que se pregunta de una planta sin repetirlo |
| `catalogo.ts` | Une `datos/catalogo.json` con `datos/juego/especies.ts`: especies sin huecos. `ventana` lee el calendario de la región |
| `acciones/` | Cada acción es una `Regla`: `puede` (si se puede y, si no, por qué), `costo` (ratos) y `aplicar`. `despachar` y `puede` las recorren. La vista pregunta `puede()` para decidir qué botones mostrar |
| `tiempo.ts`, `sistemas/` | `pasarDecada` corre dos tuberías: `SISTEMAS_POR_PLANTA` (germinar, helar, semillar o secarse, medir, crecer, estresar, plagas, espigar, madurar) y `SISTEMAS_DEL_PATIO` (avisos, compost, cierre del turno, pronóstico, riego). **El orden es contrato**: cada sistema que tira dados consume el azar de la partida. `tests/sistemas.test.ts` lo vigila |
| `textos/` | Cada frase del cuaderno y del diario es una función con nombre que devuelve `{ codigo, texto }`. Las reglas no arman frases |
| `clima.ts`, `region.ts` | El tiempo de cada década y su pronóstico, sorteados alrededor de las normales de la región; la estación y cuánto es invierno |
| `patio.ts`, `estructuras.ts` | Lo que el dominio le pregunta al patio de la partida (qué zona es cada celda, cuánto sol le da) y a la compostera |
| `sol.ts` | Horas de sol por geometría: latitud de la región, fecha y obstáculos. Y la fórmula vieja del fondo, mientras viva el test dorado |
| `espacio.ts` | Cuánto lugar ocupa cada planta: huella en celdas, cuántas entran en una celda, qué sombra hace. Apagado hasta el paso 4 |
| `factores.ts`, `abrigo.ts` | Luz, agua, temperatura, suelo, vecinos, el fantasma de siembra; manta, microtúnel y reparo fijo contra la helada |
| `diario.ts`, `misiones.ts`, `balance.ts`, `migraciones.ts` | El diario de cada planta, los logros, el puntaje, las partidas viejas |

Los números del balance (probabilidades, daños, ratos, arranque) viven en `datos/juego/reglas.ts`, cada uno con su unidad y su marca `[REPO]` o `[SUPUESTO]`. El dominio los lee de ahí.

## La aplicación y la infraestructura

`src/aplicacion/consultas/` arma, a partir del estado, lo que muestra cada parte de la pantalla: la escena para el renderer, el HUD, la ficha de una celda, la de una especie, el almanaque, el riesgo de helada por zona. Son funciones puras que devuelven objetos planos, sin HTML.

`src/aplicacion/partidas.ts` tiene los casos de uso de una partida (guardar, nueva, código para llevarla a otro lado, nombre del archivo) sobre un puerto `Almacen`. `src/infra/` tiene sus adaptadores: el autoguardado y las tres ranuras en el dispositivo, la nube del artifact de Claude, el archivo, el reloj. Sin `localStorage` se juega igual.

## La vista

`src/vista/` es Preact con signals. El estado de la interfaz es una máquina de modos (`modos.ts`: `ModoUI` es una unión discriminada y `transicion(modo, evento)` es pura, con tests sin DOM). Cada panel es un componente en `paneles/`, las piezas que se repiten están en `piezas/`, y cada uno trae su CSS al lado; los colores son variables de `src/estilos/tokens.css`. Los botones de acción salen de `puede()`: la vista nunca repite una regla del dominio.

`arrancar.tsx` carga la partida guardada (o arranca una nueva), monta la app, busca la nube y deja `window.Huertita` para el humo y las capturas.

## La gráfica

`src/render/contrato.ts` es todo lo que la vista sabe de la gráfica: un `Renderer` monta, dibuja una `Escena`, avisa qué celda se tocó y, si quiere, ofrece cámaras y efectos. Hay dos: el pixel-art y uno de texto (una grilla de emojis) que existe para probar que son intercambiables.

`src/render/pixel/` recorre la cámara elegida. Una `Camara` (`camaras/tipos.ts`) arma su geometría, pinta su fondo y, si quiere, algo antes y después de las plantas; lo que cambia de las plantas según desde dónde se las mire (sombra en el piso, avisos, dónde apoyan) es un dato de su geometría. Hay tres: `cenital`, `oblicua` y `cerca` (un cantero de frente con el suelo cortado). **Una cámara nueva es un archivo.** Plantas, capas de información, efectos y clima son comunes.

`src/arte/` dibuja cada especie en cada etapa con un pincel de píxel gordo: `estilos.ts` dice qué forma y qué colores lleva cada una, y cada forma está en `formas/`. Una especie nueva de huertapp sin estilo propio usa la forma de su grupo.

## El patio es un dato

Un patio (`datos/juego/patio.ts`) es un plano de letras con el norte arriba, una lista de zonas, una de obstáculos y una de estructuras. Las plantillas viven en `datos/juego/patios/`, una por archivo, y `validarPatio` las revisa en los tests y en cada partida que se carga.

- **Zona:** un grupo de celdas que se riega y se tapa junto. Sus propiedades son lo único que el dominio mira: `cria` (almaciguera), `techo` (no le llueve), `abrigo` (reparo fijo contra heladas), `calor`, `admiteTunel`, `macetas` (tamaño por celda), más suelo, materia orgánica, drenaje, hondo y costo de riego. El `id` es libre y queda escrito en las partidas; el `tipo` (`suelo`, `cajon`, `macetas`, `almaciguera`) decide cómo se dibuja.
- **Obstáculo:** `muro` (con `opacidad` para barandas), `arbol` (copa, fuste, caduco) o `losa` (el balcón de arriba). En celdas con decimales y alturas en metros.
- **Estructura:** lo construido que no es cantero. Hoy, la compostera, ubicada en una celda de piso.
- **Sol:** `sol.ts` recorre el día cada 10 minutos, calcula dónde está el sol en la latitud de la región del patio y ve si algún obstáculo lo tapa. Cuenta desde que supera el `horizonte` del patio. `tests/sol.test.ts` comprueba que se porte como el sol de verdad.
- **Regla:** ni el dominio, ni los renderers, ni la interfaz nombran una zona o una celda de un patio en particular. Hay un test que lo vigila. Las frases se arman con `nombre` y `conArticulo`.
- **En la partida:** cada partida lleva su propia copia del patio (`mundo.patio`) y el id de la plantilla de la que salió (`meta.plantilla`). Corregir una plantilla no cambia las partidas empezadas; editar el patio de una partida no toca la plantilla.

Sumar un patio: crear el archivo, anotarlo en `patios/index.ts`, correr `npm test` (lo valida y hace jugar al bot un año en él) y `npm run bot -- --patio <id>` para ver cómo rinde.

## La región es un dato

Lo que es del lugar y no de la especie vive en `datos/juego/regiones/` (`region.ts` es el contrato y `validarRegion` lo revisa): hemisferio y latitud, normales mensuales de temperatura y lluvia, la temporada de heladas (modelo FAUBA de dos normales), los años típicos (Niña, Niño…), cuándo tienen hoja los caducos, cómo se nombra el lugar en las frases y el calendario de siembra y trasplante por especie. Hoy hay una sola, `gba.ts`, con el clima de Ezeiza y el calendario de huertapp.

Cada patio declara su `region` y la partida la copia en `meta.region`. `clima.ts`, `sol.ts`, `estacionDe`, `invierno`, `conHojas` y `ventana` la reciben. Las reglas que dependen de la estación (épocas de plaga, qué es invierno) están escritas para el sur y pasan por `decadaEstacional`, que en el norte corre medio año. `tests/region.test.ts` juega un año en un GBA espejado en el hemisferio norte: el sol del mediodía da al sur, las estaciones se invierten y las heladas llegan en su otoño.

La especie es la misma en todos lados: temperaturas, días a cosecha, familia y marco siguen viniendo de huertapp. Derivar el calendario de una región nueva a partir de su clima, y las especies o prácticas propias de un lugar, es #57.

## Cada planta ocupa lo que ocupa

`datos/juego/especies.ts` guarda el marco de plantación de cada especie ([SUPUESTO]: los
centímetros entre plantas de la huerta agroecológica del GBA, que huertapp todavía no trae). De ahí
salen tres cosas: la **huella** (1, 2 o 4 celdas de 0,5 m que tapa una planta hecha), cuántas
**entran en una celda** —9 rabanitos, 4 lechugas, 1 tomate— y cuánto **levanta**, que es lo que le
sombrea a lo que tiene al lado. Las zonas de cría suman `capacidad`: los plantines de una bandeja.

El dominio lo usa entero: sembrar y trasplantar toman el bloque de celdas y avisan cuando no entra,
el raleo deja las que caben, la cosecha rinde por planta, la competencia empieza cuando se pasa de
la densidad, y las plantas altas entran como obstáculos temporales en el cálculo de sol.

**Está apagado** (`src/dominio/espacio.ts`): mientras viva el test dorado, el juego corre con huella 1
y una planta por celda, que es como venía jugando. Se prende en el paso 4 (ver `docs/CIMIENTOS.md`).
`conEspacioReal(fn)` lo prende para los tests.

## Lo que vigila todo esto

- **El test dorado** (`tests/dorado.test.ts`) hace jugar al bot un año entero con 8 semillas en el dominio y en el motor del prototipo (`tests/legado/motor-v04.cjs`) y exige el mismo estado final, decimal por decimal (proyectando el estado v4 a la forma vieja). Mientras esté verde, mover código es seguro. Cuando una regla cambie a propósito, el test se jubila en el mismo PR y el cambio se anota en el CHANGELOG.
- **Las capturas** (`npm run capturas -- --guardar | --comparar`) toman la huella de los píxeles de cada lienzo: el patio en las tres cámaras y las cuatro estaciones, cada cantero de cerca, el tinte de siembra, la tira de estadíos de las 55 especies y cuadro por cuadro de todos los efectos animados, con el reloj del navegador quieto. Si un cambio no debería tocar la gráfica, tienen que dar iguales.
- **El humo** (`npm run humo`) juega en un navegador de verdad, en celular y escritorio, incluida una partida guardada con el formato de la v1.
- **La arquitectura** (`tests/arquitectura.test.ts`): capas, que nadie repita el vocabulario del dominio, y la deuda que solo baja (líneas larguísimas por carpeta). `npm run lint` tiene un tope de avisos (complejidad, anidamiento, funciones largas) que solo baja.
