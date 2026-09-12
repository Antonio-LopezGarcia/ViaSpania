# Historia de ViaSpania anterior a 0.2.0

## Alcance y método

Este documento reconstruye el desarrollo de ViaSpania anterior a su primera publicación en GitHub. El periodo documentado comienza el 17 de agosto de 2026, cuando se inició la construcción de una herramienta llamada **GeoCost**, y termina el 27 de agosto de 2026, fecha del primer commit público y de la preparación de ViaSpania 0.2.0.

Durante este periodo no se mantuvo un historial Git incremental. El primer commit (`d5ded69`, *Initial commit*) incorporó de una vez 208 archivos y aproximadamente 20.000 líneas. Por ello, la secuencia se ha reconstruido a partir de:

- las sesiones locales de Codex asociadas al directorio del proyecto;
- los mensajes de finalización, resultados de pruebas y registros de compilación conservados en esas sesiones;
- el contenido del primer commit público;
- los manifiestos `package.json`, `src-tauri/Cargo.toml` y `src-tauri/tauri.conf.json` del primer commit;
- la documentación y las pruebas presentes en aquel snapshot.

Los tres manifiestos identificaban el producto como **0.1.0**. No hay evidencia de números de versión intermedios. En este documento se utiliza por tanto el término **compilación** o **etapa**, no “versión”, para diferenciar los sucesivos estados de la 0.1.0.

### Grados de certeza

- **Confirmado**: consta una finalización explícita y el resultado aparece en el snapshot inicial.
- **Compilado/probado**: además de estar implementado, existe evidencia de pruebas, build o ejecución de una aplicación nativa.
- **Parcial o transitorio**: existió durante el desarrollo, pero fue sustituido o corregido antes de 0.2.0.
- **Solicitado**: aparece en el historial, pero no hay evidencia suficiente para considerarlo terminado.

Las cifras de pruebas reflejan el momento de cada compilación y aumentan conforme creció la suite. No son directamente comparables con la suite actual.

## Resumen ejecutivo

La etapa 0.1.0 duró aproximadamente diez días y fue mucho más que un prototipo. En ella se construyeron:

- una aplicación React y TypeScript con mapas OpenLayers;
- un backend nativo Tauri 2 escrito en Rust;
- descarga y procesamiento real de modelos de elevación con GDAL y PROJ;
- un motor de rutas anisotrópicas con múltiples perfiles de coste;
- barreras, corredores preferentes, puentes y puntos de interés;
- rutas simples, comparativas, multipunto, multirruta, pasillos LCP, isócronas, visibilidad y curvas de nivel;
- visores cartográficos, comparación dual/superpuesta y terreno 3D;
- proyectos persistentes y exportaciones SIG, gráficas, imágenes, vídeo e informes PDF;
- configuración persistente, ayuda, tutorial, créditos y una primera web de presentación;
- un bundle macOS autónomo con sus dependencias geoespaciales.

El nombre **GeoCost** se utilizó hasta el 25 de agosto. Ese día el producto, los identificadores internos, iconos, documentación y extensiones propias se renombraron como **ViaSpania**.

## Cronología reconstruida

### 17 de agosto — nacimiento de GeoCost

#### Primer corte web funcional — confirmado y probado

El proyecto comenzó desde un directorio vacío. El primer corte ejecutable incorporó:

- interfaz responsive organizada inicialmente en cuatro paneles;
- mapas OpenLayers con OpenStreetMap y ortofotografía PNOA;
- consulta de servicios oficiales y estimación de celdas del MDT;
- importación validada de CSV y GeoJSON;
- puntos de inicio, final y multipunto;
- un primer motor direccional de rutas con barreras y prevención del cruce diagonal de esquinas;
- comparación, multipunto, persistencia y exportación;
- cinco perfiles iniciales: Tobler, Tobler fuera de sendero, Pandolf corregido, vehículo con pendiente crítica y Eastman.

Este primer corte utilizaba terreno local o sintético para determinadas operaciones. Pasó 9 pruebas TypeScript y el build web. La interfaz distinguía expresamente las funciones operativas de las que todavía necesitaban un backend nativo.

#### Primera aplicación macOS y backend geoespacial — compilado/probado

En la misma jornada se instalaron Rust, GDAL, PROJ y CMake y se creó el backend Tauri 2. Se incorporaron:

