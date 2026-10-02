# Visualización del terreno y visor 3D

Esta nota reúne el comportamiento que comparten el visor de modelos digitales y el visor 3D. La implementación principal está en `src/core/hillshade.ts`, `src/core/terrain3d.ts`, `src/components/Terrain3D.tsx` y los componentes del mapa de elevación.

## Hillshade

La intensidad de sombreado se configura entre 0 y 100 %, se persiste con el proyecto y se comparte con las vistas 3D y los informes compatibles. Cero desactiva el efecto. El cálculo usa una malla reducida generada a partir de las elevaciones disponibles; las cotas y separaciones horizontales se expresan en metros, y la iluminación es adimensional. Usa una dirección de luz de acimut 315° y altura 45°, con diferencias centrales y unilaterales en bordes o junto a datos inválidos. Véase [Esri, How Hillshade works](https://doc.esri.com/en/arcgis-pro/latest/tool-reference/3d-analyst/how-hillshade-works.html).

El sombreado es una ayuda visual, no un ráster analítico de pendientes ni una simulación de sombras proyectadas. No modifica elevaciones o costes. NoData no debe participar en pendientes y la cota cero puede ser válida.

## Visor 3D independiente

En escritorio, la ventana independiente es una WebviewWindow de Tauri. Presenta el visor compartido, no una segunda instancia del proyecto. El estado necesario se envía desde la ventana principal una vez que la auxiliar instala su receptor; las interacciones que modifican la vista vuelven al proyecto. El canal de sincronización es efímero y no guarda una copia del proyecto.

Cerrar la ventana auxiliar o volver a la integrada restaura la vista principal. Si se modifica el protocolo o el ciclo de vida, verificar también errores de apertura, cierre de la ventana principal y sincronización de atribuciones, capas y leyenda. La prueba de dos monitores y redimensionamiento requiere escritorio real.

## Datos de elevación en la malla

El exterior de cobertura reproyectada debe conservar NoData hasta la generación de malla; rellenarlo con cero produce paredes artificiales. Los triángulos que contienen vértices inválidos se excluyen. No se puede tratar la cota cero como NoData porque puede representar terreno real. Los modelos procesados con versiones previas que hayan convertido el exterior a cero pueden necesitar regeneración desde la fuente.

## Fuentes cartográficas

Una textura cartográfica es contexto visual. Sus atribuciones deben viajar con la textura a los visores e informes. La capa LiDAR del IGN es una referencia visual y no clasifica barreras o facilitadores ni altera costes automáticamente.
