# Empaquetado de escritorio multiplataforma

ViaSpania debe compilarse de forma nativa en cada plataforma. El frontend y el backend Rust son compartidos, pero GDAL/PROJ y el WebView pertenecen al sistema anfitrión; no se reutilizan binarios entre macOS, Windows y Linux.

## Comandos

- `pnpm desktop:dev`: desarrollo con las herramientas GDAL/PROJ disponibles en `PATH`.
- `pnpm geospatial:prepare`: prepara `src-tauri/resources/geospatial` para el sistema actual.
- `pnpm desktop:build`: prepara esos recursos y genera todos los formatos Tauri disponibles.
- `pnpm desktop:build:macos`: genera aplicación y DMG.
- `pnpm desktop:build:windows`: genera MSI y NSIS.
- `pnpm desktop:build:linux`: genera DEB, AppImage y RPM.
- `pnpm desktop:build:signed:macos`: build y firma ad hoc local de la aplicación macOS.

El firmado de distribución, la notarización y la publicación deben ejecutarse en CI o mediante credenciales específicas de cada plataforma. No forman parte del build reproducible normal.

## macOS

Requiere GDAL/PROJ nativos, `gdal-config`, `projinfo`, `otool`, `install_name_tool` y `codesign`. El preparador copia dependencias no pertenecientes al sistema, ajusta `rpath` y firma los binarios incorporados. La arquitectura del paquete coincide con la arquitectura de GDAL instalada.

## Linux

Requiere GDAL/PROJ, `gdal-config`, `projinfo`, `ldd` y `patchelf`, además de las dependencias de compilación de Tauri/WebKitGTK. El preparador copia las bibliotecas ELF transitivas y establece rutas relativas `$ORIGIN`. El artefacto debe construirse sobre una distribución cuya versión de glibc sea igual o anterior a la mínima soportada.

Los artefactos públicos actuales no están firmados. El AppImage requiere permiso de ejecución (`chmod +x ./ViaSpania_*.AppImage`); los paquetes locales pueden instalarse con `sudo apt install ./ViaSpania_*.deb` o `sudo dnf install ./ViaSpania-*.rpm`. Estas excepciones deben aplicarse únicamente al archivo obtenido de `traxtiber/ViaSpania`, sin desactivar la verificación de firmas del sistema. La compatibilidad binaria depende de glibc, WebKitGTK y la arquitectura x86_64.

## Windows

Requiere Rust MSVC, WebView2 y una distribución nativa de GDAL/PROJ accesible desde `PATH`. `GDAL_DATA` y `PROJ_DATA` deben apuntar a sus directorios de datos si estos no están junto a la instalación. El preparador copia los ejecutables y las DLL del directorio de GDAL. La validación de publicación debe comprobar que ninguna DLL requerida queda fuera del paquete.

Los instaladores públicos actuales no están firmados y pueden activar Microsoft Defender SmartScreen o mostrar un editor desconocido. Tras comprobar que el MSI o NSIS procede del artefacto `ViaSpania-Windows-x64` de `traxtiber/ViaSpania`, el usuario puede elegir **Más información → Ejecutar de todas formas**. No se debe recomendar desactivar SmartScreen, Defender o el Control de cuentas de usuario globalmente.

## Matriz mínima de validación

En cada sistema y arquitectura soportados se debe ejecutar:

1. `pnpm test` y `pnpm build`.
2. `cargo test --manifest-path src-tauri/Cargo.toml`.
3. `pnpm desktop:build`.
4. Arranque del artefacto en un equipo sin GDAL/PROJ instalado globalmente.
5. Descarga WCS pequeña, validación GeoTIFF, reproyección, ruta, exportación GeoPackage y cierre limpio.

Las exportaciones de vídeo requieren una comprobación adicional porque los códecs disponibles dependen de WebKit en macOS, WebView2 en Windows y WebKitGTK en Linux.

La matriz `.github/workflows/desktop-portability.yml` ejecuta pruebas y build web en los tres sistemas en cada cambio. La construcción de instaladores, mucho más pesada por GDAL/PROJ, se activa manualmente mediante `workflow_dispatch` y la opción `build_installers`.
