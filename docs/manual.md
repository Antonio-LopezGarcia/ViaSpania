# Manual general de ViaSpania

ViaSpania  
Copyright © 2026 Antonio López García, Universidad de Granada  
Este programa se distribuye bajo la licencia GPL-3.0-only.

[LICENSE](../LICENSE) · Esta declaración se aplica al código original de ViaSpania. Los componentes de terceros y los datos conservan sus respectivos copyrights, licencias y condiciones. El logotipo y los assets gráficos originales de ViaSpania mantienen copyright separado y todos los derechos reservados; los símbolos institucionales conservan sus condiciones propias.

ViaSpania permite explorar el relieve, calcular desplazamientos de coste mínimo y estudiar accesibilidad y visibilidad. Este manual explica cómo preparar un proyecto, elegir un análisis, interpretar sus resultados y guardarlos. Para consultar las ecuaciones y los supuestos de un perfil concreto, utilice el botón de ayuda contextual del cálculo.

## 1. Empiece aquí

### Qué necesita

Para realizar los análisis necesita la aplicación de escritorio, un modelo de elevación y los puntos que requiera la herramienta elegida. La conexión a Internet es necesaria para descargar modelos, consultar mapas en línea y buscar nombres de lugares. Puede importar un modelo local; los cálculos se realizan en el equipo.

Un mapa de fondo sirve para orientarse. El modelo de elevación proporciona las alturas utilizadas en los cálculos. Cambiar una ortofotografía por otro mapa no cambia el terreno sobre el que se calcula.

### Su primera ruta, paso a paso

1. Pulse **Nuevo proyecto**, escriba un nombre y elija dónde guardar el archivo JSON.
2. Localice una zona conocida en **Navegación**. Puede desplazarse por el mapa o utilizar **Buscar lugar**.
3. Active **Seleccionar área** y arrastre un rectángulo pequeño que incluya los dos extremos de su recorrido y espacio alrededor para posibles alternativas.
4. Elija un modelo del terreno y revise su resolución y el tamaño estimado. Descárguelo y espere a que termine el procesamiento.
5. En el mapa de **Selección**, active la herramienta de Inicio y coloque el origen. Haga lo mismo con Final para el destino. Ambos deben quedar dentro del modelo y sobre celdas con elevación válida.
6. Abra **Ruta simple**, seleccione un perfil de desplazamiento y una conectividad. Para este primer ejercicio, deje las barreras y los facilitadores vacíos.
7. Calcule la ida. Revise el trazado, su distancia, el coste y su unidad, y el perfil de elevación.
8. Si desea estudiar el regreso, calcule la vuelta independiente. Después guarde el proyecto y utilice **Componer informe** o **Exportar resultados** según lo que necesite conservar.

Empiece con un área pequeña y un solo perfil. Cuando comprenda el resultado, pruebe a cambiar una única condición y vuelva a calcular; así podrá identificar qué provoca cada diferencia.

## 2. Conozca el espacio de trabajo

### Los cuatro mapas

- **Navegación**: localiza el trabajo y define el área de estudio.
- **Selección**: permite colocar y editar puntos, barreras y facilitadores sobre un fondo cartográfico u ortofotográfico.
- **Modelo digital**: muestra la elevación cargada y las superposiciones disponibles.
- **Cartografía**: facilita la consulta de mapas modernos, históricos y otras fuentes habilitadas.

Los mapas principales comparten la navegación. Utilice el control de ampliar/restaurar para trabajar con más espacio y vuelva a la disposición conjunta cuando quiera contrastar los fondos. Los controles visibles dependen del visor y de los datos disponibles.

### Acciones principales

**Nuevo proyecto**, **Abrir proyecto** y **Guardar proyecto** gestionan su archivo de trabajo. El nombre del proyecto activo aparece junto a ViaSpania. **Configuración** reúne las preferencias; **Vista 3D** abre el relieve cuando hay un modelo cargado; **Componer informe** prepara un PDF y **Exportar resultados** guarda productos del análisis.

El panel de cálculos presenta los parámetros de la herramienta seleccionada. Los botones de ayuda contextual explican ese análisis o perfil. Lea también los mensajes de estado: indican qué falta, el progreso de una operación o el motivo de un error.

