# Cambios

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
