# Manual de ViaSpania

ViaSpania analiza desplazamiento y topografía sobre Modelos Digitales del Terreno (MDT). Los puntos se conservan en WGS84 y los cálculos se ejecutan en el CRS métrico del raster.

## 1. Vista general

Los cuatro paneles cartográficos comparten centro, escala y rotación.

### Encabezado

- **Nuevo proyecto**, **Abrir proyecto** y **Guardar proyecto** gestionan el JSON reproducible. La cabecera muestra junto a ViaSpania el nombre del proyecto activo. **Guardar proyecto** sobrescribe directamente el archivo abierto o recién creado; solo solicita una ubicación cuando el proyecto cargado automáticamente aún no está asociado a un archivo. Al abrir un proyecto que contiene un área de estudio válida, todos los mapas hacen zoom automáticamente a esa extensión.
- **Exportar resultados** reúne en una carpeta los resultados calculados que se seleccionen, organizados por rutas, superficies y elementos auxiliares.
- **Vista 3D** abre el terreno tridimensional cuando hay MDT.
- **Configuración**, **Componer informe**, **Ayuda** y **Créditos** abren sus diálogos. Las opciones del informe se eligen en su propio compositor y no forman parte de Configuración.

### Navegación

Localiza el trabajo sobre OpenStreetMap o topográfico IGN. **Seleccionar área** dibuja por arrastre la extensión del MDT. **Eliminar área** borra extensión, MDT y resultados dependientes, pero conserva puntos y barreras. **Localizarme** solicita una posición puntual y su precisión; no mantiene seguimiento. Al maximizar aparecen PNG y PDF.

### PNOA y herramientas

Muestra la ortofotografía oficial y permite crear puntos Inicio, Final y multipunto, además de barreras, corredores, puentes o pasos y puntos de interés. Las herramientas **Seleccionar elemento**, **Mover elemento** y **Eliminar elemento** funcionan de forma uniforme con todos ellos. Las barreras absolutas bloquean; las permeables multiplican el coste. Los corredores reducen coste dentro de su anchura, los pasos reabren celdas y los puntos de interés influyen o actúan como waypoint. Límites municipales, núcleos urbanos, nombres, escala, cruceta y marcador dependen de Configuración. El marcador de selección está desactivado por defecto.

### MDT

Representa el GeoTIFF con paleta de grises, terreno, hipsométrica, Viridis o alta montaña. La paleta no cambia elevaciones. La consulta opcional del cursor muestra WGS84 y elevación; un guion significa exterior o `nodata`. Las rutas usan azul para descenso, amarillo verdoso cerca de llano y naranja-rojo para ascenso. Admite PNG/PDF al maximizar.

### Cartografía histórica

Consulta primera edición MTN25/MTN50, minutas MTN50, planimetrías 1870–1950, vuelo americano B 1956–1957 y vuelo interministerial 1973–1986. Son capas IGN/CNIG con cobertura variable. Admite PNG/PDF.

### Cálculos geográficos

Primera fila: **Ruta simple**, **Ruta comparativa**, **Multipunto**, **Multirruta** y **Pasillo**. Segunda: **Isócronas**, **Isovistas** y **Curvas de nivel**. Cada acceso muestra solo parámetros pertinentes.

### Panel Barreras y facilitadores

En Ruta simple, Ruta comparativa, Multipunto, Multirruta, Pasillo e Isócronas aparece la pestaña colapsable **Barreras y facilitadores**. El resumen permanece visible cuando está plegada. Al desplegarla reúne en un mismo lugar:

- valores usados al dibujar nuevas barreras, corredores y pasos;
- todas las barreras, con tipo absoluta o permeable, multiplicador y número de vértices;
- todos los corredores, con nombre, anchura y descuento de coste;
- todos los puentes, vados o túneles, con nombre, tipo y coste;
- todos los puntos de interés, con categoría, modo, radio y atracción;
- eliminación individual de cualquier elemento.

Los controles ya no se mezclan con el perfil, la conectividad ni los parámetros científicos del cálculo. Dibujar y mover continúa realizándose en el mapa de Selección; editar propiedades y eliminar se realiza desde este panel o con las herramientas cartográficas.

### Configuración actual

Las preferencias se organizan en **Visores 2D**, **Visor 3D**, **Modelos digitales**, **Cartografía**, **Procesado** y **Sonidos**. Las decisiones de contenido, tamaño y composición de los PDF se realizan al pulsar **Componer informe**.