## 3. Crear, guardar y recuperar proyectos

### Crear y guardar

Sin un proyecto creado o abierto, el encabezado indica **Proyecto vacío** y Guardar permanece desactivado. Al crear un proyecto se solicita un nombre y un destino; el nuevo espacio de trabajo comienza sin modelo, puntos ni resultados. Guarde el trabajo actual antes de empezar otro.

**Guardar proyecto** actualiza el archivo asociado. Si se ha recuperado el último proyecto automáticamente y todavía no tiene un destino asociado en la sesión, se solicitará una ubicación. Guarde después de editar puntos, cambiar condiciones o completar un análisis que quiera conservar.

### Abrir un proyecto

1. Pulse **Abrir proyecto** y seleccione un JSON de ViaSpania.
2. Compruebe el nombre, los puntos y las condiciones recuperadas. Si contiene un área válida, los mapas se ajustan a ella.
3. Vuelva a descargar o importar el modelo de elevación antes de recalcular.

El JSON conserva datos y configuración del proyecto y los resultados incluidos al guardar; no incorpora el archivo de elevación. No confunda guardar el proyecto con exportar todos los productos. Mantenga el JSON, el GeoTIFF y las exportaciones en una carpeta de trabajo identificable.

## 4. Localizar y delimitar el estudio

### Buscar un lugar o unas coordenadas

1. Pulse **Buscar lugar** en Navegación.
2. Escriba al menos tres caracteres de un topónimo y pulse Buscar o Enter.
3. Seleccione un resultado con el ratón o con las flechas y Enter. El mapa se centrará en esa posición. Escape cierra la ventana.

La búsqueda de nombres utiliza GeoNames en línea y no requiere configurar una cuenta individual. Solo se consulta al enviar la búsqueda; pueden aparecer límites de cuota o errores de conexión. Centrar el mapa no sustituye a colocar los puntos del cálculo en Selección.

También puede introducir **latitud, longitud** en grados decimales WGS84, por ejemplo **40.4168, -3.7038**. Use punto decimal y una coma entre los valores. Este campo no admite UTM ni grados, minutos y segundos. Las coordenadas se interpretan localmente y la ventana muestra su transformación al sistema del modelo cargado o del visor.

### Elegir el área

Active **Seleccionar área** y dibuje un rectángulo en Navegación. Incluya todas las localizaciones necesarias y deje margen para que una ruta pueda rodear obstáculos. Un área demasiado ajustada puede excluir una alternativa útil; una demasiado grande aumenta el consumo de memoria.

**Eliminar área** retira la extensión y el modelo asociado, pero conserva puntos y barreras. Después deberá definir o importar de nuevo el terreno de trabajo y recalcular los análisis que dependan de él.

## 5. Preparar el modelo de elevación

### Terreno y superficie: una diferencia importante

Un **MDT** representa el terreno sin edificios ni vegetación. Es la opción habitual para estudiar desplazamientos y pendientes del suelo. Un **MDS** representa la superficie superior y puede incluir construcciones y copas de árboles; puede ser útil en estudios de visibilidad, pero esas alturas también afectan a rutas, pendientes y curvas de nivel.

Seleccione el tipo de modelo según la pregunta del estudio. Una imagen aérea no aporta por sí misma alturas de edificios ni información de transitabilidad. Un MDS tampoco garantiza que todos los obstáculos actuales estén representados.

### Descargar un modelo

1. Defina el área y seleccione una fuente habilitada en el panel de carga del modelo.
2. Revise la resolución, las dimensiones, el número de celdas y las estimaciones de recursos.
3. Inicie la descarga y el procesamiento. Espere a que el modelo aparezca antes de calcular.
4. Compruebe la cobertura y las alturas en el visor del modelo digital.

En **Configuración → Modelos digitales** puede habilitar las fuentes que necesite. Las fuentes disponibles incluyen modelos del terreno y modelos de superficie con distinta cobertura y detalle. La disponibilidad de una fuente en el selector no implica que cubra cualquier área.

### Importar un GeoTIFF

Utilice la opción de importar un modelo local y seleccione si corresponde a terreno o superficie. La aplicación comprueba sus metadatos y prepara el archivo para el análisis. Debe contener elevaciones y un sistema de referencia reconocible; una imagen TIFF sin georreferenciación no basta.

