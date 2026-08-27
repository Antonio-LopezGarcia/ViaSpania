import type {ExternalMapProtocol,ExternalWmsLayer,ExternalWmtsLayer} from '../core/externalMapLayers';

type ExternalServiceConfig=Omit<ExternalWmsLayer,'id'|'name'|'viewer'|'attribution'>|Omit<ExternalWmtsLayer,'id'|'name'|'viewer'|'attribution'>;
export interface ExternalServiceLayer {id:string;title:string;description?:string;config:ExternalServiceConfig}
const children=(node:Element,name:string)=>Array.from(node.children).filter(child=>child.localName===name);
const child=(node:Element,name:string)=>children(node,name)[0];
const textOf=(node:Element|undefined)=>node?.textContent?.trim()??'';
const serviceUrl=(raw:string,protocol:ExternalMapProtocol)=>{const url=new URL(raw);url.searchParams.set('SERVICE',protocol.toUpperCase());url.searchParams.set('REQUEST','GetCapabilities');return url.toString()};
const cleanEndpoint=(raw:string)=>{const endpoint=new URL(raw);for(const key of [...endpoint.searchParams.keys()])if(['service','request','version'].includes(key.toLowerCase()))endpoint.searchParams.delete(key);return endpoint.toString()};
const linkedEndpoint=(root:Element,operation:string,fallback:string)=>{const operationNode=Array.from(root.getElementsByTagNameNS('*','Operation')).find(item=>item.getAttribute('name')===operation)??Array.from(root.getElementsByTagNameNS('*',operation))[0],get=operationNode&&Array.from(operationNode.getElementsByTagNameNS('*','Get'))[0];return get?.getAttributeNS('http://www.w3.org/1999/xlink','href')||get?.getAttribute('xlink:href')||get?.getAttribute('onlineResource')||cleanEndpoint(fallback)};

export function parseWmsCapabilities(xml:string,url:string):ExternalServiceLayer[]{
  const document=new DOMParser().parseFromString(xml,'application/xml');if(document.querySelector('parsererror'))throw new Error('El servicio WMS devolvió un XML no válido.');
  const root=document.documentElement,version=root.getAttribute('version')==='1.1.1'?'1.1.1':'1.3.0',capability=Array.from(root.children).find(item=>item.localName==='Capability'),top=capability&&child(capability,'Layer'),mapUrl=linkedEndpoint(root,'GetMap',url);if(!top)throw new Error('No se encontraron capas en el servicio WMS.');
  const output:ExternalServiceLayer[]=[];
  const visit=(layer:Element,inheritedCrs:string[]=[])=>{const ownCrs=children(layer,'CRS').concat(children(layer,'SRS')).map(textOf),crs=[...new Set([...inheritedCrs,...ownCrs])],id=textOf(child(layer,'Name')),title=textOf(child(layer,'Title'))||id;if(id){const projection=crs.includes('EPSG:3857')?'EPSG:3857':crs.includes('EPSG:4326')?'EPSG:4326':crs[0];output.push({id,title,description:textOf(child(layer,'Abstract'))||undefined,config:{protocol:'wms',url:mapUrl,layerName:id,version,format:'image/png',transparent:true,projection}})}children(layer,'Layer').forEach(item=>visit(item,crs))};visit(top);return output;
}

export function parseWmtsCapabilities(xml:string,url:string):ExternalServiceLayer[]{
  const document=new DOMParser().parseFromString(xml,'application/xml');if(document.querySelector('parsererror'))throw new Error('El servicio WMTS devolvió un XML no válido.');
  const contents=Array.from(document.getElementsByTagNameNS('*','Contents'))[0],tileUrl=linkedEndpoint(document.documentElement,'GetTile',url);if(!contents)throw new Error('No se encontraron capas en el servicio WMTS.');
  const matrixSets=new Map<string,{projection:string;matrixIds:string[];resolutions:number[];origin:[number,number]}>();
  children(contents,'TileMatrixSet').forEach(set=>{const id=textOf(child(set,'Identifier')),crs=textOf(child(set,'SupportedCRS')),projection=/3857|900913/i.test(crs)?'EPSG:3857':/4326|CRS84/i.test(crs)?'EPSG:4326':crs,metresPerUnit=projection==='EPSG:4326'?111319.49079327358:1,matrices=children(set,'TileMatrix'),matrixIds=matrices.map(matrix=>textOf(child(matrix,'Identifier'))),resolutions=matrices.map(matrix=>Number(textOf(child(matrix,'ScaleDenominator')))*.00028/metresPerUnit),corner=textOf(child(matrices[0],'TopLeftCorner')).split(/\s+/).map(Number);if(id&&matrixIds.length&&corner.length===2)matrixSets.set(id,{projection,matrixIds,resolutions,origin:[corner[0],corner[1]]})});
  const output:ExternalServiceLayer[]=[];children(contents,'Layer').forEach(layer=>{const id=textOf(child(layer,'Identifier')),title=textOf(child(layer,'Title'))||id,style=children(layer,'Style').find(item=>item.getAttribute('isDefault')==='true')??children(layer,'Style')[0],format=textOf(children(layer,'Format')[0])||'image/png';children(layer,'TileMatrixSetLink').forEach(link=>{const matrixSet=textOf(child(link,'TileMatrixSet')),grid=matrixSets.get(matrixSet);if(id&&grid)output.push({id:`${id}|${matrixSet}`,title:matrixSets.size>1?`${title} · ${matrixSet}`:title,description:textOf(child(layer,'Abstract'))||undefined,config:{protocol:'wmts',url:tileUrl,layerName:id,matrixSet,style:textOf(style&&child(style,'Identifier'))||'default',format,projection:grid.projection,matrixIds:grid.matrixIds,resolutions:grid.resolutions,origin:grid.origin}})})});return output;
}

export async function inspectExternalMapService(protocol:'wms'|'wmts',url:string){const response=await fetch(serviceUrl(url,protocol),{headers:{Accept:'application/xml,text/xml'}});if(!response.ok)throw new Error(`El servicio respondió HTTP ${response.status}.`);const xml=await response.text();return protocol==='wms'?parseWmsCapabilities(xml,url):parseWmtsCapabilities(xml,url)}
