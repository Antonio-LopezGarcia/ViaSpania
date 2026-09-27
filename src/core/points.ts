import type { GeoPoint, PlaceProvenance } from '../types';

// Array position is the sole source of sequence order. Roles are legacy metadata.
export function appendPoint(points: readonly GeoPoint[], coordinate: {lon:number;lat:number;provenance?:PlaceProvenance}, name?:string): GeoPoint[] {
  const id=points.reduce((max,point)=>Math.max(max,point.id),0)+1;
  return [...points,{lon:coordinate.lon,lat:coordinate.lat,provenance:coordinate.provenance,id,name:name??`Punto ${points.length+1}`,comments:'',crs:'EPSG:4326',role:'multipunto'}];
}
export function movePoint(points: readonly GeoPoint[], id:number, offset:number): GeoPoint[] {
  const from=points.findIndex(point=>point.id===id),to=from+offset,result=[...points];
  if(from<0||to<0||to>=points.length)return result;
  const [point]=result.splice(from,1);result.splice(to,0,point);return result;
}
export function projectPoints(points: readonly GeoPoint[], pointOrder:unknown): GeoPoint[] {
  if(pointOrder==='array')return [...points];
  return [...points.filter(point=>point.role==='inicio'),...points.filter(point=>point.role!=='inicio'&&point.role!=='final'),...points.filter(point=>point.role==='final')];
}
export function selectedOrigins(points: readonly GeoPoint[], selection:string): GeoPoint[] {
  return selection==='todos'?[...points]:points.filter(point=>String(point.id)===selection);
}
export function sequentialValidation(points: readonly GeoPoint[], extent:readonly number[]|null, hasElevation:boolean):string|null {
  if(points.length<2)return 'La ruta secuencial necesita al menos dos puntos.';
  if(points.some(point=>!Number.isFinite(point.lon)||!Number.isFinite(point.lat)||Math.abs(point.lon)>180||Math.abs(point.lat)>90))return 'Todos los puntos deben tener coordenadas válidas.';
  if(!extent)return 'Seleccione un área de estudio antes de calcular.';
  if(points.some(point=>point.lon<extent[0]||point.lon>extent[2]||point.lat<extent[1]||point.lat>extent[3]))return 'Todos los puntos deben estar dentro del área de estudio.';
  if(!hasElevation)return 'Cargue un modelo de elevación antes de calcular la ruta secuencial.';
  return null;
}
// Golden-angle hue spacing avoids repeating a short palette as the list grows.
export function pointColor(index:number):string {
  const hue=((Math.max(0,index)*137.508+195)%360)/60,c=.72,x=c*(1-Math.abs(hue%2-1)),m=.16;
  const [r,g,b]=hue<1?[c,x,0]:hue<2?[x,c,0]:hue<3?[0,c,x]:hue<4?[0,x,c]:hue<5?[x,0,c]:[c,0,x];
  return '#'+[r,g,b].map(value=>Math.round((value+m)*255).toString(16).padStart(2,'0')).join('');
}
