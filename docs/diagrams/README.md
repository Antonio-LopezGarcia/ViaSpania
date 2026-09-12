# Arquitectura de ViaSpania · Archify

Árbol de tipo `architecture` basado en `../architecture.md`, resumido a las capas principales del repositorio. Los nombres de archivos ilustrativos del documento no se trasladan como módulos existentes. La interfaz llama a la lógica y a los adaptadores; los detalles internos y las dependencias secundarias se omiten para mantener la lectura en árbol.

- `architecture.json`: fuente editable (Archify 2.17).
- `architecture.html`: visor autónomo, sin publicación externa.
- `architecture.delivery.json`: recibo con SHA-256 y tamaños de la especificación y del HTML; 9/9 comprobaciones showcase, cero errores y advertencias.
- `architecture.visual-check.json`: evidencia automática de Chrome en 1440×900, 1600×1000, 1920×1080 y 2048×1320, sin desbordamientos.
- `architecture.visual-check.html` y PNG asociados: hoja de contacto y capturas del HTML entregado. La captura clara de mayor tamaño se incluye en el README raíz.

Revisión visual realizada sobre las capturas clara de 2048×1320 y oscura de 1440×900: árbol legible, sin cruces ni etiquetas superpuestas. `visual_review: passed`; `browser_evidence: passed`; `correction_rounds: 2`. El estado `visualReview: pending` del recibo automático se conserva: ese comprobador no realiza revisión perceptual.

## Regeneración

Desde la raíz del repositorio, sustituya `<ARCHIFY>` por la carpeta de instalación de la skill:

```bash
node <ARCHIFY>/bin/archify.mjs validate architecture docs/diagrams/architecture.json --quality showcase --json
node <ARCHIFY>/bin/archify.mjs deliver architecture docs/diagrams/architecture.json docs/diagrams/architecture.html --quality showcase --json > docs/diagrams/architecture.delivery.json
node <ARCHIFY>/bin/archify.mjs visual-check docs/diagrams/architecture.html --json
```

Ejecute cada paso únicamente si el anterior termina correctamente. Tras regenerar, revise las capturas antes de actualizar la revisión visual. El HTML y las capturas son archivos generados; edite la especificación JSON.
