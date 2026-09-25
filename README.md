# Huertita

Juego de huerta urbana agroecológica del Gran Buenos Aires. Es divertido de jugar y, de paso, enseña a tener una huerta de verdad: las reglas salen de los datos de [huertapp](https://github.com/facundo-p/huertapp).

```
npm install
npm run dev              # jugar en local
npm test                 # reglas, contrato de datos, arquitectura, vista y test dorado
npm run bot              # 8 años jugados por un bot, para balancear
npm run lint             # reglas de legibilidad, con un tope de avisos que solo baja
npm run humo             # juega en un navegador de verdad (necesita Playwright)
npm run capturas         # huellas de píxeles de la gráfica: --guardar antes, --comparar después
npm run datos:sync       # traer el catálogo de huertapp (ver docs/DATOS.md)
npm run build            # dist/ para GitHub Pages
npm run build:artifact   # dist-artifact/huertita-artifact.html, una sola página para publicar en Claude
```

## Cómo está armado

| Carpeta | Qué es | Puede importar |
| --- | --- | --- |
| `datos/` | Catálogo derivado de huertapp, su candado de versión, el contrato que lo valida y lo que agrega el juego: especies, reglas de balance, plantillas de patio, regiones | nada |
| `src/dominio/` | La simulación: acciones, sistemas del paso del tiempo, textos del cuaderno. Sin DOM; estado JSON y azar con semilla | `datos/` |
| `src/arte/` | Dibujos pixel-art de cada especie y estadío | nada |
| `src/render/` | Renderers intercambiables (pixel-art por cámaras, y uno de texto). Reciben una escena plana, nunca el estado | `arte/` |
| `src/aplicacion/` | Consultas que arman lo que muestra la pantalla y casos de uso de las partidas | `datos/`, `src/dominio/` |
| `src/infra/` | Adaptadores: dónde se guarda (dispositivo, nube, archivo) y el reloj | `src/dominio/` |
| `src/vista/` | Componentes Preact con signals. Pregunta `puede()` al dominio y le pasa la escena al renderer | todo lo anterior |
| `tests/` | Reglas, contrato de datos, arquitectura, vista, regresiones, partidas guardadas de cada versión y el test dorado contra el motor del prototipo | |
| `tools/` | Bot que juega solo, prueba de humo y capturas en navegador | |

Detalle en [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md). De dónde salen los datos y qué pasa cuando huertapp cambia, en [docs/DATOS.md](docs/DATOS.md). Lo que falta, en [docs/CIMIENTOS.md](docs/CIMIENTOS.md). Por qué el código quedó como quedó (epic #39), en [docs/REESTRUCTURA.md](docs/REESTRUCTURA.md).

## Dos marcas que vas a ver en el código

`[REPO]` es un dato o regla que sale de huertapp. `[SUPUESTO]` es algo que inventó el juego porque hacía falta; cada uno es candidato a revisarse con fuentes.

## Para retomar el trabajo

`docs/traspaso/TRASPASO-huertita.md` cuenta el estado del proyecto, cómo se trabaja y qué sigue. Al lado están el documento de diseño, el juego publicado, los issues planificados y el skill del mapa de pendientes.
