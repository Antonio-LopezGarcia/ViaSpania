import {MOVECOST_CODES,safeExportBaseName} from './geospatialExports';
import type {Barrier,ContourResult,EnabledCrossing,GeoPoint,IsochroneResult,ModelId,PointOfInterest,PreferredCorridor} from '../types';

export type ResultExportGroup='Datos del proyecto'|'Rutas simples'|'Rutas comparativas'|'Multipunto'|'Multirruta'|'Pasillos'|'Isócronas'|'Visibilidad'|'Curvas de nivel';
export interface ResultExportItem{id:string;group:ResultExportGroup;label:string;fileName:string;format:'GeoJSON'|'PNG'|'GeoPackage'|'GeoTIFF'}
export interface GeoPackageLayer {name:string;geoJson:string}

export function resultToken(value:string){return safeExportBaseName(value).replaceAll('-','_').toLowerCase()}
export function routeResultName(prefix:'sim'|'comp'|'multip',from:string,to:string,model:ModelId){return`${prefix}_${resultToken(from)}_${resultToken(to)}_${MOVECOST_CODES[model]}.geojson`}
export function multirouteResultName(point:string,model:ModelId){return`multir_${resultToken(point)}_${MOVECOST_CODES[model]}.geojson`}
export function corridorResultName(origin:string,model:ModelId){return`pas_${resultToken(origin)}_${MOVECOST_CODES[model]}.png`}
export function isochroneResultStem(origin:string,model:ModelId){return`iso_${resultToken(origin)}_${MOVECOST_CODES[model]}`}
export function viewshedResultName(project:string,observer:string,heightM:number){return`vis_${resultToken(project)}_${resultToken(observer)}_${Math.round(heightM*100)}.png`}
export function contourResultName(project:string){return`curvas_${resultToken(project)}.geojson`}
export function projectElementsGeoPackageName(project:string){return`elementos_${resultToken(project)}.gpkg`}
export function elevationRasterResultName(project:string,source:string){return`elevacion_${resultToken(project)}_${resultToken(source)}.tif`}

const collection=(name:string,features:unknown[])=>JSON.stringify({type:'FeatureCollection',name,crs:{type:'name',properties:{name:'urn:ogc:def:crs:OGC:1.3:CRS84'}},features});
export function projectElementsGeoPackageLayers(points:readonly GeoPoint[],barriers:readonly Barrier[],corridors:readonly PreferredCorridor[],crossings:readonly EnabledCrossing[],pointsOfInterest:readonly PointOfInterest[]):GeoPackageLayer[]{
 const layers:GeoPackageLayer[]=[];
 if(points.length)layers.push({name:'puntos',geoJson:collection('Puntos',points.map(point=>({type:'Feature',id:point.id,properties:{nombre:point.name,comentarios:point.comments,rol:point.role},geometry:{type:'Point',coordinates:[point.lon,point.lat]}})))});
 if(barriers.length)layers.push({name:'barreras',geoJson:collection('Barreras',barriers.map((barrier,index)=>({type:'Feature',id:index+1,properties:{nombre:barrier.name?.trim()||`Barrera ${index+1}`,tipo:barrier.kind,valor:barrier.value},geometry:{type:'LineString',coordinates:barrier.coordinates}})))});
 if(corridors.length)layers.push({name:'corredores',geoJson:collection('Corredores',corridors.map(item=>({type:'Feature',id:item.id,properties:{nombre:item.name,anchura_m:item.widthM,multiplicador_coste:item.costMultiplier},geometry:{type:'LineString',coordinates:item.coordinates}})))});
 if(crossings.length)layers.push({name:'puentes',geoJson:collection('Puentes y pasos',crossings.map(item=>({type:'Feature',id:item.id,properties:{nombre:item.name,tipo:item.kind,multiplicador_coste:item.crossingCostMultiplier,barrera_id:item.barrierId??null},geometry:{type:'LineString',coordinates:item.coordinates}})))});
 if(pointsOfInterest.length)layers.push({name:'puntos_interes',geoJson:collection('Puntos de interés',pointsOfInterest.map(item=>({type:'Feature',id:item.id,properties:{nombre:item.name,categoria:item.category,radio_influencia_m:item.influenceRadiusM,atraccion:item.attraction,modo:item.mode},geometry:{type:'Point',coordinates:item.coordinate}})))});
 return layers
}

export function isochronesGeoJson(result:IsochroneResult,origins:readonly GeoPoint[]){const levels=[...new Set(result.lines.map(line=>line.level))];return JSON.stringify({type:'FeatureCollection',name:'Isócronas ViaSpania',crs:{type:'name',properties:{name:'urn:ogc:def:crs:OGC:1.3:CRS84'}},features:levels.map(level=>({type:'Feature',properties:{level,unit:result.unit,model:result.model,origins:origins.map(point=>point.name)},geometry:{type:'MultiLineString',coordinates:result.lines.filter(line=>line.level===level).map(line=>line.coordinates)}}))},null,2)}
export function contoursResultGeoJson(result:ContourResult){return JSON.stringify({type:'FeatureCollection',name:'Curvas de nivel ViaSpania',crs:{type:'name',properties:{name:'urn:ogc:def:crs:OGC:1.3:CRS84'}},features:result.lines.map((line,index)=>({type:'Feature',id:index+1,properties:{elevation_m:line.level,interval_m:result.intervalM},geometry:{type:'LineString',coordinates:line.coordinates}}))},null,2)}