- descarga WCS real por HTTPS, con progreso y cancelación;
- límite de descarga y tratamiento de respuestas XML de error;
- validación de GeoTIFF mediante GDAL;
- reproyección y recorte con GDAL/PROJ;
- salida COG con valor NoData;
- lectura de metadatos ráster;
- comprobación de GeoPackage;
- adaptación de la interfaz para invocar el backend nativo.

Se verificó una descarga real MDT05 de 333 × 333 celdas. Las pruebas Rust y TypeScript pasaron y se generó `GeoCost.app` para Apple Silicon. El bundle, de unos 13 MB en esta etapa, fue firmado *ad hoc* y abierto correctamente en macOS. Dependía todavía de herramientas geoespaciales instaladas en el sistema.

### 20 de agosto — del prototipo a un flujo cartográfico real

#### Sincronización, selección y descarga de MDT — compilado/probado

Se corrigieron tres carencias estructurales:

- los visores de navegación y PNOA pasaron a compartir centro, escala y rotación;
- las herramientas de puntos dejaron de ser controles decorativos y se conectaron a capas e interacciones OpenLayers;
- el parser WCS se adaptó a los espacios de nombres usados por `CoverageId`.

La primera corrección aún descargaba un rectángulo de prueba y no cargaba el ráster en Análisis. Tras nuevas pruebas se sustituyó la selección por arrastre por una selección fiable mediante dos esquinas y se eliminó el MDT sintético del flujo normal.

El resultado final de la etapa descargaba, validaba y mostraba automáticamente:

- MDT05: 1825 × 820 celdas, aproximadamente 2,9 MB en el recorte probado;
- MDT25: 365 × 164 celdas, aproximadamente 117,4 KB;
- MDT200: 46 × 21 celdas, aproximadamente 2,3 KB.

Los tamaños corresponden a un área de prueba concreta y no caracterizan el tamaño general de cada producto.

#### Representación y cálculo sobre el MDT — confirmado

Durante el resto del día se incorporaron o consolidaron:

- ruta óptima de alto contraste sobre PNOA y MDT, anclada a los puntos seleccionados;
- distintas paletas para visualizar el modelo de elevación;
- consulta de coordenadas y elevación bajo el cursor;
- límite de cálculo ampliado, con controles para evitar operaciones inviables;
- selección del destino de los archivos mediante diálogos nativos;
- visualización correcta del MDT completo;
- dibujo de barreras con distintos costes;
- varios tipos de conectividad de rejilla;
- mapas topográficos e históricos del IGN;
- límites municipales y capas de nombres geográficos;
- rectángulo del área de estudio y crucetas de orientación;
- coloración de rutas según pendiente;
- visor 3D orbital con zoom, desplazamiento y brújula;
- visor de comparación dual y superpuesta;
- mejora progresiva de los modos Comparación y Multipunto;
- ampliación del informe PDF horizontal con mapas, datos y resultados.

Algunas de estas funciones fueron refinadas de nuevo entre el 21 y el 26 de agosto. La descripción representa su incorporación inicial, no necesariamente su diseño definitivo.

### 21 de agosto — análisis avanzado y elementos del paisaje

#### Modelos y modos de cálculo — confirmado

Se amplió el sistema de perfiles de desplazamiento a partir de la revisión de `movecost` y bibliografía especializada. El snapshot anterior a 0.2.0 documenta quince perfiles y una arquitectura común para rutas direccionales. Entre los modelos añadidos o revisados se encontraban perfiles asociados a Tobler, Pandolf, Márquez-Pérez, Kondo y Seino, Rees, Garmy y colaboradores, Tripcevich, Alberti, Minetti/Herzog, Ardigò y vehículo con pendiente crítica.

También se trabajó en:

- cálculo de ida y vuelta independiente;
- comparación simultánea de perfiles;
- matriz multipunto dirigida;
- isócronas;
- visibilidad;
- curvas de nivel;
- resultados y leyendas específicos para cada análisis.

#### Barreras y facilitadores — confirmado y probado

El concepto inicial de barrera se convirtió en un modelo más general de elementos del paisaje:

- barreras que penalizan o impiden el paso;
- corredores preferentes con anchura y multiplicador de coste positivo;
- puentes que reabren únicamente las celdas atravesadas;
- puntos de interés con influencia espacial o paso obligatorio;
- importación, exportación, edición, desplazamiento y eliminación;
- persistencia dentro de los proyectos.

