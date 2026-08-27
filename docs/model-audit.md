# Auditoría de modelos de coste

Fecha de auditoría: 20 de agosto de 2026. Referencia funcional: registro `mc_cost_functions` de `movecost` 3.0.0 y las publicaciones citadas en él. ViaSpania implementa las ecuaciones independientemente y calcula cada arista con pendiente firmada `x = desnivel (m) / distancia horizontal (m)`.

## Resultado de la revisión

| Modelo | Resultado | Unidad acumulada | Direccional |
|---|---|---:|---:|
| Tobler | Corregido el factor de terreno | s | sí |
| Tobler fuera de senda | Corregido a velocidad Tobler × 0,6 | s | sí |
| Márquez–Pérez | Incorporado | s | sí |
| Kondo–Seino | Incorporado con rama `x < −0,07` | s | sí |
| Rees | Incorporado | s | no |
| Garmy–Kaddouri–Rozenblat–Schneider | Incorporado | s | no |
| Tripcevich | Incorporado | s | no |
| Alberti pastoral | Incorporado | s | sí |
| Pandolf | Corregidos término de velocidad y pendiente absoluta | J | no |
| Pandolf con corrección de descenso | Incorporado; corrección solo si `x < 0` | J | sí |
| Minetti | Incorporado | J/kg | no |
| Herzog | Incorporado | J/kg | no |
| Ardigò | Incorporado con velocidad fija de 1,2 m/s | J/kg | no |
| Vehículo | Corregido: la pendiente crítica controla una penalización cuadrática, no convierte automáticamente la celda en barrera | coste relativo | no |
| Eastman | Corregido para usar pendiente angular y los coeficientes publicados | coste relativo | no |

## Parámetros y limitaciones

Pandolf usa por ahora 70 kg de masa corporal, carga 0 kg, velocidad 1,2 m/s y factor de terreno 1. Ardigò permite elegir caminar (1,2 m/s), correr (3,0 m/s) o bicicleta (5,5 m/s). Minetti se recomienda solo para `−0,5 ≤ x ≤ 0,5`; para pendientes exteriores se ofrece Herzog. Las barreras blandas se aplican después de la ecuación como multiplicadores exactos del coste, por lo que no se confunden con el parámetro biofísico de terreno de Pandolf.

La conectividad de 4 vecinos permite movimientos ortogonales; 8 añade diagonales; 16 añade movimientos de tipo `(2,1)` y reduce el sesgo de la cuadrícula a costa de más memoria y tiempo. Los costes siguen siendo direccionales cuando la ecuación utiliza el signo de `x`.

## Referencias

- Tobler, W. (1993). *Three Presentations on Geographical Analysis and Modeling*. NCGIA 93-1.
- Márquez-Pérez, J. et al. (2017). *Estimated travel time for walking trails in natural areas*. DOI 10.1080/00167223.2017.1316212.
- Rees, W. G. (2004). *Least-cost paths in mountainous terrain*. Computers & Geosciences 30(3), 203–209.
- Kondo, Y. & Seino, Y. (2010). *GPS-aided Walking Experiments and Data-driven Travel Cost Modeling*.
- Tripcevich, N. (2008). *Estimating Llama caravan travel speeds*.
- Alberti, G. (2019). *Locating potential pastoral foraging routes in Malta*. SoftwareX 10, 100331.
- Pandolf, K. B. et al. (1977). DOI 10.1152/jappl.1977.43.4.577; Yokota et al. (2004), USARIEM T04-09.
- Minetti, A. E. et al. (2002). Journal of Applied Physiology 93, 1039–1046.
- Ardigò, L. P. et al. (2003). European Journal of Applied Physiology 90, 365–371.
- Herzog, I. (2016, 2020), formulaciones de vehículo, aproximación a Minetti y revisión de funciones.
