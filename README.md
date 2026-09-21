# Huertita

Juego de huerta urbana agroecológica del Gran Buenos Aires. Es divertido de jugar y, de paso, enseña a tener una huerta de verdad: las reglas salen de los datos de [huertapp](https://github.com/facundo-p/huertapp).

```
npm install
npm run dev              # jugar en local
npm test                 # 185 tests: reglas, contrato de datos y test dorado
npm run bot              # 8 años jugados por un bot, para balancear
npm run datos:sync       # traer el catálogo de huertapp (ver docs/DATOS.md)
npm run build            # dist/ para GitHub Pages
npm run build:artifact   # dist-artifact/huertita-artifact.html, una sola página para publicar en Claude
```

## Cómo está armado

| Carpeta | Qué es | Puede importar |
| --- | --- | --- |
| `datos/` | Catálogo derivado de huertapp, su candado de versión, el contrato que lo valida y lo que agrega el juego | nada |
| `src/motor/` | La simulación. TypeScript estricto, sin DOM. Estado JSON y azar con semilla | `datos/` |
| `src/arte/` | Dibujos pixel-art de cada especie y estadío | nada |
| `src/render/` | Renderers intercambiables. Reciben una escena plana, nunca el estado | `arte/` |
| `src/ui/` | Paneles y flujo. Habla con el motor por acciones y con el renderer por su contrato | todo lo anterior |
| `tests/` | Reglas, contrato de datos, regresiones y el test dorado contra el motor del prototipo | |
| `tools/` | Bot que juega solo y prueba de humo en navegador | |

Detalle en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md). De dónde salen los datos y qué pasa cuando huertapp cambia, en [docs/DATOS.md](docs/DATOS.md). Lo que falta, en [docs/CIMIENTOS.md](docs/CIMIENTOS.md). La reestructura que viene (epic #39), en [docs/REESTRUCTURA.md](docs/REESTRUCTURA.md).

## Dos marcas que vas a ver en el código

`[REPO]` es un dato o regla que sale de huertapp. `[SUPUESTO]` es algo que inventó el juego porque hacía falta; cada uno es candidato a revisarse con fuentes.

## Para retomar el trabajo

`docs/traspaso/TRASPASO-huertita.md` cuenta el estado del proyecto, cómo se trabaja y qué sigue. Al lado están el documento de diseño, el juego publicado, los issues planificados y el skill del mapa de pendientes.
