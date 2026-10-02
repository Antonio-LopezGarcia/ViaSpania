# Auditoría de documentación

Fecha: 2 de octubre de 2026. Alcance: documentación versionada, referencias desde la aplicación y scripts, y artefactos de documentación bajo `docs/`. La revisión se hizo sobre el árbol de trabajo actual; `README.md`, los manuales y numerosos archivos de código ya tenían cambios locales, que se dejaron intactos.

## Resultado

El repositorio mezcla cuatro cosas distintas: documentación de uso, referencias de mantenimiento, expedientes de cumplimiento y notas de cambios puntuales. El problema principal no es que toda la carpeta `docs/` sobre: es que no queda claro qué es una referencia vigente y qué es evidencia histórica. No conviene borrar en bloque `docs/`: los scripts de cumplimiento leen varios de esos archivos para generar avisos, paquetes de fuentes y manifiestos verificables.

La aplicación sí incorpora tres manuales como contenido de ayuda (`manual.md`, `manual.en.md` y `manual.it.md`). El resto de `docs/` no se incorpora a la interfaz por esta vía. La carpeta también contiene evidencia de licencia y procedencia que forma parte del proceso de distribución aunque no sea documentación para usuarios.

## Cambios aplicados

- Reescrita `docs/ARCHITECTURE.md` como referencia corta basada en los directorios y flujos actuales.
- Retirado `docs/research.md`; las referencias científicas de modelos se mantienen en `docs/model-audit.md`. Se actualizaron sus enlaces en `docs/LICENSE_AUDIT.md`.
- Consolidada la documentación de restricciones en `design-notes/constraints-and-crossings.md` y la de elevación/ráster en `design-notes/raster-processing.md`.
- Consolidada la documentación de hillshade y visor 3D en `design-notes/terrain-visualization.md`.
- Retiradas las notas fuente que quedaron sustituidas por esas referencias: `facilitators.md`, `mdt-constraints.md`, `required-crossings.md`, `compact-facilitators.md`, `elevation-model-limits.md`, `large-raster-analyses.md`, `large-raster-routing.md`, `mdt05-download-limits.md`, `detached-terrain-window.md`, `terrain-3d-edges.md` y `hillshade.md`.
- Retirados apuntes obsoletos o duplicados: `research.md`, `3d-export-revision.md`, `empty-project.md`, `calculation-viewer-exports.md` y `design-notes/native-backend.md`. La exportación y empaquetado actuales se documentan en `VIDEO_EXPORT.md` y `desktop-portability.md`.
- Actualizado el índice de notas técnicas y eliminado material de revisión visual generado del diagrama (recibos, capturas y página de verificación). Se conservan la fuente JSON, el visor HTML y la imagen del README.
- No se modificaron `README.md` ni los manuales, que tenían cambios locales previos.

## Acciones recomendadas

| Prioridad | Grupo | Acción | Motivo |
| --- | --- | --- | --- |
| Alta | `docs/ARCHITECTURE.md` | **Hecho:** reescrita como referencia breve basada en la estructura actual. | La versión anterior tenía ejemplos de módulos inexistentes y flujos de plataforma que ya no describían bien el repositorio. |
| Alta | `docs/research.md` | **Hecho:** retirada; se conservaron referencias científicas en `docs/model-audit.md` y se actualizaron enlaces del expediente de licencias. | Era un registro fechado que mezclaba comprobaciones temporales y tareas futuras. |
| Alta | `docs/design-notes/` | **Hecho para los grupos tratados:** cotejadas y consolidadas las notas de restricciones, ráster y visor 3D; retiradas varias notas puntuales ya resueltas. | Se conservaron las referencias específicas aún útiles para mantenimiento, como GeoNames y LiDAR. |
| Media | Notas de barreras y facilitadores | **Hecho:** consolidadas las notas funcionales en `design-notes/constraints-and-crossings.md`; retirada `compact-facilitators.md`, que describía una revisión de UI ya aplicada. | Las reglas técnicas comparten ahora una referencia; el manual sigue siendo la guía de interfaz. |
| Media | Notas de elevación y ráster | **Hecho:** combinadas en `design-notes/raster-processing.md`, sin conservar cifras históricas de rendimiento como garantías. | Se reunieron límites, memoria, descarga e importación, cotejados con las constantes actuales. |
| Media | Visor 3D | **Hecho:** combinadas en `design-notes/terrain-visualization.md`. | Hillshade, ventana desacoplada, NoData y textura se mantienen en una referencia común. |
| Media | `docs/diagrams/` | **Hecho:** retirada la evidencia visual de comprobación generada sin consumidores encontrados. Se mantienen la fuente JSON, HTML entregable e imagen enlazada por README. | Capturas y recibos no son entradas del programa ni aparecen referenciados por scripts/workflows. |
| Baja | `docs/RELEASE_0.2.2.md`, `docs/RELEASE_0.2.3.md`, `docs/PRE_0.2.0_HISTORY.md` | Mantener como historial inmutable o trasladar a notas de versión; no mezclarlos con la guía vigente. | Un registro de release conserva qué se publicó y qué se validó entonces. Sus cifras no deben presentarse como estado actual. `PRE_0.2.0_HISTORY.md` requiere decidir si ese nivel de detalle histórico tiene valor público. |
| Baja | Cumplimiento y licencias | Mantener los manifiestos, textos upstream, fuentes correspondientes, revisiones y scripts referenciados. Consolidar solo la explicación narrativa repetida; no fusionar ni quitar las evidencias fuente. | `scripts/compliance/release.py`, otros scripts y los avisos generados consumen explícitamente parte de este material. Retirarlo puede romper verificaciones o dejar incompleto el expediente de una distribución. |
| Baja | Manuales | Mantener un archivo por idioma, ya que la aplicación importa cada idioma por separado. Revisar su sincronía con la interfaz antes de cada release y mantener el índice/enlaces en README. | Los tres manuales tienen consumidores reales. No deben combinarse en un único archivo si eso dificulta la carga localizada dentro de la aplicación. |

