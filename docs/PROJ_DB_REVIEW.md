# proj.db y procedencia de resultados — 2026-09-10

## Resultado de esta revisión

La verificación documental identifica condiciones que permiten la redistribución de los componentes examinados, conservando sus avisos y condiciones propias. **No se ha identificado una prohibición de incorporar este `proj.db` sin modificar al producto ViaSpania con código GPL-3.0-only.** Esta conclusión es sobre la distribución conjunta descrita, no una autorización para relicenciar como GPL todos los registros ni vender EPSG como producto independiente. Confianza: media; se explicitan las inferencias de procedencia y la cuestión de agregación.

Se ha implementado la conservación de procedencia por resultado y una migración conservadora de proyectos antiguos. **No se puede recuperar con certeza información que un proyecto nunca guardó.** Esa ausencia se conserva como `REQUIERE REVISIÓN`, con la referencia histórica original si existe; se recomienda recalcular con una fuente documentada antes de redistribuir dichos resultados.

La revisión general `data` queda cerrada para el alcance y las condiciones documentadas en `DATA_LICENSE_REVIEW.md`, con nueva `.app` local inspeccionada. No hay nueva release publicada; `corresponding_source` sigue pendiente.

## Base examinada y evidencia

`src-tauri/resources/geospatial/share/proj/proj.db`, SHA-256 `ba59d662d0e3e4d46b3b43e72dba5d25b8bbd1e1441c80f03cb70572aa8862b4`; no modificada. SQLite se abre en modo de solo lectura. `crs_view` contiene las autoridades EPSG, ESRI, IAU_2015, IGNF, NKG, OGC y PROJ. La revisión inicial centrada en `metadata` no enumeraba IAU_2015, OGC y PROJ; aquí quedan incluidas.

El archivo fuente original de PROJ 9.8.1 está en el expediente de fuentes. Se conservan `COPYING`, el README de SQL, generadores y muestras de archivos de entrada en `docs/data-evidence/proj-9.8.1`. Los metadatos y hashes del runtime están en `PROJ_INVENTORY.json`. `upstream/SOURCES.json` identifica revisiones históricas oficiales de ESRI/NKG anteriores a las fechas declaradas por el runtime: acredita licencias disponibles entonces, no equivalencia byte a byte con cada CSV usado por quien compiló PROJ. `FILES.json` fija las evidencias locales.

| Componente | Versión/evidencia | Licencia y condiciones | Evaluación |
|---|---|---|---|
| SQL, generadores y contenido propio PROJ/OGC | PROJ 9.8.1, `COPYING`, README SQL | MIT, conservar avisos y cabeceras | Compatible con obligaciones. El nombre OGC de una autoridad no significa que se esté redistribuyendo el texto de un estándar. |
| EPSG | v12.029, 2025-10-02; términos oficiales con revisión 2016-04-08 | Términos EPSG/IOGP, atribución, avisos y reglas de modificación; inclusión comercial con valor añadido | Distribución conjunta viable con condiciones; no etiquetar EPSG como MIT/GPL por inferencia. |
| ESRI | ArcGIS Pro 3.6, 2025-12-01; generador señala `Esri/projection-engine-db-doc` | Apache-2.0; copyright Esri 2010–2025 en revisión histórica, conservar licencia y avisos; conversión a SQL identificada | Compatible con obligaciones. No implica empaquetar ArcGIS ni aceptar su EULA. |
| NKG | 1.0.w, 2025-02-13; `nkg.sql` identifica NordicTransformations | CC BY 4.0; atribuir NKG y las autoridades nacionales indicadas en README; indicar adaptación | Datos con licencia separada, compatibles con su inclusión y avisos. No relicenciados como MIT. |
| IGNF | 3.1.0, 2019-05-24; generador y URL XML exactos en metadata | Ficha oficial del registro: Licence Ouverte / Open Licence (`fr-lo`); conservar productor, fuente y fecha. El enlace histórico redirige hoy a texto 2.0 | Permiso de reutilización acreditado para el registro. No se afirma que el XML histórico declare literalmente SPDX `Etalab-2.0`. Se conservan la ficha, la redirección y el texto obtenido. |
| IAU_2015 | `iau.sql`, `scripts/build_db_from_iau.py`, copyright Hobu 2021 | Contenido PROJ bajo MIT; parámetros numéricos referidos al artículo DOI 10.1007/s10569-017-9805-5 | El código genera definiciones a partir de parámetros científicos; no se distribuye el artículo ni software SOFA. No extrapolar la licencia de SOFA ni el copyright editorial a las constantes. |

## Fuentes oficiales y alcance jurídico

### PROJ y EPSG

