# ViaSpania 0.5.0

## Español

Esta versión reúne los cambios acumulados desde ViaSpania 0.2.2, incluidos los publicados en 0.2.3, 0.3.0 y 0.4.0. Amplía el análisis del terreno y las rutas, mejora la edición cartográfica, la visualización y las exportaciones, y refuerza la preparación de los paquetes de escritorio.

### Novedades y correcciones

- **Modelos de coste y análisis de rutas:** se incorporan los perfiles Irmischer–Clarke, Uriarte González, Marín Arroyo y Llobera–Sluckin, con variantes y parámetros configurables. Se amplían la creación, numeración, ordenación y compatibilidad de puntos; las rutas secuenciales multipunto; las matrices de conexiones (sin el límite anterior de ocho puntos); la comparación de modelos y los itinerarios alternativos. Los proyectos guardan automáticamente y conservan información sobre el origen de los modelos de elevación y la configuración del análisis.
- **Análisis de modelos grandes y terreno:** la descarga WCS de MDT05, MDT25, MDT200 y MDS05 se realiza por bloques. Se mejora el uso de memoria y se aplica un límite de procesamiento común a los modelos descargados o importados, rutas, isócronas, pasillos, visibilidad y curvas de nivel, con comprobaciones de RAM, cancelación y gestión de respuestas parciales. Se añade sombreado ajustable sin alterar las elevaciones ni los costes, y se corrigen artefactos de reproyección y costuras de pasillos.
- **Cartografía, medición y edición:** OpenTopoMap y el mapa LiDAR del IGN se incorporan como fondos y texturas con atribución. Se añaden mediciones de distancia y área, perfiles de elevación, rutas de aproximación y creación/edición de máscaras marítimas. Las curvas de nivel permiten configurar estilo y etiquetas; se mejoran las validaciones geométricas, leyendas, paletas, opacidades y dimensiones de los modelos rectangulares.
- **Visores y exploración topográfica:** los controles 3D incluyen cámara, paleta, exageración, texturas cartográficas y capas de análisis; se mejora la sincronización de indicadores y la captura del estado visible. Se añade un modo de vuelo interactivo para recorrer el terreno con el teclado, ajustar velocidad y crucero, y consultar la altura sobre el terreno; solo mueve la cámara y no modifica el modelo ni los resultados. Las isovistas admiten varios observadores, selección del punto en el mapa y visualización de zonas visibles u ocultas en 2D y 3D. Se localizan picos dentro de la extensión visible y se corrige la estimación de visibilidad alrededor de crestas y los huecos transparentes en sus bloques de salida.
- **Exportaciones:** se mantienen informes y resultados geográficos y se amplían las animaciones a AVI/MJPEG y MP4/H.264, además de GIF y PNG. Se mejora la conservación de atribuciones y superposiciones del perfil de elevación, la presentación de los archivos y los diagnósticos de exportación. En Windows se fija el runtime de FFmpeg; los avisos de licencia de vídeo usan UTF-8. Si falla la conversión de vídeo, se conserva el AVI intermedio.
- **Edición y experiencia de uso:** se puede deshacer y rehacer cambios en puntos, barreras, corredores, cruces y puntos de interés. Se revisan la bienvenida y el tutorial, los controles de descarga, la cancelación y seguimiento de tareas, las traducciones, las leyendas, los créditos y los formularios. Los informes usan nombres únicos y una cabecera más clara.
- **Fiabilidad de escritorio y descargas:** en Linux las descargas de elevación usan los certificados del sistema y reintentan fallos transitorios; el bundle de GDAL/PROJ incluye dependencias de Conda y mejores diagnósticos. La preparación de recursos geoespaciales comprueba plataforma y arquitectura. Se refuerza el workflow de portabilidad y cumplimiento para Windows, Linux y macOS.

### Datos, supuestos y atribuciones

Los datos geoespaciales incluidos se mantienen sin cambios respecto a la revisión registrada; la revisión técnica del candidato 0.5.0 está documentada en [`data-evidence/REVIEW_0.5.0.json`](data-evidence/REVIEW_0.5.0.json). Las zonas de visibilidad son una estimación dependiente del MDT/MDS, la resolución y el muestreo; no modelan refracción ni curvatura terrestre. Un MDT no incorpora automáticamente edificios o vegetación. Una ruta calculada no acredita que exista un camino, permiso de acceso, cobertura o transitabilidad. Las capas y fuentes conservan sus atribuciones en la aplicación y en las exportaciones correspondientes. Los datos importados por cada persona siguen requiriendo comprobación de procedencia, licencia y adecuación al uso previsto.

Se han reportado fallos en todas las versiones publicadas desde la 0.2.3. Esta nota describe el conjunto de cambios de 0.2.2 a 0.5.0, pero no afirma que todos esos fallos estén corregidos ni que 0.5.0 sea una sustitución validada en todas las plataformas. Compruebe esta candidata con sus proyectos y exportaciones antes de distribuirla o retirar las publicaciones anteriores.

