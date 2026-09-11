# Revisión de datos geográficos y exportaciones

Fecha: 2026-09-10. **Cierre técnico y documental condicionado al inventario exacto revisado**, registrado en `docs/data-evidence/REVIEW.json`. Confianza media. No se han identificado condiciones de los datos examinados que impidan distribuir el código propio de ViaSpania como GPL-3.0-only conservando los datos bajo sus condiciones originales. Esto no convierte el conjunto de datos en GPL ni constituye una certificación jurídica de cualquier exportación del usuario.

## Alcance y separación de derechos

Se examinan `geospatial/share`, `proj.db`, las rejillas PROJ-data 1.24, proveedores preconfigurados y conservación de atribuciones/procedencia en las rutas de exportación. Los servicios remotos no son bibliotecas enlazadas. El código, los datos y las marcas tienen derechos separados. La utilización de una transformación no convierte por sí sola sus coordenadas de salida en una adaptación protegida de toda la base o la rejilla. Redistribuir esos recursos sí requiere sus avisos.

El cierre no ampara cambios futuros en datos o implementación: el control de cumplimiento reabre la revisión cuando cambian los hashes registrados. Tampoco autoriza a distribuir datos importados de origen desconocido, ni acredita permisos sobre resultados históricos que nunca guardaron su fuente. Esos casos conservan **REQUIERE REVISIÓN** y deben documentarse o recalcularse antes de su redistribución. Son límites sobre esos datos concretos, no un impedimento demostrado para liberar la aplicación.

## Datos empaquetados

`PROJ_INVENTORY.json` identifica PROJ 9.8.1, PROJ-data 1.24 y 453 filas del catálogo de copyright: 451 presentes, dos ausentes que no se distribuyen. Incluye README; no son 453 rejillas. El registro de cierre incluye todos los archivos de `share`, además del catálogo. Se mantienen los bytes originales del runtime.

`proj.db`: SHA-256 `ba59d662d0e3e4d46b3b43e72dba5d25b8bbd1e1441c80f03cb70572aa8862b4`. La revisión de EPSG, ESRI, IGNF, NKG, IAU_2015, OGC y PROJ, versiones y fuentes oficiales se encuentra en [PROJ_DB_REVIEW.md](PROJ_DB_REVIEW.md). Los textos están en `public/compliance/PROJ_DB_NOTICES.txt`. EPSG permite inclusión en paquetes con valor añadido bajo sus términos; no se afirma permiso para vender EPSG como producto independiente o relicenciarlo como GPL. La conclusión se refiere a la distribución conjunta de este recurso sin modificar.

| Licencia declarada en PROJ-data | Filas del catálogo | Conclusión y obligaciones para esta distribución |
|---|---:|---|
| CC-BY-4.0 | 171, de ellas 169 presentes | Redistribución permitida; autor, fuente, enlace de licencia y modificaciones. Catálogo y README originales conservados. |
| Public domain | 171 | Se conserva la declaración del proveedor; no es una dedicación nueva hecha por ViaSpania. |
| Open License France | 57 | `fr_ign_README.txt` enlaza expresamente el texto francés 2.0 y la traducción inglesa histórica. Mantener productor, fuente y fecha; texto francés incluido en PROJ_DB_NOTICES. No sustituir silenciosamente la declaración histórica del CSV. |
| OGL-Canada-2.0 | 35 | Redistribución comercial y adaptación permitidas; atribución, enlace y no respaldo oficial. Se conservan los créditos específicos del Canadian Geodetic Survey/Natural Resources Canada y el aviso estándar. |
| CC-BY-SA-4.0 | 6 | Se distribuyen sin cambios respecto a PROJ-data, con licencia propia y avisos. Share-alike afecta a adaptaciones del dato; no se extiende automáticamente a todo el software acompañante. |
| CC0-1.0 | 5 | Conservar evidencia de dedicación y ausencia de garantías; no concede marcas ni derechos ajenos. |
| BSD-2-Clause | 4 | Ordnance Survey: conservar copyright original, dos condiciones y disclaimer, reproducidos con el catálogo y texto estándar identificado separadamente. |
| Data licence Germany – attribution – version 2.0 | 3 | Uso comercial permitido; proveedor, nombre/enlace de licencia, URI del dataset y cambios. README conserva fuente y transformación realizada por el distribuidor original. No confundir con variantes no comerciales. |
| Free redistribution is allowed and welcome | 1 | `de_adv_BETA2007.tif`: permiso explícito en `de_adv_README.txt` para redistribuirlo. Este cierre no autoriza modificarlo ni sustituir su licencia. |

Los textos y créditos se reúnen en `public/compliance/PROJ_GRID_NOTICES.txt`; el detalle por archivo permanece en el catálogo original y el inventario. Las conversiones anteriores de OSGeo están descritas en sus README: ViaSpania no afirma ser el autor de ellas. GDAL share conserva sus cabeceras y `LICENSE.TXT`; el alcance de código nativo se examina separadamente en `NATIVE_LICENSE_REVIEW.md`.