[PROJ 9.8.1 COPYING](https://github.com/OSGeo/PROJ/blob/9.8.1/COPYING) declara cobertura de fuentes y datos. Se conserva esta licencia junto con las condiciones originales adicionales identificadas; la declaración general no se usa para borrar los derechos de las autoridades.

[Términos oficiales EPSG](https://epsg.org/terms-of-use.html): consultados directamente en el navegador el 10-09-2026, sin iniciar sesión ni aceptar un formulario. La descarga HTTP automática devolvía 403, pero no impidió la lectura de la página. La transcripción completa, incluida la tabla de modificaciones, está en `upstream/EPSG-TERMS-OF-USE.txt`; se identifica como transcripción con formato de texto y no como copia HTML idéntica. El §6 permite copias y distribución con obligaciones; §6.III admite paquetes comerciales cuyo valor añadido no se atribuya al dataset; §6.IV exige reconocer a IOGP; §6.VI–VII regula equivalencia y atribución de cambios. No se alteran parámetros ni nombres de autoridad en ViaSpania.

La discusión de [incubación PROJ en OSGeo](https://discourse.osgeo.org/t/sac-osgeo-2268-incubation-request-proj/3298) explica la interpretación de las reglas de modificación como protección del nombre EPSG y su tratamiento en Debian. Es contexto de los mantenedores, no permiso independiente del titular ni dictamen vinculante. La conclusión prudente conserva la separación de datos y condiciones. Si se pretendiera aplicar exclusivamente GPL al dataset completo, eliminar avisos o vender EPSG aislado, la conclusión debe reabrirse.

### ESRI y NKG

El [repositorio oficial ESRI](https://github.com/Esri/projection-engine-db-doc) contiene datos y su licencia Apache-2.0. El generador de la versión exacta de PROJ señala expresamente ese repositorio y el directorio CSV. Las licencias actuales y anteriores a la fecha de metadata coinciden en la licencia ofrecida. No se ha usado la EULA comercial ArcGIS para clasificar estos ficheros abiertos.

El [repositorio oficial NordicTransformations](https://github.com/NordicGeodesy/NordicTransformations) declara CC BY 4.0 para todos sus archivos y especifica autoridades de atribución. Se conserva el README y el texto de licencia de la revisión histórica, incluidos créditos nacionales. Los datos derivados en SQL deben mantener esas atribuciones. Las rejillas NKG se auditan además como archivos propios en el catálogo PROJ-data.

### IGNF

La [ficha publicada por IGN en data.gouv.fr](https://www.data.gouv.fr/datasets/repertoire-de-donnees-de-reference-geodesiques-et-des-codelists-iso-19115) identifica expresamente `IGNF.xml` y declara reutilización libre bajo Licence Ouverte. El generador de PROJ 9.8.1 documenta la URL original de ese registro y usa una copia 3.1.0. Esto proporciona evidencia específica del producto, superior a una afirmación genérica sobre apertura de datos IGN.

La API oficial guardada declara `fr-lo`. Su enlace a `https://www.etalab.gouv.fr/wp-content/uploads/2014/05/Licence_Ouverte.pdf` redirige a `https://static.data.gouv.fr/resources/licence-ouverte-2-0/20240711-152120/licence-ouverte.pdf`. El texto descargado exige atribución del productor y fecha, permite reproducción, redistribución, adaptación y explotación comercial. **La ficha es actual y no demuestra qué redacción contractual acompañó cada descarga histórica**; no se inventa una declaración SPDX dentro del XML. Se mantiene el registro como dato de IGN, su fecha, licencia/ficha y representación por PROJ. El XML de trabajo se inspeccionó temporalmente; no se añade una copia completa adicional al repositorio.

## Avisos que se distribuirán

`public/compliance/PROJ_DB_NOTICES.txt` reúne avisos de PROJ, ESRI, NKG, EPSG e IGNF, los textos de licencia obtenidos y la transcripción EPSG. Se conserva también el expediente general de licencias y los README originales. Los avisos quedan sujetos al control de hashes de los recursos públicos. Hay que reconstruir el instalador para que los incorpore: el `.app` anterior no ha cambiado.

## Procedencia por resultado y proyectos antiguos

`src/core/resultProvenance.ts` define un registro versionado: estado, atribución, ruta del raster y fecha de registro, más la referencia histórica cuando no puede acreditarse el origen. `recorded` significa **registrado**, no validación jurídica ni firma criptográfica del archivo.

- La importación/descarga registra la procedencia junto al raster; importaciones sin información suficiente siguen como `requires-review`.
- Los adaptadores nativos capturan una copia antes de empezar rutas, isócronas, pasillos, curvas y visibilidad. Cambiar de raster durante una operación no cambia retrospectivamente su atribución.
- Los itinerarios compuestos conservan las fuentes de sus tramos; un tramo de origen desconocido mantiene el estado de revisión.
- El proyecto 0.10 persiste el registro dentro del resultado. La migración recorre los campos conocidos, incluidas rutas subóptimas y conexiones, sin inferir derechos del selector actual, resolución, nombre del fichero ni palabra IGN en `source`.
- La reapertura restaura los resultados después de los efectos que invalidan cálculos al cambiar puntos/raster, evitando borrar inadvertidamente los resultados recién leídos.
- GeoJSON de rutas, isócronas y curvas incorpora procedencia; sidecars usan la fuente del resultado concreto. PDF distingue raster actual del visor de la fuente del cálculo y añade créditos por resultado.
- La ausencia histórica se informa expresamente y se conserva. No se añade una supuesta autorización del titular. Para acreditar esos resultados hace falta la documentación original o volver a calcular con la fuente documentada.

Este cambio garantiza que el programa no sustituya automáticamente la procedencia del resultado por la selección actual. No autentica archivos de proyecto manipulados ni recupera información ausente, y la ruta local no es una huella criptográfica de los bytes del raster. Las atribuciones de otras entradas (puntos importados, capas de mapas y facilitadores) conservan el alcance y pendientes documentados en la revisión general de datos.

## Validación final

- 73 archivos de pruebas, 372 pruebas aprobadas. Incluyen migración idempotente, ausencia de inferencia desde el selector, conservación al guardar/reabrir, cambios de raster durante una operación asíncrona, mezcla de tramos y separación de atribuciones entre archivos exportados.
- TypeScript y build web de producción correctos; se mantiene el aviso de Vite sobre tamaño de chunks.
- 8 pruebas del expediente de cumplimiento aprobadas con Python 3.14. El Python 3.9 del sistema no es suficiente para ese expediente; no se cambió el entorno ni se instalaron dependencias.
- `git diff --check` correcto y SHA-256 de `proj.db` idéntico al inventariado.
- No se ha reconstruido ni publicado un instalador macOS en esta fase. El cierre de todas las exportaciones y del código fuente correspondiente sigue siendo una revisión separada.