Los corredores y puentes se integraron realmente en rutas e isócronas del backend Rust. Se evitó el uso de costes negativos para no crear ciclos artificiales. El modo de “visita única” de puntos de interés quedó expresamente fuera porque requería un estado combinatorio distinto.

### 22 de agosto — pasillos, multirruta y visores de resultados

#### Pasillos LCP — confirmado y probado

Se añadió un análisis de pasillos basado en la suma de superficies de coste desde el inicio y hacia el final. Para perfiles asimétricos se respetó la diferencia entre “coste desde el final” y “coste hasta el final”. Incluía:

- umbral configurable sobre el coste óptimo;
- perfil, conectividad, barreras y facilitadores;
- superficie coloreada y control de opacidad;
- coste óptimo y número de celdas incluidas;
- reutilización de la superficie preparada.

La implementación registró 13 pruebas Rust y 33 pruebas web superadas.

#### Multirruta y visores independientes — confirmado y probado

Se diferenció claramente:

- **Multipunto**: matriz dirigida de costes entre todos los puntos;
- **Multirruta**: recorrido secuencial 1→2, 2→3, 3→4, etc.

Multirruta añadió progreso y resultados por tramo, colores independientes, exportación GeoJSON y representación en PNOA, MDT, cartografía histórica y 3D. Se crearon visores propios para Ruta y Multirruta, con selección de fondo, controles de capas y exportación PNG/PDF.

### 24 de agosto — limpieza de interfaz y configuración persistente

Se realizó una reorganización importante de la interfaz:

- eliminación de la numeración de paneles;
- cambio de «Ortofotografía PNOA» por «Selección»;
- retirada del indicador simplificado de ascenso/llano/descenso;
- herramienta Desplazar como primera opción de Selección;
- «Opciones generales» pasó a llamarse «Configuración»;
- preferencia para mostrar u ocultar crucetas, escalas y coordenadas;
- opciones de inicio con último proyecto, proyecto nuevo o sin automatización;
- correcciones de escalas, cursores y elementos superpuestos;
- conservación de atribuciones obligatorias aunque se simplificaran rótulos visibles.

Las preferencias se centralizaron en `AppSettings` y se hicieron persistentes. Esta fase registró 36 pruebas y un build de producción correcto.

También se unificó la gestión de puntos, barreras y facilitadores para poder seleccionarlos, desplazarlos, editarlos y eliminarlos desde herramientas coherentes.

### 25 de agosto — consolidación como ViaSpania

#### Fuentes externas y visualización — confirmado y probado

La configuración incorporó un primer cargador de fuentes XYZ externas con:

- nombre y URL de teselas;
- visor de destino;
- lista persistente;
- renombrado y eliminación;
- validación y errores en español;
- atribución automática;
- permisos de red de Tauri para los dominios añadidos.

También se consolidó la representación del análisis activo en Selección, Cartografía histórica y MDT: rutas comparativas, pasillos, isócronas, visibilidad y curvas de nivel.

#### Proyectos, nombres y exportaciones — confirmado

Se añadió un flujo explícito de nuevo proyecto, con nombre y ubicación. Los proyectos guardaban su nombre y área de estudio, recuperaban el encuadre al abrirse y limpiaban correctamente el estado anterior.

Los informes recibieron prefijos por modo (`RSimple`, `RComp`, `MultiPn`, `MultiRt`, `Pas`, `Isoc`, `Vis` y `Curvas`) y sufijos incrementales para evitar sobrescrituras. Las exportaciones visuales recibieron una marca de agua adaptativa.

#### Optimización del visor 3D — confirmado y probado

Se corrigió un cierre de WebKit al mostrar curvas de nivel densas. En lugar de crear un objeto Three.js por segmento, las curvas pasaron a agruparse por cota en geometrías compartidas. La visualización se limitó a 120.000 segmentos muestreados uniformemente, mientras el cálculo y las exportaciones conservaron todos los datos.

#### Cambio de nombre GeoCost → ViaSpania — confirmado

El 25 de agosto se cambió el nombre del producto en:

- interfaz y documentación;
- nombres y extensiones de archivos propios;
- paquete JavaScript y crate Rust;
- identificadores de Tauri y almacenamiento local;
- ejecutable y bundle;
- iconos de macOS, Windows, iOS y Android;
- logotipo, sustituyendo la “G” por “VS”.

