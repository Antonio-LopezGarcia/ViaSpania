# ViaSpania 0.2.3

Versión publicada que reúne las mejoras posteriores a 0.2.2 en análisis del terreno, modelos de coste, visualización, exportación y estabilidad.

## Novedades

- **Análisis de modelos grandes.** Descarga WCS por bloques para MDT05, MDT25, MDT200 y MDS05; límite común de 67.928.064 celdas para modelos descargados o importados, rutas, isócronas, pasillos, visibilidad y curvas de nivel. Se reduce el uso de memoria, se respetan las preferencias del usuario y se comprueba la RAM disponible.
- **Puntos y proyectos.** Flujo unificado para crear puntos iniciales, finales y multipunto, añadirlos con numeración y colores, y reordenarlos. La ruta secuencial conecta puntos consecutivos; la matriz de conexiones admite la lista completa sin el límite anterior de ocho. Se mantiene la compatibilidad de proyectos y el orden de importación CSV/GeoJSON; los puntos de interés se crean por separado. Los proyectos se guardan automáticamente.
- **Modelos de coste.** Se añaden Irmischer–Clarke (variantes de sexo y desplazamiento por sendero/fuera de sendero), Uriarte González, Marín Arroyo y Llobera–Sluckin. Sus parámetros y categorías de perfil se explican en la configuración y la ayuda contextual, y la información del modelo se conserva en análisis y exportaciones.
- **Relieve y cartografía.** Hillshade ajustable y persistente en el MDT y en el visor 3D, sin modificar elevaciones ni costes. El mapa LiDAR del IGN está disponible como fondo en mapas, cálculos, comparación, texturas 3D e informes, con atribución IGN/CNIG y PNOA-LiDAR; es referencia visual y no clasifica automáticamente barreras o facilitadores.
- **Vídeo.** El diálogo permite exportar AVI o MP4/H.264 mediante FFmpeg/libx264 incluido. Si la conversión falla, se conserva el AVI intermedio. Continúan GIF y PNG. La compilación y conversión real se verificaron en macOS ARM64; la verificación equivalente de MP4 en Linux y Windows queda pendiente.
- **Mapas, 3D e informes.** Se corrigen bordes artificiales a cota cero al reproyectar modelos; mejoran paletas, colores de pasillos, *viewshed* 3D, etiquetas de isócronas y leyendas de curvas de nivel y vídeo. El visor 3D ajusta la opacidad de superficies acumuladas, muestra dimensiones correctas para modelos rectangulares y captura el estado visible en PNG con nombres de archivo más claros. Los rásteres antiguos afectados por el problema de bordes deben reprocesarse o descargarse de nuevo. Los informes usan nombres únicos y una cabecera más limpia; se corrigen textos de exportación.
- **Robustez y experiencia de uso.** Pantalla de bienvenida con selección inicial de idioma y tutorial, tutorial actualizado, controles de cancelación y seguimiento de tareas. Se refuerzan cancelación, memoria y manejo de tareas en análisis de cuadrícula, rutas e importación/descarga de MDT; las descargas de elevación por bloques gestionan respuestas parciales y fallos de transferencia. También se revisan títulos de modelos importados, la ventana de descarga de MDT/MDS, formularios Linux oscuros, traducciones y detalles de interfaz.

Consulte el [manual en español](manual.md) o el [manual en inglés](manual.en.md). Las instrucciones de instalación y disponibilidad de paquetes por sistema están en el [README](../README.md).

## Verificación

La compilación final de escritorio y los instaladores deben corresponder al código fuente de esta versión. El expediente y las cifras de validación de v0.2.2 son históricos y no certifican v0.2.3. MP4/H.264 se ha verificado con una conversión real en macOS ARM64; Linux y Windows requieren validación adicional.
