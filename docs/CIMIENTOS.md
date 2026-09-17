# Cimientos: qué está hecho y qué falta

| Paso | Qué | Estado |
| --- | --- | --- |
| 1 | TypeScript estricto, módulos, Vite, Vitest, bot, test dorado, CI | **Hecho** (v0.5) |
| 1b | Datos sincronizados con huertapp: contrato, candado, reporte de cambios, huecos | **Hecho** (v0.5) |
| 2 | El patio como dato: contenedores con propiedades (volumen, hondo, suelo, reparo, móvil) y obstáculos con altura; sombra por geometría y fecha | Pendiente |
| 3 | Plantas con huella propia y contenedores con capacidad (almacigueras de 50 celdas, zapallo de 4 celdas) | Pendiente |
| 4 | Tic diario y `avanzar(estado, días)`; ratos por día con tope; pronóstico de 5 días | Pendiente. Jubila el test dorado |
| 5 | Contenido como tablas: eventos, logros, pedidos e ítems son filas con condición y efecto | Pendiente |
| 6 | Interfaz por componentes y arte tipado; PWA | Pendiente |

Deudas que aparecieron en el paso 1, ya con test que las vigila:

- **Almácigo protegido de verdad.** Berenjena y batata no pueden germinar en su época ideal porque la almaciguera del juego es solo +2 °C. Falta el almácigo de adentro o con cama caliente (`CONTRADICCIONES_CONOCIDAS`).
- **83 huecos en huertapp** que el juego completa con supuestos (`datos/HUECOS.md`).

Bugs del prototipo que encontró el tipado y quedaron corregidos: especies con extremos de temperatura vacíos nunca germinaban o sufrían calor siempre (`null` comparado como 0), y el daño por exceso de riego nunca se disparaba.
