# Límites y procesamiento de modelos de elevación

Referencia de mantenimiento para descargas, importación y análisis sobre rásteres. La política compartida está en [`elevationLimits.ts`](../../src/core/elevationLimits.ts) y [`raster_limits.rs`](../../src-tauri/src/raster_limits.rs); descarga y memoria tienen lógica adicional en `src-tauri/src/mdt_download.rs` y `src-tauri/src/route_memory.rs`.

## Límites compartidos

El máximo configurado es **67.928.064 celdas** en total; no limita cada eje por separado. Se aplica a modelos descargados o importados y a rutas, isócronas, pasillos, visibilidad y curvas de nivel. La preferencia de procesamiento puede fijar un límite inferior. El backend también comprueba dimensiones inválidas, desbordamiento y memoria disponible; alcanzar el máximo de celdas no garantiza que cualquier equipo pueda ejecutar cualquier análisis.

Las descargas WCS tienen además límites del proveedor y un presupuesto de **100.000.000 de celdas nativas** antes de reproyectar. Cobertura, transferencia, espacio en disco y disponibilidad remota siguen siendo restricciones independientes. No se reduce silenciosamente la resolución para hacer caber una salida.

## Descarga e importación

Los proveedores y coberturas se seleccionan explícitamente en el adaptador nativo; las peticiones se leen por bloques con caché acotada para respetar las dimensiones máximas del servicio. El tamaño proyectado se valida antes de crear la salida. La descarga produce un ráster georreferenciado independiente de sus temporales.

La inspección de GeoTIFF local y su procesamiento nativo validan también el tamaño de salida reproyectada. La reproyección conserva las propiedades espaciales del flujo seleccionado y no debe asignar CRS o resolución ficticios para superar un límite. Los fallos y cancelaciones deben limpiar temporales sin publicar una salida incompleta.

## Análisis y memoria

Rutas, isócronas, pasillos y análisis topográficos comparten el límite de celdas y evitan lanzar simultáneamente varios cálculos que compitan por grandes reservas. La comprobación de memoria es una admisión conservadora, no una predicción del consumo real. Las reservas grandes deben fallar de forma explícita si el sistema no informa de memoria suficiente; el motor no debe alterar silenciosamente la cuadrícula.

Las geometrías resultantes también tienen límites propios en las operaciones que producen muchas líneas. Si se alcanza uno, se informa el error en vez de truncar el resultado sin indicarlo.

## Datos sin elevación y vistas previas

La reproyección marca el exterior de cobertura como NoData, sin tratar la elevación cero como inválida. La generación de malla y los análisis deben excluir muestras NoData. Las vistas previas pueden reducir resolución para representación; esa reducción no cambia las elevaciones del ráster usado en el cálculo.

## Verificación al cambiar estos flujos

Conservar pruebas de límites en frontend y backend, dimensiones rectangulares, desbordamiento, importación y descarga por bloques, uniones entre bloques, geotransformación, NoData, cancelación y rechazo por memoria. Las pruebas que contactan servicios reales permanecen optativas; las rutinas deben poder ejecutarse con fixtures o datos locales deterministas.
