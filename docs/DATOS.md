# Los datos: una sola fuente de verdad

**huertapp manda.** Este repo no tiene una copia editable de la base de conocimiento: tiene un derivado y un candado.

```
huertapp · data/huerta_gba_enriquecido.json      ← se edita SOLO ahí
        │  npm run datos:sync  (valida el contrato, deriva, compara)
        ▼
datos/catalogo.json        derivado compacto; no se edita a mano
datos/fuente.lock.json     de qué versión exacta salió (sha256, rama, fecha)
datos/CAMBIOS.md           qué cambió en cada sync y qué sistema del juego toca
datos/HUECOS.md            lo que a huertapp le falta y el juego supone
datos/juego/especies.ts    lo que agrega el juego: familia, tipo de cosecha, supuestos para los huecos
datos/juego/reglas.ts      los números del juego (balance): cada supuesto con nombre, unidad y marca
```

## Qué pasa si cambio la base en huertapp

Nada, hasta que sincronices: el juego está clavado a la versión del candado. Cuando corrés `npm run datos:sync`:

1. **Si cambió la forma** de un campo que el juego usa (por ejemplo `temperaturas.helada` deja de ser una de cuatro palabras), el sync corta con error y no escribe nada. Se arregla en huertapp o se adapta `datos/contrato.ts`.
2. **Si cambiaron valores**, escribe el catálogo nuevo y lista cada cambio con el sistema que toca: "tomate.dec (almanaque y vigor de siembra)".
3. `npm test` dice si algún valor nuevo rompe una regla: que toda especie pueda germinar en su época ideal, que ninguna asociación apunte a una especie inexistente, que los rangos tengan sentido.
4. **Especie nueva**: entra sola con el dibujo genérico de su grupo. Para que se vea bien, sumale estilo en `src/arte/estilos.ts` y familia en `datos/juego/especies.ts`.
5. **Especie que desaparece o cambia de slug**: el sync lo avisa; hay que escribir una migración de partidas en `src/dominio/migraciones.ts`.

Una vez por semana, un workflow (`.github/workflows/datos.yml`) corre el sync solo y, si hay cambios, abre un PR con el reporte.

## El camino de vuelta

`datos/HUECOS.md` es la lista de lo que el juego tuvo que suponer porque huertapp no lo trae (hoy, sobre todo extremos de temperatura y riego). Completar esos datos en huertapp, con fuente, mejora las dos apps: el supuesto del juego deja de usarse solo.

`CONTRADICCIONES_CONOCIDAS` en `tests/catalogo.test.ts` es la lista de lugares donde el juego todavía no le hace justicia a huertapp.

## Por qué no un paquete compartido o un submódulo

Hoy hay un solo productor y un solo consumidor, y el contrato es un archivo JSON. Un fetch con candado y validación da lo mismo que un paquete, sin publicar nada. Si aparece un tercer consumidor, o si el juego necesita el modelo de clima de `scripts/clima-gba.mjs` tal cual, conviene extraer `huerta-datos` como paquete y que los dos repos dependan de él.
