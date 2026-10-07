# ViaSpania 0.4.0

## Español

Esta versión reúne mejoras de edición cartográfica, visualización 3D, fiabilidad de descargas y portabilidad de escritorio posteriores a ViaSpania 0.3.0.

### Novedades y correcciones

- **Edición de la selección:** deshacer y rehacer cambios en puntos, barreras, corredores, cruces y puntos de interés, con controles y atajos de teclado.
- **Capas cartográficas:** OpenTopoMap se incorpora a los selectores y a las texturas del terreno 3D. Las texturas disponibles siguen las capas habilitadas en ajustes y admiten capas externas.
- **Terreno 3D:** opción de textura de mayor resolución cuando el equipo la admite, controles adicionales de cámara y un panel de exportación animada que se puede desplazar.
- **Proyectos y modelos de elevación:** los proyectos registran el uso de modelos de elevación locales o importados. El límite de lectura de archivos de proyecto aumenta a 100 MB.
- **Fiabilidad en Linux:** GDAL/PROJ se prepara con sus dependencias de Conda y diagnósticos más claros. Las descargas de elevación usan los certificados del sistema y reintentan fallos de transporte transitorios.
- **Portabilidad macOS:** la preparación del bundle geoespacial valida que los ejecutables y bibliotecas correspondan a macOS y a la arquitectura anfitriona antes de empaquetarlos.
- **Documentación y mantenimiento:** se actualizan los manuales en español, inglés e italiano, la guía de compilación multiplataforma y pnpm.

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

## English

This release brings improvements to map editing, 3D visualisation, download reliability and desktop portability since ViaSpania 0.3.0.

### Features and fixes

- **Selection editing:** undo and redo changes to points, barriers, corridors, crossings and points of interest, using controls and keyboard shortcuts.
- **Map layers:** OpenTopoMap is available in layer selectors and as a 3D terrain texture. Available textures follow the layers enabled in settings and include external layers.
- **3D terrain:** higher-resolution textures are available when supported by the device, with additional camera controls and a draggable animation export panel.
- **Projects and elevation models:** projects record whether elevation data is local or imported. The project file read limit increases to 100 MB.
- **Linux reliability:** GDAL/PROJ bundles include Conda dependencies and clearer diagnostics. Elevation downloads use system certificates and retry transient transport failures.
- **macOS portability:** geospatial bundle preparation checks that executables and libraries match macOS and the host architecture before packaging.
- **Documentation and maintenance:** Spanish, English and Italian manuals, the cross-platform build guide and pnpm are updated.

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
