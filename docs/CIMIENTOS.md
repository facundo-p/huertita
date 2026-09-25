# Cimientos: qué está hecho y qué falta

| Paso | Qué | Estado |
| --- | --- | --- |
| 1 | TypeScript estricto, módulos, Vite, Vitest, bot, test dorado, CI | **Hecho** (v0.5) |
| 1b | Datos sincronizados con huertapp: contrato, candado, reporte de cambios, huecos | **Hecho** (v0.5) |
| 2 | El patio como dato: zonas con propiedades y obstáculos con altura; sol por geometría y fecha; segundo patio de prueba; estado v2 con migración | **Hecho** (v0.6) |
| 3 | Plantas con huella propia y contenedores con capacidad (almacigueras de 50 celdas, zapallo de 4 celdas) | **Hecho** (v0.8), con los marcos reales apagados hasta el paso 4 |
| 4 | Tic diario y `avanzar(estado, días)`; ratos por día con tope; pronóstico de 5 días | Pendiente. Rebalancea todo junto (el dorado v0.4 ya se jubiló en la 0.10, #68) |
| 5 | Contenido como tablas: eventos, logros, pedidos e ítems son filas con condición y efecto | Pendiente |
| 6 | Interfaz por componentes, arte y renderer tipados | **Hecho** (v0.9, epic #39). Falta la PWA instalable |

**La epic #39 (reestructura) está hecha en la v0.9** y fue antes del paso 4, con el test dorado vivo:
el dominio quedó en capas y sistemas, el estado en v4 con el patio adentro, la región como dato, la
vista con Preact y el renderer por cámaras, sin cambiar cómo se juega. El registro de la epic está en
`docs/REESTRUCTURA.md`.

**El dorado v0.4 se jubiló en la 0.10** (#68), cuando el compost, los eventos y los pedidos cambiaron
reglas a propósito. Desde ahí el test dorado es una foto propia del bot (`tests/fixtures/dorado.json`)
que se regenera a mano cuando una regla cambia, con el diff a la vista en el PR.

**El paso 3 está hecho pero todavía no se juega.** El motor ya sabe de huella, densidad y sombra
entre plantas, y cada especie tiene su marco de plantación en `datos/juego/especies.ts`. La regla
está apagada (`src/dominio/espacio.ts`): el juego corre como venía —una planta, una celda—, porque
prender los marcos reales cambia rendimientos, azar y balance. Se prende en el paso 4, donde se
rebalancea todo junto. `tests/espacio.test.ts`
la prende a propósito y prueba las reglas nuevas.

Deudas que aparecieron en el paso 1, ya con test que las vigila:

- **Almácigo protegido de verdad.** Berenjena y batata no pueden germinar en su época ideal porque la almaciguera del juego es solo +2 °C. Falta el almácigo de adentro o con cama caliente (`CONTRADICCIONES_CONOCIDAS`).
- **El sol del fondo sigue siendo la fórmula vieja.** El patio original tiene `sol: 'v04'`, la fórmula del prototipo. Sus obstáculos ya están cargados, pero la geometría no da lo mismo: un paredón de 1,8 m al norte deja sin sol directo en pleno invierno todo lo que esté a menos de ~2,6 m, y la fórmula vieja le daba entre 1 y 5 horas. Pasarlo a `'geometria'` es una decisión de diseño (mover canteros, bajar el paredón o aceptarlo) que va con el rebalanceo del paso 4.
- **El balcón está sin balancear y sin revisar.** Todos sus números son supuestos. El bot saca ahí entre 12 y 37 puntos. Aparece en el juego marcado "en prueba".
- **Babosas bajo techo.** Una zona con `techo` igual puede recibir babosas cuando llueve mucho. Es herencia del prototipo (la almaciguera) y corregirlo cambia el balance: va en el paso 4.
- **Propiedad `movil`.** No se agregó porque todavía ninguna regla la usa. Entra con la mecánica de mover macetas (vacaciones de enero, sombra de verano).
- **83 huecos en huertapp** que el juego completa con supuestos (`datos/HUECOS.md`).

Bugs del prototipo que encontró el tipado y quedaron corregidos: especies con extremos de temperatura vacíos nunca germinaban o sufrían calor siempre (`null` comparado como 0), y el daño por exceso de riego nunca se disparaba.