## 2. Preparación del MDT

ViaSpania descarga `Elevacion4258_5`, `Elevacion4258_25` o `Elevacion4258_200` mediante WCS IGN/IDEE, valida el GeoTIFF, lo reproyecta con GDAL/PROJ a ETRS89/UTM local, mantiene celdas cuadradas y genera un COG. Inspecciona dimensiones, geotransformación, CRS, resolución y `nodata`. El WCS admite 4096 celdas por eje y Configuración limita además el total procesable.

### Modelos digitales de superficie (MDS)

Configuración → Modelos digitales permite habilitar PNOA-LiDAR MDS05 de la 1.ª cobertura y Copernicus DEM GLO-30. Están desactivados inicialmente y solo aparecen en el selector de modelos de elevación después de habilitarlos. ViaSpania descarga MDS05 por área desde el WCS oficial. Para Copernicus GLO-30 determina las teselas COG públicas de un grado que intersectan el área, las descarga, forma un mosaico, lo recorta y lo reproyecta al UTM local con celdas de 30 m.

Un MDT representa el terreno sin los objetos situados sobre él. Un MDS representa la superficie superior registrada por LiDAR y puede contener edificios y vegetación. ViaSpania permite utilizar un MDS en todos los modos de análisis, pero muestra y conserva esta advertencia:

**Los MDS contienen edificios y vegetación y están destinados a análisis específicos de superficie. No son adecuados para calcular rutas o pendientes del terreno. Los resultados de esos cálculos pueden diferir en gran medida de la realidad.**

El MDS resulta especialmente pertinente para visibilidad, horizonte, obstáculos, sombreado y representación tridimensional. En rutas, isócronas, pasillos, perfiles, pendientes y curvas de nivel, los edificios y las copas pueden comportarse como elevaciones artificiales. Las curvas obtenidas sobre un MDS describen la superficie superior, no el terreno desnudo. Copernicus GLO-30 es una fuente global de aproximadamente 30 m, adecuada principalmente para estudios regionales y trabajos fuera de España; no ofrece el detalle urbano de MDS05.

La fecha de adquisición, el método de captura, el relleno de vacíos y los cambios posteriores en edificios o vegetación condicionan cualquier resultado. Copernicus GLO-30 utiliza WGS84 horizontal y alturas EGM2008; ViaSpania conserva los metros de elevación y transforma horizontalmente el raster, pero no debe interpretarse una diferencia vertical respecto a productos IGN como si fuera necesariamente un cambio real del terreno.

### Ortoimagen europea Copernicus VHR 2021

El selector **Mapa base** del panel Selección permite utilizar **Copernicus VHR 2021 · Europa · 2 m** como alternativa paneuropea a PNOA. Es un mosaico ortorrectificado de imágenes de satélite adquiridas principalmente entre 2020 y 2022, ofrecido como servicio web por Copernicus Land Monitoring Service y la Agencia Europea de Medio Ambiente.

Esta capa está destinada a la visualización y selección de elementos. No se descarga como archivo ni interviene en los cálculos, que utilizan exclusivamente el modelo de elevación cargado y los condicionantes definidos. Su resolución de 2 m es inferior al detalle habitual de PNOA, por lo que en España se recomienda mantener PNOA para trabajos locales y utilizar Copernicus VHR como fondo europeo general.

Copernicus VHR 2021 también puede seleccionarse como fondo en los visores de rutas comparadas, pasillos, isócronas, visibilidad y curvas de nivel, y como textura cartográfica del visor 3D. Cada visor conserva la atribución del proveedor en pantalla o en la composición exportada.

## 3. Cálculos geográficos: funcionamiento e interpretación

Todos los cálculos utilizan las elevaciones reales del MDT cargado. Las herramientas de rutas comparten una superficie de terreno preparada en memoria, pero resuelven de nuevo el análisis cuando cambian puntos, perfil, conectividad o condicionantes. Curvas e isovistas permanecen desacopladas del motor de rutas. Antes de interpretar un resultado conviene comprobar resolución, extensión, CRS, `nodata`, modelo y unidad.

### Ruta simple

**Finalidad.** Busca una conexión de coste mínimo entre un punto Inicio y un punto Final. «Mínimo» no significa necesariamente menor distancia: significa menor suma del coste definido por el perfil seleccionado sobre todas las transiciones de la ruta.

