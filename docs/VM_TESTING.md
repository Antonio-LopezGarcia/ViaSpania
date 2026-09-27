# Pruebas locales en VMware Fusion

Guía preparada el 20-09-2026 para Ubuntu 26.04 ARM64 y Windows 11 ARM.
No consume GitHub Actions. Los comandos se han contrastado con los scripts del
proyecto, pero todavía no se han ejecutado en estas dos máquinas virtuales.

El archivo `ViaSpania-vm-testing.tar.gz` contiene las fuentes locales actuales,
incluidos cambios sin commit. No contiene los instaladores ni las dependencias
compiladas del Mac. La versión interna sigue siendo 0.2.2: es un candidato de
trabajo para preparar 0.2.3, no una publicación nueva.

Copiar y extraer el archivo en el disco de cada VM. No compilar directamente
sobre una carpeta compartida de VMware: usar `~/ViaSpania` en Ubuntu y
`C:\ViaSpania` en Windows. Cada VM tendrá su propio `node_modules`, `target` y
recursos nativos. Las primeras instalaciones y descargas necesitan Internet.
Como orientación, asignar 4 CPU, 8 GB de RAM y 30 GB de disco libre si el Mac lo
permite; las pruebas de modelos grandes pueden necesitar más memoria.

## Ubuntu 26.04 ARM64

### Preparar herramientas

Confirmar `aarch64` con `uname -m`. Instalar los requisitos nativos de Tauri,
GDAL/PROJ y el conversor:

```bash
sudo apt update
sudo apt install -y build-essential curl wget file git pkg-config \
  libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev \
  librsvg2-dev patchelf gdal-bin libgdal-dev proj-bin python3
```

