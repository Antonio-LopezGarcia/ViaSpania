# Análisis sobre modelos grandes

Verificado el 19 de septiembre de 2026.

## Límite común

Rutas, isócronas, pasillos LCP, visibilidad y curvas de nivel admiten hasta
**67.928.064 celdas (8192 × 8292)**, cualquiera que sea el modelo descargado
o importado. El antiguo límite de cinco millones era interno al motor.
La preferencia guardada en Configuración → Procesado puede imponer un máximo
inferior; no se cambia automáticamente. También se comprueba con superficies
ya almacenadas en caché. Los comandos topográficos aceptan `maxCells`, con
valor predeterminado para mantener compatibilidad con clientes anteriores.

Se conserva la comprobación de RAM por encima de cinco millones de celdas:
96 bytes por celda más 512 MiB, sin superar la mitad de la RAM total ni el
75 % de la disponible. Es un presupuesto conservador de admisión, no el RSS
esperado. Todos estos análisis comparten un mutex y trabajan fuera del hilo
de interfaz para evitar reservas simultáneas de varios cálculos.

## Procesamiento

- Isócronas y pasillos reutilizan la cola con disminución de clave: una entrada
  por celda como máximo, distancias `f64` y reservas fallibles. Se mantienen
  los costes, conexiones y recorrido inverso dirigido del pasillo.
- Visibilidad recorre todas las celdas nativas ordenadas por distancia mediante
  una mezcla de recorridos monótonos. La cola es proporcional al lado menor,
  sin ordenar una lista del tamaño del ráster. Conserva la aproximación angular
  de horizonte de 7200 sectores; no es un nuevo algoritmo de rayos exactos.
  Solo la vista previa se reduce a 500 celdas por lado. Los recuentos usan
  todas las celdas nativas. Se admiten hasta 50 observadores secuenciales.
- Curvas de nivel obtiene mínimos y máximos sin copiar las cotas y recorre
  cada cuadrado nativo una vez, calculando solamente los niveles que lo cruzan.
  Conserva interpolación, borde excluido y georreferenciación. Las coordenadas
  se transforman en bloques de 10.000 segmentos.
- Isócronas y curvas tienen un límite independiente de 250.000 segmentos de
  salida para acotar geometrías. Si se supera, se informa del error; no se
  trunca el resultado ni se reduce la resolución del ráster. Un intervalo
  mayor puede reducir esa complejidad.

## Verificación

Prueba nativa de capacidad `all_analyses_on_full_8192_by_8292_grid`, ejecutada
en release con GDAL/PROJ sobre un ráster sintético completo de 67.928.064
celdas a 5 m:

| Análisis | Resultado | Tiempo |
| --- | --- | --- |
| Isócronas | Todas las celdas accesibles, 24.135 segmentos | 22,35 s |
| Pasillo LCP | 29.519.058 celdas; coste óptimo comprobado | 41,64 s |
| Visibilidad | Todas las celdas planas visibles | 4,08 s |
| Curvas de nivel | Rampa con 65.512 segmentos | 1,64 s |

Pico RSS del proceso: **1.992.753.152 bytes (1,86 GiB)**, sin swaps,
69,95 s totales. Son medidas de este ensayo, no garantías para terrenos,
intervalos o máquinas diferentes.

Las pruebas pequeñas comparan costes con el algoritmo anterior en relieve
asimétrico, comprueban un obstáculo entre muestras de la vista previa,
verifican la ordenación radial con píxeles no cuadrados y comprueban límites
inferiores incluso con caché. El cliente verifica que los cuatro comandos
reciben la misma preferencia tanto al máximo como con un valor inferior.