**Datos necesarios.** Requiere un MDT cargado y exactamente un Inicio y un Final dentro de su cobertura. Puede incorporar barreras absolutas, penalizaciones, corredores preferentes, puentes/pasos y puntos de interés. Los waypoint obligan a encadenar varios cálculos parciales en el orden establecido.

**Cómo se calcula.** El MDT se convierte en una rejilla navegable. Cada transición entre celdas recibe una distancia horizontal, una distancia sobre la superficie, un desnivel y una pendiente firmada. El perfil transforma esos valores en segundos, energía o coste relativo. Dijkstra acumula el coste y recupera la secuencia de celdas más barata. Conectividad 4 admite movimientos ortogonales; 8 añade diagonales; 16 añade movimientos de tipo caballo y reduce el sesgo de cuadrícula, a cambio de más tiempo y memoria.

**Ida y vuelta.** **Calcular ida sobre MDT** resuelve Inicio→Final. **Calcular vuelta independiente** resuelve Final→Inicio desde cero. No se limita a invertir la polilínea: Tobler, Kondo–Seino, Alberti y otros perfiles usan el signo de la pendiente, por lo que subir y bajar pueden tener costes y recorridos diferentes.

**Resultado.** Presenta coste total y unidad, distancia planimétrica, ascenso y descenso acumulados, geometría WGS84, pendientes por tramo, conectividad y parámetros específicos. El mapa colorea la pendiente y el visor propio permite examinar capas y exportar PNG/PDF. GeoJSON conserva geometría y atributos científicos.

**Interpretación.** El trazado expresa un óptimo matemático dentro del raster y de los condicionantes introducidos. No demuestra que exista camino físico, permiso de paso, seguridad, firme adecuado o transitabilidad.

### Ruta comparativa

**Finalidad.** Permite estudiar cuánto cambia el trazado cuando se modifica la función de coste, manteniendo constantes el área, los extremos y el resto de los datos. Es útil para contrastar hipótesis de marcha, energía, pastoreo, caravana o vehículo.

**Selección.** Cada casilla activa un perfil y **Seleccionar todos** controla el conjunto completo. No existe un selector individual redundante. La conectividad es común. **Pendiente crítica** aparece cuando se incluye Vehículo y **Velocidad Ardigò** cuando se incluye ese perfil.

**Proceso.** ViaSpania ejecuta los perfiles secuencialmente sobre el mismo MDT y reutiliza la superficie preparada cuando es posible. Cada modelo conserva su propia geometría, unidad y configuración. Un error interrumpe la serie y la interfaz informa en español del punto alcanzado.

**Resultados.** La tabla resume coste y distancia. El visor superpuesto asigna un color estable a cada modelo y permite ocultarlos por separado. El visor dual coloca una ruta y un fondo independientes a cada lado, con navegación sincronizada. También se puede generar una página de informe por ruta.

**Interpretación correcta.** Dos rutas temporales pueden compararse en segundos; dos energéticas pueden compararse si comparten unidad y supuestos. No debe afirmarse que un resultado en J, J/kg o coste relativo sea «menor» que otro en segundos. La comparación espacial de las geometrías sí es válida como contraste de hipótesis.

### Multipunto

**Finalidad.** Estudia todas las conexiones dirigidas entre un conjunto de localizaciones. Responde preguntas como «¿qué punto resulta más accesible desde cada origen?» o «¿la conexión A→B difiere de B→A?».

**Datos y límite.** Utiliza los primeros ocho puntos de la lista para mantener un tiempo y una matriz manejables. Todos deben estar dentro del MDT. El orden de la lista determina filas y columnas, pero no obliga a formar un itinerario.

**Proceso.** Para cada par ordenado distinto se ejecuta una ruta real con el perfil, conectividad y condicionantes activos. La diagonal no necesita desplazamiento. Los resultados son direccionales y no se copian al triángulo opuesto.

**Resultado.** La matriz muestra el coste desde el punto de la fila hacia el de la columna. Además se conserva cada polilínea, distancia y desniveles. En los mapas, el color representa el punto de origen. El informe incorpora matriz, parámetros y conexiones; el GeoJSON agrupa las líneas por perfil.

**Diferencia con Multirruta.** Multipunto calcula una red completa de pares; Multirruta calcula únicamente tramos consecutivos.

