# ViaSpania 0.6.0

## Español

Esta versión reúne las novedades de ViaSpania desde la 0.2.2 y conserva aquí su historial por versión, de la más reciente a la más antigua. Las secciones históricas resumen lo que se incorporó en cada publicación; no implican que cada función o instalador de aquellas versiones se haya vuelto a validar en 0.6.0.

### Novedades y correcciones

#### 0.6.0 — Informes, exportación y visualización

- **Compositor de informes:** permite configurar papel A4, A3 o A2 en horizontal o vertical, el mapa base, las capas visibles, la flecha del norte y la escala gráfica. Se pueden ajustar las curvas de nivel, su intervalo y estilo, y las superposiciones de puntos, etiquetas, barreras, corredores, cruces, puntos de interés y rutas de aproximación. Se adapta la disposición de mapas y datos técnicos al formato elegido.
- **Contenido técnico y procedencia:** los informes amplían las fichas de rutas y análisis, y añaden un inventario de los elementos espaciales y de la configuración exportada, con coordenadas en WGS 84 y atribuciones disponibles. Las vistas 3D incluyen indicadores de orientación e inclinación de cámara. No se completan cotas ni otros datos que no estén registrados. Se mejoran la localización del informe, la paginación, la composición de perfiles y la presentación de las atribuciones.
- **Rutas de aproximación:** se pueden incluir en informes y exportar como GeoJSON o GeoPackage; la importación de GeoPackage también recupera esta capa.
- **Modo de vuelo inmersivo:** permite recorrer el terreno 3D con controles de dirección, velocidad, ascenso y descenso, control de crucero e indicadores de rumbo y altitud; un minimapa sitúa la cámara sobre el modelo.
- **Identidad visual y acabado gráfico:** se incorpora un nuevo logotipo en la bienvenida y en las exportaciones, se renuevan los iconos de la aplicación y se retocan la presentación de controles, paneles y animación de inicio.
- **Proyectos y uso:** al cerrar la aplicación se puede elegir si guardar el proyecto y el modelo digital descargado. Se amplían textos de ayuda, traducciones y detalles de los controles 3D.

#### 0.5.0 — Portabilidad y expediente de publicación

- Se refuerza el workflow de GitHub Actions para preparar y revisar candidatos de escritorio en macOS, Windows y Linux, con comprobaciones de procedencia, dependencias y recursos nativos.
- Se corrige la preparación multiplataforma de las evidencias de cumplimiento, la conservación del inventario durante las revisiones, la detección de diferencias nativas y la localización de avisos de licencia del toolchain Rust.
- Se restaura la generación de instaladores de escritorio en el workflow de portabilidad. Esta versión también reunió en sus notas las novedades de aplicación de 0.2.3 y 0.4.0; se detallan en sus apartados históricos a continuación.

#### 0.4.0 — Edición cartográfica y terreno 3D

- **Selección:** deshacer y rehacer cambios en puntos, barreras, corredores, cruces y puntos de interés, mediante controles y atajos de teclado.
- **Capas y terreno 3D:** OpenTopoMap se incorpora a los selectores y a las texturas del terreno. Se añaden texturas de mayor resolución cuando el equipo las admite, más controles de cámara y un panel desplazable para la exportación animada. Las texturas respetan las capas habilitadas en ajustes e incluyen capas externas.
- **Proyectos y modelos:** los proyectos registran si el modelo de elevación es local o importado; el límite de lectura de los proyectos aumenta a 100 MB.
- **Descargas en Linux:** se reintentan fallos transitorios de transporte durante la descarga de elevación.
- **Portabilidad y documentación:** la preparación del bundle geoespacial comprueba sistema y arquitectura antes de empaquetar. Se actualizan los manuales en español, inglés e italiano y la guía de compilación multiplataforma.

#### 0.3.1 — Descargas de elevación en Linux

- Las conexiones de descarga de elevación usan el almacén de certificados del sistema para validar certificados HTTPS con la configuración de Linux.

#### 0.3.0 — Dependencias geoespaciales de Linux

- El bundle de GDAL/PROJ en Linux incorpora las dependencias necesarias de Conda y ofrece diagnósticos más claros cuando la preparación falla.
- Se incorpora OpenTopoMap como fondo cartográfico y se añaden herramientas para medir distancias y áreas, consultar perfiles de elevación, dibujar rutas de aproximación y crear o editar máscaras marítimas desde el modelo de elevación.

#### 0.2.4 — Vídeo en Windows

