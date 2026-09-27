# ViaSpania 0.2.3 — candidato de release

Versión de cierre del trabajo posterior a 0.2.2. Incluye sombreado del relieve, mapa LiDAR del IGN como fondo atribuido, mejoras de modelos ráster grandes, cancelación y memoria de cálculos, búsqueda de lugares y flujo de puntos, leyendas y atribución en informes y vídeo, y exportación MP4/H.264 además de AVI/MJPEG, GIF y PNG.

La exportación MP4 convierte el AVI ya compuesto con el FFmpeg/libx264 incluido. Si falla, conserva el AVI intermedio. Las exportaciones de resultados mantienen la procedencia y generan archivos de atribución junto a los productos cuando corresponde.

El candidato debe distribuirse con el expediente regenerado, sus hashes, el paquete de fuentes correspondiente y los instaladores inspeccionados de cada plataforma. `pnpm compliance:check --strict` es la comprobación de integridad previa a publicación; no constituye certificación jurídica ni sustituye la revisión de los términos de datos importados por el usuario.

## Verificación

- Pruebas TypeScript/React, Rust y del colector de cumplimiento: ejecutar `pnpm test`, `cargo test --manifest-path src-tauri/Cargo.toml` y `pnpm compliance:test`.
- Build web: `pnpm build`.
- Conversor: `pnpm video:check` y prueba real MP4 en cada plataforma de distribución.
- Expediente: `pnpm compliance:prepare --network`, `pnpm compliance:check --strict`.
- Instaladores: inspeccionar la aplicación/paquete resultante, comprobar que contiene recursos geoespaciales, vídeo, avisos, fuentes y `SOURCE_CODE.txt`, y ejecutar una exportación mínima de ráster y vídeo.
