# Rutas sobre modelos grandes

Implementado y verificado el 19 de septiembre de 2026.

## Límite y activación

El máximo nativo para rutas es **67.928.064 celdas**, suficiente para
**8192 × 8292**. El mismo máximo total se aplica ahora a todos los modelos
descargados e importados, cualquiera que sea su resolución o proveedor; véase
[límite común de modelos](elevation-model-limits.md).

En **Configuración → Procesado → Límite máximo de celdas**, seleccionar
**67.928.064 · 8192 × 8292** y guardar preferencias. Las preferencias
existentes no se cambian automáticamente. Hay opciones intermedias de 16 y
32 millones. La recomendación es 5 millones hasta 8 GiB de RAM, 32 millones
hasta 16 GiB y el máximo por encima de 16 GiB; si no se conoce la memoria se
conserva la recomendación de 3 millones.

El máximo es de admisión del ráster, no una promesa de que cualquier cálculo
termine con cualquier cantidad de RAM. El backend comprueba la memoria antes
de preparar la superficie o reservar el estado de búsqueda, también cuando
se reutiliza la caché. En caso de memoria insuficiente muestra un error con
el presupuesto requerido y disponible; no cambia el tamaño de celda.

Isócronas, pasillos LCP, visibilidad y curvas de nivel comparten ahora este
máximo y la preferencia de procesado. Véase [Análisis grandes](large-raster-analyses.md).
Los análisis se ejecutan de forma secuencial en el backend.

## Causa y cambios

El límite de cinco millones era interno: `MAX_ROUTE_CELLS`, comprobaciones
de preparación/búsqueda y lista de opciones de las preferencias. No procede
del servicio WCS. Subir solamente la constante mantenía reservas innecesarias
y una cola con entradas duplicadas y tamaño no acotado a una entrada por celda.

- Se mantiene Dijkstra exacto, costes `f64`, conectividades 4/8/16, penalización
  de rutas alternativas, barreras y facilitadores. No se modifica ninguna
  ecuación de coste ni se remuestrea o recorta la rejilla de búsqueda.
- La cola usa disminución de clave y como máximo una entrada por celda.
  Sus índices y los predecesores son `u32`, suficientes para el máximo nuevo.
  El desempate por índice de celda es el mismo que en la cola anterior.
- Penalizaciones y descuentos se guardan en páginas de 4096 celdas. Las páginas
  uniformes con factor 1 no se reservan; una página se crea cuando se pinta
  una barrera o facilitador. Los valores siguen siendo `f64`.
- Las elevaciones se decodifican con un buffer de 64 KiB; se elimina la segunda
  copia completa del archivo binario. GDAL usa caché de 64 MiB.
- Las matrices principales se reservan mediante operaciones fallibles. La cola
  y las distancias se liberan antes de reconstruir el recorrido; los
  predecesores se liberan antes de preparar las coordenadas del resultado.
- Se descarta la superficie anterior antes de preparar una incompatible.
  Un mutex serializa búsquedas de rutas, isócronas, pasillos y topografía para que una
  comparación concurrente no multiplique sus reservas. El comando de rutas
  trabaja fuera del hilo de interfaz.
- El cálculo no divide el área en rutas independientes por tesela: hacerlo
  sin un algoritmo global podría cambiar el camino óptimo. La búsqueda
  conserva acceso a todas las celdas y todas las conexiones originales.

El presupuesto conservador de admisión es de **96 bytes por celda más
512 MiB**: incluye las matrices de búsqueda/superficie en el caso denso,
espacio adicional para reconstrucción y serialización, y margen para otros
componentes. Es una reserva estimada de ingeniería, no una predicción del RSS.
Para el máximo resulta aproximadamente **6,57 GiB**. No se permite consumir
más de la mitad de la RAM total ni más del 75 % de la memoria disponible
estimada. Si solo se conoce uno de esos valores, se usa un presupuesto más
conservador. Si no se puede comprobar ninguno, los cálculos de más de cinco
millones se rechazan con un error explicativo.

En macOS la memoria disponible se estima con páginas libres, inactivas y
especulativas de `vm_stat`, sin sumar otra vez las purgables; Linux usa
`MemAvailable` y Windows `FreePhysicalMemory`. Esta comprobación es preventiva:
la presión de memoria puede cambiar después de iniciarse el cálculo.

## Verificación

Pruebas realizadas con GDAL/PROJ y el motor Rust compilado en `release`:

| Caso | Resultado | Tiempo y memoria máxima |
| --- | --- | --- |
| Rejilla plana completa de 8192 × 8292 a 5 m, extremos opuestos, conectividad 8 | 67.928.064 celdas admitidas; recorrido de 8292 celdas; 58.419,116 m; coste 41.754,931 s, igual al esperado | 21,95 s; RSS 1.507.098.624 bytes, aproximadamente 1,40 GiB |
| MDT05 real de 4782 × 5116 a 5 m | Ruta de 18.187,121 m y 2711 celdas; repetición con caché y recorrido/coste idénticos | 14,08 s para ambos cálculos; RSS 646.758.400 bytes, aproximadamente 617 MiB |

El caso máximo recorre una superficie plana transitable, no una ventana
reducida ni una simulación del resultado. Sus tiempos no son una garantía
para relieve complejo, conectividad 16, barreras o series de alternativas.
El caso real utiliza el COG verificado en la tarea de descarga, sin nueva
consulta de red durante estas pruebas de rutas.

Las pruebas rutinarias comprueban la equivalencia de costes con el Dijkstra
anterior sobre una barrera permeable para conectividades 4, 8 y 16; orden y
actualizaciones de la cola; asignación por páginas y precisión de factores;
lectura por bloques; rechazo bajo presión de memoria; límite sobre superficie
ya almacenada; persistencia y selección del límite nuevo; traducción de errores.

Verificación: **525 tests TypeScript**, **45 tests Rust** y build web correctos.
Las pruebas de capacidad son opt-in para no consumir gigabytes en cada suite:

```sh
cargo test --release --manifest-path src-tauri/Cargo.toml route_on_full_8192_by_8292_grid -- --ignored --nocapture
VIASPANIA_ROUTE_RASTER=/ruta/al/mdt.tif cargo test --release --manifest-path src-tauri/Cargo.toml route_on_large_real_mdt_and_reuse_surface -- --ignored --nocapture
```

En este entorno `pnpm test` y `pnpm build` se ejecutaron con
`--config.verify-deps-before-run=false`, usando las dependencias instaladas.

## Archivos de esta ampliación

- `src-tauri/src/lib.rs`
- `src-tauri/src/route_memory.rs`
- `src/core/appSettings.ts`
- `src/core/appSettings.test.ts`
- `src/components/GeneralSettingsControl.tsx`
- `src/components/GeneralSettingsControl.test.tsx`
- `src/core/i18n.en.json`
- `src/core/i18nPatterns.ts`
- `src/core/nativeMessages.english.test.ts`
- `docs/design-notes/mdt05-download-limits.md`
- `docs/design-notes/large-raster-routing.md`
