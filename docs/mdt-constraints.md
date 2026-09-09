# Barreras y facilitadores sobre el modelo digital

El visor del modelo digital muestra por defecto las barreras absolutas y permeables, los corredores, los puentes y pasos y los puntos de interés. La capa recibe los datos del proyecto y refleja su creación, edición y eliminación desde Selección.

Al ampliar el visor aparecen «Mostrar barreras y facilitadores» y «Mostrar etiquetas». Son controles independientes: ocultar elementos no altera sus geometrías ni su participación en los cálculos. Las etiquetas muestran los nombres de los puntos del proyecto y de los facilitadores, además de la numeración de las barreras. Aunque se oculten las barreras y los facilitadores, las etiquetas de los puntos permanecen disponibles. La simbología se comparte con Selección: barreras negras o grises discontinuas con contorno blanco, corredores amarillos discontinuos, pasos cian y POI violetas.

Las geometrías persistidas en WGS84 se transforman con OpenLayers al EPSG:3857 del visor, igual que la imagen del modelo. La capa se conserva al actualizar la imagen o extensión del modelo dentro del visor; no depende del CRS nativo del ráster. Estos controles son preferencias de visualización de la sesión del visor.
