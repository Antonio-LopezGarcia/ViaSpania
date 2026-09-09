/** Match whole notifications before generic UI substitutions can alter their data. */
export function translateStatusMessage(value:string,translate:(text:string)=>string):string|undefined{
 const paths:readonly (readonly [string,string])[]=[
  ['Nuevo proyecto creado en ','New project created at '],['Proyecto guardado en ','Project saved at '],
  ['Captura guardada en ','Screenshot saved to '],['PDF de la vista guardado en ','View PDF saved to '],
  ['Informe PDF horizontal guardado en ','Landscape PDF report saved to '],['Imagen del visor 3D guardada en ','3D viewer image saved to '],
 ];
 for(const [source,target] of paths)if(value.startsWith(source))return target+value.slice(source.length);
 let match=value.match(/^(\d+) resultado\(s\) exportado\(s\) en (.+)$/s);
 if(match)return `${match[1]} result(s) exported to ${match[2]}`;
 match=value.match(/^Aplicando paleta (.+)…$/);
 if(match)return `Applying ${translate(match[1])} palette…`;
 match=value.match(/^Paleta (.+) aplicada al MDT$/);
 if(match)return `${translate(match[1])} palette applied to the DTM`;
 match=value.match(/^Calculando (\d+) rutas subóptimas (inicio→final|final→inicio|ida|vuelta)…$/);
 const direction=(text:string)=>text==='inicio→final'?'start→end':text==='final→inicio'?'end→start':text==='ida'?'outbound':'return';
 if(match)return `Calculating ${match[1]} sub-optimal routes · ${direction(match[2])}…`;
 match=value.match(/^(\d+) ruta\(s\) subóptima\(s\) (inicio→final|final→inicio|ida|vuelta); los costes se han evaluado sobre la superficie original\.$/);
 if(match)return `${match[1]} sub-optimal route(s) · ${direction(match[2])}; costs have been evaluated on the original surface.`;
 match=value.match(/^Ruta calculada sobre el MDT real: (.+) m · conectividad (\d+)\.$/);
 if(match)return `Route calculated on the actual DTM: ${match[1]} m · ${match[2]}-neighbour connectivity.`;
 match=value.match(/^Comparando (.+)… (\d+)\/(\d+)$/);
 if(match)return `Comparing ${translate(match[1])}… ${match[2]}/${match[3]}`;
 match=value.match(/^(\d+) modelos comparados sobre el mismo MDT\.$/);
 if(match)return `${match[1]} models compared on the same DTM.`;
 match=value.match(/^Matriz multipunto: (\d+)\/(\d+)$/);
 if(match)return `Multipoint matrix: ${match[1]}/${match[2]}`;
 match=value.match(/^Multirruta: calculando (\d+) itinerarios completos…$/);
 if(match)return `Multi-route: calculating ${match[1]} complete itineraries…`;
 match=value.match(/^(Matriz|Multirruta|Comparación) interrumpida: (.+)$/s);
 if(match)return `${{Matriz:'Matrix',Multirruta:'Multi-route',Comparación:'Comparison'}[match[1]]} interrupted: ${translate(match[2])}`;
 match=value.match(/^Punto (\d+) seleccionado$/);
 if(match)return `Point ${match[1]} selected`;
 match=value.match(/^Punto (inicio|final) colocado$/);
 if(match)return `${match[1]==='inicio'?'Start':'End'} point placed`;
 match=value.match(/^(Punto|Barrera|Corredor|Puente o paso|Punto de interés) (seleccionado\.|eliminado\.|movido\.|preparado\. Pulse en su nueva posición\.)$/);
 if(match){const labels:Record<string,string>={Punto:'Point',Barrera:'Barrier',Corredor:'Corridor','Puente o paso':'Bridge or crossing','Punto de interés':'Point of interest'};const actions:Record<string,string>={'seleccionado.':'selected.','eliminado.':'deleted.','movido.':'moved.','preparado. Pulse en su nueva posición.':'ready. Click its new position.'};return `${labels[match[1]]} ${actions[match[2]]}`}
 match=value.match(/^Procesando (MDT|MDS) importado y generando COG interno…$/);
 if(match)return `Processing imported ${match[1]==='MDT'?'DTM':'DSM'} and generating internal COG…`;
 match=value.match(/^(MDT|MDS) importado, validado y convertido a (EPSG:\d+): (.+)$/);
 if(match)return `${match[1]==='MDT'?'DTM':'DSM'} imported, validated and converted to ${match[2]}: ${match[3]}`;
 return undefined;
}