Tras importar, revise el área, la resolución y el tipo asignado. Los puntos guardados usan WGS84; las distancias y la resolución del análisis se expresan en metros. No es necesario convertir manualmente los puntos al sistema proyectado del archivo.

### Resolución, memoria y zonas sin datos

Cada celda del modelo representa una parte del terreno. Una celda más pequeña aporta más detalle si la fuente lo contiene, pero aumenta el tamaño y el trabajo de cálculo. Reducir la resolución de salida no crea información nueva en una fuente poco detallada.

Si se supera el límite de procesamiento, reduzca el área o elija un modelo menos detallado. En **Configuración → Procesado** puede aplicar el límite recomendado para la memoria detectada. Aumentar el límite permite más celdas, pero no añade memoria al equipo.

Las celdas sin elevación válida, llamadas **NoData**, no son terreno de altura cero. Pueden impedir una conexión. Si el cursor muestra un guion, compruebe si está fuera del modelo o sobre una zona sin datos. Cambiar la paleta solo modifica los colores, no las alturas.

## 6. Añadir puntos y condiciones de paso

### Puntos del cálculo

Coloque Inicio y Final para una ruta entre dos extremos. Utilice multipuntos para estudiar varias localizaciones o un itinerario con paradas. Revise nombres, posiciones y orden en la lista. Las herramientas de seleccionar, mover y eliminar actúan sobre los elementos del mapa de Selección; vuelva al modo de navegación para desplazar el mapa sin editarlos.

Puede importar puntos mediante CSV o GeoJSON. Use la plantilla CSV de la aplicación como referencia de columnas y formato, y compruebe en el mapa el resultado antes de calcular. El orden de coordenadas del buscador es latitud, longitud; GeoJSON utiliza longitud, latitud.

### Barreras y facilitadores

Dibuje los elementos en Selección y edite sus propiedades en el panel desplegable **Barreras y facilitadores**. Su resumen permite revisar las condiciones sin mantener todos los controles abiertos.

- **Barrera absoluta**: impide cruzar las celdas afectadas.
- **Barrera permeable**: incrementa el coste mediante un multiplicador.
- **Corredor preferente**: reduce el coste dentro de la anchura indicada.
- **Puente o paso**: permite atravesar una barrera por su trazado, con el coste configurado.
- **Punto de interés**: puede influir en el coste cercano o intervenir como visita/punto de paso, según su modo.

Por ejemplo, para representar un obstáculo atravesable solo por un paso, dibuje la barrera y después el paso que la cruza. Compruebe que ambos coinciden a la escala del modelo. Un paso no rellena elevaciones NoData ni demuestra que exista una infraestructura real.

### Pasos obligatorios

Marque **Paso obligatorio** si la ruta debe visitar ese puente o paso. Sin marcarlo, el paso sigue disponible para cruzar la barrera, pero la ruta puede elegir otra alternativa. Los pasos obligatorios se aplican a rutas simples, comparación, conexiones multipunto y alternativas.

La aplicación encadena visitas; no optimiza globalmente su orden. En Multirruta las condiciones se aplican a cada tramo y un paso puede visitarse más de una vez. Las isócronas y la superficie de pasillo no representan un itinerario de visitas obligatorias.

### Mostrar no equivale a activar o eliminar

Ocultar barreras, facilitadores o etiquetas en un visor solo cambia su presentación. Para cambiar las condiciones del análisis, edite o elimine los elementos del proyecto y vuelva a calcular. Compruebe siempre la lista antes de interpretar una nueva ruta.

## 7. Elegir el análisis

### Ruta simple: conectar dos lugares

Utilícela para buscar una ruta entre Inicio y Final. Cargue el modelo, coloque ambos puntos, elija perfil y conectividad y calcule la ida. El coste mínimo es el menor coste según ese perfil, no necesariamente la distancia más corta.

El resultado ofrece trazado, distancia, coste con unidad, ascenso, descenso y perfil de elevación. La vuelta se calcula de forma independiente: subir y bajar pueden producir costes y rutas diferentes. Para comparar sentidos, calcule ambos.

