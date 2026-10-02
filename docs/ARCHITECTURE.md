# Arquitectura de ViaSpania

Referencia de alto nivel del código actual. La estructura del repositorio y las pruebas son la autoridad si esta página queda desactualizada.

## Aplicación

- `src/App.tsx` compone la aplicación y sus flujos principales.
- `src/components/` contiene la interfaz React, mapas OpenLayers, visores y controles. Los componentes coordinan estado y presentación; las reglas geográficas y de análisis se mantienen fuera de la interfaz cuando pueden expresarse como lógica independiente.
- `src/core/` contiene lógica TypeScript para proyectos, coordenadas, importación, límites, modelos de coste, rutas, geometrías, exportaciones, localización y otras reglas que no dependen de React.
- `src/services/` conecta la interfaz con el backend Tauri, proveedores de mapas y elevación, operaciones de exportación, informes y servicios remotos. Las respuestas externas se validan y normalizan en estos adaptadores.
- `src-tauri/src/` contiene el proceso nativo Rust. `lib.rs` registra y conecta comandos Tauri; módulos separados implementan análisis de cuadrícula, descarga de elevación, cancelación, límites y exportación de vídeo.
- `public/` contiene recursos web estáticos, fixtures y avisos de distribución. `src-tauri/resources/` contiene recursos nativos incorporados al paquete.

## Flujos principales

### Web

Vite carga React en `src/`. La interfaz usa módulos de `src/core/` y adaptadores de `src/services/`; las operaciones disponibles en navegador usan las capacidades web admitidas por esos adaptadores. Los proveedores remotos se contactan desde los adaptadores y sus atribuciones acompañan mapas y productos cuando corresponde.

### Escritorio

Tauri presenta el mismo frontend y expone comandos Rust mediante IPC. GDAL/PROJ, lectura y escritura de archivos y análisis nativos se ejecutan en el proceso de escritorio. El empaquetado prepara recursos para el sistema anfitrión; véase [empaquetado de escritorio](desktop-portability.md).

### Ayuda integrada

`src/components/HelpControl.tsx` incorpora los manuales en español, inglés e italiano como recursos de texto. Los catálogos de interfaz y sus pruebas viven en `src/core/`. Las instrucciones para mantener el italiano están en [TRANSLATING_IT.md](TRANSLATING_IT.md).

## Datos y límites

Las coordenadas de puntos persistidos son WGS84 y las distancias del grafo se expresan en metros. Los límites de elevación se comparten entre frontend y backend: véanse [`elevationLimits.ts`](../src/core/elevationLimits.ts) y [`raster_limits.rs`](../src-tauri/src/raster_limits.rs). GDAL/PROJ y los proveedores remotos quedan detrás de adaptadores o comandos nativos.

El procesamiento local no implica que los datos estén disponibles sin conexión: cartografía, descargas y algunas búsquedas usan servicios externos. Cada fuente mantiene sus atribuciones y condiciones. La elevación por sí sola no describe caminos, acceso, cobertura del suelo ni seguridad de paso.

## Pruebas y cambios

La lógica pura se prueba en sus módulos `*.test.ts`; los componentes se prueban con React Testing Library y Vitest; el backend tiene pruebas Rust. Las pruebas de proveedores con red son optativas y las pruebas rutinarias usan fixtures cuando están disponibles. Los comandos de desarrollo y verificación se mantienen en `AGENTS.md` y `package.json`.

El diagrama editable está en [`diagrams/architecture.json`](diagrams/architecture.json); la imagen enlazada desde README es una vista resumida, no un inventario de módulos.
