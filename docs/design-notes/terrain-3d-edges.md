# Bordes artificiales del MDT05 y MDS05 en 3D

## Diagnóstico (2026-09-16)

Las descargas WCS examinadas no declaran NoData. Al reproyectar su cuadrícula
geográfica a UTM, quedan celdas del rectángulo de salida fuera de la cobertura.
Sin `-dstnodata`, esas celdas quedaban a cero y sin máscara de invalidez. La malla
las interpretaba como elevaciones reales, formando paredes hacia la cota 0 m.
El recorte existente de una celda no basta: la franja depende de la reproyección.

En las dos muestras locales de 435 × 219 celdas, la reproyección anterior creaba
2.574 ceros que no existían en las descargas originales. Sus rangos originales
eran 737–761 m (MDT05) y 737–774 m (MDS05).

## Corrección

`process_raster` utiliza siempre `-dstnodata -9999 -ot Float32`, también cuando
no hay máscara vectorial. GDAL conserva el NoData de entrada al remuestrear y
marca el exterior como NoData de salida. Float32 permite representar el valor
negativo incluso con fuentes sin signo y conserva las alturas interpoladas.
No se establece `-srcnodata 0`: la cota cero puede ser terreno válido.

Referencia: [GDAL, gdalwarp: -dstnodata y -ot](https://gdal.org/en/stable/programs/gdalwarp.html).

El visor ya transmite `validCells` y excluye los triángulos con vértices sin datos.
La corrección se aplica al raster, antes del remuestreo de la malla, para impedir
que los ceros artificiales contaminen también las alturas vecinas.

## Verificación y archivos anteriores

La prueba Rust genera fuentes locales deterministas, ejecuta la reproyección y
la generación real de malla a 450 y 100 vértices de lado máximo. Incluye terreno
elevado, cota cero válida, fuentes sin signo y un hueco NoData interior. La prueba
TypeScript comprueba que ningún triángulo usa el perímetro inválido.

La comprobación manual con las dos descargas originales conservó los rangos de
elevación y eliminó todos los ceros artificiales a ambas resoluciones de malla.
No requiere acceder a servicios de red para las pruebas rutinarias.

Los rasters procesados con versiones anteriores deben regenerarse desde la
descarga original, o descargarse de nuevo usando la versión corregida. No se
modifican automáticamente: sus metadatos no permiten distinguir con seguridad
un cero de relleno de una elevación real a nivel del mar.
