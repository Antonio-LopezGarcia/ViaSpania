# Barreras, corredores y pasos

Referencia técnica de las restricciones espaciales aplicadas a los análisis. La implementación está en `src/core/barriers.ts`, `src/core/facilitators.ts`, `src/services/native.ts` y la rasterización del backend en `src-tauri/src/lib.rs`.

## Geometrías y efecto en el coste

- Las geometrías del proyecto se persisten en WGS84. El backend las transforma al CRS del ráster antes de rasterizarlas.
- Las barreras absolutas excluyen celdas; las permeables añaden una penalización positiva. Una penalización no convierte una barrera permeable en una barrera absoluta.
- Los corredores preferentes son líneas con anchura en metros y un multiplicador positivo no mayor que uno. Modifican el coste en las celdas que cubren.
- Los puntos de interés pueden influir en una zona con radio y atracción, o actuar como visitas obligatorias. Las influencias espaciales reducen el coste de forma acotada; los puntos obligatorios se gestionan como waypoints.
- Un puente o paso reabre localmente las celdas bloqueadas que cubre, aunque no sea obligatorio. Fuera de esa huella la barrera sigue vigente; no se inventan elevaciones en celdas NoData.

## Visitas obligatorias

Los puntos obligatorios y los pasos marcados como obligatorios fuerzan segmentos consecutivos en el itinerario. El siguiente punto se selecciona mediante proximidad desde el origen actual; no se optimiza globalmente el orden de visita. Los vértices de un paso se recorren consecutivamente según el sentido elegido.

La regla se aplica a rutas, comparaciones, conexiones multipunto y alternativas; en itinerarios multirruta se aplica por tramo entre puntos consecutivos. Isócronas y superficies de pasillo conservan su significado de superficie y no fuerzan un orden de visitas. Si un segmento no es transitable, el cálculo devuelve error en lugar de presentar una ruta parcial como completa.

Los resultados conservan los waypoints obligatorios utilizados y sus coordenadas WGS84. Los formatos y nombres de campos de exportación deben mantenerse junto con `src/core/requiredCrossings.test.ts`, `src/services/requiredCrossings.test.ts` y las pruebas de exportación correspondientes.

## Visualización

El visor del modelo digital transforma las geometrías al CRS de pantalla y puede ocultar restricciones y etiquetas sin cambiar los datos del proyecto ni su participación en los cálculos. La simbología compartida se define junto a los componentes de mapa. Los cambios de capa son preferencias de visualización, no cambios en el análisis.

## Casos que deben conservarse

- Un paso solo abre el tramo local que atraviesa la barrera.
- Un cruce diagonal funciona con las conectividades admitidas por el motor sin ampliar la apertura a toda la barrera.
- Marcar o desmarcar «Paso obligatorio» cambia el itinerario exigido, no la capacidad geométrica del paso para cruzar una barrera.
- Proyectos antiguos sin la propiedad opcional se leen con el valor predeterminado compatible.
- Los costes de distintos perfiles no son comparables numéricamente si sus unidades difieren.
