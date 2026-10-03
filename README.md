# ViaSpania

[Español](#español) · [English](#english) · [Descargas / Downloads](https://github.com/Antonio-LopezGarcia/ViaSpania/releases) · [Soporte / Support](https://github.com/Antonio-LopezGarcia/ViaSpania/issues)

## Español

ViaSpania es una aplicación de escritorio para analizar costes de desplazamiento sobre el terreno, comparar rutas y explorar la topografía. Permite trabajar con modelos de elevación, cartografía y datos geográficos locales; incluye análisis de rutas de coste mínimo, perfiles, pasillos, isócronas, cuencas visuales y terreno 3D. Los cálculos se realizan en el equipo; los mapas, las descargas de elevación y la búsqueda de lugares necesitan conexión.

https://github.com/user-attachments/assets/ee2ea6d8-2c74-4082-ab1c-d10cbf481d35

### Descargar e instalar

Descargue el instalador adecuado desde [GitHub Releases](https://github.com/Antonio-LopezGarcia/ViaSpania/releases). En **Assets**, elija el paquete de su sistema y arquitectura; los archivos automáticos «Source code» no son instaladores.

| Sistema | Paquetes | Arquitectura disponible |
| --- | --- | --- |
| macOS | `.dmg` | Apple Silicon (M1 o posterior) |
| Windows | `-setup.exe` o `.msi` | Intel/AMD de 64 bits (`x64`) |
| Linux | `.AppImage`, `.deb` o `.rpm` | Intel/AMD (`amd64`/`x86_64`) o ARM64 (`arm64`/`aarch64`), según el paquete |

Los paquetes incluyen GDAL/PROJ. No necesita instalar Node.js, pnpm ni Rust. Windows requiere WebView2; Linux necesita WebKitGTK y bibliotecas compatibles. La disponibilidad de paquetes puede variar entre releases: consulte los **Assets** de la versión elegida.

**macOS (aplicación no notarizada):** abra el DMG y arrastre ViaSpania a Aplicaciones. Si macOS bloquea la primera apertura, vaya a **Ajustes del Sistema → Privacidad y seguridad → Abrir igualmente** y confirme. Si la copia oficial continúa bloqueada por cuarentena, cierre la aplicación y ejecute `xattr -dr com.apple.quarantine "/Applications/ViaSpania.app"` en Terminal. Descargue una copia oficial nueva si macOS indica que está dañada; no omita avisos de malware ni desactive Gatekeeper globalmente. [Instrucciones de Apple](https://support.apple.com/es-es/102445).

**Windows (instalador sin firma):** SmartScreen puede mostrar «Windows protegió su PC». Compruebe que descargó el instalador desde este repositorio y, si se ofrece, seleccione **Más información → Ejecutar de todas formas**. Si una política del dispositivo lo bloquea, consulte con su administrador; no desactive Defender ni SmartScreen. [Información de Microsoft sobre SmartScreen](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation).

**Linux (paquete local o AppImage):** use el archivo descargado, con su nombre y arquitectura exactos. Elija el comando correspondiente. Los paquetes no están firmados por una autoridad de distribución; Linux no usa la notarización de Apple. Si su sistema bloquea un paquete sin firmar, siga el método aprobado por su distribución o administrador.

```bash
# AppImage
chmod +x ./ViaSpania_VERSION_ARCH.AppImage
./ViaSpania_VERSION_ARCH.AppImage

# Debian / Ubuntu
sudo apt install ./ViaSpania_VERSION_ARCH.deb

# Distribuciones con DNF
sudo dnf install ./ViaSpania-VERSION-1.ARCH.rpm
```

Si AppImage requiere FUSE, instale el soporte indicado por su distribución o use el paquete DEB/RPM. Linux puede requerir bibliotecas del sistema compatibles.

### Soporte

Informe errores en [GitHub Issues](https://github.com/Antonio-LopezGarcia/ViaSpania/issues). Incluya la versión, sistema y arquitectura, pasos para reproducir el problema y el mensaje de error. Quite datos personales o sensibles de los archivos adjuntos. Contacto: [Antonio López García](mailto:antonio.lopez@ugr.es).

### Autoría, licencia y fuentes

Copyright © 2026 Antonio López García, Universidad de Granada. ViaSpania se distribuye bajo [GNU GPL versión 3, solo](LICENSE). La licencia y los avisos de terceros se incluyen en el repositorio y en la aplicación: consulte [avisos de terceros](THIRD_PARTY_NOTICES.md) y los créditos para conocer las licencias, atribuciones y fuentes de software, datos y cartografía. Entre las fuentes cartográficas figuran © OpenStreetMap contributors (ODbL), IGN/CNIG y GeoNames; respete la atribución y condiciones de cada proveedor.

Consulte la página de cada [release](https://github.com/Antonio-LopezGarcia/ViaSpania/releases) para acceder a sus instaladores y fuentes correspondientes, junto con los avisos e instrucciones de verificación. El código fuente del proyecto también está disponible en este repositorio. Véase la [información sobre distribución GPL y fuentes correspondientes](docs/RELEASE_COMPLIANCE.md).

### Financiación

Este programa es resultado de la ayuda RYC2022-037730-I, financiada por MICIU/AEI/10.13039/501100011033 y por ESF+.

[Reconocimiento de financiación y fuentes oficiales](docs/funding.md).

## English

ViaSpania is a desktop application for terrain-based movement-cost analysis, route comparison and topographic exploration. It works with elevation models, maps and local geographic data, and provides least-cost routes, profiles, corridors, isochrones, viewsheds and 3D terrain. Analyses run on your computer; maps, elevation downloads and place searches require an internet connection.

https://github.com/user-attachments/assets/30de8dae-7c5e-4916-ad62-112b4db818fd

### Download and install

Download the appropriate installer from [GitHub Releases](https://github.com/Antonio-LopezGarcia/ViaSpania/releases). Under **Assets**, choose a package for your system and architecture; GitHub's automatically generated “Source code” archives are not installers.

| System | Packages | Available architecture |
| --- | --- | --- |
| macOS | `.dmg` | Apple Silicon (M1 or later) |
| Windows | `-setup.exe` or `.msi` | 64-bit Intel/AMD (`x64`) |
| Linux | `.AppImage`, `.deb` or `.rpm` | Intel/AMD (`amd64`/`x86_64`) or ARM64 (`arm64`/`aarch64`), depending on the package |

Packages include GDAL/PROJ. You do not need Node.js, pnpm or Rust. Windows requires WebView2; Linux requires compatible WebKitGTK and system libraries. Package availability may vary by release; check the **Assets** for the version you choose.

**macOS (application not notarized):** open the DMG and drag ViaSpania to Applications. If macOS blocks the first launch, go to **System Settings → Privacy & Security → Open Anyway** and confirm. If quarantine still blocks the official copy, quit the app and run `xattr -dr com.apple.quarantine "/Applications/ViaSpania.app"` in Terminal. Download a fresh official copy if macOS says the app is damaged; do not bypass malware alerts or disable Gatekeeper globally. [Apple instructions](https://support.apple.com/en-us/102445).

**Windows (unsigned installer):** SmartScreen may display “Windows protected your PC”. Verify that you downloaded the installer from this repository and, if offered, choose **More info → Run anyway**. If device policy blocks it, contact your administrator; do not disable Defender or SmartScreen. [Microsoft SmartScreen information](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation).

**Linux (local package or AppImage):** use the downloaded file with its exact name and architecture. Choose the relevant command:

```bash
# AppImage
chmod +x ./ViaSpania_VERSION_ARCH.AppImage
./ViaSpania_VERSION_ARCH.AppImage

# Debian / Ubuntu
sudo apt install ./ViaSpania_VERSION_ARCH.deb

# Distributions using DNF
sudo dnf install ./ViaSpania-VERSION-1.ARCH.rpm
```

Linux packages are not signed by a distribution authority; Linux does not use Apple notarization. If your system blocks an unsigned package, follow the method approved by your distribution or administrator. If AppImage requires FUSE, install the support recommended by your distribution or use the DEB/RPM package. Linux may require compatible system libraries.

### Support

Report issues on [GitHub Issues](https://github.com/Antonio-LopezGarcia/ViaSpania/issues). Include the version, operating system and architecture, reproduction steps and error message. Remove personal or sensitive data from attachments. Contact: [Antonio López García](mailto:antonio.lopez@ugr.es).

### Authorship, licence and source credits

Copyright © 2026 Antonio López García, University of Granada. ViaSpania is distributed under the [GNU GPL version 3 only](LICENSE). The licence and third-party notices are included in the repository and application: see [third-party notices](THIRD_PARTY_NOTICES.md) and the in-app credits for software, data and map licences, attributions and sources. Map sources include © OpenStreetMap contributors (ODbL), IGN/CNIG and GeoNames; follow each provider's attribution and terms.

See each [release page](https://github.com/Antonio-LopezGarcia/ViaSpania/releases) for its installers and corresponding source, together with notices and verification instructions. The project's source code is also available in this repository. See [GPL distribution and corresponding source information](docs/RELEASE_COMPLIANCE.md).

### Funding

This application is a result of grant RYC2022-037730-I, funded by MICIU/AEI/10.13039/501100011033 and ESF+.

[Funding acknowledgement and official sources](docs/funding.md).
