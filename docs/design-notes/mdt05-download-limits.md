# MDT05: descarga por bloques y límite práctico

Verificado el 17 de septiembre de 2026 con GDAL/PROJ locales y el WCS oficial.

## Causa

`src/App.tsx` imponía 4096 columnas o filas en tres lugares: guardia de
`downloadMdt`, aviso y desactivación del botón. El servicio también impone
**MAXSIZE=4096 por petición**, no por proyecto. Una petición real WCS 2.0.1
`GetCoverage`, cobertura `Elevacion4258_5`, `Long(-3.3,-3.02)`,
`Lat(40,40.23)` devolvió una excepción `InvalidParameterValue`, locator `size`,
indicando `MAXSIZE=4096`.

Servicio: https://servicios.idee.es/wcs-inspire/mdt

El antiguo backend ya escribía la respuesta HTTP por fragmentos a disco;
4096 no era un límite de representación GeoTIFF ni un límite inevitable de RAM.
La descarga monolítica conserva su tope independiente de 1.500.000.000 bytes.
La primera ampliación de descarga conservó el límite de rutas de 5.000.000
celdas. Desde el 19 de septiembre el motor de rutas admite hasta 67.928.064
celdas con comprobación de memoria; véase [Rutas grandes](large-raster-routing.md).
Isócronas, pasillos y análisis topográficos comparten también este máximo;
véase [Análisis grandes](large-raster-analyses.md).

## Implementación

Actualización: MDT05, MDT25, MDT200 y MDS05 utilizan el comando
`download_mdt_tiles` con selección explícita del servicio y su resolución.
Copernicus e importaciones comparten el mismo límite de salida; véase
[límite común de modelos](elevation-model-limits.md). El comando WCS usa GDAL con
bloques de 1024 × 1024, `GDAL_FORCE_CACHING=YES`, caché de 64 MiB y sin overviews
remotos. La lectura por bloques evita que GDAL convierta una lectura grande en
una única petición GetCoverage que exceda MAXSIZE.

Se utiliza WCS 1.0.0, cobertura `Elevacion4258_5`, formato `GEOTIFFINT16`.
En la comprobación, WCS 2.0 publicaba offsets redondeados de 0,000045 grados y
GDAL recibía bloques de 1023 × 1023 donde esperaba 1024 × 1024. WCS 1.0 publica
0,00004505 grados y permite especificar las dimensiones del bloque.
`OriginAtBoundary` interpreta el origen publicado como esquina del píxel.
La cuadrícula se obtiene de DescribeCoverage; no se asignan coordenadas nuevas
manualmente ni se reduce la resolución para eludir la restricción.

Un VRT selecciona la ventana en la cuadrícula del servicio. Otro VRT calcula la
salida UTM a 5 m y valida las dimensiones antes de descargar el área completa.
Se guarda un GeoTIFF temporal teselado y se realiza una sola reproyección local
con las mismas opciones anteriores: bilineal, `-tr 5 5 -tap`, Float32 y NoData
-9999. La reproyección usa 64 MiB de memoria de warp, además de la caché de
64 MiB, y un solo hilo de compresión. Son presupuestos de buffers, no una
promesa de que el RSS total sea exactamente 128 MiB.

La salida publicada es un COG independiente: ningún VRT ni archivo temporal se
necesita después. Se conserva `RasterResult`, la atribución y la compatibilidad
con importación y exportación existentes. Cancelar mata y espera al proceso de
descarga/reproyección; errores y cancelaciones limpian el directorio temporal.
Las estadísticas y las previsualizaciones, incluida la paleta, tienen caché
acotada; las miniaturas no superan 1400 píxeles en ninguno de sus ejes. Solo se
reduce la miniatura, nunca el ráster de elevaciones.

Referencias de GDAL:
- https://gdal.org/en/stable/drivers/raster/wcs.html
- https://gdal.org/en/stable/user/configoptions.html#config-GDAL_FORCE_CACHING
- https://gdal.org/en/stable/programs/gdalwarp.html

## Límites y verificación

- Máximo común de salida: **67.928.064 celdas** (8192 × 8292 o cualquier otra
  forma con un total igual o inferior), para todos los modelos descargados o
  importados. La interfaz estima dimensiones y el backend comprueba la salida
  reproyectada exacta. No se reduce resolución para hacer caber la selección.
- Protección adicional de origen WCS: 100.000.000 celdas nativas.
- Descarga real: 6216 × 5107 celdas geográficas; COG UTM resultante de
  **4782 × 5116 a 5 m**, sin exceder MAXSIZE en ninguna petición.
- Medición de la descarga por bloques con `/usr/bin/time -l`: RSS máximo
  142.802.944 bytes, aproximadamente 136,2 MiB, y 121,4 segundos. Depende del
  equipo y de la respuesta del servicio; no es una garantía de tiempo ni de RSS.
- Comparación real: 64 celdas a través de una unión entre bloques coinciden
  exactamente, tanto en coordenadas como en cotas, con una consulta directa.
- Prueba determinista local: cuadrícula de **8192 × 8192**, copia por bloques,
  reproyección y miniatura; comprueba tamaño, geotransformación, NoData y cotas
  a ambos lados de los límites 1024 y 4096 y en la última celda.
- Pruebas de límites, entradas inválidas y limpieza al cancelar.

Verificación rutinaria: `pnpm test`, `pnpm build` y
`cargo test --manifest-path src-tauri/Cargo.toml`. En el entorno de revisión,
PNPM se ejecutó con `--config.verify-deps-before-run=false` para utilizar las
dependencias existentes sin reinstalarlas. La suite de TypeScript tiene 518
pruebas aprobadas; el build web y la suite Rust también pasan.

La prueba de red es opt-in:

```sh
cargo test --manifest-path src-tauri/Cargo.toml live_mdt_larger_than_4096 -- --ignored --nocapture
```
