import type {AppSettings} from './appSettings';
import {BUILT_IN_MAP_SOURCES,type BuiltInMapSource} from './mapSources';
import type {ExternalMapLayer} from './externalMapLayers';

export interface ReportMapSource {
  id:string;name:string;
  group:'Cartografía'|'Ortofotografías'|'Capas importadas'|'Modelo 3D';
  attribution:string;builtIn?:BuiltInMapSource;external?:ExternalMapLayer;terrain3d?:true;
}

export function reportMapSources(settings:Pick<AppSettings,'enabledMapSources'|'externalMapLayers'>,includeTerrain3d=true):ReportMapSource[]{
  const builtIns=BUILT_IN_MAP_SOURCES.filter(source=>settings.enabledMapSources[source.id]).map(source=>({id:`builtin:${source.id}`,name:source.name,group:source.category==='Ortofotografía'?'Ortofotografías' as const:'Cartografía' as const,attribution:source.attribution,builtIn:source}));
  const external=settings.externalMapLayers.map(layer=>({id:`external:${layer.id}`,name:layer.name,group:'Capas importadas' as const,attribution:layer.attribution||`Fuente externa: ${layer.name}`,external:layer}));
  return[...builtIns,...external,...(includeTerrain3d?[{id:'terrain3d',name:'Modelo 3D',group:'Modelo 3D' as const,attribution:'ViaSpania',terrain3d:true as const}]:[])];
}

export function resolveReportMapSource(sources:readonly ReportMapSource[],id:string){return sources.find(source=>source.id===id)??sources.find(source=>source.id==='builtin:ign-topographic')??sources[0]}