Fuentes de condiciones: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/legalcode), [CC0](https://creativecommons.org/publicdomain/zero/1.0/legalcode), [BSD de dos cláusulas](https://opensource.org/license/bsd-2-clause), [OGL Canada 2.0 en SPDX](https://spdx.org/licenses/OGL-Canada-2.0.html), [licencia alemana oficial](https://www.govdata.de/dl-de/by-2-0). El sitio canadiense devolvió 403: se conserva el texto SPDX de la versión que declara el catálogo, no se inventa una licencia a partir de ese error. `GRID_LICENSE_SOURCES.json` identifica descargas y hashes.

## Proveedores de ejecución

| Fuente | Uso | Condiciones y tratamiento |
|---|---|---|
| IGN/CNIG, PNOA, MDT/MDS e históricos | WCS/WMS/WMTS y teselas | [Política oficial](https://www.ign.es/web/politica-datos) y [licencia de uso](https://www.ign.es/resources/licencia/Condiciones_licenciaUso_IGN.pdf): reconocimiento de institución/producto, fuente y cambios. Crédito en visor, capturas e informes y procedencia del raster. |
| OpenStreetMap | Mapa y textura de la zona solicitada | [Copyright](https://www.openstreetmap.org/copyright): atribución visible y URL en salidas no interactivas. ODbL sobre la base no convierte automáticamente una imagen en base derivada. [Política de teselas](https://operations.osmfoundation.org/policies/tiles/): HTTPS, identificación propia en WebView, caché HTTP habitual, sin mecanismo de descarga masiva/offline. El control de atribuciones se mantiene visible. No se garantiza disponibilidad del servicio ni se autoriza ampliar esta función a predescargas. |
| Copernicus CLMS VHR 2021 | Imágenes remotas | [Política](https://land.copernicus.eu/en/data-policy): crédito requerido, identificar composición y no respaldo. La [ficha exacta del producto](https://land.copernicus.eu/en/products/european-image-mosaic/very-high-resolution-image-mosaic-2021-true-colour-2m) remite a esa política y no muestra DOI en su apartado de cita consultado. No se inventa DOI; si el proveedor suministra uno aplicable posteriormente, se deberá incorporar. |
| Copernicus GLO-30 Public | COG público y reproyección GDAL | [Producto usado](https://registry.opendata.aws/copernicus-dem/) y [licencia WorldDEM-30](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf): conservar crédito de datos modificados, responsabilidad y condiciones para receptores. Se añade enlace y aviso de transformación. No se etiqueta como CC BY o GPL. |
| GeoNames | Consulta searchJSON, puntos | [GeoNames](https://www.geonames.org/) declara CC BY 4.0; se conserva procedencia por punto en GeoJSON, CSV y campo textual JSON en GeoPackage, y se atribuye en informes/paquetes que contienen esos puntos. |
| Importaciones y servicios configurables | Recursos elegidos por el usuario | Se conserva atribución suministrada; ausencia de licencia/origen queda REQUIERE REVISIÓN. Un protocolo o formato abierto no concede permiso de redistribución. |

## Procedencia y exportaciones

- Cada cálculo registra la procedencia del raster en el momento de iniciarse; cambiar de selección posteriormente no cambia ese registro. Las uniones de rutas combinan sus fuentes.
- La migración de proyectos antiguos es conservadora, persistente e idempotente: conserva la referencia histórica disponible y marca la fuente ausente; nunca atribuye al proveedor actualmente seleccionado. No puede recuperar información inexistente.
- GeoJSON conserva `data_provenance`; puntos conservan `provenance`. CSV conserva un campo JSON de procedencia; GeoPackage conserva ese campo como texto. El paquete incluye un `.attribution.txt` por archivo, también GeoTIFF/GeoPackage/PNG. **El sidecar forma parte del producto exportado y debe acompañarlo.** No se afirma que un GeoTIFF aislado tenga esos metadatos incrustados.
- Capturas 2D/3D y fotogramas incorporan créditos; el logotipo tiene una zona separada. El exportador rechaza una imagen demasiado pequeña para los créditos, en lugar de cortarlos. Los informes conservan una sección obligatoria paginada de fuentes y créditos por mapa; se corrige el cambio de tamaño de letra al continuar a otra página.
- Los créditos de capas externas se preservan en la composición y en el informe; no se sustituyen por IGN. Las rutas alternativas también conservan crédito por resultado.

## Validación y límites de la conclusión

Pruebas de procedencia, migración, exportaciones, créditos largos y control de cambios; comprobación TypeScript y build. Revisión visual en navegador del compositor real a 640×480 y 320×240; rechazo explícito a 120×80. PDF sintético con 30 créditos, renderizado con Poppler: se identificó y corrigió desbordamiento al cambiar de página, y se revisó la continuación corregida. Son pruebas representativas del motor compartido, no una ejecución exhaustiva de todos los proveedores y combinaciones de UI. No se presentan datos sintéticos como geografía real.

El expediente de release debe verificar los bytes de todos los datos de `share` y avisos dentro de la nueva `.app`; el inspector ahora comprueba también los datos, además de los binarios y licencias. El resultado de esa comprobación queda en `release/APP_INSPECTION.json`. Los instaladores anteriores no quedan validados retroactivamente. La autorización final de publicación sigue separada y depende del cierre de `corresponding_source`.

### Resultado de la verificación final

- 388 pruebas en 77 archivos aprobadas; nueve pruebas del colector aprobadas. TypeScript y build web correctos (se mantiene el aviso de tamaño de chunks de Vite).
- Build macOS `--bundles app` correcto, con runtime preparado y controles de cumplimiento. Inspector: **1012 archivos, cero fallos**, comparación de UUID/enlaces nativos, avisos y todos los hashes de datos de `share`. Registro local: `release/APP_INSPECTION.json`.
- Prueba real GeoJSON → GeoPackage con el GDAL empaquetado y lectura SQLite: el JSON de procedencia del punto se conserva exactamente.
- `git diff --check` sin errores. No se ha regenerado el DMG ni publicado una nueva release en esta fase. El DMG futuro debe construirse con este estado y verificarse antes de publicarlo.

Con estas comprobaciones queda **resuelta la decisión `data` para este alcance**. Sigue pendiente `corresponding_source`. La ausencia de permisos de datos particulares del usuario sigue expresamente fuera de este cierre.