### Multirruta

**Finalidad.** Construye un itinerario abierto que visita los puntos en el orden actual de la lista. Es apropiado cuando el orden ya está decidido y se desea calcular el mejor trazado topográfico entre cada parada.

**Proceso.** Con los puntos 1, 2, 3 y 4 ejecuta 1→2, 2→3 y 3→4. Cada tramo se resuelve independientemente con el mismo perfil y condicionantes. ViaSpania no reordena paradas, no resuelve un problema del viajante y no añade un regreso automático al primer punto.

**Resultado.** Conserva coste, distancia, ascenso, descenso y geometría por tramo. El visor asigna colores distintos para comprobar uniones y solapamientos. El informe presenta el orden y las métricas pertinentes; la exportación vectorial mantiene los tramos calculados.

### Pasillo LCP

**Finalidad.** Delimita una zona de alternativas próximas a la ruta óptima, en lugar de reducir el análisis a una única línea. Resulta útil para reconocer bandas de paso potenciales y sectores donde pequeñas diferencias de coste permiten varios trazados.

**Proceso.** ViaSpania calcula una superficie de coste desde Inicio y otra hacia Final respetando la dirección del perfil. Para cada celda suma el mejor coste Inicio→celda y celda→Final. Compara ese total con el coste óptimo Inicio→Final.

**Umbral.** Una celda entra cuando su ruta completa no supera `óptimo × (1 + umbral/100)`. Con 0 % aparecen únicamente celdas compatibles con soluciones óptimas. Con 10 %, por ejemplo, se admiten rutas hasta un 10 % más costosas. Un valor alto produce un pasillo más amplio, no una predicción de uso.

**Resultado.** Informa coste óptimo, unidad, porcentaje y número de celdas. La superficie coloreada está georreferenciada sobre el área; opacidad solo cambia su presentación. El visor exporta PNG/PDF y el informe registra modelo, conectividad, fuente y métricas.

**Interpretación.** El pasillo es una tolerancia de coste según el modelo, no una anchura física de camino ni un intervalo estadístico de probabilidad.

### Isócronas

**Finalidad.** Delimitan lugares alcanzables con el mismo coste acumulado desde uno o varios orígenes. Aunque se denominan isócronas por tradición, solo representan tiempo cuando el perfil tiene unidad temporal; con perfiles energéticos son isolíneas de energía y con perfiles abstractos, isolíneas de coste relativo.

**Orígenes.** Se puede usar Inicio, Final, todos los multipuntos o todos los puntos. Con varios orígenes cada celda conserva el menor coste procedente de cualquiera de ellos; el resultado no separa una superficie por origen.

**Parámetros.** En perfiles temporales el intervalo de interfaz se expresa en minutos y el backend trabaja en segundos. En otros perfiles mantiene su unidad. **Número máximo** entre 1 y 30 evita una leyenda ilegible. **Superficie acumulada** y **Transparencia** no alteran el cálculo.

**Proceso.** Una expansión de Dijkstra obtiene el coste mínimo de todas las celdas accesibles. Después, una extracción interpolada genera los contornos solicitados. La tarea informa preparación, expansión, extracción y reproyección, y **Cancelar cálculo** la detiene de forma segura.

**Resultado y exportación.** Informa niveles, máximo y celdas accesibles. Los visores muestran superficie y líneas sobre distintos fondos. GeoJSON exporta nivel, unidad y modelo en WGS84; PNG/PDF conserva la composición visible. La imagen de pantalla puede estar reducida, pero los contornos proceden del cálculo completo.

### Isovistas

**Finalidad.** Clasifican qué celdas del terreno mantienen línea de visión topográfica desde un observador. Pueden servir para explorar control visual, emplazamientos o relaciones entre relieve y campo visual.

**Observadores.** Se selecciona uno o varios puntos existentes. ViaSpania calcula y conserva un resultado independiente para cada uno, que se elige después en **Resultado**. La altura se añade a la cota del terreno: humana 1,7 m, trípode 3 m, torre 10 m o personalizada entre 0 y 1.000 m.

**Proceso.** El punto WGS84 se transforma al CRS del MDT y se comprueba que esté dentro y no sea `nodata`. El análisis evalúa horizontes angulares sobre la extensión cargada y limita la rejilla de representación para conservar rendimiento. No intervienen perfiles, conectividad, barreras ni lógica de rutas.

