import {resultProvenance} from './resultProvenance';
import { MODELS } from './costModels';
import type { GeoPoint, ModelId, RouteResult } from '../types';

export const MOVECOST_CODES:Record<ModelId,string>={
  'tobler':'t','tobler-off':'tofp','marquez-perez':'mp','kondo-seino':'ks',rees:'r',gkrs:'gkrs',tripcevich:'trp',alberti:'alb',pandolf:'p','pandolf-corrected':'pcf',minetti:'m',herzog:'hrz',ardigo:'a',wheeled:'wcs',eastman:'e'
};

export interface PointWithElevation extends GeoPoint { elevationM:number|null }
export interface RouteLine { result:RouteResult; from?:GeoPoint; to?:GeoPoint; rank?:number; costIncreasePercent?:number; sharedCellsPercent?:number }

const csvCell=(value:string|number)=>{const text=String(value);return /[",\n;]/.test(text)?`"${text.replaceAll('"','""')}"`:text};

export function exportPointsCsv(points:PointWithElevation[]){
  const rows=points.map(point=>[point.id,point.name,point.comments,point.role,point.lon.toFixed(8),point.lat.toFixed(8),point.elevationM==null?'':point.elevationM.toFixed(2),point.crs,point.provenance?JSON.stringify(point.provenance):''].map(csvCell).join(','));
  return ['id,nombre,comentarios,rol,longitud,latitud,elevacion_m,crs,provenance',...rows].join('\n')+'\n';
}

export function exportPointsGeoJson(points:PointWithElevation[]){
  return JSON.stringify({type:'FeatureCollection',name:'Puntos ViaSpania',crs:{type:'name',properties:{name:'urn:ogc:def:crs:OGC:1.3:CRS84'}},features:points.map(point=>({type:'Feature',id:point.id,properties:{name:point.name,nombre:point.name,comments:point.comments,role:point.role,rol:point.role,elevation_m:point.elevationM,crs:point.crs,provenance:point.provenance??null},geometry:{type:'Point',coordinates:[point.lon,point.lat]}}))},null,2);
}

export function exportRoutesGeoJson(lines:RouteLine[]){
  return JSON.stringify({type:'FeatureCollection',name:'Rutas ViaSpania',crs:{type:'name',properties:{name:'urn:ogc:def:crs:OGC:1.3:CRS84'}},features:lines.flatMap(({result,from,to,rank,costIncreasePercent,sharedCellsPercent},index)=>result.coordinates&&result.coordinates.length>1?[{type:'Feature',id:index+1,properties:{data_provenance:resultProvenance(result),required_waypoints:result.requiredWaypoints??[],model_id:result.model,model_name:MODELS[result.model].name,movecost_code:MOVECOST_CODES[result.model],direction:result.direction,from_id:from?.id??null,from_name:from?.name??null,to_id:to?.id??null,to_name:to?.name??null,rank:rank??null,cost_increase_percent:costIncreasePercent??null,shared_cells_percent:sharedCellsPercent??null,cost:result.cost,cost_unit:result.unit,distance_m:result.distanceM,ascent_m:result.ascentM,descent_m:result.descentM,connectivity:result.settings?.connectivity??null,critical_slope_percent:result.settings?.criticalSlopePercent??null},geometry:{type:'LineString',coordinates:result.coordinates}}]:[])},null,2);
}

export function safeExportBaseName(value:string){return value.trim().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'viaspania'}
export function routeExportName(base:string,model:ModelId){return `${safeExportBaseName(base)}_${MOVECOST_CODES[model]}.geojson`}