- Se enlaza estáticamente el runtime de FFmpeg para Windows para reducir dependencias externas al ejecutar la conversión de vídeo.
- Los avisos de licencia de vídeo se escriben en UTF-8 para conservar correctamente los caracteres acentuados.

#### 0.2.3 — Análisis del terreno, rutas y exportaciones

- **Modelos grandes:** las descargas WCS de MDT05, MDT25, MDT200 y MDS05 se realizan por bloques. Se establece un límite común de 67.928.064 celdas para modelos descargados o importados y para rutas, isócronas, pasillos, visibilidad y curvas de nivel. Mejoran el uso de memoria, la comprobación de RAM, la cancelación y la gestión de respuestas parciales.
- **Puntos y proyectos:** se unifican la creación y ordenación de puntos iniciales, finales y multipunto. Las rutas secuenciales conectan puntos consecutivos; las matrices de conexiones dejan atrás el límite de ocho puntos. Los puntos de interés se gestionan por separado y los proyectos se guardan automáticamente, conservando compatibilidad e información de los análisis.
- **Modelos de coste:** se añaden Irmischer–Clarke (variantes de sexo y desplazamiento por sendero o fuera de sendero), Uriarte González, Marín Arroyo y Llobera–Sluckin. Sus parámetros y categorías se explican en la ayuda y se conservan en los análisis y exportaciones.
- **Cartografía y relieve:** se añade sombreado ajustable, que no altera elevaciones ni costes, y el mapa LiDAR del IGN como referencia visual en mapas, cálculos, comparaciones, texturas 3D e informes, con su atribución.
- **Visores e informes:** se mejoran paletas, colores de pasillos, isovistas 3D, etiquetas de isócronas y leyendas de curvas de nivel y vídeo. El visor 3D ajusta la opacidad de superficies acumuladas, representa las dimensiones de modelos rectangulares y permite capturar el estado visible en PNG. Los informes reciben nombres únicos y una cabecera más clara.
- **Vídeo:** se añade exportación AVI/MJPEG y MP4/H.264 mediante FFmpeg/libx264; continúan GIF y PNG. Si falla MP4, se conserva el AVI. En la publicación se documentó la conversión real en macOS ARM64; Linux y Windows requerían validación adicional de MP4.
- **Robustez y experiencia de uso:** se actualizan la bienvenida, el selector de idioma y el tutorial. Se refuerzan la cancelación, la memoria y el seguimiento de tareas en cálculos e importaciones; se revisan formularios Linux, traducciones, controles de descarga, títulos de modelos y elementos de interfaz. Se corrigen artefactos de reproyección, costuras de pasillos, geometrías, texturas 3D, sincronización de indicadores y máscaras marítimas multiplataforma. Los rásteres antiguos afectados por el problema de bordes deben reprocesarse o descargarse de nuevo.

#### 0.2.2 — Versión de partida del historial

- La nota de 0.2.2 registra una actualización de la interfaz, la importación de elementos, las opciones de movimiento y las exportaciones de resultados y vídeo, junto con cambios posteriores a 0.2.1.
- Su expediente amplió los avisos de fuentes y licencias con mimalloc y dependencias de cabeceras de SFCGAL. La nota histórica consignó 414 pruebas de aplicación para aquella revisión; esa cifra no describe la validación de 0.6.0.

---

## English

This release brings together ViaSpania's changes since version 0.2.2 and preserves their history by version, from newest to oldest. Historical sections describe what each release introduced; they do not mean that every feature or installer from those versions has been revalidated in 0.6.0.

### Features and fixes

#### 0.6.0 — Reports, exports and visualisation

- **Report composer:** choose A4, A3 or A2 paper in landscape or portrait, select the map base and visible layers, and configure the north arrow and scale bar. Contours, interval and style can be adjusted, along with overlays for points, labels, barriers, corridors, crossings, points of interest and approach routes. Maps and technical details adapt to the selected page format.
- **Technical content and provenance:** reports expand route and analysis details and add an inventory of spatial elements and exported settings, using WGS 84 coordinates and available attributions. 3D views include camera orientation and inclination indicators. Missing elevations or other unrecorded data are not fabricated. Report localisation, pagination, profile layout and attribution presentation are improved.
- **Approach routes:** include them in reports and export them as GeoJSON or GeoPackage; GeoPackage import also restores this layer.
- **Immersive flight mode:** explore 3D terrain with direction, speed, ascent and descent controls, cruise control, heading and altitude indicators, and a minimap showing the camera position on the model.
- **Visual identity and polish:** a new logo appears in the welcome screen and exports, application icons are renewed, and controls, panels and the startup animation receive visual refinements.
- **Projects and usability:** when closing the application, choose whether to save the project and downloaded elevation model. Help text, translations and 3D controls are refined.