**Resultado.** Verde identifica celdas visibles, rojo celdas no visibles y transparente ausencia de datos. Se informan elevación del terreno, altura añadida, celdas visibles y válidas. Los observadores permanecen separados para informes posteriores. Puede abrirse un visor PNG/PDF y una superposición 3D.

**Limitación esencial.** La clasificación depende de resolución, precisión vertical, fecha, interpolación y contenido del MDT. Un MDT del terreno puede no incluir vegetación, edificios, muros o infraestructuras. Por tanto, una celda visible topográficamente puede no serlo en una fecha histórica o en la realidad actual. El resultado no debe presentarse automáticamente como reconstrucción histórica ni observación de campo.

### Curvas de nivel

**Finalidad.** Transforman la elevación raster en líneas de igual cota para lectura morfológica, composición cartográfica y exportación vectorial.

**Parámetros.** Se ofrecen 10, 20, 50 y 100 m, además de intervalo personalizado entre 0,1 y 10.000 m. Un intervalo pequeño aporta más detalle pero genera más geometrías y exige mayor resolución del MDT; no recupera detalle ausente en la fuente.

**Proceso.** ViaSpania recorre celdas válidas, interpola el cruce de cada nivel por sus bordes y reproyecta los segmentos a WGS84. Respeta `nodata` y usa el MDT ya preparado, sin ejecutar rutas ni análisis acumulados.

**Resultado.** Informa número de segmentos, elevación mínima y máxima, CRS, resolución y celdas sin datos. El visor agrupa por cota y aplica exactamente la misma escala de color que la leyenda altura-color. GeoJSON CRS84 incluye `elevation_m`, `interval_m` y fuente. PNG/PDF conserva la cartografía visible.

## 4. Perfiles de desplazamiento

Los perfiles temporales acumulan segundos, los metabólicos energía y los abstractos coste relativo.

- **Tobler por caminos**: velocidad de marcha según pendiente firmada. Tobler (1993), *Three Presentations on Geographical Analysis and Modeling*, NCGIA 93-1.
- **Tobler campo a través**: Tobler ×0,6 fuera de senda. Tobler (1993), NCGIA 93-1.
- **Márquez–Pérez**: ajuste empírico para senderos naturales. Márquez-Pérez et al. (2017), DOI 10.1080/00167223.2017.1316212.
- **Kondo–Seino**: tiempo direccional con rama para descensos mayores del 7 %. Kondo y Seino (2010), *GPS-aided Walking Experiments and Data-driven Travel Cost Modeling*.
- **Rees**: velocidad en terreno montañoso. Rees (2004), *Computers & Geosciences* 30(3), 203–209.
- **Garmy–Kaddouri–Rozenblat–Schneider**: función exponencial de pendiente angular. Garmy et al.; formulación documentada por Herzog (2020).
- **Tripcevich**: velocidad de caravanas de llamas. Tripcevich (2008), *Estimating Llama Caravan Travel Speeds*.
- **Alberti pastoral**: Tobler reescalado a velocidad de rebaño. Alberti (2019), *SoftwareX* 10, 100331.
- **Pandolf**: energía para 70 kg, carga 0, 1,2 m/s y terreno configurable. Pandolf, Givoni y Goldman (1977), DOI 10.1152/jappl.1977.43.4.577.
- **Pandolf corregido**: añade corrección Yokota solo en descenso. Pandolf et al. (1977); Yokota et al. (2004), USARIEM T04-09.
- **Minetti**: energía por kg; dominio recomendado de pendiente −0,5 a 0,5. Minetti et al. (2002), *Journal of Applied Physiology* 93, 1039–1046.
- **Herzog**: aproximación estable de sexto grado a Minetti. Herzog (2016), *Potential and Limits of Optimal Path Analysis*.
- **Ardigò**: coste locomotor para caminar, correr o bicicleta; 0,2–15 m/s y presets 1,2, 3,0 y 5,5. Ardigò, Saibene y Minetti (2003), *European Journal of Applied Physiology* 90, 365–371.
- **Vehículo con pendiente crítica**: penalización cuadrática relativa; la pendiente crítica no crea una barrera. Herzog (2016), *Potential and Limits of Optimal Path Analysis*.
- **Eastman**: coste cuadrático por pendiente angular. Eastman (1999); formulación en Vaissié (2021).

