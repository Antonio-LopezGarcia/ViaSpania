import type { BuiltInMapSourceId } from './appSettings';

export interface BuiltInMapSource {id:BuiltInMapSourceId;name:string;category:'Navegación'|'Ortofotografía'|'Cartografía';provider:string;attribution:string;url:string}

export const BUILT_IN_MAP_SOURCES:BuiltInMapSource[]=[
  {id:'osm',name:'OpenStreetMap',category:'Navegación',provider:'OpenStreetMap',attribution:'© OpenStreetMap contributors · ODbL 1.0',url:'https://www.openstreetmap.org/copyright'},
  {id:'ign-topographic',name:'Topográfico IGN',category:'Navegación',provider:'IGN/CNIG',attribution:'© Instituto Geográfico Nacional de España · CC BY 4.0',url:'https://www.ign.es/wmts/mapa-raster'},
  {id:'pnoa',name:'PNOA · España',category:'Ortofotografía',provider:'IGN/CNIG',attribution:'© Instituto Geográfico Nacional de España · PNOA · CC BY 4.0',url:'https://www.ign.es/wmts/pnoa-ma'},
  {id:'copernicus-vhr-2021',name:'Copernicus VHR 2021 · Europa · 2 m',category:'Ortofotografía',provider:'Copernicus/EEA',attribution:"European Union's Copernicus Land Monitoring Service information · VHR 2021",url:'https://land.copernicus.eu/en/products/european-image-mosaic'},
  {id:'MTN50',name:'Primera edición MTN50',category:'Cartografía',provider:'IGN/CNIG',attribution:'© Instituto Geográfico Nacional de España · CC BY 4.0',url:'https://www.ign.es/wms/primera-edicion-mtn'},
  {id:'MTN25',name:'Primera edición MTN25',category:'Cartografía',provider:'IGN/CNIG',attribution:'© Instituto Geográfico Nacional de España · CC BY 4.0',url:'https://www.ign.es/wms/primera-edicion-mtn'},
  {id:'catastrones',name:'Minutas MTN50',category:'Cartografía',provider:'IGN/CNIG',attribution:'© Instituto Geográfico Nacional de España · CC BY 4.0',url:'https://www.ign.es/wms/primera-edicion-mtn'},
  {id:'Minutas',name:'Planimetrías 1870–1950',category:'Cartografía',provider:'IGN/CNIG',attribution:'© Instituto Geográfico Nacional de España · CC BY 4.0',url:'https://www.ign.es/wms/minutas-cartograficas'},
  {id:'AMS_1956-1957',name:'Vuelo americano 1956–1957',category:'Ortofotografía',provider:'IGN/CNIG',attribution:'© Instituto Geográfico Nacional de España · PNOA histórico · CC BY 4.0',url:'https://www.ign.es/wms/pnoa-historico'},
  {id:'Interministerial_1973-1986',name:'Vuelo interministerial 1973–1986',category:'Ortofotografía',provider:'IGN/CNIG',attribution:'© Instituto Geográfico Nacional de España · PNOA histórico · CC BY 4.0',url:'https://www.ign.es/wms/pnoa-historico'},
];

export function builtInMapAttribution(id:BuiltInMapSourceId){return BUILT_IN_MAP_SOURCES.find(source=>source.id===id)?.attribution??''}
