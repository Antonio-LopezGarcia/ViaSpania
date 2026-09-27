# Exportación AVI y MP4

Al pulsar «Exportar vídeo» se abre una ventana en español o inglés, según el
idioma activo, para elegir AVI (por defecto) o MP4. AVI conserva el flujo anterior:
renderizado AVI/MJPEG y diálogo de guardado al terminar. Para MP4 se elige primero
el destino `.mp4`, se renderiza el AVI internamente y se convierte inmediatamente
al terminar, sin otro diálogo ni exponer el AVI intermedio. Se muestra el estado
«Convirtiendo a MP4…». Se ejecuta exclusivamente el FFmpeg incluido con la
aplicación, nunca uno encontrado en PATH. Cancelar la selección o el destino MP4
no inicia el renderizado.

La conversión usa libx264, CRF 20, preset medium y yuv420p. Se convierte el rango
completo del JPEG al rango limitado de vídeo, conservando dimensiones y tiempos
originales; no se escala la resolución ni se fuerza otra frecuencia. El AVI del
renderizador no tiene audio; no se crea ninguna pista de audio.

El MP4 se escribe junto al destino en un archivo provisional y se publica al
terminar correctamente. Solo entonces se elimina el AVI temporal. Un error de
conversión o publicación conserva el AVI finalizado; el mensaje muestra su ruta
para recuperarlo. La cancelación posterior de la sesión no lo borra.

## Dependencias y licencias

`docs/VIDEO_DEPENDENCIES.json` fija fuentes, SHA-256 y configuración exacta:

- FFmpeg 8.0.1: configuración GPL-3.0-or-later, seleccionada GPL-3.0-only.
- libx264 c24e06c2e184345ceb33eb20a15d1024d9fd3497: GPL-2.0-or-later,
  seleccionada GPL-3.0-only. El encabezado original x264.h concede versiones posteriores.

La configuración utiliza `--enable-gpl --enable-version3 --enable-libx264`,
desactiva autodetección, red y componentes no requeridos y enlaza x264
estáticamente. No habilita `--enable-nonfree`. Los textos originales están en
`docs/video-licenses`; la atribución IJG se conserva. No se modifican las fuentes
upstream. Esto sigue la política de [FFmpeg](https://ffmpeg.org/legal.html) y la
declaración de la versión concreta en `docs/video-licenses/FFmpeg-LICENSE.md`.

La compilación y verificación no aceptan opciones adicionales ni enlaces externos
no inventariados. `BUILD.json` vincula binario, fuentes, avisos y receta por hash.
Los archivos fuente exactos se incluyen en el recurso `video/sources`, además del
expediente de fuentes del proyecto. Los notices y el inventario público se
regeneran con las herramientas de compliance.

```sh
# Python >= 3.11, compilador C, make y pkg-config. Descarga inicial explícita:
pnpm video:prepare --network
pnpm video:check
pnpm compliance:prepare
pnpm compliance:check
pnpm compliance:test
cargo test --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml real_mp4 -- --ignored
```

El build nativo exige el conversor preparado, sin descargas implícitas. La
verificación de enlaces cubre macOS, Linux y las DLL del sistema Windows
(mediante objdump en MSYS2). Las dependencias externas no inventariadas bloquean
el empaquetado. La compilación y la prueba real se han ejecutado en macOS arm64;
Linux y Windows requieren validación en sus respectivos sistemas. Los cambios
previos del proyecto pueden dejar pendientes otras
revisiones globales de compliance, que no se dan por resueltas con este conversor.

## Preparación en GitHub Actions

El job `installers` de `.github/workflows/desktop-portability.yml` prepara el
conversor antes del expediente de macOS y de cualquier build de Tauri. Instala
Python 3.12 y las herramientas C/make/pkg-config; Windows usa
[MSYS2/UCRT64](https://github.com/msys2/setup-msys2) con GCC, binutils y pkgconf.
Las fuentes se descargan explícitamente con `--network` y se comprueban contra
los SHA-256 fijados antes de compilar. Después se ejecuta `--check` para validar
el binario, los enlaces, la configuración, las fuentes y los avisos. Cualquier
fallo detiene ese instalador antes de construirlo.

En Windows se usa Python nativo dentro del shell MSYS2 y se convierte el prefijo
de instalación a una ruta POSIX para configure/make. El directorio UCRT64 de
binutils queda disponible en los pasos posteriores de PowerShell para que el
hook de Tauri pueda verificar el conversor con objdump. Los builds posteriores
reutilizan únicamente recursos que superen la verificación; no necesitan
descargas implícitas. Esta integración no constituye evidencia de ejecución
exitosa en Windows/Linux hasta que sus jobs se hayan ejecutado.
