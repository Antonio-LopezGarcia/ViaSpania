# Reconstrucción de fuentes nativas — 11 de septiembre de 2026

**Estado: pendiente.** Esta revisión aporta reconstrucciones parciales y corrige una fuente auxiliar ausente. No demuestra todavía la reconstrucción de toda la distribución desde el paquete final de fuentes. `corresponding_source` permanece `pending`.

## Carencia corregida: mimalloc 3.4.1

La compilación de Apache Arrow 25.0.1 intentó descargar mimalloc pese a `ARROW_DEPENDENCY_SOURCE=SYSTEM`. La receta conservada no declara ese recurso: lo descarga `cpp/cmake_modules/ThirdpartyToolchain.cmake` mediante `ExternalProject_Add`; versión y SHA-256 están en `cpp/thirdparty/versions.txt` del archivo de Arrow ya verificado.

Se recuperó el archivo con SHA-256 `37107a52c16baa80c5f74861dddda7b27bb9949e41a6637691867a94c88ca446`. El colector incorpora ahora fuente y licencia MIT originales como `native-aux/mimalloc-3.4.1`, vinculados al hash de las fuentes de Arrow. Rechaza un padre ausente o modificado. La biblioteca Arrow distribuida presenta símbolos `_arrow_mi_free` y `_arrow_mi_malloc_aligned`; no se deduce una versión exacta únicamente de esos símbolos.

El expediente contiene ahora **823 componentes**, sin errores de obtención. Esto no equivale a haber inventariado automáticamente todas las dependencias estáticas restantes.

## Pruebas realizadas

| Componente | Resultado | Límite |
| --- | --- | --- |
| PROJ 9.8.1 | Compilación e instalación aisladas; transformación EPSG:4326 → EPSG:25830 → EPSG:4326 correcta | Usa TIFF instalado y SDK del sistema. Se forzó nlohmann/json interno después de detectar una cabecera externa de Miniconda. |
| Apache Arrow 25.0.1 | Compilación completa de los targets configurados; array entero creado con el asignador mimalloc reconstruido | Usa bibliotecas dinámicas instaladas; RapidJSON, xsimd y gflags corresponden a las versiones fijadas por Arrow, cuya identidad con las del build histórico Homebrew no está demostrada. |
| GDAL 3.13.2 | Compilación; GeoTIFF de 8 × 8 a valor 100, reproyectado a WGS84, con mínimo y máximo 100 | Usa dependencias instaladas, incluidos Arrow y PROJ. Bindings Python/Java/C# desactivados. No demuestra paridad de todos los drivers del build Homebrew. |

Los binarios de prueba están bajo `release/reconstruction`, fuera del runtime distribuido. No se sustituyeron bibliotecas Homebrew ni recursos de la aplicación. No se generó un instalador nuevo.

## Evidencia y repetición

- `corresponding-source-evidence/INVENTORY.json`: hashes de fuentes y recetas de los 85 componentes nativos originales; candidatos a descargas CMake/Meson/submódulos y dependencias declaradas de build. Es un análisis estático, con sus limitaciones expresas; no evalúa condiciones Ruby ni todos los scripts de descarga.
- `corresponding-source-evidence/PROJ_REBUILD.json`, `ARROW_REBUILD.json`, `GDAL_REBUILD.json`: resultados y límites de cada prueba.
- Logs `proj-*`, `arrow-*` y `gdal-*` en el mismo directorio; `arrow-smoke.cpp` conserva la prueba compilada.
- `NATIVE_AUXILIARY_SOURCES.json`: fuente de mimalloc incorporada al colector con versión, URL y hash.
- `corresponding-source-evidence/AUXILIARY_SOURCES.json`: fuentes auxiliares de las pruebas. RapidJSON, xsimd y gflags se mantienen fuera del paquete final; el archivo completo de RapidJSON incluye fixtures con licencia JSON separada, cuyo alcance requiere revisión antes de incorporarlo.
- `bash scripts/compliance/rebuild_native_probe.sh`: repite las compilaciones aisladas con los archivos locales indicados y verificados por hash. Requiere Python 3.12+, CMake, clang y las dependencias nativas instaladas. No es un constructor autónomo de toda la cadena. No ejecuta todas las suites upstream.
- `python3 scripts/compliance/audit_native_sources.py`: regenera el inventario estático; `node scripts/release-compliance.mjs test` verifica el colector, incluidas alteración de fuente y vinculación de auxiliares al padre.

## Qué impide el cierre completo

1. Los 85 componentes originales tienen archivos de fuentes verificados, pero solo se han hecho estas tres reconstrucciones parciales; faltan comprobaciones de las dependencias restantes y sus recursos transitivos realmente utilizados.
2. Debe fijarse y suministrarse la cadena de cabeceras/dependencias de compilación necesaria. El recibo y SBOM locales de Arrow describen dependencias de ejecución, pero no fijan RapidJSON/xsimd/gflags del build histórico. El índice Homebrew actualmente cacheado describe Arrow revisión 5, frente a revisión 1 distribuida: no se puede usar como sustituto de la evidencia histórica.
3. Falta reconstruir y validar desde el paquete final de fuentes, con instrucciones completas y sin depender de archivos auxiliares que solo existan en esta máquina. Las pruebas actuales parten de archivos del expediente y de bibliotecas instaladas.
4. Tras cualquier cambio del runtime deben repetirse las revisiones vinculadas a sus hashes. La revisión de datos/exportaciones ya está reabierta por cambios previos de implementación y se trata por separado.

Validación del cambio del colector: 13 tests Python, 414 tests de aplicación y build web correctos. `compliance:check --strict` sigue fallando por las dos revisiones pendientes; no por fuentes obsoletas ni por fallos de obtención.

## Ampliación y cambio de prioridad

Se incorporaron CGAL 6.2, Eigen 5.0.1 y nlohmann/json 3.12.0. Las 4.356 cabeceras reconstruidas de CGAL y Eigen coinciden con las instaladas; SFCGAL se compiló y pasó una prueba de área. `CMAKE_REBUILDS.json` conserva 47 intentos adicionales: 41 compilaciones correctas y seis fallos que no se ocultan. Las pruebas usan dependencias instaladas. La ampliación exhaustiva se detiene por la petición expresa de priorizar tiempo y coste; la revisión sigue pendiente.

La versión 0.2.2 se prepara como borrador en GitHub, sin afirmar cierre integral de fuentes ni publicación aprobada.
