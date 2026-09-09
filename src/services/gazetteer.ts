import {invoke, isTauri} from '@tauri-apps/api/core';
import {fromLonLat} from 'ol/proj';
export interface GazetteerResult {source:string;sourceId:string;displayName:string;longitude:number;latitude:number;featureType:string;country:string;admin1:string;admin2:string}
export interface GazetteerContext {viewport?:number[];work?:number[]}
export interface GazetteerProvider {search(query:string,context:GazetteerContext):Promise<GazetteerResult[]>}
export interface ProjectCoordinate {crs:string;coordinate:[number,number]}
// Public service account, shared by web and native transports. Not a secret.
const GEONAMES_USERNAME='viaspania';
const normalize=(s:string)=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
const inside=(p:GazetteerResult,e?:number[])=>e?.length===4&&p.latitude>=e[1]&&p.latitude<=e[3]&&(e[0]<=e[2]?p.longitude>=e[0]&&p.longitude<=e[2]:p.longitude>=e[0]||p.longitude<=e[2]);
export function parseGeonames(data:unknown,query:string,context:GazetteerContext):GazetteerResult[]{
 if(!data||typeof data!=='object')throw new Error('GeoNames devolvió una respuesta inválida.');
 const payload=data as {status?:{value?:number};geonames?:unknown[]};
 if(payload.status){const code=payload.status.value;throw new Error(code===10?'La cuenta de GeoNames de ViaSpania no está disponible. Inténtelo más tarde o contacte con el soporte de ViaSpania.':[18,19,20].includes(code??0)?'Se ha alcanzado el límite de consultas de GeoNames. Inténtelo más tarde.':'GeoNames no pudo completar la búsqueda. Inténtelo más tarde.')}
 if(!Array.isArray(payload.geonames))throw new Error('GeoNames devolvió una respuesta inválida.');
 const seen=new Set<string>();
 return payload.geonames.flatMap((raw,index)=>{
  if(!raw||typeof raw!=='object')return [];const r=raw as Record<string,unknown>;
  const latitude=Number(r.lat),longitude=Number(r.lng),id=Number(r.geonameId);
  if(!Number.isInteger(id)||id<=0||r.lat==null||r.lng==null||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180||typeof r.name!=='string'||!r.name||seen.has(String(id)))return [];
  seen.add(String(id));const str=(key:string)=>typeof r[key]==='string'?r[key] as string:'';
  const place:GazetteerResult={source:'geonames',sourceId:String(id),displayName:r.name,latitude,longitude,country:str('countryName'),admin1:str('adminName1'),admin2:str('adminName2'),featureType:({P:'población',A:'región',T:'relieve',H:'agua',S:'lugar de interés'} as Record<string,string>)[str('fcl')]??'lugar'};
  const score=(normalize(place.displayName)===normalize(query)?1000:0)+(inside(place,context.viewport)?300:inside(place,context.work)?150:0);
  return [{place,score,index}];
 }).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,10).map(r=>r.place);
}
export async function searchGeonames(query:string,context:GazetteerContext):Promise<GazetteerResult[]>{
 if(query.trim().length<3)return [];
 const username=GEONAMES_USERNAME;
 let data:unknown;
 if(isTauri())data=await invoke('geonames_search',{query:query.trim(),username});
 else {const url=new URL('https://secure.geonames.org/searchJSON');url.search=new URLSearchParams({q:query.trim(),username,maxRows:'40',lang:'es',style:'FULL',isNameRequired:'true'}).toString();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetch(url,{signal:controller.signal,credentials:'omit'});if(response.status===429)throw new Error('Se ha alcanzado el límite de consultas de GeoNames. Inténtelo más tarde.');if(!response.ok)throw new Error(`GeoNames no está disponible (HTTP ${response.status}).`);data=await response.json()}catch(error){if(error instanceof SyntaxError)throw new Error('GeoNames devolvió una respuesta inválida.');if(error instanceof TypeError||(error instanceof Error&&error.name==='AbortError'))throw new Error('No se pudo conectar con GeoNames. Compruebe Internet e inténtelo de nuevo.');throw error}finally{clearTimeout(timeout)}}
 return parseGeonames(data,query,context);
}
export const gazetteer:GazetteerProvider={search:searchGeonames};
export async function projectCoordinate(result:Pick<GazetteerResult,'longitude'|'latitude'>,rasterPath?:string):Promise<ProjectCoordinate>{
 const projected:ProjectCoordinate=rasterPath?await invoke('project_coordinate',{coordinate:[result.longitude,result.latitude],rasterPath}):{crs:'EPSG:3857',coordinate:fromLonLat([result.longitude,result.latitude]) as [number,number]};
 if(!projected.crs||!Array.isArray(projected.coordinate)||projected.coordinate.length!==2||!projected.coordinate.every(Number.isFinite))throw new Error('La transformación devolvió coordenadas inválidas.');
 return projected;
}