### Ruta comparativa: contrastar perfiles

Utilícela para estudiar cómo cambia el trazado al cambiar la hipótesis de desplazamiento. Seleccione varios perfiles y calcule manteniendo iguales los extremos, el modelo y las condiciones de paso.

Revise la tabla y los visores superpuesto o dual. En el superpuesto puede mostrar u ocultar perfiles; el dual permite inspeccionar dos rutas con navegación sincronizada. Compare geometrías y compruebe las unidades antes de comparar valores numéricos: segundos, julios y coste relativo no son equivalentes.

### Multipunto: comparar conexiones entre localizaciones

Utilícelo para estudiar conexiones entre los primeros ocho puntos de la lista. El resultado es una matriz de costes y un conjunto de rutas dirigidas. Lea cada casilla desde el origen de la fila hacia el destino de la columna.

La conexión A→B puede diferir de B→A. Multipunto responde qué cuesta ir entre pares; no propone un orden para visitar todos los lugares.

### Multirruta: seguir una secuencia de paradas

Utilícela cuando el orden de visita ya está decidido. Ordene los puntos y calcule: con A, B y C se obtiene A→B y después B→C. Revise cada tramo y sus uniones.

La aplicación no reordena las paradas ni añade automáticamente el regreso al inicio. Si desea otro itinerario, cambie la lista y vuelva a calcular.

### Alternativas subóptimas

En los modos que ofrecen esta opción, active las alternativas antes de calcular. El rango 1 es el óptimo; los siguientes buscan trazados espacialmente diferentes. Revise el incremento de coste y el porcentaje compartido con la ruta óptima.

La separación influye en cuánto se apartan los trazados. No son las k rutas más cortas exactas, ni todas tienen por qué ser útiles para el estudio. Los costes mostrados se evalúan sobre las condiciones originales. En Multirruta, cada rango corresponde al itinerario completo por la lista de paradas.

### Pasillo: explorar una franja de alternativas

Utilícelo para reconocer una zona de paso potencial entre Inicio y Final. Elija perfil, conectividad y porcentaje de tolerancia; después calcule y revise la superficie.

Un umbral del 10 % admite celdas por las que puede pasar una conexión con un coste hasta un 10 % superior al óptimo. Aumentar el porcentaje suele ampliar el pasillo. No representa una anchura física de camino ni una probabilidad de uso.

### Isócronas: estudiar alcance desde uno o varios orígenes

Seleccione los orígenes, el intervalo entre niveles y el número máximo de niveles. Calcule y examine las líneas y la superficie acumulada. Con varios orígenes, cada celda toma el menor coste desde cualquiera de ellos.

Las líneas representan tiempo solo si el perfil usa unidades temporales. Con otros perfiles expresan energía o coste relativo. En los perfiles temporales, el intervalo de la interfaz se introduce en minutos. No interprete el alcance calculado como una garantía de acceso real.

### Isovistas: estudiar visibilidad

Seleccione los observadores y su altura sobre la superficie, calcule y examine las zonas visibles y no visibles. La altura del observador puede representar una persona, un trípode, una torre o un valor personalizado.

La visibilidad depende del modelo cargado. Un MDT no incorpora automáticamente árboles ni edificios; un MDS solo incorpora lo registrado en su superficie. El análisis no incluye refracción atmosférica ni reconstruye condiciones históricas.

### Curvas de nivel: leer las alturas

Elija la separación vertical en metros y genere las curvas. Utilice sus valores de cota para reconocer laderas, crestas y fondos. Una separación pequeña produce más líneas, pero no mejora la precisión de la fuente.

Las curvas calculadas pueden superponerse en los visores que las admiten, incluido el 3D. Sobre un MDS describen la superficie superior, no necesariamente el suelo.

## 8. Elegir parámetros e interpretar resultados

### Perfil de desplazamiento

El perfil define qué se minimiza: tiempo, energía o coste relativo. Elija uno adecuado a la pregunta y consulte su ayuda contextual para conocer los supuestos. Algunos perfiles ofrecen parámetros propios, como velocidad o pendiente crítica; no son controles universales.

