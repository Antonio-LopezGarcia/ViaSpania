# Preparación de una distribución GPL de ViaSpania

Avance de reconstrucción nativa (11-09-2026): [CORRESPONDING_SOURCE_REVIEW.md](CORRESPONDING_SOURCE_REVIEW.md). Se incorporó mimalloc 3.4.1 al colector y se completaron pruebas parciales de PROJ, Arrow y GDAL; el cierre integral continúa pendiente.

El código propio usa GPL-3.0-only. El expediente automatizado conserva fuentes y avisos; **no concede permisos de los titulares ni certifica automáticamente una release**. Los resultados con revisiones pendientes son candidatos locales y el control `--strict` impide su publicación automatizada.

## Requisitos y comandos (macOS)

Se necesita Python 3.11+ (solo biblioteca estándar), Node/pnpm, Rust y las herramientas de desarrollo Apple. Las dependencias JS/Rust están fijadas en sus lockfiles. GDAL/PROJ deben estar instalados con Homebrew. No utilizar versiones `stable` de fórmulas como sustituto de las versiones instaladas.

1. `pnpm install --frozen-lockfile` y entorno Rust del proyecto.
2. `pnpm geospatial:prepare` copia binarios/datos y registra sus originales, UUID, hashes, receta instalada y recibo de Homebrew.
3. `pnpm compliance:prepare --network` obtiene fuentes por URL y hash fijados. Sin `--network` solo usa el expediente/cache ya disponible. Guarda textos originales de licencias y avisos bajo `public/compliance`, incluidos los de paquetes de otros targets/build para cobertura de fuentes.
4. `pnpm test`, `pnpm compliance:test` y `pnpm build`.
5. `VIASPANIA_USE_PREPARED_GEOSPATIAL=1 pnpm compliance:build`. La reutilización exige que todos los binarios coincidan con el expediente; no omite esa comprobación.
6. `pnpm compliance:inspect` compara la `.app` con el inventario y avisos y registra hashes del producto.
7. `pnpm compliance:package` genera el paquete de fuentes local en `release/`. Incluye el código actual (también modificaciones aún no committeadas), pero excluye `tmp/`, backups, configuraciones privadas y archivos .env. No es una copia automática de la rama principal. No distribuye `.git`, herramientas del sistema ni archivos fuera del proyecto.
8. `pnpm compliance:check --strict` debe pasar **antes de publicar**. Actualmente las revisiones humanas/documentales siguen pendientes. Ofrecer instalador y paquete de fuentes de esa versión juntos, con hashes e instrucciones claras. No se ha configurado una oferta escrita ni publicado fuentes en nombre de los titulares.

Cambiar las fuentes después de generar el paquete exige regenerarlo y repetir su correspondencia con la compilación. Las recetas nativas originales, parámetros/recibos de Homebrew y scripts del proyecto se conservan; comprobar también recursos descargados transitivamente por CMake u otros builds. Archivos fuente obtenidos no equivalen a reconstrucción demostrada ni a cierre automático de Corresponding Source.

## Contenido del expediente

- `release/compliance/MANIFEST.json`: inventario, hashes de entradas, fuentes/avisos verificados y revisiones.
- `release/compliance/STATUS.md`: faltas concretas de obtención, textos y revisiones.
- `release/compliance/npm`, `cargo`, `native`: archivos comprimidos originales sin ejecutar su contenido; URL y SHA-256 documentados. npm verifica SRI del lockfile y crates SHA-256 de Cargo.lock.
- `src-tauri/resources/geospatial/compliance`: relación Mach-O ↔ fórmula/version instalada y recetas/recibos. No depende de una consulta actual a `brew info`.
- `public/compliance/THIRD_PARTY_LICENSES.txt`: textos originales encontrados; no borra copyrights, no inventa titulares y no convierte una licencia dual OR en obligación AND.
- `public/compliance/RUST_STANDARD_LIBRARY.html`: avisos específicos de std del toolchain instalado, cuando están disponibles.
- `release/APP_INSPECTION.json`: evidencia de la `.app` real, incluida la relación con frameworks del SO.
- `release/SOURCE_ARTIFACT.json`: hash del paquete local de fuentes y de los archivos propios incluidos.

Los textos de fuentes de build u otros sistemas se incluyen para no perder sus avisos cuando se ofrece el código; su inclusión en el expediente no afirma que todos esos componentes estén enlazados en macOS. Las licencias de datos permanecen bajo `geospatial/share` y sus términos no pasan a GPL.

## Revisión humana/documental pendiente

Confirmar titularidad/mandato institucional; aprobar términos precisos de assets oficiales ([ASSETS.md](ASSETS.md)); revisar alcance de licencias nativas compuestas con fuentes/objetos; completar términos de bases/rejillas y todas las salidas; cerrar descargas auxiliares de builds nativos y reconstruir desde el paquete. La autorización de publicación se documentará con evidencia concreta, no borrando avisos ni ignorando el control.

Windows/Linux requieren la misma comprobación sobre sus propios instaladores y procedencia apt/conda; este colector nativo no convierte el resultado macOS en una auditoría de esos targets.

El build ordinario conserva su flujo de desarrollo. `compliance:build` añade comprobación del expediente y recibo de entradas para el candidato macOS; `compliance:check --strict` bloquea cualquier publicación automática sin expediente cerrado, también en otros targets.

Las cinco revisiones se documentan en `docs/RELEASE_DECISIONS.json`. Solo marcar `resolved` después de completar la revisión indicada e incluir evidencia identificable (permiso, informe, resultado de reconstrucción). El programa registra esa declaración; no valida la autoridad del firmante ni la veracidad jurídica. La publicación de fuentes se cumple al ofrecerlas junto al instalador; no es una autorización que se conceda a sí mismo el colector. Los archivos npm originales pueden contener binarios de herramientas de build: conservarlos no los convierte en código fuente.

Los avisos ausentes recuperables se contrastan con el commit indicado en el paquete (`gitHead` o `.cargo_vcs_info.json`), el árbol Git oficial y el hash del blob; se conserva la evidencia bajo `UPSTREAM_NOTICES.json` y `upstream-trees/`. Nunca se supone que la rama actual corresponda a una versión histórica.
