#!/usr/bin/env bash
# Crea los issues de Huertita en orden, conservando la numeración del mapa de ideas.
# Requisitos: gh instalado y autenticado (gh auth login), el repo SIN issues ni PRs previos.
# Los 1 a 5 ya están hechos: se crean y se cierran en el acto.
set -euo pipefail
REPO=facundo-p/huertita

url=$(gh issue create -R $REPO --title 'Almaciguera con varios plantines, raleo y repique' --label 'rabanito' --body 'Cada siembra son varias semillas; nacen más o menos según el suelo y la época; se ralea o se repica de a un plantín. Enseña una práctica real con un cambio de modelo chico.

**Cuadrante:** rabanito · costo 3 · impacto 8 (de 1 a 10, estimaciones). Idea de Facu.

**Hecho en v0.3.** Se crea cerrado para conservar la numeración del mapa de ideas.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#1 → $url"
gh issue close -R $REPO "$url" --comment 'Hecho antes de abrir el repo. Se crea cerrado para conservar la numeración del mapa de ideas.'
sleep 1
url=$(gh issue create -R $REPO --title 'Indicadores con el rango que pide cada especie' --label 'rabanito' --body 'La banda es lo que pide el catálogo, la marca lo que tiene la planta. La barra ahora explica el porqué.

**Cuadrante:** rabanito · costo 2 · impacto 7 (de 1 a 10, estimaciones). Idea de Facu.

**Hecho en v0.3.** Se crea cerrado para conservar la numeración del mapa de ideas.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#2 → $url"
gh issue close -R $REPO "$url" --comment 'Hecho antes de abrir el repo. Se crea cerrado para conservar la numeración del mapa de ideas.'
sleep 1
url=$(gh issue create -R $REPO --title 'Almanaque de siembra y ficha completa' --label 'rabanito' --body 'Las 36 décadas por especie y todos los datos del catálogo, a un toque.

**Cuadrante:** rabanito · costo 3 · impacto 7.5 (de 1 a 10, estimaciones). Idea de Facu.

**Hecho en v0.3.** Se crea cerrado para conservar la numeración del mapa de ideas.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#3 → $url"
gh issue close -R $REPO "$url" --comment 'Hecho antes de abrir el repo. Se crea cerrado para conservar la numeración del mapa de ideas.'
sleep 1
url=$(gh issue create -R $REPO --title 'Guardar y cargar la huerta' --label 'rabanito' --body 'Autoguardado visible, tres ranuras, nube privada para seguir en otro dispositivo, archivo y código.

**Cuadrante:** rabanito · costo 2.5 · impacto 6.5 (de 1 a 10, estimaciones). Idea de Facu.

**Hecho en v0.4.** Se crea cerrado para conservar la numeración del mapa de ideas.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#4 → $url"
gh issue close -R $REPO "$url" --comment 'Hecho antes de abrir el repo. Se crea cerrado para conservar la numeración del mapa de ideas.'
sleep 1
url=$(gh issue create -R $REPO --title 'Protección de heladas que cumple lo que dice' --label 'rabanito' --body 'Cada abrigo suma grados y el juego dice hasta qué mínima aguanta. El cuaderno cuenta cuándo salvó y cuándo no alcanzó.

**Cuadrante:** rabanito · costo 1.5 · impacto 6 (de 1 a 10, estimaciones). Idea de Facu.

**Hecho en v0.4.** Se crea cerrado para conservar la numeración del mapa de ideas.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#5 → $url"
gh issue close -R $REPO "$url" --comment 'Hecho antes de abrir el repo. Se crea cerrado para conservar la numeración del mapa de ideas.'
sleep 1
url=$(gh issue create -R $REPO --title 'Eventos sorpresa' --label 'rabanito,enhancement' --body 'Regalos, clima, bichos, barrio. Con los eventos como tabla de datos, cada uno nuevo cuesta minutos. Es la mayor fuente de sorpresa por peso invertido.

Va después de #29 (contenido como tablas): con los eventos como filas, cada evento nuevo cuesta minutos. El catálogo posible está en el mapa de ideas (docs/mapa-ideas.html, sección Eventos sorpresa). Regla: todo evento tiene una respuesta que es una práctica real, y los malos se anuncian o se pueden prevenir. Los que no salen de huertapp necesitan revisión de Facu antes de entrar.

**Cuadrante:** rabanito · costo 4 · impacto 9 (de 1 a 10, estimaciones). Idea de Facu.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#6 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Césped y poda como secos y verdes del compost' --label 'rabanito,enhancement' --body 'La receta de 2 secos por 1 verde ya está en el repo. Suma un recurso finito más para administrar.

La receta de 2 secos por 1 verde ya está en huertapp (compostaje). Césped y poda como recurso finito más.

**Cuadrante:** rabanito · costo 3.5 · impacto 6.5 (de 1 a 10, estimaciones). Idea de Facu.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#7 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Pedidos de vecinos con fecha' --label 'rabanito,enhancement' --body 'Dan objetivo de corto plazo, que hoy falta después del octavo logro. Obligan a contar días hacia atrás: eso es planificar una huerta.

Da objetivo de corto plazo después del octavo logro. Obliga a contar días hacia atrás con la ficha en la mano. Pagan con sobres raros, compost o herramientas; es la semilla de la feria vecinal (#13). Depende de #29.

**Cuadrante:** rabanito · costo 4.5 · impacto 9 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#8 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Sonido y ambiente' --label 'rabanito,enhancement' --body 'Lluvia, pájaros, el pop de la cosecha. Mucho disfrute por poco código.

Lluvia, pájaros, el pop de la cosecha. Respeta prefers-reduced-motion y arranca silenciado.

**Cuadrante:** rabanito · costo 3 · impacto 7 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#9 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Patios prediseñados: balcón, terraza, fondo grande' --label 'rabanito,enhancement' --body 'Si el patio es un dato, cada patio nuevo es un archivo. Cada uno plantea un problema distinto de luz y espacio.

Avance: desde 0.6 el patio es un dato (datos/juego/patios/) y hay un segundo patio en prueba, el balcón (#32). Falta: terraza o fondo grande, y una pantalla de elección con dibujo de cada patio.

**Cuadrante:** rabanito · costo 4.8 · impacto 7.5 (de 1 a 10, estimaciones). Idea de Facu.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#10 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Vacaciones de enero y otros desafíos anunciados' --label 'rabanito,enhancement' --body 'Dos décadas sin tocar nada, avisadas un mes antes. Obliga a preparar mulch, sombra y goteo.

Dos décadas sin poder tocar nada, avisadas un mes antes. Quien puso mulch, agrupó macetas a la sombra y dejó goteo vuelve a una huerta viva. Depende de #29 y se lleva bien con #20 y #35.

**Cuadrante:** rabanito · costo 2.5 · impacto 8 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#11 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Jugar de a 1 a 10 días' --label 'zapallo,enhancement' --body 'El motor simula día por día y vos elegís el salto. Toca el corazón del motor y obliga a rebalancear todo.

Es el paso 4 de los cimientos (#28): el motor simula día por día y el jugador elige el salto (1 a 10 días), con ratos por día con tope y pronóstico de 5 días. Jubila el test dorado y obliga a rebalancear.

**Cuadrante:** zapallo · costo 8 · impacto 8.5 (de 1 a 10, estimaciones). Idea de Facu.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#12 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Feria vecinal: vender o trocar verdura' --label 'zapallo,enhancement' --body 'Necesita economía, precios, tienda y balance. Le da sentido al excedente y abre las mejoras comprables.

Necesita economía, precios, tienda y balance. Le da sentido al excedente y abre las mejoras comprables (#20).

**Cuadrante:** zapallo · costo 7.5 · impacto 8 (de 1 a 10, estimaciones). Idea de Facu.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#13 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Editor del espacio' --label 'zapallo,enhancement' --body 'Interfaz de edición más sombras calculadas por geometría. Llega casi gratis después de "patio como dato" y los patios prediseñados.

Interfaz de edición más sombras calculadas por geometría. Desde 0.6 el patio es un dato y el sol se calcula por geometría (src/motor/sol.ts): lo que falta es la interfaz de edición y guardar el patio dentro de la partida.

**Cuadrante:** zapallo · costo 9 · impacto 7 (de 1 a 10, estimaciones). Idea de Facu.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#14 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Tamaño real de cada planta y marcos de plantación' --label 'zapallo,enhancement' --body 'Un zapallo ocupa 4 celdas, en una entran 9 rabanitos, el choclo sombrea al sur. El bancal se vuelve rompecabezas.

Es el paso 3 de los cimientos (#27). Un zapallo ocupa 4 celdas, en una entran 9 rabanitos, el choclo sombrea al sur.

**Cuadrante:** zapallo · costo 7 · impacto 9 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#15 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Diagnóstico por síntomas' --label 'zapallo,enhancement' --body 'La planta muestra el problema y vos elegís la causa. Pide dibujar síntomas por especie. Entrena el ojo.

La planta muestra el problema (hojas amarillas desde abajo, tallo ahilado, puntas quemadas) y el jugador elige la causa entre tres; si acierta, el tratamiento cuesta menos. Pide dibujar síntomas por especie. El diario por planta (0.7) ya registra las causas: es la base.

**Cuadrante:** zapallo · costo 8 · impacto 8 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#16 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Modo "mi patio" y puente con huertapp' --label 'zapallo,enhancement' --body 'Cargás tu patio real y el juego pasa a ser un simulador de tu huerta. Comparte datos y décadas con la app.

Cargar el patio real y jugar con él. Comparte datos y décadas con huertapp. Depende de #14.

**Cuadrante:** zapallo · costo 8.5 · impacto 7.5 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#17 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Fauna viva y álbum de bichos' --label 'aromática,enhancement' --body 'Vaquitas, crisopas, sapo, picaflor. La mecánica ya existe; suma disfrute y colección.

Vaquitas, crisopas, sapo, picaflor. La mecánica de aliados ya existe; suma disfrute y colección.

**Cuadrante:** aromática · costo 4 · impacto 5 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#18 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Preparados agroecológicos' --label 'aromática,enhancement' --body 'Purín de ortiga, jabón potásico, trampa de cerveza como recetas. Variante de "tratar plaga".

Purín de ortiga, jabón potásico, trampa de cerveza como recetas: variante de "tratar plaga". Solo preparados agroecológicos.

**Cuadrante:** aromática · costo 2.5 · impacto 4 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#19 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Tanque de lluvia y goteo como mejoras' --label 'aromática,enhancement' --body 'Pesa sobre todo en años Niña y en las vacaciones.

Pesa sobre todo en años Niña y en las vacaciones de enero (#11).

**Cuadrante:** aromática · costo 3 · impacto 4.5 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#20 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Recetas veganas de estación y conservas' --label 'aromática,enhancement' --body 'Cierra el ciclo de la semilla al plato. No cambia cómo se juega.

Cierra el ciclo de la semilla al plato. No cambia cómo se juega. Recetas veganas.

**Cuadrante:** aromática · costo 3.5 · impacto 3 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#21 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Variedades del repo' --label 'aromática,enhancement' --body 'Tomate determinado, zanahoria corta, coliflor temprana. El dato existe; suma opciones, no mecánicas.

Tomate determinado, zanahoria corta, coliflor temprana. El dato existe en huertapp (variedad_de); hoy el sync las excluye a propósito.

**Cuadrante:** aromática · costo 4.5 · impacto 4 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#22 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Árboles frutales' --label 'yuyo,enhancement' --body 'No hay datos con fuente y su escala es de años. Atajo: un solo frutal ya plantado en algún patio, cuando investigues esas fichas.

No hay datos con fuente y su escala es de años. Atajo: un solo frutal ya plantado en algún patio, cuando Facu investigue esas fichas.

**Cuadrante:** yuyo · costo 8.5 · impacto 4.5 (de 1 a 10, estimaciones). Idea de Facu.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#23 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Fotoperíodo detallado' --label 'yuyo,enhancement' --body 'Es lo que de verdad hace espigar a la lechuga, pero el jugador casi no lo vería y falta investigarlo.

Es lo que de verdad hace espigar a la lechuga, pero el jugador casi no lo vería y falta investigarlo.

**Cuadrante:** yuyo · costo 7 · impacto 3 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#24 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Cámara isométrica o 3D' --label 'yuyo,enhancement' --body 'La vista de cerca ya da el disfrute. Esto sería un renderer entero.

La vista de cerca ya da el disfrute. Esto sería un renderer entero; el contrato (src/render/contrato.ts) ya lo permite.

**Cuadrante:** yuyo · costo 9.5 · impacto 3.5 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#25 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Feria de semillas en línea entre jugadores' --label 'yuyo,enhancement' --body 'Requiere servidor y moderación. Se puede simular con códigos más adelante.

Requiere servidor y moderación. Se puede simular con códigos más adelante.

**Cuadrante:** yuyo · costo 9 · impacto 2.5 (de 1 a 10, estimaciones). Idea propuesta por Claude.

Mapa de ideas: `docs/mapa-ideas.html`.')
echo "#26 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Cimientos, paso 3: plantas con huella propia y contenedores con capacidad' --label 'cimientos,zapallo' --body 'Hoy una celda aloja igual a un zapallo que a un rabanito, y la almaciguera tiene tantas celdas como bandejas dibujadas. Con huella y capacidad: un zapallo invade 4 celdas, en una entran 9 rabanitos o 4 lechugas, la almaciguera cría 50 plantines, y las macetas tienen volumen de verdad. Es lo que hace jugable #15.

**Cuadrante:** zapallo · costo 7 · impacto 9.

Detalle y orden en docs/CIMIENTOS.md.')
echo "#27 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Cimientos, paso 4: tic diario y avanzar(estado, días); ratos por día; pronóstico de 5 días' --label 'cimientos,zapallo' --body 'El motor simula día por día y el jugador elige el salto (1 a 10 días). Ratos por día con tope, pronóstico de 5 días, salto "hasta que pase algo". Acá se jubila el test dorado y se rebalancea todo: es el momento de decidir #31. Es lo que hace real a #12.

**Cuadrante:** zapallo · costo 8 · impacto 8,5.

Detalle y orden en docs/CIMIENTOS.md.')
echo "#28 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Cimientos, paso 5: contenido como tablas (eventos, logros, pedidos, ítems)' --label 'cimientos,zapallo' --body 'Eventos, logros, pedidos e ítems pasan a ser filas con condición y efecto, no código. Después de esto, #6, #8 y #11 son rabanitos.

**Cuadrante:** zapallo · costo 6 · impacto 8.

Detalle y orden en docs/CIMIENTOS.md.')
echo "#29 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Cimientos, paso 6: interfaz por componentes, arte tipado y PWA' --label 'cimientos,zapallo' --body 'src/arte, src/render y src/ui siguen con @ts-nocheck, portados tal cual del prototipo; la interfaz arma HTML a mano en un solo archivo. Pasar a componentes, tipar el arte y hacer PWA instalable como huertapp.

**Cuadrante:** zapallo · costo 7 · impacto 6.

Detalle y orden en docs/CIMIENTOS.md.')
echo "#30 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Decidir el sol del patio original: fórmula v0.4 o geometría' --label 'deuda,cimientos' --body 'El fondo sigue con `sol: '"'"'v04'"'"'` para conservar el test dorado. Con geometría, un paredón de 1,8 m al norte deja sin sol directo en pleno invierno todo lo que esté a menos de ~2,6 m (cinco celdas): el bancal a suelo queda a oscuras de mayo a agosto, y la fórmula vieja le daba entre 1 y 5 horas. Opciones: mover los canteros lejos del paredón, bajar el paredón, o aceptarlo como parte del desafío. Decisión de diseño de Facu; va junto con #28. Ver datos/juego/patios/fondo.ts y tests/sol.test.ts.')
echo "#31 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Revisar y balancear el balcón (patio en prueba)' --label 'deuda' --body 'Todos los números del balcón son supuestos de Claude: reparo por altura, techo del balcón, tamaños de maceta, horizonte, estrellas 10/25/45. El bot saca entre 12 y 37 puntos (en el fondo, 112 a 141). Falta la revisión de Facu y un balance propio. Ver datos/juego/patios/balcon.ts.')
echo "#32 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Almácigo protegido de verdad: berenjena y batata no pueden germinar en su época' --label 'bug,deuda' --body 'huertapp las siembra en julio-agosto en "almácigo protegido" y piden 15 °C de suelo; la almaciguera del juego suma solo +2 °C y no llega. Falta un almácigo de adentro, con botella o cama caliente. Hay un test que documenta la contradicción (CONTRADICCIONES_CONOCIDAS en tests/catalogo.test.ts).')
echo "#33 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Babosas bajo techo' --label 'bug,deuda' --body 'Una zona con `techo` (almaciguera, cajón del balcón) igual recibe babosas cuando llueve mucho. Es herencia del prototipo; corregirlo cambia el test dorado, así que va con #28.')
echo "#34 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Macetas móviles: mover recipientes a la sombra o al reparo' --label 'enhancement,aromática' --body 'La propiedad `movil` de las zonas no se agregó porque ninguna regla la usa todavía. Entra con la mecánica de mover macetas: a la sombra en la ola de calor, contra la pared en la helada, agrupadas antes de las vacaciones (#11).')
echo "#35 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Completar en huertapp los 83 huecos que el juego rellena con supuestos' --label 'deuda' --body '`npm run datos:sync` escribe datos/HUECOS.md con cada dato que falta en huertapp (temperaturas, días de germinación, maceta mínima…). El juego los completa con valores conservadores marcados como supuestos. Completarlos en huertapp mejora las dos apps; el trabajo es en el repo de huertapp, este issue lo sigue desde acá.')
echo "#36 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Prender GitHub Pages y comprobar que el juego se publica en cada push' --label 'rabanito' --body 'El workflow ci.yml construye y despliega a Pages. Falta activar Pages en Settings con fuente "GitHub Actions" y verificar el primer despliegue. Después, anotar la URL en el README.')
echo "#37 → $url"
sleep 1
url=$(gh issue create -R $REPO --title 'Revisar los textos nuevos del diario por planta (0.7)' --label 'rabanito' --body 'Los textos que anota el diario ("Le faltó agua: pide riego parejo y tuvo menos", "Creció lento: lo que más la frenó fue…", "Sigue con pulgones…") los redactó Claude. Revisar que suenen a huerta y que sean verdad en cada caso. Ver src/motor/tiempo.ts y src/motor/diario.ts.')
echo "#38 → $url"
sleep 1
