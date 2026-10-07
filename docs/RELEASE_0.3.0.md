# ViaSpania 0.3.0

## Español

Esta versión reúne las funciones añadidas y los fallos corregidos desde ViaSpania 0.2.2.

### Novedades y correcciones

- **Análisis del terreno:** descarga de modelos de elevación por bloques y análisis de modelos mayores, con límites de procesamiento y gestión de memoria mejorados. Se incorporan nuevos modelos de coste, sombreado del relieve ajustable y el mapa LiDAR del IGN como fondo cartográfico.
- **Puntos y proyectos:** creación y ordenación de puntos numerados y multipunto, rutas secuenciales y matrices de conexiones ampliadas, además de guardado automático de proyectos.
- **Medición y edición cartográfica:** herramientas para medir distancias y áreas, obtener perfiles de elevación, dibujar rutas de aproximación y crear/editar máscaras marítimas a partir del MDT. Se añade OpenTopoMap como fondo.
- **Visores, mapas y exportaciones:** controles y leyendas mejorados en mapas y terreno 3D; informes y exportaciones más claros; exportación de vídeo AVI o MP4/H.264, además de GIF y PNG.
- **Robustez y correcciones:** se refuerzan la cancelación de cálculos, las descargas de elevación, el uso de memoria y el manejo de tareas. Se corrigen artefactos en rásteres reproyectados, costuras en pasillos, validación de geometrías, renderizado de texturas 3D, sincronización del indicador de inclinación de cámara y generación de máscaras marítimas en distintas plataformas, con mejores diagnósticos de GDAL. También se revisan el inicio, la localización, la interfaz y los créditos.

### Descarga e instalación

En **Assets**, descargue el paquete que corresponda a su sistema y arquitectura. Los archivos automáticos «Source code» no son instaladores.

| Plataforma | Archivo que debe descargar |
| --- | --- |
| macOS Apple Silicon (M1 o posterior) | Archivo `.dmg` |
| Windows x64 | Instalador `*-setup.exe` o `.msi` |
| Linux Intel/AMD x86_64 | `.AppImage`, `.deb` o `.rpm` con arquitectura `amd64`/`x86_64` |
| Linux ARM64 | `.AppImage`, `.deb` o `.rpm` con arquitectura `arm64`/`aarch64`, si está disponible en Assets |

Los paquetes incluyen GDAL/PROJ. Windows requiere WebView2; Linux necesita WebKitGTK y bibliotecas compatibles.

**macOS — aplicación no notarizada:** abra el DMG y arrastre ViaSpania a Aplicaciones. Si macOS bloquea el primer inicio, vaya a **Ajustes del Sistema → Privacidad y seguridad → Abrir igualmente** y confirme. Si la copia oficial sigue bloqueada por cuarentena, cierre la aplicación y ejecute en Terminal:

```bash
xattr -dr com.apple.quarantine "/Applications/ViaSpania.app"
```

Si macOS indica que la aplicación está dañada, descargue una copia oficial nueva. No omita avisos de malware ni desactive Gatekeeper globalmente. [Instrucciones de Apple](https://support.apple.com/es-es/102445).

**Windows:** SmartScreen puede mostrar «Windows protegió su PC». Compruebe que descargó el instalador desde este repositorio y, si aparece la opción, seleccione **Más información → Ejecutar de todas formas**. Si una política del dispositivo lo bloquea, consulte con su administrador; no desactive Defender ni SmartScreen.

**Linux:** use el archivo descargado con su nombre y arquitectura exactos:

```bash
# AppImage
chmod +x ./ViaSpania_VERSION_ARCH.AppImage
./ViaSpania_VERSION_ARCH.AppImage

# Debian / Ubuntu
sudo apt install ./ViaSpania_VERSION_ARCH.deb

# Distribuciones con DNF
sudo dnf install ./ViaSpania-VERSION-1.ARCH.rpm
```

Si AppImage requiere FUSE, instale el soporte indicado por su distribución o use el paquete DEB/RPM. Linux puede requerir bibliotecas del sistema compatibles. Los paquetes Linux no están firmados por una autoridad de distribución; Linux no utiliza la notarización de Apple.

---

## English

This release brings together the features added and issues fixed since ViaSpania 0.2.2.

### Features and fixes

- **Terrain analysis:** block-based elevation downloads and larger model analyses, with improved processing limits and memory handling. Adds new cost models, adjustable hillshade and the IGN LiDAR map as a basemap.
- **Points and projects:** create and reorder numbered and multipoint locations; use sequential routes and expanded connection matrices; projects are saved automatically.
- **Measurement and map editing:** measure distances and areas, inspect elevation profiles, draw approach routes, and create/edit sea masks from the elevation model. OpenTopoMap is available as a basemap.
- **Viewers, maps and exports:** improved map and 3D terrain controls and legends; clearer reports and exports; video export to AVI or MP4/H.264, as well as GIF and PNG.
- **Reliability and bug fixes:** stronger calculation cancellation, elevation downloads, memory use and task handling. Fixes address artifacts in reprojected rasters, corridor seams, geometry validation, 3D texture rendering, camera-tilt indicator synchronisation and cross-platform sea-mask generation, with more useful GDAL diagnostics. Startup, localisation, interface details and credits have also been revised.

### Download and installation

Under **Assets**, download the package matching your operating system and architecture. GitHub's automatically generated “Source code” archives are not installers.

| Platform | File to download |
| --- | --- |
| macOS Apple Silicon (M1 or later) | `.dmg` file |
| Windows x64 | `*-setup.exe` installer or `.msi` |
| Linux Intel/AMD x86_64 | `.AppImage`, `.deb` or `.rpm` for `amd64`/`x86_64` |
| Linux ARM64 | `.AppImage`, `.deb` or `.rpm` for `arm64`/`aarch64`, if available under Assets |

Packages include GDAL/PROJ. Windows requires WebView2; Linux requires compatible WebKitGTK and system libraries.

**macOS — application not notarized:** open the DMG and drag ViaSpania to Applications. If macOS blocks the first launch, go to **System Settings → Privacy & Security → Open Anyway** and confirm. If quarantine still blocks the official copy, quit the app and run in Terminal:

```bash
xattr -dr com.apple.quarantine "/Applications/ViaSpania.app"
```

Download a fresh official copy if macOS says the app is damaged. Do not bypass malware alerts or disable Gatekeeper globally. [Apple instructions](https://support.apple.com/en-us/102445).

**Windows:** SmartScreen may display “Windows protected your PC”. Verify that you downloaded the installer from this repository and, if offered, choose **More info → Run anyway**. If device policy blocks it, contact your administrator; do not disable Defender or SmartScreen.

**Linux:** use the downloaded file with its exact name and architecture:

```bash
# AppImage
chmod +x ./ViaSpania_VERSION_ARCH.AppImage
./ViaSpania_VERSION_ARCH.AppImage

# Debian / Ubuntu
sudo apt install ./ViaSpania_VERSION_ARCH.deb

# Distributions using DNF
sudo dnf install ./ViaSpania-VERSION-1.ARCH.rpm
```

If AppImage requires FUSE, install the support recommended by your distribution or use the DEB/RPM package. Linux may require compatible system libraries. Linux packages are not signed by a distribution authority; Linux does not use Apple notarization.
