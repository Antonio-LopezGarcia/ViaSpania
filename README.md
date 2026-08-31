# ViaSpania

Aplicación local-first de análisis de coste territorial para España. Incluye cuatro paneles, OSM y PNOA sincronizados, descarga y visualización MDT, puntos, CSV/GeoJSON, cinco modelos y rutas direccionales calculadas sobre las elevaciones reales del GeoTIFF.

## Ejecutar

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Aplicación de escritorio

```bash
pnpm desktop:dev
pnpm desktop:build
```

Tauri genera los formatos nativos disponibles en el sistema anfitrión: aplicación y DMG en macOS, MSI/NSIS en Windows, y AppImage/DEB/RPM en Linux. El backend consulta WCS por HTTPS, transmite progreso, permite cancelación real, escribe de forma temporal antes de publicar el archivo y valida el resultado con GDAL. El motor de rutas extrae la banda numérica del GeoTIFF, respeta NoData, aplica costes direccionales y devuelve la geometría WGS84. Para controlar memoria admite hasta 5.000.000 de celdas por cálculo. También expone reproyección y recorte a COG mediante `gdalwarp`.

Requisitos comunes: Node/pnpm, Rust y una instalación nativa de GDAL y PROJ. `pnpm desktop:build` prepara un paquete geoespacial autónomo para la plataforma actual antes de compilar. El firmado está separado: en macOS, `pnpm desktop:build:signed:macos` aplica la firma local después del build. Consulte `docs/desktop-portability.md` para los requisitos y limitaciones por sistema.

### Abrir la versión descargable en macOS

El DMG publicado por GitHub Actions no está firmado con un certificado Apple Developer ni notarizado por Apple. Por ello, Gatekeeper puede mostrar el mensaje **«ViaSpania está dañada y no puede abrirse»**, aunque la descarga se haya completado correctamente.

Use este procedimiento únicamente con el artefacto `ViaSpania-macOS-arm64` descargado desde la sección **Actions** de este repositorio:

1. Abra el DMG y copie `ViaSpania.app` en `/Applications`.
2. Abra Terminal y elimine la cuarentena solo de ViaSpania:

   ```bash
   xattr -dr com.apple.quarantine "/Applications/ViaSpania.app"
   ```

3. En Finder, abra **Aplicaciones**, haga Control-clic sobre ViaSpania y seleccione **Abrir**.

Si Terminal responde `Permission denied`, repita el comando con permisos de administrador:

```bash
sudo xattr -dr com.apple.quarantine "/Applications/ViaSpania.app"
```

Este comando no desactiva Gatekeeper globalmente; elimina el atributo de cuarentena exclusivamente del paquete indicado. No debe utilizarse con copias obtenidas de terceros. El artefacto actual de macOS está compilado para Apple Silicon (M1 y posteriores), no para Mac Intel.

### Instalar la versión descargable en Windows

Los instaladores MSI y NSIS publicados por GitHub Actions no están firmados con un certificado de firma de código. Por ello, Microsoft Defender SmartScreen o el Control de cuentas de usuario pueden identificar al editor como desconocido y mostrar **«Windows protegió su PC»**.

Use este procedimiento únicamente con el artefacto `ViaSpania-Windows-x64` descargado desde la sección **Actions** de este repositorio:

1. Extraiga por completo el ZIP descargado de GitHub Actions.
2. Ejecute el instalador `.msi` o `-setup.exe` incluido.
3. Si aparece SmartScreen, compruebe que el archivo procede de `traxtiber/ViaSpania`, seleccione **Más información** y después **Ejecutar de todas formas**.
4. Si Windows muestra el aviso del Control de cuentas de usuario, confirme que el nombre de la aplicación sea ViaSpania y que el editor figure como desconocido antes de continuar.

No desactive SmartScreen, Microsoft Defender ni el Control de cuentas de usuario para instalar ViaSpania. No continúe si el archivo procede de un enlace, correo o repositorio distinto. El artefacto actual de Windows está compilado para sistemas x64.

### Instalar la versión descargable en Linux

Los paquetes AppImage, DEB y RPM publicados por GitHub Actions no incluyen una firma de distribución. Linux puede indicar que el AppImage no es ejecutable o que el paquete no está firmado.

Use este procedimiento únicamente con el artefacto `ViaSpania-Ubuntu-x64` descargado desde la sección **Actions** de este repositorio:

1. Extraiga por completo el ZIP descargado de GitHub Actions.
2. Para AppImage, conceda permiso de ejecución únicamente al archivo descargado y ábralo:

   ```bash
   chmod +x ./ViaSpania_*.AppImage
   ./ViaSpania_*.AppImage
   ```

3. En Debian o Ubuntu puede instalar el DEB local con:

   ```bash
   sudo apt install ./ViaSpania_*.deb
   ```

4. En una distribución compatible con RPM puede instalar el paquete local con:

   ```bash
   sudo dnf install ./ViaSpania-*.rpm
   ```

Revise siempre el nombre y la procedencia del archivo antes de conceder permisos o usar `sudo`. No desactive la verificación de firmas del sistema ni ejecute scripts descargados de terceros. El artefacto actual de Linux está compilado para x86_64 y su compatibilidad depende de la versión de glibc y WebKitGTK de la distribución.

## Aviso

El resultado es el óptimo matemático de un modelo de elevación. No demuestra que exista un camino, permiso de paso o condiciones seguras y no sirve para navegación de emergencia.

Datos: © OpenStreetMap contributors. Origen de los datos: Instituto Geográfico Nacional de España / Centro Nacional de Información Geográfica.
