# Puentes de paso obligatorio

En Barreras y facilitadores, cada puente o paso dispone de la casilla «Paso obligatorio». Por defecto está desactivada, también al abrir proyectos antiguos. Se conserva en el JSON del proyecto, en GeoJSON (`required`) y en la capa de puentes de GeoPackage (`paso_obligatorio`).

Las rutas usan el mismo cálculo por tramos que los POI obligatorios. Se elige por proximidad el siguiente POI o extremo de un puente obligatorio, desde el origen real de cada sentido. Los vértices de cada puente se visitan consecutivamente en el sentido de entrada elegido. Esta heurística no optimiza globalmente el orden de visita. El cálculo entre vértices sigue usando el terreno, costes y barreras del motor ráster; la precisión espacial está limitada por sus celdas.

Se aplica a rutas simples, comparaciones, conexiones multipunto y alternativas. En multirruta se aplica a cada tramo entre los puntos de la secuencia, igual que un cálculo individual; por tanto, un puente puede visitarse más de una vez. Isócronas y superficies de pasillo mantienen su semántica de superficie y no imponen un itinerario de visitas.

Los resultados conservan `requiredWaypoints`, con identificador, nombre y coordenadas WGS84 de cada paso utilizado. Los informes muestran los nombres en la configuración de la ruta y la exportación GeoJSON de rutas incluye `required_waypoints`. Si un tramo es inalcanzable, el cálculo falla sin devolver un itinerario parcial como resultado válido.

## Cruce de barreras absolutas

Todo puente o paso reabre las celdas bloqueadas de su trazado, tenga o no activado «Paso obligatorio». Esta casilla decide si la ruta debe visitarlo; no determina su capacidad de cruzar una barrera. La máscara de apertura utiliza el mismo margen de una celda que la rasterización de barreras, para mantener conectados los cruces diagonales con conectividad 4, 8 o 16. Fuera de esa huella local, la barrera absoluta sigue bloqueada. La apertura no inventa elevaciones en celdas NoData.
