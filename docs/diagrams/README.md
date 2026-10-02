# Arquitectura de ViaSpania · Archify

Árbol de tipo `architecture` basado en [la arquitectura del repositorio](../ARCHITECTURE.md), resumido a las capas principales. Los nombres de archivos ilustrativos no se trasladan como módulos existentes. La interfaz llama a la lógica y a los adaptadores; los detalles internos y las dependencias secundarias se omiten para mantener la lectura en árbol.

- `architecture.json`: fuente editable (Archify 2.17).
- `architecture.html`: visor autónomo, sin publicación externa.
- `architecture-overview.png`: imagen resumida enlazada desde el README raíz.

## Regeneración

Desde la raíz del repositorio, sustituya `<ARCHIFY>` por la carpeta de instalación de la skill:

```bash
node <ARCHIFY>/bin/archify.mjs validate architecture docs/diagrams/architecture.json --quality showcase --json
node <ARCHIFY>/bin/archify.mjs deliver architecture docs/diagrams/architecture.json docs/diagrams/architecture.html --quality showcase --json > docs/diagrams/architecture.delivery.json
node <ARCHIFY>/bin/archify.mjs visual-check docs/diagrams/architecture.html --json
```

Ejecute cada paso únicamente si el anterior termina correctamente. Tras regenerar, revise las capturas antes de actualizar la revisión visual. El HTML y las capturas son archivos generados; edite la especificación JSON.