Instalar **Node.js 24 para Linux ARM64** desde
[Node.js](https://nodejs.org/en/download), siguiendo sus instrucciones de
instalación para Linux. Instalar Rust con el instalador oficial de
[rustup](https://rustup.rs/):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs -o /tmp/viaspania-rustup.sh
sh /tmp/viaspania-rustup.sh -y
. "$HOME/.cargo/env"
node --version
npm install --global pnpm@11.19.0
rustc --version
```

Si npm no tiene permiso para su directorio global, usar una instalación de Node
para el usuario según sus instrucciones; no cambiar permisos del sistema.

### Extraer y compilar

Copiar el archivo a Descargas. Adaptar la ruta si la carpeta se llama Downloads:

```bash
tar -xzf ~/Descargas/ViaSpania-vm-testing.tar.gz -C ~
cd ~/ViaSpania
pnpm install --frozen-lockfile
pnpm video:prepare --network
pnpm video:check
pnpm test
pnpm build
cargo test --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml real_mp4 -- --ignored
pnpm tauri build --bundles deb
```

El último comando prepara GDAL/PROJ, vuelve a comprobar el conversor y genera el
instalador en `src-tauri/target/release/bundle/deb/`. Para empezar usamos `.deb`;
no necesitamos instalar RPM ni resolver requisitos de AppImage.

```bash
sudo apt install ./src-tauri/target/release/bundle/deb/*.deb
```

Abrir ViaSpania desde el menú de aplicaciones. Este paquete se ha compilado
sobre Ubuntu 26.04: no se presume compatible con versiones anteriores de Ubuntu.
Para generar también AppImage después, usar `pnpm tauri build --bundles appimage`.

## Windows 11 ARM: candidato x64 bajo emulación

Se mantiene la arquitectura x64 del paquete Windows actual. No mezclar
GDAL ARM64 o FFmpeg ARM64 con esta receta. Windows 11 ARM ejecuta aplicaciones
x64 mediante emulación; la compatibilidad completa de ViaSpania se debe probar.

### Preparar herramientas

Instalar desde sus páginas oficiales:

1. [Visual Studio / Build Tools](https://visualstudio.microsoft.com/downloads/):
   carga **Desarrollo para el escritorio con C++**, herramientas MSVC para
   **x64/x86** y Windows SDK. Visual Studio puede ser nativo ARM64; el destino
   de esta compilación será x64.
2. [Node.js 24 para Windows x64](https://nodejs.org/en/download).
3. [Rust mediante rustup](https://rustup.rs/). Más abajo se selecciona
   explícitamente el toolchain x64 MSVC.
4. [Miniforge3 Windows x86_64](https://github.com/conda-forge/miniforge), para
   obtener GDAL/PROJ y Python x64.
5. [MSYS2](https://www.msys2.org/), en `C:\msys64`; se utilizará la terminal
   **UCRT64**, no CLANGARM64.
6. [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
   si no está instalado. Es el motor web del sistema; no hay que forzarlo a x64.

Copiar el archivo de fuentes a Windows y extraerlo. Por ejemplo, desde PowerShell,
si está en Descargas (extraer en `C:\` puede requerir permisos; también sirve una
carpeta del usuario sin espacios, adaptando todos los `cd`):

```powershell
tar -xzf "$env:USERPROFILE\Downloads\ViaSpania-vm-testing.tar.gz" -C C:\
```

Abrir **Miniforge Prompt**, crear el entorno y abrir PowerShell heredando ese
entorno:

```bat
conda create -n viaspania-build -c conda-forge python=3.12 gdal -y
conda activate viaspania-build
powershell -NoProfile
```

En esa PowerShell:

```powershell
cd C:\ViaSpania
$env:GDAL_DATA = "$env:CONDA_PREFIX\Library\share\gdal"
$env:PROJ_DATA = "$env:CONDA_PREFIX\Library\share\proj"
$env:Path = "$env:CONDA_PREFIX\Library\bin;$env:Path"
node -p "process.arch"
python -c "import sys; print(sys.executable)"
gdalinfo --version
npm.cmd install --global pnpm@11.19.0
rustup toolchain install stable-x86_64-pc-windows-msvc
rustup override set stable-x86_64-pc-windows-msvc
pnpm.cmd install --frozen-lockfile
```

`process.arch` debe ser `x64`. Python debe ser el del entorno `viaspania-build`.
Si `rustup` no se reconoce, cerrar y volver a abrir Miniforge Prompt tras su
instalación, reactivar el entorno y repetir la apertura de PowerShell.

### Compilar FFmpeg/libx264 con UCRT64

Desde esa misma PowerShell, abrir MSYS2 heredando el PATH y el directorio actual:

```powershell
& C:\msys64\msys2_shell.cmd -defterm -here -no-start -ucrt64 -full-path
```

Dentro del shell **UCRT64**:

```bash
pacman -Syu
```

Si la actualización pide cerrar la terminal, cerrarla y repetir la apertura de
UCRT64 desde PowerShell. Después:

```bash
pacman -Su
pacman -S --needed make diffutils mingw-w64-ucrt-x86_64-gcc \
  mingw-w64-ucrt-x86_64-binutils mingw-w64-ucrt-x86_64-pkgconf
cd /c/ViaSpania
python -c 'import sys; print(sys.executable)'
export CC=gcc
python scripts/prepare-video.py --network
python scripts/prepare-video.py --check
exit
```

Python debe seguir siendo el del entorno Conda x64, no el Python POSIX de MSYS.
El script descarga las fuentes fijadas por SHA-256 y compila el conversor, sin
utilizar un FFmpeg instalado por otro programa. Si un comando falla, detenerse
y guardar su error; no continuar al empaquetado.

### Generar el instalador Windows

De vuelta en la PowerShell con el entorno Conda activo:

```powershell
$env:Path = "C:\msys64\ucrt64\bin;$env:Path"
pnpm.cmd video:check
pnpm.cmd test
pnpm.cmd build
cargo test --manifest-path src-tauri/Cargo.toml --target x86_64-pc-windows-msvc
pnpm.cmd tauri build --target x86_64-pc-windows-msvc --bundles nsis
```

El instalador `*-setup.exe` estará en:

```text
C:\ViaSpania\src-tauri\target\x86_64-pc-windows-msvc\release\bundle\nsis\
```

Ejecutarlo y abrir ViaSpania desde Inicio, fuera de Miniforge/MSYS2. Eso ayuda a
comprobar que usa los recursos empaquetados y no las dependencias del entorno de
compilación. La prueba real MP4 existente contiene rutas de ejecutables Unix;
en Windows, en esta guía, la conversión se comprueba manualmente desde la app.
No se afirma que esa prueba automatizada esté adaptada o ejecutada en Windows.

## Prueba del instalador en ambas máquinas

1. Abrir la aplicación desde el menú del sistema y anotar versión/build.
2. Abrir una copia de un proyecto de 0.2.2; comprobar puntos, orden y resultados.
3. Importar un GeoTIFF pequeño, calcular una ruta y cancelar otro cálculo.
4. Abrir 3D, activar Hillshade y una capa base; revisar sus atribuciones.
5. Exportar un vídeo corto (por ejemplo 3 segundos y 720p) a AVI y MP4; abrir
   ambos en un reproductor y revisar dimensiones, duración, colores y créditos.
6. Exportar un PDF y comprobar mapas y fuentes. Guardar y reabrir el proyecto.

Si hay fallo, conservar el comando o acción, mensaje completo y versión de la
VM. No instalar FFmpeg para solventar una exportación fallida: precisamente se
está verificando el conversor que debe incluir ViaSpania.

Estas compilaciones son para pruebas locales. El expediente macOS no acredita
los binarios, datos o dependencias que se generen en Windows/Ubuntu; antes de una
distribución pública hay que completar la evidencia de cada plataforma.

## Referencias verificadas

- [Requisitos de Tauri](https://v2.tauri.app/start/prerequisites/).
- [WebKitGTK en Ubuntu 26.04](https://packages.ubuntu.com/search?keywords=libwebkit2gtk-4.1-dev&searchon=names&suite=resolute&section=all).
- [Visual Studio en Windows ARM](https://learn.microsoft.com/en-us/visualstudio/install/visual-studio-on-arm-devices).
- [Emulación x64 en Windows 11 ARM](https://learn.microsoft.com/en-us/windows/arm/faq).
- [MSYS2 en ARM64 y emulación de herramientas](https://www.msys2.org/docs/arm64/).