## Clasificación de archivos

### Documentación activa o con consumidor directo

- `README.md`: portada, instalación, estado público y enlaces. La versión actual contiene texto sobre cambios locales preparados para v0.2.4; retirarlo o actualizarlo al publicar la release.
- `docs/manual.md`, `docs/manual.en.md`, `docs/manual.it.md`: ayuda integrada. Los manuales español e inglés estaban modificados localmente durante esta auditoría; no se compararon esos cambios con el código ni se sobrescribieron.
- `docs/VIDEO_EXPORT.md`, `docs/desktop-portability.md`, `docs/TRANSLATING_IT.md`, `docs/model-audit.md`: documentación de subsistemas y procesos concretos. Comprobar cifras y comandos al cambiar esos subsistemas.
- `docs/ASSETS.md`, `docs/CODE_OWNERSHIP.md`, `docs/RELEASE_COMPLIANCE.md` y revisiones de licencia/fuentes/datos: expediente de distribución y decisiones declaradas. Aunque algunas páginas sean largas o específicas, no son restos sin uso.
- `docs/diagrams/architecture.json` y recursos vinculados desde README: fuente y presentación del diagrama.

### Candidatos a consolidación o retirada

- `docs/design-notes/calculation-viewer-exports.md`: retirar si la decisión ya está implementada y no tiene una función futura activa; su propio texto la deja como estudio futuro.
- `docs/design-notes/empty-project.md` y `3d-export-revision.md`: candidatos a retirar una vez confirmada la cobertura en el manual o código. Son narraciones de cambios ya realizados.
- `docs/RELEASE_0.2.2.md`, `RELEASE_0.2.3.md` y `PRE_0.2.0_HISTORY.md`: no son necesarios para ejecutar la aplicación; conservarlos como historial o moverlos a una carpeta de archivo. Eliminar solo si se decide que Git no debe guardar notas históricas.

### No borrar por una limpieza general

- `docs/data-evidence/`, `docs/native-evidence/`, `docs/corresponding-source-evidence/`, `docs/license-evidence/` y `docs/video-licenses/` contienen evidencia o textos upstream. Parte está incorporada a los cálculos y verificaciones de distribución.
- `docs/LICENSE_SELECTIONS.json`, `docs/NATIVE_AUXILIARY_SOURCES.json`, `docs/VIDEO_DEPENDENCIES.json` y `docs/RELEASE_DECISIONS.json` son datos estructurados consumidos por scripts.
- Los documentos de autoría, permisos, copyright de assets, atribuciones y licencias cumplen una función distinta de explicar la interfaz. Su extensión no los convierte en candidatos seguros para borrar.

## Referencias y comprobaciones realizadas

- `src/components/HelpControl.tsx` importa los tres manuales como texto; `src/core/contact.test.ts` importa los manuales español e inglés.
- `scripts/prepare-italian-catalog.mjs` lee el manual español para preparar el catálogo italiano.
- `scripts/compliance/release.py`, `scripts/compliance/video.py`, `scripts/compliance/selections.py`, `scripts/compliance/audit_native_sources.py` y `scripts/compliance/rebuild_cmake_components.py` leen evidencia y datos bajo `docs/`.
- `README.md` enlaza a manuales, resumen de release, documentación de cumplimiento, ownership, assets, financiación y muestra `docs/diagrams/architecture-overview.png`.
- `docs/design-notes/README.md` enumera referencias técnicas vigentes y enlaza por separado los apuntes de implementación que pueden ser históricos.

## Criterio para futuras limpiezas

Antes de retirar un archivo, comprobar referencias desde código, scripts, README, workflows, configuración de publicación y avisos generados. Si contiene evidencia que justifica un artefacto publicado, conservar la copia necesaria aunque se quite la explicación duplicada. El objetivo editorial recomendado es que `docs/` distinga claramente: guía de usuario, referencia técnica vigente, notas de versión e historial, y expediente de cumplimiento.
