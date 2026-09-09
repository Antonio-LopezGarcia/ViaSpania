import type {ExternalMapLayer} from './externalMapLayers';
import {BUILT_IN_MAP_SOURCES} from './mapSources';

// Keep the comparison viewer's order and identifiers in every calculation viewer.
export const calculationBackgrounds=[
 {id:'pnoa',source:'pnoa'}, {id:'copernicus-vhr-2021',source:'copernicus-vhr-2021'},
 {id:'osm',source:'osm'}, {id:'topographic',source:'ign-topographic'},
 {id:'mtn50',source:'MTN50'}, {id:'mtn25',source:'MTN25'},
 {id:'catastrones',source:'catastrones'}, {id:'minutas',source:'Minutas'},
 {id:'american',source:'AMS_1956-1957'}, {id:'interministerial',source:'Interministerial_1973-1986'},
] as const;
export function calculationBackgroundOptions(externalLayers:readonly ExternalMapLayer[],includeTerrain=false){
 return [
  ...calculationBackgrounds.map(item=>({id:item.id as string,name:BUILT_IN_MAP_SOURCES.find(source=>source.id===item.source)!.name})),
  ...(includeTerrain?[{id:'mdt',name:'Modelo Digital del Terreno'}]:[]),
  ...externalLayers.map(layer=>({id:`external:${layer.id}`,name:layer.name})),
 ];
}
export function calculationMapProps(background:string,externalLayers:readonly ExternalMapLayer[]){
 const externalLayer=externalLayers.find(layer=>`external:${layer.id}`===background);
 if(externalLayer)return {kind:'osm' as const,externalLayer};
 const source=calculationBackgrounds.find(item=>item.id===background)?.source??'pnoa';
 if(source==='osm'||source==='ign-topographic')return {kind:'osm' as const,navigationLayer:source};
 if(source==='pnoa'||source==='copernicus-vhr-2021')return {kind:'pnoa' as const,orthophotoLayer:source};
 return {kind:'historical' as const,historicalLayer:source};
}
