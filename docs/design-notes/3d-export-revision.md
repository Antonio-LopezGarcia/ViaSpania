# Revisión de exportación 3D

La escena y los resultados calculados siguen siendo comunes a todos los modos. No se modifica el motor de rutas.

Problemas corregidos: las listas vacías predeterminadas recreaban referencias en cada render React; el bucle de OrbitControls competía con la cámara de exportación; MediaRecorder dependía del tiempo real y podía agrupar/perder capturas atrasadas; el recorrido ocultaba su línea original y reconstruía un buffer creciente en cada fotograma.

Ahora las referencias vacías son estables, la exportación tiene poses deterministas y acceso exclusivo al renderizador, y las líneas se conservan. El progreso se obtiene por búsqueda binaria sobre distancias acumuladas, calculadas una vez por ruta. Un solo bucle alimenta GIF o AVI/MJPEG. AVI utiliza el formato RIFF documentado por Microsoft: https://learn.microsoft.com/en-us/windows/win32/directshow/avi-riff-file-reference. No se añaden dependencias ni requisitos FFmpeg al instalador.

AVI sacrifica compresión y compatibilidad con reproductores exclusivamente MP4 para evitar la dependencia de MediaRecorder/WebCodecs en los motores web de macOS, Windows y Linux. El vídeo se escribe progresivamente en un archivo temporal administrado por el motor nativo. JavaScript conserva solo el fotograma actual y los tamaños del índice, no la película completa. El guardado de vídeo es independiente del límite general de 100 MB y permite hasta 1,5 GB por archivo. Al finalizar se actualizan la cabecera y el índice y se copia el resultado a un temporal en el destino antes de publicarlo. Los temporales se eliminan al terminar, cancelar o fallar; se necesita espacio en disco para el temporal y la copia final.

El seguimiento es una cámara cinematográfica, no un cálculo de vuelo: acercamiento inicial, rumbo suavizado hacia la tangente y progreso por la geometría existente. La cámara se separa del suelo en la posición bajo ella; no se garantiza ausencia de oclusiones por relieve entre cámara y objetivo.

Pruebas: estructura RIFF e índice, tiempo y extremos, vértices repetidos, continuidad del acercamiento, líneas conservadas, resolución, estabilidad de escena, restauración y cancelación. Las pruebas de componente sustituyen WebGL y el guardado nativo; no equivalen a una validación visual de los instaladores en los tres sistemas.
