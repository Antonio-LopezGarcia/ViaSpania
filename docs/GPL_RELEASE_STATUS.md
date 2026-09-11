> Estado vigente 2026-09-11: candidato 0.2.2 en preparación para GitHub como borrador; expediente con 823 componentes. Las revisiones de fuentes correspondientes y de datos/exportaciones están cerradas para los hashes inventariados. No se declara publicación hasta regenerar y verificar los artefactos finales.

# Estado de preparación GPL de ViaSpania 0.2.1

## Resultado actual

PB-2 (alcance residual de Kerberos) está resuelto para el runtime macOS exacto, con avisos conservados y reapertura si cambian los binarios: [NATIVE_LICENSE_REVIEW.md](NATIVE_LICENSE_REVIEW.md). Estos nuevos avisos/evidencias requieren incorporarse al próximo build y paquete de fuentes; los artefactos siguientes son históricos.

La revisión de assets está resuelta para el uso descrito en [ASSETS.md](ASSETS.md): permiso de reproducción del logotipo propio y reconocimiento institucional de financiación. Esta actualización documental requiere incorporarse al próximo build; no se ha creado una nueva release.

La revisión de titularidad y autorización del código propio está resuelta a partir de la declaración del responsable y el extracto de correo UGR aportado: [CODE_OWNERSHIP.md](CODE_OWNERSHIP.md). Los resultados de compilación y hashes siguientes corresponden al candidato anterior a esta actualización documental; no se ha publicado una nueva release.

Se han resuelto los nueve casos de selección/texto de licencia, documentados en [LICENSE_SELECTIONS.md](LICENSE_SELECTIONS.md). Se elige MIT para siete paquetes; Apache-2.0 para lerc; MPL-2.0 con la vía de combinación GPL-3.0-only de §3.3 para selectors. En stackback se conserva además BSD-3-Clause para formatstack.js de V8: no se sustituye por MIT.

La evidencia distingue declaraciones/cabeceras originales de textos estándar SPDX. No se inventan copyrights ni un LICENSE original inexistente. Cada decisión queda vinculada a la versión y hash del paquete en [LICENSE_SELECTIONS.json](LICENSE_SELECTIONS.json); no se aplica automáticamente a versiones futuras ni a bibliotecas nativas de otros titulares.

El expediente reúne 819 componentes, 839 archivos originales de paquetes/fuentes y material de declaración/licencia para los 819 componentes. Esto no implica que todos estén incluidos en macOS, ni que los archivos originales npm con herramientas binarias sean su código fuente preferido para modificaciones.

## Verificación y candidato local

- 360 tests de la aplicación y 7 del colector superados. La primera ejecución de la aplicación tuvo timeouts simultáneos; la repetición completa pasó sin cambiar tests ni sus límites.
- Build web y build macOS correctos. Créditos y los recursos de licencias incluyen las selecciones.
- `.app`: 1008 archivos inspeccionados, sin fallos en la comparación de inventario nativo y avisos. Se conservan los registros de 196 Mach-O (9 ejecutables y 187 bibliotecas), sus proveedores exactos, UUID, enlaces y hashes. Se controlan también 626 archivos de datos.
- `.dmg`: regenerado; `hdiutil verify` = VALID.
- Fuentes: paquete regenerado después de comprobar las entradas del build. SHA-256 recalculado y correcto. No se afirma aún cierre completo de Corresponding Source nativo ni notarización.
- Sin modificaciones de dependencias/lockfiles y sin publicación.

El ejecutable principal usa GDAL/PROJ mediante subprocess; la app sí distribuye el runtime geoespacial y sus dependencias dinámicas. Mantener esta distinción no elimina las obligaciones sobre esos binarios distribuidos.

## Dos revisiones que siguen abiertas

- REQUIERE REVISIÓN: Cerrar recursos auxiliares de builds nativos y verificar reconstrucción desde las fuentes suministradas.
- REQUIERE REVISIÓN: Revisar términos de proj.db, rejillas y exportaciones según DATA_NOTICES.txt.

Estas cuestiones no se resuelven escogiendo MIT. Deben cerrarse con evidencia en [RELEASE_DECISIONS.json](RELEASE_DECISIONS.json). El control estricto de publicación continúa fallando por esas dos revisiones, no por los nueve casos ya resueltos. Se mantiene GPL-3.0-only para el código propio; no se certifica todavía toda la distribución.

## Artefactos locales

- Inventario: `release/compliance/MANIFEST.json`; pendientes: `release/compliance/STATUS.md`.
- Inspección: `release/APP_INSPECTION.json`; hashes: `release/ARTIFACTS.json`.
- Instalador: `src-tauri/target/release/bundle/dmg/ViaSpania_0.2.1_aarch64.dmg`; SHA-256 `bedd1285453458c6c9097a63bcc3cda6b640085ea6768e4d2e9911cf1aec6818`.
- Fuentes: `release/ViaSpania-0.2.1-source-candidate.tar.gz`; SHA-256 `528316d9817649e40c25b6e7c7b5a0ded5e0925a0cdb826a14012ddd38507727`.
- Procedimiento: [RELEASE_COMPLIANCE.md](RELEASE_COMPLIANCE.md).

`release/` está excluido de Git por tamaño. Los artefactos son candidatos locales pendientes de las dos revisiones. Para la distribución final se deberán ofrecer instalador y fuentes correspondientes por una vía válida y conservar las atribuciones y obligaciones aplicables.
