# ViaSpania 0.1 architecture

ViaSpania is local-first. The React/TypeScript shell owns interaction, provider-independent map state, validated imports, project JSON and presentation. OpenLayers renders OSM and PNOA. Pure TypeScript currently implements the tested model registry and an 8-neighbour directional shortest-path engine. The production boundary is a Tauri 2 command API where Rust will own cancellation, WCS downloads, GDAL/PROJ raster work, SQLite/GeoPackage and large graphs.

The macOS shell is implemented with Tauri 2. Rust owns bounded WCS downloads, real cancellation, atomic publication, service-exception detection and GDAL validation. The native commands also provide COG reprojection/cutline processing and OGR/GDAL inspection. The routing backend keeps one prepared terrain surface in memory: the decoded elevation matrix, NoData mask and rasterized absolute/permeable barriers are shared by successive calculations. Its key includes the raster path, size and modification time plus the barriers. Endpoints, model, connectivity and model parameters do not invalidate this terrain layer because their directional costs are evaluated afresh by Dijkstra; changing them never reuses a previous route. A changed raster or barrier replaces the entry, which bounds memory growth. The current development bundle resolves the Homebrew GDAL command-line tools from `/opt/homebrew/bin` or `/usr/local/bin`; a self-contained commercial distribution should bundle and sign the required libraries and drivers.

## CRS
Persist points as EPSG:4326. Select the local ETRS89 / UTM zone for mainland Spain, Balearic Islands, Ceuta and Melilla; use REGCAN95-aware projected CRSs for Canary production rasters. Route calculations must occur in a metric projected CRS. Never calculate terrain distance directly in degrees.

## Data and privacy
Projects and imported attributes stay local. No telemetry. Remote calls are limited to map tiles and explicit capability/coverage requests. URLs use HTTPS and downloads must be cancellable, bounded and validated before native processing.

## Current scope
Real OSM and PNOA visualization, native WCS GeoTIFF extraction and validation, colored raster previews, PDF reports, native COG reprojection/recorte, CSV and GeoJSON import, audited directional cost models, 4/8/16-neighbour routing, model comparison, multipoint matrices, multi-origin accumulated-cost isochrones and directional LCP corridors are implemented. Full GeoPackage/Shapefile import UI and notarized distribution remain milestones.
# Visor 3D

El visor construye una única malla simplificada a partir del GeoTIFF activo mediante `generate_terrain_mesh`. Las rutas, isócronas, pasillos LCP, facilitadores y puntos se añaden como superposiciones Three.js sobre esa malla usando los resultados que ya conserva la aplicación; mostrarlos no vuelve a ejecutar los análisis. Las rutas usan líneas de anchura configurable y el pasillo limita su nube de visualización a unas 25.000 muestras para mantener una interacción fluida. La cota máxima se obtiene de las elevaciones de la malla derivada del MDT y se asocia de nuevo a su coordenada WGS84.

Las exportaciones de órbita y recorrido comparten un timeline normalizado (`animationTimeline`). El visor permanece siempre bajo control manual y el timeline solo se aplica al generar fotogramas. La órbita calcula directamente la cámara; el recorrido usa una línea de animación dedicada y un marcador interpolado sobre las coordenadas ya calculadas. El vídeo se captura localmente como MP4 o WebM mediante `MediaRecorder`; el GIF usa un codificador local de paleta fija y limita resolución/fotogramas para controlar memoria. En ambos casos la cancelación detiene pistas y libera fotogramas temporales.