#### 0.5.0 — Portability and release evidence

- GitHub Actions is strengthened to prepare and review desktop candidates for macOS, Windows and Linux, including checks of provenance, dependencies and native resources.
- Fixes improve portable compliance evidence, preserve inventories during review, surface native differences and locate Rust toolchain licence notices.
- Desktop installer generation is restored in the portability workflow. The 0.5.0 notes also gathered application changes from 0.2.3 and 0.4.0; those are detailed in the historical sections below.

#### 0.4.0 — Map editing and 3D terrain

- **Selection editing:** undo and redo changes to points, barriers, corridors, crossings and points of interest with controls and keyboard shortcuts.
- **Layers and 3D terrain:** OpenTopoMap is available in selectors and as a terrain texture. Higher-resolution textures are available when supported, with additional camera controls and a draggable animation-export panel. Textures follow the layers enabled in settings and can use external layers.
- **Projects and models:** projects record whether elevation models are local or imported; the project-file read limit increases to 100 MB.
- **Linux downloads:** transient transport failures during elevation downloads are retried.
- **Portability and documentation:** geospatial bundle preparation checks the operating system and architecture before packaging. The Spanish, English and Italian manuals and the cross-platform build guide are updated.

#### 0.3.1 — Linux elevation downloads

- Elevation downloads use the system certificate store to validate HTTPS certificates against Linux configuration.

#### 0.3.0 — Linux geospatial dependencies

- The Linux GDAL/PROJ bundle includes required Conda dependencies and provides clearer diagnostics when preparation fails.
- OpenTopoMap is added as a basemap, along with tools to measure distances and areas, inspect elevation profiles, draw approach routes, and create or edit sea masks from the elevation model.

#### 0.2.4 — Windows video

- FFmpeg's runtime is statically linked for Windows to reduce external dependencies during video conversion.
- Video licence notices use UTF-8 so accented characters are preserved.

#### 0.2.3 — Terrain analysis, routes and exports

- **Large models:** WCS downloads for MDT05, MDT25, MDT200 and MDS05 use tiles. A shared ceiling of 67,928,064 cells applies to downloaded or imported models and to routes, isochrones, corridors, viewsheds and contours. Memory use, RAM checks, cancellation and partial-response handling improve.
- **Points and projects:** point creation and ordering for start, end and multipoint workflows are unified. Sequential routes connect consecutive points, and connection matrices no longer have the eight-point limit. Points of interest are managed separately. Projects save automatically while preserving compatibility and analysis information.
- **Cost models:** adds Irmischer–Clarke (sex and on-path/off-path variants), Uriarte González, Marín Arroyo and Llobera–Sluckin. Their parameters and categories are described in help and retained in analyses and exports.
- **Maps and terrain:** adjustable hillshade does not alter elevations or costs. The IGN LiDAR map is available as a visual reference in maps, calculations, comparisons, 3D textures and reports, with attribution.
- **Viewers and reports:** improves palettes, corridor colours, 3D viewsheds, isochrone labels, and contour and video legends. The 3D viewer adjusts accumulated-surface opacity, displays rectangular-model dimensions and captures the visible state as PNG. Reports use unique filenames and a clearer header.
- **Video:** adds AVI/MJPEG and MP4/H.264 export using FFmpeg/libx264; GIF and PNG remain available. If MP4 conversion fails, the AVI is retained. The release recorded a real conversion on macOS ARM64; Linux and Windows still required MP4 validation.
- **Reliability and usability:** updates welcome, language selection and tutorial flows. Calculation and import cancellation, memory use and task tracking improve; Linux forms, translations, download controls, model titles and interface details are revised. Fixes address reprojection artifacts, corridor seams, geometry validation, 3D textures, indicator synchronisation and cross-platform sea-mask generation. Older rasters affected by the edge issue must be reprocessed or downloaded again.

#### 0.2.2 — Starting point for this history

- The 0.2.2 notes record an interface update, element import, movement options and result and video exports, together with changes made after 0.2.1.
- Its source and licence notices were expanded to cover mimalloc and SFCGAL header dependencies. The historical notes recorded 414 application tests for that revision; that figure does not describe 0.6.0 validation.
