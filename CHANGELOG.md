# Cambios

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
