# Auditoría de licencias de ViaSpania 0.2.1

> Actualización posterior a la auditoría · 8 de septiembre de 2026: por indicación del responsable se adopta el siguiente aviso para el código propio. Las referencias siguientes a la licencia anterior describen el estado histórico auditado; esta actualización no modifica las evidencias ni resuelve las revisiones de terceros, datos y assets.
>
> ViaSpania
> Copyright © 2026 Antonio López García, Universidad de Granada
> Este programa se distribuye bajo la licencia GPL-3.0-only.

Fecha de revisión: 7 de septiembre de 2026. Estado: **no publicar todavía el paquete nativo macOS generado con la instalación Homebrew actual**.

## Alcance comprobado

- Licencia y metadatos propios de ViaSpania.
- Grafo JavaScript de producción instalado (`pnpm licenses list --prod`), separado de las herramientas de desarrollo.
- Grafo Rust efectivo para `aarch64-apple-darwin` a partir de `Cargo.lock` y `cargo tree --target`.
- Contenido real de `dist` y del runtime geoespacial copiado a `src-tauri/resources/geospatial`.
- Servicios GeoNames, IGN/CNIG, OpenStreetMap y Copernicus; cartografía, ortofotografía, MDT y MDS.
- Iconos, SVG, imágenes, logotipos y fuentes tipográficas presentes en el árbol distribuible.

## Correcciones realizadas

- Se añadió una licencia principal visible y se declaró mediante `package.json` y `Cargo.toml`.
- Se creó `THIRD_PARTY_NOTICES.md` y una copia de distribución en `public/THIRD_PARTY_NOTICES.txt`.
- Créditos dejó de presentar Vite, TypeScript, Vitest, Testing Library y jsdom como componentes ejecutados por el usuario.
- Se añadieron los componentes transitivos del bundle web por familia de licencia y un enlace al inventario completo.
- Se actualizaron las atribuciones visibles y exportadas de OSM, IGN/PNOA, cartografía histórica y Copernicus VHR.
- Se incorporaron GeoNames y Copernicus GLO-30 con sus condiciones y fórmulas de reconocimiento.
- Se corrigió la descripción obsoleta de vídeo basada en MediaRecorder: la versión actual usa AVI/MJPEG propio.
- Se verificó que no hay tipografías empaquetadas. El icono VS y los símbolos de interfaz son recursos originales.
- Los preparadores eliminan los logotipos e iconos de GDAL copiados con sus datos porque no son necesarios para ejecutar ViaSpania.
- El preparador macOS genera un manifiesto de ejecutables, bibliotecas y fórmulas Homebrew efectivamente incorporadas, y conserva `HOMEBREW_FORMULAE.json` con sus licencias declaradas.

## Bloqueo de publicación detectado

El runtime macOS preparado el 7 de septiembre ocupa aproximadamente 945 MB e incorpora 85 fórmulas Homebrew. El grafo dinámico incluye fórmulas declaradas con GPL, entre ellas componentes que llegan a través de una compilación de GDAL con muchos controladores opcionales. Dos avisos genéricos de GDAL/PROJ y el metadato SPDX de Homebrew no satisfacen por sí solos todas las obligaciones de redistribución de ese conjunto.

El preparador macOS falla ahora cuando detecta una fórmula GPL. Antes de publicar debe hacerse una de estas dos cosas:

1. compilar un runtime GDAL/PROJ mínimo, sin controladores ni bibliotecas GPL que ViaSpania no utiliza, y volver a generar el manifiesto; o
2. distribuir la aplicación bajo términos compatibles y cumplir las obligaciones de texto de licencia, código fuente/oferta correspondiente y demás avisos de cada componente.

La primera opción es la adecuada para conservar la licencia cerrada actualmente declarada para ViaSpania. Después debe repetirse la auditoría en cada arquitectura y en Windows/Linux, porque sus grafos nativos son distintos.

## Evidencia normativa consultada

- IGN: política de datos y licencia de uso compatibles con CC BY 4.0: <https://www.ign.es/web/ign/portal/politica-datos>.
- GeoNames: licencia CC BY y obligación de reconocimiento del servicio/datos: <https://www.geonames.org/export/>.
- OpenStreetMap: atribución a colaboradores y ODbL 1.0: <https://www.openstreetmap.org/copyright>.
- Copernicus Land Monitoring Service: acceso abierto, reconocimiento de fuente, identificación de modificaciones y ausencia de respaldo institucional: <https://land.copernicus.eu/en/data-policy>.
- Copernicus DEM GLO-30: licencia y fórmula de reconocimiento: <https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM>.

## Revisión por publicación

No debe reutilizarse este resultado para otra versión sin regenerarlo. Cada publicación debe ejecutar el inventario JavaScript de producción, el árbol Rust para cada destino y el preparador geoespacial; después debe comparar los manifiestos producidos con los avisos incluidos en el instalador.
