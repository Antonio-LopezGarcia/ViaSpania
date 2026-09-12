# Notas técnicas y de diseño

Esta carpeta reúne decisiones de implementación y revisiones funcionales concretas de ViaSpania. Son documentos de apoyo para mantenimiento y evolución del código; el [manual general](../manual.md), la [arquitectura](../ARCHITECTURE.md) y la [documentación de empaquetado](../desktop-portability.md) siguen siendo las referencias principales.

## Interfaz, proyectos y herramientas

- [Estado de proyecto vacío](empty-project.md): creación de proyectos sin datos iniciales y estados de la interfaz.
- [Editor compacto de barreras y facilitadores](compact-facilitators.md): organización y comportamiento del editor de restricciones.
- [Facilitadores de coste](facilitators.md): representación y aplicación de elementos que reducen el coste.
- [Barreras y facilitadores sobre el modelo digital](mdt-constraints.md): integración de restricciones con el ráster de cálculo.
- [Puentes de paso obligatorio](required-crossings.md): tratamiento de cruces obligatorios sobre barreras absolutas.
- [Buscar lugar con GeoNames](gazetteer.md): adaptador de búsqueda, límites de red e interpretación de coordenadas.

## Visualización y exportación

- [Ventana independiente del visor 3D](detached-terrain-window.md): ciclo de vida y validación del visor desacoplado.
- [Revisión de exportación 3D](3d-export-revision.md): decisiones sobre formatos, memoria y escritura de vídeo.
- [Impresión de resultados de cálculo](calculation-viewer-exports.md): responsabilidades del visor y del compositor de informes.

## Motor nativo

- [Backend nativo y empaquetado](native-backend.md): integración de Rust, GDAL/PROJ y firma local.

## Relación con otras referencias

- [Arquitectura general](../ARCHITECTURE.md)
- [Manual en español](../manual.md) · [Manual in English](../manual.en.md)
- [Empaquetado multiplataforma](../desktop-portability.md)
- [Auditoría de modelos](../model-audit.md)
- [Preparación de la distribución GPL](../RELEASE_COMPLIANCE.md)

Las notas pueden describir el estado y las validaciones disponibles en el momento en que se tomaron las decisiones. Cuando exista una discrepancia, prevalecen el código actual, las pruebas y la documentación principal enlazada arriba.
