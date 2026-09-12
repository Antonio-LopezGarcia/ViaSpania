export type ExternalMapViewer='navigation'|'selection'|'historical';
export type ExternalMapProtocol='xyz'|'wms'|'wmts';

interface ExternalMapLayerBase {id:string;name:string;url:string;viewer?:ExternalMapViewer;attribution?:string;opacity?:number}
export interface ExternalXyzLayer extends ExternalMapLayerBase {protocol:'xyz'}
export interface ExternalWmsLayer extends ExternalMapLayerBase {protocol:'wms';layerName:string;version:'1.1.1'|'1.3.0';format:string;transparent:boolean;projection?:string}
export interface ExternalWmtsLayer extends ExternalMapLayerBase {protocol:'wmts';layerName:string;matrixSet:string;style:string;format:string;projection:string;matrixIds:string[];resolutions:number[];origin:[number,number]}
export type ExternalMapLayer=ExternalXyzLayer|ExternalWmsLayer|ExternalWmtsLayer;
export type ExternalMapLayerInput=ExternalMapLayer|(ExternalMapLayerBase&{protocol?:'xyz'});

function normalizedUrl(raw:string){const url=raw.trim();let parsed:URL;try{parsed=new URL(url.replace('{z}','0').replace('{x}','0').replace('{y}','0'))}catch{throw new Error('La URL de la capa externa no es válida.')}if(!['http:','https:'].includes(parsed.protocol))throw new Error('La capa externa debe usar una URL HTTP o HTTPS.');return url}

export function normalizeExternalMapLayer(input:ExternalMapLayerInput):ExternalMapLayer{
  const name=input.name.trim(),url=normalizedUrl(input.url),attribution=input.attribution?.trim()||undefined,opacity=Math.min(1,Math.max(0,Number.isFinite(input.opacity)?input.opacity!:1));
  if(!name)throw new Error('Escriba un nombre para la capa externa.');
  if(input.protocol==='wms'){
    if(!input.layerName.trim())throw new Error('Seleccione una capa del servicio.');
    return{...input,name,url,layerName:input.layerName.trim(),format:input.format||'image/png',attribution,opacity};
  }
  if(input.protocol==='wmts'){
    if(!input.layerName.trim())throw new Error('Seleccione una capa del servicio.');
    if(!input.matrixSet||!input.matrixIds.length||input.matrixIds.length!==input.resolutions.length)throw new Error('La matriz de teselas WMTS no es válida.');
    return{...input,name,url,layerName:input.layerName.trim(),attribution,opacity};
  }
  if(!url.includes('{z}')||!url.includes('{x}')||!url.includes('{y}'))throw new Error('La URL XYZ debe incluir {z}, {x} e {y}.');
  return{...input,protocol:'xyz',name,url,attribution,opacity};
}
