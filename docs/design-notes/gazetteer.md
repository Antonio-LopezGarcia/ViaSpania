# Buscar lugar · GeoNames online

En la columna de herramientas de Navegación, Buscar lugar abre una ventana. Escriba al menos tres caracteres y pulse Buscar lugar o Enter. Escribir no genera peticiones. Las flechas y Enter permiten seleccionar un resultado y centrar el mapa; Escape cierra la ventana. La búsqueda está disponible sin configurar ninguna cuenta individual.

ViaSpania utiliza la cuenta pública del proyecto, centralizada en el adaptador `src/services/gazetteer.ts` para los transportes web y nativo. No se incluyen contraseñas ni tokens. Las preferencias de usuario GeoNames de versiones anteriores ya no se leen; no hay pestaña Topónimos ni configuración manual. Las consultas comparten la cuota del proyecto y los límites se muestran como errores recuperables, sin reintentos automáticos. La interfaz depende de `GazetteerProvider`, lo que permite sustituir el acceso por otro adaptador sin rediseñarla.

Se ha sustituido la instalación SQLite por el servicio HTTPS `https://secure.geonames.org/searchJSON`. No se descargan dumps ni se mantienen índices locales. Los archivos locales previamente instalados no se eliminan automáticamente, pero ya no se utilizan. La búsqueda requiere Internet y envía el término y usuario a GeoNames. No se envían coordenadas del viewport ni puntos del proyecto.

`src/services/gazetteer.ts` normaliza y valida respuestas, traduce errores de cuenta y cuota al español y devuelve diez resultados como máximo. En escritorio, el comando Rust `geonames_search` consulta un endpoint fijo con un timeout de 15 segundos; en web se usa fetch HTTPS con el mismo timeout. La UI descarta respuestas obsoletas al editar o cerrar. No se realizan reintentos automáticos.

Se solicitan 40 candidatos mundiales a GeoNames. Entre ellos se priorizan coincidencias exactas normalizadas (+1000), viewport (+300) y área de trabajo (+150); los empates conservan el orden del proveedor. La prioridad local solo se aplica a los candidatos devueltos por la API: no garantiza recuperar todos los homónimos locales. La consulta incluye nombres alternativos según el buscador de GeoNames.

La integración cartográfica y LCP permanece: OpenLayers / SharedMapView sincronizan los mapas; el transformador GDAL existente calcula coordenadas en el CRS del ráster. Los puntos persistidos usan WGS84 y conservan fuente, ID, nombre, coordenadas originales y proyectadas. Reproducir los análisis guardados no requiere consultar GeoNames.

Validación: pruebas deterministas de parsing, homónimos, ranking, errores de API/red, límites, consulta explícita y selección de roles; pruebas Rust y build. Se comprobó en vivo una consulta de Málaga con la cuenta `viaspania` y respondió correctamente. Las pruebas rutinarias no usan red.

Fuente y documentación: https://www.geonames.org/export/geonames-search.html. Datos de GeoNames, https://www.geonames.org/, licencia CC BY 4.0, https://creativecommons.org/licenses/by/4.0/.

## Buscar mediante coordenadas

En Buscar lugar puede pegar `latitud, longitud` en grados decimales WGS84 (EPSG:4326), por ejemplo `40.4168, -3.7038`, y pulsar Enter o Buscar lugar. El orden es latitud primero; use punto decimal y una coma para separar los valores. La longitud debe estar entre −180 y 180 y la latitud entre −90 y 90. No se admiten coordenadas UTM ni grados/minutos/segundos en este campo.

La entrada se valida localmente y no se envía a GeoNames. Con un modelo cargado, `projectCoordinate` utiliza el comando común `project_coordinate`, que obtiene el CRS del ráster y transforma desde WGS84 con `transform_points` (GDAL). Sin modelo, utiliza la transformación de OpenLayers al CRS EPSG:3857 del visor. La ventana muestra las coordenadas transformadas y su CRS; el centro compartido de los mapas se actualiza en EPSG:3857 a partir de la posición WGS84. Un fallo de transformación conserva la vista y muestra un mensaje en español.
