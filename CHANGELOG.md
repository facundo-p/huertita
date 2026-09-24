# Cambios

## Sin publicar · reestructura (epic #39)
- Las acciones son reglas con `puede / costo / aplicar` (`src/dominio/acciones/`). La interfaz ya no repite condiciones: pregunta `puede()`. Cuatro condiciones que antes aplicaba solo la interfaz ahora las aplica el dominio, con su explicación: en la almaciguera no se ralea ni se pone tutor ni compost, el tutor va solo en especies que lo piden y ya germinadas, y se trasplanta solo un plantín o una planta que está creciendo. El juego se ve igual; lo que cambia es que ya no se puede esquivar desde afuera.
- Partidas guardadas: formato v4, con migración automática desde v1, v2 y v3 (probada con partidas guardadas de verdad por cada versión, en `tests/fixtures/`, y en navegador). El estado va en cinco partes (`meta`, `mundo`, `tiempo`, `recursos`, `progreso`); la partida lleva una copia de su patio, y la compostera pasa a ser una estructura del patio en vez de una letra del plano. Los patios de `datos/juego/patios/` pasan a llamarse plantillas. Se juega igual: el test dorado y el bot dan lo mismo que antes.

## 0.8.0 · 2026-09-18 · Cimientos, paso 3: cada planta ocupa lo que ocupa
- Marco de plantación por especie en `datos/juego/especies.ts` ([SUPUESTO], huertapp todavía no lo trae): centímetros entre plantas, y de ahí la huella en celdas, cuántas entran en una celda (9 rabanitos, 4 lechugas, 1 tomate) y cuánto levanta cada planta.
- El motor lo usa entero (`src/motor/espacio.ts`): un zapallo se lleva 4 celdas y avisa cuando no entra, el raleo deja las que caben en vez de una sola, la cosecha rinde por planta, la competencia empieza cuando se pasa de la densidad, el fantasma de siembra marca las celdas donde no entra, y una planta alta le hace sombra a las de al lado (obstáculo temporal en el cálculo de sol por geometría).
- Las zonas de cría tienen `capacidad`: la almaciguera siembra la bandeja entera (50 plantines).
- **La regla está apagada:** mientras viva el test dorado el juego corre como venía —una planta, una celda—, porque prender los marcos reales cambia rendimientos, azar y balance. Se prende en el paso 4, junto con el rebalanceo. `tests/espacio.test.ts` la prende y prueba cada regla.
- Partidas guardadas: formato v3 (una planta puede ocupar varias celdas), con migración automática desde v2.
- Una planta que tapa varias celdas se dibuja una sola vez: la escena marca cuál es su celda ancla.

## 0.7.0 · 2026-09-17 · Diario por planta y plantines que avisan
- Cada planta lleva su diario (`pl.hist`, últimas 16 anotaciones): qué le pasó cada década, con qué salud cerró y cuánto cambió. Incluye lo que antes bajaba la salud en silencio (sed leve, plaga que sigue) y qué factor la frenó cuando creció lento. Se ve en la ficha de la planta y se abre solo si la salud está por debajo de 70. El plantín repicado conserva la historia del almácigo. Hay un test que exige que toda baja de salud tenga explicación.
- Plantines: la ficha dice si está chico (y cuántos días de crecimiento le faltan), listo o pasándose; la barra de avance va hacia el trasplante y no hacia la cosecha; en el patio, una flecha verde marca los listos y una roja los que se pasan.
- La salud se ve en el dibujo: la planta amarillea desde salud 80 (antes 55) y por debajo de 60 aparece una barrita.
- La ficha decía "N días" mezclando días de calendario con días de crecimiento: ahora dice "sembrada hace N días" y "días de crecimiento".

## 0.6.0 · 2026-09-17 · Cimientos, paso 2: el patio es un dato
- Los patios son archivos en `datos/juego/patios/`: plano, zonas con propiedades (cría, techo, abrigo, calor, microtúnel, macetas) y obstáculos con altura. El motor, los renderers y la interfaz ya no nombran ninguna zona ni celda en particular.
- Sol por geometría: latitud del GBA, fecha, muros, barandas, árboles caducos y losas. Con tests de que se porta como el sol de verdad.
- Segundo patio, en prueba: balcón en esquina, todo en recipientes, con el problema de luz inverso al del fondo. Se elige desde "Guardar y cargar".
- Las estrellas de fin de año dependen del patio.
- El microtúnel se anota por zona. Partidas guardadas: formato v2, con migración automática desde v1 (probada también en navegador).
- El patio original conserva la fórmula de sol del prototipo, así el test dorado sigue verde. Ver la deuda en `docs/CIMIENTOS.md`.
- `npm run bot` juega en todos los patios; `--patio <id>` elige uno.

## 0.5.0 · 2026-09-17 · Cimientos, paso 1
- El prototipo pasa a un repo propio con TypeScript estricto, Vite y Vitest.
- Motor partido en módulos, con la misma conducta que el prototipo v0.4 (test dorado, 8 semillas, estado idéntico).
- Datos: `npm run datos:sync` trae el catálogo de huertapp con candado de versión, valida el contrato y reporta qué cambió y qué sistema toca.
- Lo que agrega el juego a cada especie queda separado de lo que viene de huertapp (`datos/juego/especies.ts`), con cada supuesto anotado.
- Corregido: especies con temperaturas incompletas en huertapp (girasol, romero, radicchio y otras 20) no podían germinar o sufrían calor siempre.
- Corregido: regar de más ahora sí daña a las que piden riego escaso.
- Migración de partidas guardadas del prototipo.

## 0.4 y anteriores
Prototipo en un solo HTML. Ver `docs/` y el historial del artifact.
