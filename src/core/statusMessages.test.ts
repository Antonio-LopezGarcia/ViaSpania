import {afterEach,expect,it} from 'vitest';
import {setLanguage,translateText} from './i18n';
afterEach(()=>setLanguage('es'));
const cases=[
 ['Aplicando paleta Escala de grises…','Applying Greyscale palette…'],
 ['Paleta Viridis aplicada al MDT','Viridis palette applied to the DTM'],
 ['Calculando 3 rutas subóptimas inicio→final…','Calculating 3 sub-optimal routes · start→end…'],
 ['Calculando 3 rutas subóptimas final→inicio…','Calculating 3 sub-optimal routes · end→start…'],
 ['3 ruta(s) subóptima(s) final→inicio; los costes se han evaluado sobre la superficie original.','3 sub-optimal route(s) · end→start; costs have been evaluated on the original surface.'],
 ['Ruta calculada sobre el MDT real: 1,234 m · conectividad 16.','Route calculated on the actual DTM: 1,234 m · 16-neighbour connectivity.'],
 ['Comparando Tobler… 2/3','Comparing Tobler… 2/3'],
 ['3 modelos comparados sobre el mismo MDT.','3 models compared on the same DTM.'],
 ['Matriz multipunto: 2/4','Multipoint matrix: 2/4'],
 ['Matriz interrumpida: No se pudo abrir el proyecto','Matrix interrupted: The project could not be opened'],
 ['Multirruta: calculando 3 itinerarios completos…','Multi-route: calculating 3 complete itineraries…'],
 ['Multirruta: calculando los tramos secuenciales…','Multi-route: calculating sequential legs…'],
 ['Punto 2 seleccionado','Point 2 selected'],['Punto inicio colocado','Start point placed'],['Punto final colocado','End point placed'],
 ['Puente o paso eliminado.','Bridge or crossing deleted.'],['Punto de interés movido.','Point of interest moved.'],
 ['Barrera preparado. Pulse en su nueva posición.','Barrier ready. Click its new position.'],
 ['Procesando MDS importado y generando COG interno…','Processing imported DSM and generating internal COG…'],
 ['MDT importado, validado y convertido a EPSG:25830: 12 MB','DTM imported, validated and converted to EPSG:25830: 12 MB'],
 ['Pasillo LCP calculado: 1,234 celdas · umbral 10 % · superficie reutilizada','LCP corridor calculated: 1,234 cells · threshold 10 % · reused surface'],
 ['3 isócronas calculadas · 1,234 celdas accesibles · superficie preparada.','3 calculated isochrones · 1,234 reachable cells · prepared surface.'],
 ['1,234 segmentos de curvas calculados sobre el MDT.','1,234 contour segments calculated from the DTM.'],
 ['Visibilidad calculada por separado para 2 observador(es).','Viewshed calculated separately for 2 observer(s).'],
 ['Captura cancelada.','Screenshot cancelled.'],
 ['Primero pulse «Seleccionar área» y marque dos esquinas en el mapa.','First click “Select area” and mark two corners on the map.'],
] as const;
it.each(cases)('traduce íntegramente %s',(source,expected)=>{setLanguage('en');expect(translateText(source)).toBe(expected);setLanguage('es');expect(translateText(source)).toBe(source)});
it.each([
 ['Nuevo proyecto creado en ','New project created at '],['Proyecto guardado en ','Project saved at '],
 ['Captura guardada en ','Screenshot saved to '],['PDF de la vista guardado en ','View PDF saved to '],
 ['Informe PDF horizontal guardado en ','Landscape PDF report saved to '],['2 resultado(s) exportado(s) en ','2 result(s) exported to '],
])('conserva literalmente el archivo en %s',(source,target)=>{setLanguage('en');const path='/Users/Inicio/Resultados/Área · Ruta: Final.pdf';expect(translateText(source+path)).toBe(target+path)});
