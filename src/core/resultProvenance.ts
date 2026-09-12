// ViaSpania
// Copyright © 2026 Antonio López García, Universidad de Granada
// Este programa se distribuye bajo la licencia GPL-3.0-only.
export interface DataProvenance {
 readonly version:1;
 readonly status:'recorded'|'requires-review';
 readonly attribution:string;
 readonly rasterPath?:string;
 readonly recordedAt?:string;
 readonly legacySource?:string;
}
export interface Provenanced {dataProvenance?:DataProvenance;source?:string}
export const UNKNOWN_DATA_ATTRIBUTION='REQUIERE REVISIÓN: procedencia de este resultado no registrada. La fuente seleccionada actualmente no acredita su origen. Recalcule con una fuente documentada antes de redistribuirlo.';
export function resultProvenance(value:Provenanced):DataProvenance {
 const p=value.dataProvenance;
 if(p?.version===1&&(p.status==='recorded'||p.status==='requires-review')&&typeof p.attribution==='string'&&p.attribution.trim())return {...p};
 return {version:1,status:'requires-review',attribution:UNKNOWN_DATA_ATTRIBUTION,...(typeof value.source==='string'?{legacySource:value.source}:{})};
}
export function resultCredit(value:Provenanced){const p=resultProvenance(value);return p.attribution+(p.legacySource?`\nReferencia histórica (sin validar): ${p.legacySource}`:'')}
/** Migrate only known result fields; never infer origins from project preferences. */
export function migrateProjectProvenance(project:Record<string,unknown>):Record<string,unknown>{
 const result=(value:unknown):unknown=>value&&typeof value==='object'&&!Array.isArray(value)?{...value,dataProvenance:resultProvenance(value as Provenanced)}:value;
 const connection=(value:unknown):unknown=>value&&typeof value==='object'?{...value,result:result((value as {result?:unknown}).result)}:value;
 const list=(value:unknown,convert:(v:unknown)=>unknown)=>Array.isArray(value)?value.map(convert):value;
 const copy={...project};
 for(const key of ['route','outboundRoute','returnRoute','isochrones','lcpCorridor','reportViewshed','reportContours'])if(key in copy)copy[key]=result(copy[key]);
 if('comparison' in copy)copy.comparison=list(copy.comparison,result);
 for(const key of ['outboundRanked','returnRanked','multiConnections','sequentialConnections'])if(key in copy)copy[key]=list(copy[key],connection);
 if('rankedMultiroutes' in copy)copy.rankedMultiroutes=list(copy.rankedMultiroutes,v=>v&&typeof v==='object'?{...v,connections:list((v as {connections?:unknown}).connections,connection)}:v);
 return copy;
}
const rasterSources=new Map<string,DataProvenance>();
export function registerRasterProvenance<T extends {path:string;dataAttribution?:string}>(raster:T):T&{dataProvenance:DataProvenance}{
 const attribution=raster.dataAttribution||UNKNOWN_DATA_ATTRIBUTION;
 const dataProvenance:DataProvenance={version:1,status:attribution.includes('REQUIERE REVISIÓN')?'requires-review':'recorded',attribution,rasterPath:raster.path,recordedAt:new Date().toISOString()};
 rasterSources.set(raster.path,dataProvenance);return {...raster,dataProvenance};
}
/** Snapshot before invoking asynchronous work; later raster changes cannot relabel it. */
export async function withRasterProvenance<T>(path:string,calculate:()=>Promise<T>):Promise<T&{dataProvenance:DataProvenance}>{
 const dataProvenance={...(rasterSources.get(path)??{version:1 as const,status:'requires-review' as const,attribution:UNKNOWN_DATA_ATTRIBUTION,rasterPath:path})};
 return {...await calculate(),dataProvenance};
}

export function mergeResultProvenance(values:readonly Provenanced[]):DataProvenance{
 const sources=values.map(resultProvenance);if(sources.length&&sources.every(p=>JSON.stringify(p)===JSON.stringify(sources[0])))return {...sources[0]};
 return {version:1,status:sources.length&&sources.every(p=>p.status==='recorded')?'recorded':'requires-review',attribution:[...new Set(sources.map(p=>p.attribution))].join('\n')||UNKNOWN_DATA_ATTRIBUTION};
}
