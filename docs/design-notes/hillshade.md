# Sombreado compartido del modelo digital y del visor 3D

El control «Hillshade» establece una intensidad común (0–100 %, inicialmente 65 %). Aparece en el modelo digital únicamente cuando su visor está ampliado, y permanece disponible en el visor 3D. Cero desactiva el efecto. El estado se guarda en el proyecto y se transmite a la ventana 3D independiente. Las vistas 3D usadas por los informes y las capturas del MDT reciben también el sombreado.

Se reutilizan las elevaciones reales del raster mediante `generate_terrain_mesh` (máximo 450 muestras por lado). El MDT no necesita abrir el visor 3D: carga su malla cuando hay sombreado y la reutiliza al cambiar paleta o intensidad. Las respuestas obsoletas se descartan al cambiar de raster o de imagen.

La iluminación es el producto escalar de la normal del terreno y una dirección de luz de acimut 315° y altura 45°. Las cotas y las separaciones horizontales están en metros; las derivadas y la iluminación son adimensionales. Se utilizan diferencias centrales, y diferencias unilaterales en los bordes o junto a muestras inválidas. Referencia del modelo de iluminación: [Esri, How Hillshade works](https://doc.esri.com/en/arcgis-pro/latest/tool-reference/3d-analyst/how-hillshade-works.html). La implementación usa gradientes sobre la malla de visualización, no el kernel de Horn de 3 × 3 descrito por Esri.

La mezcla visual conserva un 25 % de luz ambiente en las pendientes a contraluz. En el MDT se multiplica el color de la paleta sin modificar el canal alfa; se interpola el sombreado y se alinea el recorte de la malla con el raster completo mediante las dimensiones métricas y los metadatos GDAL. El borde excluido permanece sin sombrear. En 3D se modulan los colores de los vértices, también cuando existe textura cartográfica, manteniendo la iluminación ambiental del visor. El aspecto final puede diferir ligeramente por esa iluminación y por la gestión del color del renderizador.

Las celdas NoData y no finitas no intervienen en las pendientes vecinas. La exageración vertical no interviene en el hillshade, de modo que modificarla o rotar la cámara no cambia la dirección del sombreado. Las rutas, curvas, etiquetas y atribuciones conservan su representación.

Es una ayuda visual sobre una malla reducida: no es un raster analítico a resolución nativa, un mapa cuantitativo de pendientes ni una simulación de sombras proyectadas. No modifica las cotas ni los cálculos de rutas.

Pruebas: plano horizontal, pendientes opuestas, celdas de distinto tamaño, NoData, bordes, intensidad cero, alineación, transparencia, sustitución de raster, reutilización de malla, errores, transmisión a la ventana independiente y colores reales del objeto Three.js con paleta y textura.
