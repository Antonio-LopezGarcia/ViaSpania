# Facilitadores de coste

ViaSpania representa los corredores como líneas WGS84 con anchura en metros y un multiplicador `m`, donde `0 < m <= 1`. En una transición de coste base `C` (segundos, julios, J/kg o coste relativo, según el modelo), el coste es `C' = C × m`; por tanto siempre permanece positivo y Dijkstra conserva sus garantías.

Los pasos habilitados son líneas cortas que deben atravesar localmente una barrera. Solo las celdas cubiertas por esa geometría se reabren y reciben su multiplicador positivo. La geometría lineal evita que un punto ambiguo abra una zona completa.

Los puntos de interés con influencia espacial aplican un descuento lineal que vale `1 − atracción` en el centro y converge a `1` en el radio indicado. Los puntos configurados como paso obligatorio dividen la ruta en tramos consecutivos que se unen conservando coste, distancia, ascenso y descenso. Las recompensas de visita única requerirán ampliar el estado de búsqueda; se muestran desactivadas hasta contar con una implementación exacta.