Un perfil de vehículo no incorpora por sí solo carreteras, firme ni permisos. Su pendiente crítica es una referencia de coste, no una barrera absoluta. Represente las restricciones conocidas mediante las condiciones del proyecto.

### Conectividad

La conectividad define las direcciones disponibles entre celdas: 4 permite movimientos ortogonales, 8 añade diagonales y 16 añade direcciones extendidas. Una mayor conectividad puede suavizar el efecto de la cuadrícula, a costa de más trabajo de cálculo. Manténgala constante al comparar perfiles si quiere aislar el efecto del perfil.

### Cómo revisar un resultado

1. Compruebe fuente, área y resolución del modelo utilizado.
2. Revise puntos, perfil, unidad, conectividad y condiciones de paso.
3. Examine el trazado y el perfil de elevación, no solo el coste total.
4. Compruebe si el resultado se acerca al borde del área o a zonas NoData.
5. Tras cambiar los datos o parámetros del análisis, vuelva a calcular antes de exportar una conclusión.

Cambiar fondo, paleta, opacidad o visibilidad de etiquetas no recalcula el análisis. Una ruta modelada no acredita camino, permiso, transitabilidad ni seguridad. ViaSpania no debe utilizarse para navegación de emergencia.

## 9. Explorar los resultados en 2D y 3D

### Visores 2D

Abra el visor del resultado para explorar mapas, leyendas, tablas y perfiles. El selector de fondo permite situar el resultado sobre distintas fuentes y capas externas guardadas. Los fondos históricos son contexto visual; no convierten el modelo de elevación actual en un terreno histórico.

En el visor ampliado del modelo digital puede controlar barreras, facilitadores y etiquetas. Ocultarlos no cambia su participación en el cálculo. Los visores de cálculo no tienen exportación PNG/PDF ni impresión directa: utilice el compositor de informes.

### Visor 3D

Con un modelo cargado, pulse **Vista 3D**. Arrastre con el botón izquierdo para orbitar, con el derecho para desplazar y use la rueda para acercar o alejar. La brújula y el indicador de inclinación ayudan a orientarse.

Ajuste exageración vertical, paleta o textura y active los puntos, rutas, curvas y demás resultados disponibles. La exageración solo modifica la representación; un valor de cero aplana la vista. La malla 3D es una representación simplificada, no una fuente de elevación adicional.

### Crear imágenes y animaciones

1. Prepare las capas visibles y espere a que termine de cargar el fondo.
2. En **Exportación animada**, elija Órbita de cámara, Recorrido de rutas o Seguimiento a vista de pájaro.
3. Para seguir una ruta, mantenga una ruta calculada visible y seleccione cuál seguir. Ajuste distancia de cámara, inclinación y los controles disponibles.
4. Elija duración, velocidad y resolución. Active brújula o perfil altimétrico si los necesita y están disponibles.
5. Pulse **Exportar vídeo**, **Exportar animación GIF** o **Exportar fotograma PNG** y espere a la confirmación de guardado.

El vídeo se guarda como AVI/MJPEG a 30 fotogramas por segundo, con un máximo de 90 segundos y 1,5 GB por archivo. La duración efectiva depende de duración y velocidad: 20 segundos a 2× producen 10 segundos. El tiempo necesario para generar el archivo puede ser mayor que su duración de reproducción.

GIF adapta la resolución y el número de fotogramas para controlar memoria. El PNG corresponde al fotograma inicial del modo configurado. Los vídeos pueden ocupar mucho espacio; reserve disco para el temporal y el archivo final. Puede cancelar la exportación. Si el reproductor no admite AVI/MJPEG, abra el archivo con uno compatible.

## 10. Guardar resultados y componer un informe

### Qué opción utilizar

- **Guardar proyecto**: continuar editando el trabajo en ViaSpania.
- **Exportar resultados**: conservar datos geográficos para archivo o uso en un SIG.
- **Componer informe**: presentar mapas, métricas y parámetros en PDF.
- **Exportación del visor 3D**: obtener una imagen o animación de la escena.

### Exportar datos

Abra **Exportar resultados**, seleccione los productos disponibles y elija una carpeta. La aplicación organiza los archivos con nombres descriptivos. Según el análisis, puede incluir modelos de elevación, rutas, superficies, curvas, puntos, barreras y facilitadores.