El cambio de identificadores creó un espacio de preferencias nuevo. Desde este punto las compilaciones se denominaron `ViaSpania.app`, aunque los tres manifiestos continuaron indicando la versión 0.1.0.

#### Primer bundle autónomo — compilado/probado

La compilación inicial de ViaSpania seguía invocando nueve utilidades externas de GDAL/PROJ. Se añadió una fase de empaquetado que:

- copiaba ejecutables, bibliotecas dinámicas y datos de GDAL/PROJ;
- recorría dependencias nativas de manera recursiva;
- reescribía rutas de bibliotecas para ejecutarlas dentro del bundle;
- hacía que el backend priorizara los recursos incluidos;
- firmaba el conjunto *ad hoc*.

Se verificó GDAL sin recurrir a Homebrew. El resultado era un `ViaSpania.app` ARM64 autónomo de aproximadamente 959 MB. Pasó 81 pruebas web, 15 pruebas Rust y el build web. No estaba firmado con Developer ID ni notarizado, por lo que todavía no era una distribución macOS convencional.

### 26 de agosto — fuentes digitales, internacionalización de datos y documentación

#### Modelos digitales de superficie — confirmado y probado

Se incorporó el uso opcional de MDS, distinguiéndolo explícitamente del terreno desnudo. Tras experimentar con varias coberturas PNOA-LiDAR, el diseño se simplificó:

- MDS05 quedó como única opción MDS nacional;
- se desactivaba por defecto y se habilitaba desde Configuración;
- se descargaba automáticamente desde el WCS oficial;
- se eliminaron MDS50 y MDS02 y el selector GeoTIFF asociado;
- la ayuda advertía que edificios y vegetación afectan a rutas y pendientes.

Se corrigieron el dominio autorizado, el CRS EPSG:4258 requerido por el servicio y la conversión de puntos situados exactamente en los bordes del recorte. Se validó una descarga y una ruta real sobre MDS05. La suite alcanzó 87 pruebas web y 17 nativas en esta fase.

#### Copernicus — confirmado y probado

Se añadió Copernicus DEM GLO-30 mediante teselas COG, mosaico, recorte y reproyección automática. Una prueba real produjo un COG válido de aproximadamente 30 m.

También se integró el mosaico visual Copernicus VHR 2021 como alternativa a PNOA. Se propagó a Selección, comparación dual y superpuesta, pasillos, isócronas, visibilidad, curvas de nivel y textura 3D, manteniendo atribuciones diferenciadas de IGN.

#### Reorganización de Configuración — confirmado

El panel se dividió en seis pestañas:

- Visores 2D;
- Visor 3D;
- Modelos digitales;
- Cartografía;
- Procesado;
- Sonidos.

Se añadieron activación individual de fuentes, valores predeterminados del 3D, validaciones para no dejar el programa sin fuentes utilizables y migración de preferencias antiguas.

#### WMS y WMTS externos — confirmado y probado

El cargador XYZ se amplió con WMS 1.1.1/1.3.0 y WMTS 1.0.0. El programa consultaba `GetCapabilities`, interpretaba capas, CRS, formatos, estilos y matrices, y guardaba la configuración para Navegación, Selección o Cartografía histórica. Las fuentes XYZ anteriores siguieron siendo compatibles. La suite alcanzó 92 pruebas.

#### Sonidos y ayuda contextual — confirmado y probado

Se añadió configuración de sonidos de aviso para cálculos, descarga/carga de modelos y exportaciones. La ayuda contextual `?` pasó a detectar los ocho modos de cálculo y documentar los quince perfiles, con autoría, finalidad, fórmula, variables, unidades, parámetros, limitaciones y referencia científica.

#### Web de presentación — confirmado y probado

Se creó una entrada web independiente en `/web/` con:

- identidad visual de ViaSpania;
- cordillera 3D animada con el desplazamiento;
- descripción del programa y sus funciones;
- fichas de los quince perfiles;
- secciones de autor, publicaciones, licencias, contacto y futuras descargas;
- diseño responsive;
- ruta animada sobre el relieve añadida al final de la etapa.

La web y la aplicación se generaban dentro del mismo build. En su primera comprobación completa se registraron 96 pruebas superadas.