La auditoría matemática ampliada está en `docs/model-audit.md`.

## 5. Visores de resultados

Ruta, multirruta, isócronas, pasillos, curvas e isovistas comparten visor. Opciones: fondo PNOA, MDT, topográfico IGN o MTN50; puntos; nombres; barreras; facilitadores; ruta; superficie y opacidad cuando procede; zoom al área; restablecer; imprimir; PNG; PDF; y cierre superior derecho. En Ruta simple, un perfil altimétrico colapsable se superpone en la esquina inferior izquierda: representa la distancia acumulada y las cotas reales muestreadas del GeoTIFF, con series separadas para ida y vuelta cuando ambas están calculadas. El visor de Ruta comparativa utiliza el mismo gráfico: en superposición representa todos los modelos visibles y en vista dual representa los dos modelos seleccionados, conservando sus colores. Multirruta encadena los perfiles según el orden del itinerario: cada tramo comienza en la distancia acumulada donde termina el anterior y conserva el color utilizado en el mapa. CSV/GeoJSON de entrada, plantilla y exportación de puntos/rutas aparecen solo en cálculos de rutas. Isócronas y curvas usan GeoJSON vectorial; pasillos e isovistas PNG/PDF.

## 6. Visor 3D

Genera una malla visual simplificada, sin modificar el MDT ni las rutas.

### Cámara y orientación

- Arrastre izquierdo orbita; derecho desplaza; rueda/trackpad amplía.
- **Restablecer cámara** recupera la vista inicial.
- Brújula e inclinómetro del mismo tamaño muestran rumbo y ángulo; el inclinómetro no presenta el texto «inclinación».
- El cierre está arriba a la derecha.

### Terreno y capas

- Exageración: 0 %, 0,5×, 1×, 1,5×, 2×, 3×, 4×, 6× u 8×.
- Paletas: grises, terreno, hipsométrica, Viridis y alta montaña.
- **Mapa sobre el MDT**: PNOA, OSM, topográfico IGN o capas históricas; solo cambia textura.
- Grosor, color y presentación simultánea de todas las rutas.
- Capas: puntos, etiquetas, barreras, puentes/pasos, corredores, puntos de interés, isócronas, pasillo y punto más alto.
- El punto más alto procede de las elevaciones del MDT cargado.
- Las superposiciones reutilizan resultados; **Exportar PNG** guarda vista y atribución.

### Vídeo y GIF

El panel **Exportación animada** se pliega para liberar espacio y configura la salida sin reproductor en pantalla.

- Tipo: **Órbita de cámara** o **Recorrido de rutas**.
- Velocidad: 0,25×, 0,5×, 1×, 2×, 5×, 10×, 25× o 50×.
- Duración inicial 20 s; rango 2–86.400 s, sujeto a límites efectivos.
- Inclinación 5–85° y orientación 0–359°.
- Resolución 854×480, 1280×720 o 1920×1080.
- **Exportar vídeo** elige MP4/H.264 o WebM admitido por MediaRecorder y limita a 90 s efectivos.
- **Exportar GIF** usa hasta 640 px de anchura, 8 fps, 120 fotogramas y 5 min efectivos.
- **Cancelar** libera stream, fotogramas y recursos.

Las imágenes PNG, los GIF y todos los fotogramas de los vídeos exportados incorporan automáticamente una pequeña marca de agua **VS · ViaSpania** en la esquina inferior derecha. La marca se adapta a la resolución y no altera el resultado geográfico original.

Órbita completa 360°. Recorrido anima cabeza y estela sobre rutas ya calculadas, sin recalcularlas.

## 7. Configuración

**Cancelar** descarta el borrador; **Guardar preferencias** persiste localmente.

### Visores 2D

- Etiquetas de elementos, crucetas, marcadores de selección, escalas y coordenadas del cursor en Selección.
- Límites administrativos de España.
- Mapa de navegación, ortofotografía de selección y paleta del modelo digital predeterminados.

### Visor 3D

- Exageración vertical, paleta, cota máxima y escala horizontal predeterminadas.

### Modelos digitales

- Activa o desactiva individualmente los MDT y MDS disponibles para descarga y análisis.
- Debe permanecer activo al menos un modelo. Los MDS parten desactivados.

### Cartografía