GeoJSON conserva geometrías vectoriales; GeoPackage agrupa capas y atributos; GeoTIFF conserva datos ráster y su georreferenciación. El GeoTIFF de elevación no incorpora la paleta de la previsualización. Compruebe el mensaje final y los archivos generados antes de trasladar o cerrar el trabajo.

### Preparar el PDF

1. Calcule los resultados que desee incluir y seleccione el modo de análisis correspondiente.
2. Pulse **Componer informe**. Las opciones cambian según el análisis y los resultados disponibles.
3. Seleccione mapas, rutas, tablas y páginas técnicas que se ofrezcan. Elija el fondo y el tamaño de página.
4. Ajuste las opciones visuales. Si utiliza Modelo 3D, revise inclinación y orientación antes de generar el documento.
5. Pulse **Generar PDF**, elija el destino y compruebe el documento guardado.

Incluya los parámetros y las unidades si necesita que otra persona interprete el cálculo. El PDF comunica un resultado; no sustituye al proyecto editable ni a los datos geográficos.

## 11. Adaptar la aplicación a su trabajo

### Idioma y ayuda

En **Configuración** elija Español o English y guarde las preferencias. La selección se aplica a la interfaz y a la ayuda general, además de los textos asociados. Utilice el tutorial para orientarse por los controles y la ayuda contextual para profundizar en cada cálculo.

### Mapas y representación

**Visores 2D** permite ajustar punteros, coordenadas, escalas, etiquetas, límites y fondos predeterminados. **Visor 3D** reúne preferencias de relieve y representación. Estas opciones afectan a la lectura del mapa, no a las elevaciones originales.

### Fuentes y capas externas

En **Modelos digitales** habilite las fuentes de elevación que quiera ofrecer en el selector. En **Cartografía** gestione los fondos y añada servicios XYZ, WMS o WMTS. Revise la dirección del servicio, la capa y la configuración solicitada antes de guardar. Un servicio puede tener cobertura limitada o impedir el acceso desde la aplicación.

### Procesado y sonidos

En **Procesado** revise la memoria detectada y aplique el límite recomendado. En **Sonidos** puede activar, elegir y probar el aviso de finalización. El sonido informa del éxito de una operación; compruebe igualmente el mensaje de estado y el resultado.

## 12. Resolver problemas frecuentes

### No puedo iniciar el cálculo

Compruebe que hay un modelo cargado, un área válida y los puntos requeridos. Revise si los puntos están dentro de la cobertura y si falta algún parámetro. Lea el mensaje de estado; un control desactivado suele indicar un requisito pendiente.

### No se encuentra una ruta

Revise celdas NoData, barreras absolutas y pasos obligatorios. Compruebe que los pasos conectan ambos lados del obstáculo a la resolución utilizada. Amplíe el área si una alternativa puede quedar fuera, vuelva a cargar el modelo y recalcule.

### La descarga o el mapa no carga

Compruebe la conexión y la cobertura de la fuente. Pruebe un área menor o un fondo diferente. Si el servicio falla o alcanza su cuota, inténtelo más tarde. Para continuar con un modelo disponible, use la importación local de GeoTIFF.

### El cálculo consume demasiados recursos

Reduzca el área, utilice un modelo menos detallado o pruebe primero un solo perfil y menos puntos. Comparaciones, alternativas y conectividad 16 pueden requerir más tiempo. No aumente el límite de celdas sin revisar la memoria disponible.

### He abierto un proyecto y no aparece el terreno

El proyecto JSON no contiene el archivo de elevación. Vuelva a descargar o importar el modelo y compruebe que corresponde al estudio antes de recalcular.

### El vídeo falla o no se reproduce

Espere a que las texturas terminen de cargar, compruebe que hay una ruta visible si el modo la requiere y reduzca duración o resolución. Revise el espacio de disco y los límites de exportación. El archivo es AVI/MJPEG; necesita un reproductor que admita ese formato.

### Necesito comunicar un problema

Anote versión y compilación, sistema operativo, pasos realizados y mensaje de error completo. Indique la fuente y resolución del modelo y adjunte solo datos que pueda compartir. Contacto de soporte: antonio.lopez@ugr.es.