### 27 de agosto — cierre de la etapa privada y primera publicación

Antes del primer commit se realizaron comprobaciones finales en modo desarrollo y reparaciones de la web de presentación. El commit inicial público (`d5ded69`) capturó el producto acumulado como 0.1.0.

En los commits inmediatamente posteriores se trabajó en empaquetado multiplataforma y publicación de instaladores para macOS, Linux y Windows. Finalmente, el commit `7f5a208` preparó la publicación **ViaSpania 0.2.0 con rutas subóptimas**. Esa publicación queda fuera del alcance principal de este documento y constituye el comienzo del historial trazable directamente con Git.

## Compilaciones identificables

No se conservan todos los binarios intermedios, pero las sesiones permiten identificar al menos estos hitos de compilación:

| Fecha | Producto | Evidencia | Estado |
|---|---|---|---|
| 17 ago. | GeoCost web | 9 pruebas y build Vite | Confirmado |
| 17 ago. | `GeoCost.app` ARM64 | Bundle Tauri de unos 13 MB, firma *ad hoc* y ejecución | Confirmado |
| 20 ago. | `GeoCost.app` | MDT05/25/200 reales, mapas sincronizados y pruebas web/Rust | Confirmado |
| 21–22 ago. | `GeoCost.app` | Facilitadores, pasillos y multirruta integrados y probados | Confirmado por sesiones; binario no conservado |
| 24 ago. | GeoCost en desarrollo | Limpieza de interfaz y configuración, 36 pruebas | Confirmado |
| 25 ago. | `ViaSpania.app` | Renombrado completo, 72 pruebas web y 15 Rust | Confirmado |
| 25 ago. | `ViaSpania.app` autónomo | GDAL/PROJ incluidos, unos 959 MB, 81 pruebas web y 15 Rust | Confirmado |
| 26 ago. | ViaSpania en desarrollo | MDS, Copernicus, WMS/WMTS, sonidos, ayuda y web; hasta 96 pruebas | Confirmado |

Los tamaños citados proceden de compilaciones concretas y no deben interpretarse como tamaños oficiales de una release.

## Funciones solicitadas cuya finalización no debe darse por supuesta

El historial contiene propuestas y exploraciones que no equivalen necesariamente a una implementación cerrada. Entre ellas:

- soporte regional completo para numerosos países europeos;
- actualización automática de la aplicación;
- firma Developer ID y notarización de macOS;
- distribución pública plenamente auditada desde el punto de vista de licencias;
- modo combinatorio de visita única para puntos de interés;
- fuentes históricas nacionales italianas incorporadas de fábrica;
- paridad nativa completamente probada en Windows y Linux antes de 0.2.0.

Estas líneas no deben figurar como características terminadas de la 0.1.0 sin evidencia adicional.

## Limitaciones de la reconstrucción

1. El repositorio no conserva commits anteriores al snapshot del 27 de agosto.
2. Las sucesivas compilaciones sobrescribían normalmente el bundle anterior.
3. Los mensajes de sesión prueban que se ejecutaron determinadas acciones, pero no sustituyen un artefacto firmado con checksum.
4. Una función pudo incorporarse, corregirse y volver a modificarse dentro de una misma jornada.
5. El primer commit permite confirmar el estado final, pero no siempre asignar cada línea a una compilación concreta.
6. La denominación 0.1.0 se mantuvo durante todo el periodo; los hitos descritos no fueron releases SemVer independientes.

## Conclusión

La 0.1.0 fue una fase privada de desarrollo acelerado comprendida entre el 17 y el 27 de agosto de 2026. Comenzó como una aplicación web llamada GeoCost y terminó como ViaSpania: una aplicación de escritorio con backend geoespacial nativo, análisis de coste y terreno, múltiples visores, persistencia, exportaciones, ayuda y empaquetado autónomo para macOS.

La evidencia disponible permite reconstruir con confianza alta las grandes etapas y muchas compilaciones concretas. No permite recuperar todos los binarios ni establecer una numeración retrospectiva exacta. Si se desea etiquetar estos hitos en documentación pública, sería más riguroso usar nombres como **prototipo inicial**, **primera compilación nativa**, **GeoCost 0.1.0 tardía** y **ViaSpania 0.1.0**, evitando inventar versiones que nunca constaron en los manifiestos.