- Enumera las fuentes incorporadas, sus proveedores y enlaces de origen, y permite activarlas o desactivarlas.
- Añade teselas XYZ mediante una URL con `{z}/{x}/{y}` o servicios WMS/WMTS mediante su URL de capacidades.
- Para WMS y WMTS, **Consultar servicio** lee `GetCapabilities` y permite escoger una de las capas y matrices compatibles. Se priorizan `EPSG:3857` y `EPSG:4326`.
- Cada fuente externa se asigna a Navegación, Selección o Visor de cartografía y puede editarse o eliminarse. La atribución introducida se conserva en el visor.
- Algunos servidores no permiten consultas desde otras aplicaciones mediante CORS. En ese caso ViaSpania muestra el error y no guarda una configuración incompleta.

### Procesado

- Memoria detectada y límite recomendado.
- Límite máximo: 2.000.000, 3.000.000, 3.500.000 o 5.000.000 celdas.
- **Aplicar valor recomendado** selecciona el nivel calculado. No cambia resolución ni valores.

### Sonidos

- Activa o desactiva el aviso al terminar cálculos, cargas y exportaciones.
- Permite elegir y probar el sonido antes de guardar.

## 8. Compositor y exportación del informe PDF

**Componer informe** abre el compositor específico del análisis activo. Permite elegir cálculos, páginas técnicas, mapas combinados, bases cartográficas, capas visibles, flecha del norte, escala gráfica, posición de elementos y tamaño A4/A3/A2 horizontal. La previsualización muestra la organización prevista con la identidad final de ViaSpania.

**Plantilla** ofrece Análisis activo, Mapas abiertos, Informe completo y Vacía. **Tamaño** elige A4/A3/A2 horizontal. Un mapa se captura al pulsar **Generar PDF**, conservando el encuadre y capas visibles en ese momento; por eso un visor debe permanecer abierto para aparecer en el catálogo. Se registran atribuciones. Puntos, barreras y facilitadores producen páginas de texto seleccionables. **Cancelar** no escribe ningún archivo.

El generador común produce Ruta simple, Ruta comparativa, página por ruta, Multirruta, Multipunto, Isócronas, Pasillos e Isovistas. La composición ordena los bloques añadidos y la plantilla analítica registra fecha, extensión, resolución, tamaño, CRS y fuente del MDT, parámetros y métricas. Predictivo no está implementado.

## 9. Archivos y exportaciones

Los puntos se importan en CSV/GeoJSON; la plantilla CSV documenta el esquema. Exportar puntos consulta elevación. Exportar rutas crea GeoJSON por perfil con geometría, modelo, coste, unidad, distancia, desniveles, conectividad, extremos y parámetros. Los proyectos usan JSON. Al abrirlos se recupera el área y se ajusta automáticamente el zoom. Los visores exportan PNG/PDF y 3D PNG, vídeo o GIF.

**Exportar resultados** permite seleccionar conjuntamente el MDT o MDS cargado, rutas, isócronas, pasillos, visibilidad, curvas, puntos, barreras y facilitadores disponibles. ViaSpania solicita una carpeta y escribe cada resultado con un nombre descriptivo y el formato apropiado. El modelo de elevación se exporta como GeoTIFF conservando CRS, georreferenciación, resolución y `nodata`; no se exporta la paleta visual aplicada a su previsualización. Los PNG, vídeos y GIF incluyen la marca de agua de ViaSpania.

## 10. Limitaciones

El MDT solo describe elevación. Una ruta óptima no garantiza camino, permiso, transitabilidad ni seguridad; ViaSpania no debe usarse para emergencias. Las isovistas no incorporan automáticamente vegetación, edificios ni condiciones históricas. Ningún resultado tiene más precisión que su fuente.

## 11. Créditos, fuentes y contacto

Creador y responsable: Antonio López García, 2026.

Correo electrónico: antonio-lopez-garcia@hotmail.com.

Base metodológica: paquete R `movecost`, creado y mantenido por Gianmarco Alberti. Elevación, PNOA, topográfico, histórica, límites y núcleos: Instituto Geográfico Nacional / Centro Nacional de Información Geográfica. OpenStreetMap: © colaboradores, ODbL 1.0.

Créditos y licencias enumera dependencias efectivas: React, React DOM, OpenLayers, Three.js, jsPDF, Tauri y Dialog, Vite, TypeScript, Vitest, Testing Library, jsdom, GDAL, PROJ y dependencias Rust declaradas. No se inventan créditos ni licencias.
