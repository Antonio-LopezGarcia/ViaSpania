# Límite común para modelos de elevación

La descarga, importación y capacidad máxima de los análisis comparten
**67.928.064 celdas**, sin distinguir MDT05, MDT25, MDT200, MDS05, Copernicus
GLO-30 ni el origen de un GeoTIFF local. Se limita el **total**, no cada eje:
8192 × 8292 y 16000 × 4000 son ejemplos admitidos. La preferencia de procesado
puede limitar los análisis a un valor inferior y el motor mantiene su comprobación
de RAM. Incluye rutas, isócronas, pasillos LCP, visibilidad y curvas de nivel;
véase [Análisis grandes](large-raster-analyses.md).

## Implementación

- `src/core/elevationLimits.ts` define la política común del cliente;
  `src-tauri/src/raster_limits.rs` define la comprobación nativa, reutilizada
  por descarga, importación y el máximo de análisis. Se comprueban dimensiones
  positivas, total y desbordamiento. Las preferencias reutilizan la constante.
- Todos los WCS usan bloques de 1024 × 1024 y caché acotada. La selección del
  proveedor es un enum cerrado: no se aceptan endpoints arbitrarios. Se usan
  los servicios y coberturas oficiales, WCS 1.0.0 y `GEOTIFFINT16`.
- La ventana se expresa explícitamente en EPSG:4326 con `-projwin_srs`.
  Esto es necesario para MDS05, cuya cuadrícula WCS es EPSG:25830, mientras
  los MDT publicados usan una cuadrícula geográfica. Se conserva la
  georreferenciación descrita por cada servicio; la salida mantiene las
  resoluciones de catálogo: 5, 25, 200 o 30 m según corresponda.
- Copernicus conserva la descarga a disco con streaming y su límite de
  transferencia de 1,5 GB. La guardia pasa de 16 a 128 teselas para admitir
  ventanas mayores o en latitudes altas. La reproyección tiene caché de
  64 MiB y memoria de warp de 64 MiB. Se comprueba mediante un VRT el tamaño
  proyectado antes de crear el COG y se valida también el resultado.
- Los GeoTIFF locales se comprueban al inspeccionarlos y en el backend. Un
  VRT calcula la salida proyectada antes de reservar el COG. No se impone la
  resolución de MDT05: se conserva el flujo de reproyección propio de la
  importación, sin reducir resolución para cumplir el límite. En un CRS
  métrico idéntico las pruebas verifican la geotransformación exacta.
- La selección de descarga usa siempre la resolución de su proveedor,
  aunque antes se haya importado un modelo con otra resolución.

El límite común no elimina restricciones independientes de cobertura,
transferencia, espacio en disco o disponibilidad de los servicios. WCS mantiene
un presupuesto adicional de 100 millones de celdas **nativas** intermedias;
el resultado reproyectado tiene el límite común de 67.928.064.

## Verificación

Descargas reales realizadas con el flujo integrado, todas superiores a 4096
celdas en ambos ejes:

| Modelo | Salida | Resolución |
| --- | --- | --- |
| MDT25 | 4472 × 4682 | 25 m |
| MDT200 | 6324 × 4523 | 200 m |
| MDS05 | 4782 × 5115 | 5 m |

MDT05 ya estaba verificado con 4782 × 5116 a 5 m. Para Copernicus se prueba
localmente el comando de reproyección real con un ráster de 5000 × 4200 y
salida de 30 m, comprobando que coincide con la cuadrícula de prevalidación;
no se repitió una descarga de red de Copernicus en esta ampliación.

La importación se prueba con el máximo de 8192 × 8292, incluyendo valores
situados a ambos lados de uniones de bloques y en la última celda, y con
modelos de 1, 25, 30 y 200 m que conservan exactamente su geotransformación.
Una entrada de 8192 × 8293 se rechaza antes de crear el resultado.

Pasan **530 tests TypeScript**, **49 tests Rust** y el build web. Las pruebas
WCS de red son opt-in (`live_other_elevation_sources` con
`VIASPANIA_WCS_SOURCE=mdt25`, `mdt200` o `mds05`).
