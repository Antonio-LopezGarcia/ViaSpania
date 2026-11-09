# ViaSpania 1.0.1

## Español

Versión de mantenimiento.

### Novedades y correcciones

- **Preferencias iniciales:** los visores usan por defecto la paleta de terreno y muestran el marcador de selección. En instalaciones nuevas también quedan habilitados MDS05 y Copernicus DEM GLO-30.
- **Puntos de interés en itinerarios:** al calcular itinerarios con varias paradas, cada punto de interés se incorpora al tramo asociado a la parada más cercana. Para la última parada se utiliza el tramo de llegada.
- **Actualización de los visores:** las rutas, isócronas y la ubicación se actualizan sin reconstruir el mapa. Los cambios de opacidad de la superficie se aplican sobre la capa existente, reduciendo trabajo durante las actualizaciones.
- **Capa Copernicus VHR 2021:** se corrige el nombre técnico enviado a WMS (`0`); `VHR_2021_LAEA` es el título publicado de la capa.
- **Documentación:** el README incorpora enlaces a los manuales de uso en español e inglés y refleja la versión 1.0.1.

---

## English

Maintenance release.

### Features and fixes

- **Initial preferences:** map viewers use the terrain palette by default and show the selection marker. New installations also enable MDS05 and Copernicus DEM GLO-30.
- **Points of interest on itineraries:** when calculating an itinerary with multiple stops, each point of interest is included in the leg associated with its nearest stop. The final stop is assigned to the incoming leg.
- **Viewer updates:** routes, isochrones and location update without rebuilding the map. Surface opacity changes apply to the existing layer, reducing work during updates.
- **Copernicus VHR 2021 layer:** corrects the technical name sent to WMS (`0`); `VHR_2021_LAEA` is the published layer title.
- **Documentation:** the README now links to the Spanish and English user manuals and shows version 1.0.1.
