# Backend nativo y empaquetado

## Implementado

- Tauri 2 con backend Rust portable; los artefactos se compilan de forma nativa para cada sistema y arquitectura.
- Lista blanca HTTPS para IGN/IDEE.
- Lectura real de `GetCapabilities` WCS.
- Descarga en flujo con límite de 1,5 GB, progreso y cancelación atómica.
- Detección de `ExceptionReport` XML y validación de GeoTIFF mediante `gdalinfo -json -stats`.
- Reproyección a CRS EPSG y recorte por máscara vectorial mediante `gdalwarp`, con salida COG y NoData.
- Inspección de GeoTIFF con GDAL y formatos vectoriales/GeoPackage con OGR.
- Escritura en el directorio de datos local de `es.viaspania.desktop`.
- Selección rectangular del área de estudio en el mapa de navegación; su extensión WGS84 se utiliza en la petición WCS.
- Sincronización bidireccional de centro, resolución y rotación entre OSM y PNOA, con protección frente a bucles de eventos.
- Capa de puntos sobre PNOA con modos mutuamente excluyentes para seleccionar, colocar inicio/final, añadir multipunto, mover y eliminar.
- Empaquetado autónomo de las herramientas de GDAL/OGR/PROJ, sus bibliotecas dinámicas y sus directorios de datos. El backend prioriza estas copias internas sobre cualquier instalación del sistema.

## Verificación real

El 17 de agosto de 2026 se descargó `Elevacion4258_5` para `Long(-3.715,-3.700)` y `Lat(40.410,40.425)`. GDAL 3.13.2 validó un GeoTIFF de 333 × 333 celdas, con extensión y geotransformación coherentes. El bundle se abrió en macOS y la interfaz detectó GDAL correctamente.

El 20 de agosto de 2026 se corrigió el parser de `CoverageId` con namespaces WCS y se verificó la descarga desde el botón de `ViaSpania.app`. La interfaz informó de una descarga y validación correctas de 0,2 MB. También se verificó que ambos mapas muestran simultáneamente la misma escala tras navegar y que un nuevo punto multipunto puede crearse y seleccionarse sobre PNOA.

## Firma

`pnpm desktop:build` prepara las dependencias geoespaciales de la plataforma actual y construye los formatos Tauri disponibles. El firmado se mantiene separado del build reproducible. En macOS, `pnpm desktop:build:signed:macos` añade una firma ad hoc equivalente a:

```bash
codesign --force --deep --sign - src-tauri/target/release/bundle/macos/ViaSpania.app
codesign --verify --deep --strict --verbose=2 src-tauri/target/release/bundle/macos/ViaSpania.app
```

Esto permite desarrollo local y distribución manual, aunque Gatekeeper puede exigir al usuario una autorización explícita. Para una apertura normal y sin advertencias fuera de la App Store se debe usar Apple Developer ID, hardened runtime y notarización.

Los preparadores disponibles cubren macOS (`.dylib`/Mach-O), Linux (`.so`/ELF y `rpath`) y Windows (`.exe`/`.dll`). El bundle incluye las licencias principales de GDAL y PROJ cuando la distribución instalada permite localizarlas. Antes de una publicación pública debe completarse el inventario y los avisos de todas las bibliotecas transitivas incorporadas por la instalación de GDAL usada para compilar. Que la aplicación sea gratuita no elimina esas obligaciones de licencia.