### Estado de los paquetes de escritorio

Se ha generado y verificado estructuralmente un DMG local para macOS Apple Silicon (`aarch64`), con la aplicación 0.5.0. Este DMG de revisión no está firmado ni notarizado. Los instaladores de Windows y Linux deben compilarse y validarse en sus jobs de GitHub Actions antes de anunciarse como artefactos disponibles. No se deben tratar los archivos automáticos «Source code» de GitHub como instaladores.

Para compilar desde un checkout limpio, consulte la [guía de portabilidad de escritorio](desktop-portability.md). La aplicación requiere acceso a Internet para consultar mapas, descargar modelos de elevación y buscar lugares; los análisis se ejecutan localmente.

---

## English

This release brings together the accumulated changes since ViaSpania 0.2.2, including those published in 0.2.3, 0.3.0 and 0.4.0. It expands terrain and route analysis, improves map editing, visualisation and exports, and strengthens desktop packaging preparation.

### Features and fixes

- **Cost models and route analysis:** adds the Irmischer–Clarke, Uriarte González, Marín Arroyo and Llobera–Sluckin profiles with configurable variants and parameters. Point creation, numbering and ordering, sequential multipoint routes, connection matrices (without the previous eight-point limit), model comparisons and alternative itineraries are expanded. Projects save automatically and retain elevation-model provenance and analysis settings.
- **Large-model and terrain analysis:** block-based WCS downloads cover MDT05, MDT25, MDT200 and MDS05. Memory use, RAM checks, cancellation and partial-transfer handling improve; a shared processing-cell limit applies to downloaded or imported models, routes, isochrones, corridors, viewsheds and contours. Adjustable hillshade does not alter elevations or costs. Reprojection artifacts and corridor seams are fixed.
- **Maps, measurement and editing:** OpenTopoMap and the IGN LiDAR map are available as basemaps and textures with attribution. New tools measure distance and area, inspect elevation profiles, draw approach routes and create/edit sea masks. Contours support configurable styles and labels; geometry checks, legends, palettes, opacity and rectangular-model dimensions improve.
- **Viewers and topographic exploration:** 3D controls cover camera, palette, exaggeration, map textures and analysis layers; indicator synchronisation and visible-state capture improve. An interactive flight mode lets users navigate the terrain with the keyboard, adjust speed and cruise control, and check height above terrain; it moves the camera without changing the model or analysis results. Viewsheds support multiple observers, map-based point selection and visible/hidden areas in 2D and 3D. Peak detection follows the visible extent, while viewshed estimation reduces leakage around ridges and fills transparent output gaps.
- **Exports:** retains reports and geographic results and extends animation export to AVI/MJPEG and MP4/H.264, as well as GIF and PNG. Attribution preservation, elevation-profile overlays, file presentation and export diagnostics improve. Windows uses a fixed FFmpeg runtime; video licence notices use UTF-8. The intermediate AVI is retained if conversion fails.
- **Editing and usability:** undo and redo changes to points, barriers, corridors, crossings and points of interest. The welcome flow and tutorial, download controls, task cancellation and tracking, translations, legends, credits and forms are revised. Reports use unique filenames and a clearer header.
- **Desktop and download reliability:** Linux elevation downloads use system certificates and retry transient failures; the Linux GDAL/PROJ bundle includes Conda dependencies and clearer diagnostics. Geospatial resource preparation checks platform and architecture. The portability and compliance workflow is strengthened for Windows, Linux and macOS.

### Data, assumptions and attributions

Bundled geospatial data is unchanged from the recorded review; the 0.5.0 candidate's technical review is documented in [`data-evidence/REVIEW_0.5.0.json`](data-evidence/REVIEW_0.5.0.json). Viewsheds are estimates that depend on the DEM/DSM, resolution and sampling; they do not model refraction or Earth curvature. A DEM does not automatically include buildings or vegetation. A calculated route does not prove that a path, access permission, coverage or passability exists. Map layers and data sources retain their attributions in the application and relevant exports. Data imported by each user still requires checks for provenance, licence and suitability for its intended use.

Failures have been reported in every release published since 0.2.3. These notes describe the changes from 0.2.2 through 0.5.0; they do not claim that all those issues are fixed or that 0.5.0 has been validated as a replacement on every platform. Test this candidate with your projects and exports before distributing it or removing the earlier releases.

### Desktop package status

A local DMG for macOS Apple Silicon (`aarch64`) has been built and structurally verified with the 0.5.0 application. This review DMG is not signed or notarized. Windows and Linux installers must be built and validated by their GitHub Actions jobs before being announced as available artifacts. GitHub's automatically generated “Source code” archives are not installers.

For a clean-checkout build, see the [desktop portability guide](desktop-portability.md). The application needs an Internet connection to access maps, download elevation models and search for places; analyses run locally.
