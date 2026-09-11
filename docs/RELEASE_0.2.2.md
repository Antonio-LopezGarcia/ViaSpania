# ViaSpania 0.2.2 — candidato de release

Actualización de la interfaz, importación de elementos, opciones de movimiento y exportaciones de resultados y vídeo. Incluye los cambios de desarrollo posteriores a 0.2.1, con 414 pruebas de aplicación verificadas.

Se amplía el expediente de fuentes y avisos con mimalloc y dependencias de cabeceras de SFCGAL. Se conservan las atribuciones y la licencia del código propio GPL-3.0-only.

## Estado del candidato

Los instaladores y el paquete de fuentes se preparan para una release **en borrador**. Quedan abiertas la revisión integral de fuentes correspondientes y la revisión de datos/exportaciones reabierta por cambios de implementación. Las reconstrucciones parciales no se presentan como cierre de toda la cadena.

El build macOS incorpora GDAL/PROJ. No incluye firma Apple Developer ID ni notarización. Las compilaciones de Windows y Linux requieren sus propios entornos y comprobaciones.

No publicar el borrador automáticamente mientras falle `compliance:check --strict`. El detalle de fuentes y reconstrucciones está en `docs/CORRESPONDING_SOURCE_REVIEW.md`.
