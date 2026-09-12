import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { transformExtent } from 'ol/proj';
import { COPERNICUS_VHR_2021_LAYER, COPERNICUS_VHR_2021_WMS } from './ogc';
import {createExternalMapSource} from './externalMapLayers';
import type {ExternalMapLayer} from '../core/externalMapLayers';

export type TerrainTextureId='pnoa'|'copernicus-vhr-2021'|'osm'|'topographic'|'mtn50'|'mtn25'|'catastrones'|'minutas'|'american'|'interministerial';
export const TERRAIN_TEXTURES:Record<TerrainTextureId,string>={pnoa:'PNOA · España','copernicus-vhr-2021':'Copernicus VHR 2021 · Europa · 2 m',osm:'OpenStreetMap',topographic:'Topográfico IGN',mtn50:'Primera edición MTN50',mtn25:'Primera edición MTN25',catastrones:'Minutas MTN50',minutas:'Planimetrías 1870–1950',american:'Vuelo americano 1956–1957',interministerial:'Vuelo interministerial 1973–1986'};
export function terrainTextureLayerPlan(id:'none'|TerrainTextureId,externalLayers:readonly ExternalMapLayer[]){return[...(id==='none'?[]:[{id:`built-in:${id}`,opacity:1,external:null}]),...externalLayers.map(layer=>({id:layer.id,opacity:layer.opacity??1,external:layer}))]}

const resolutions=Array.from({length:20},(_,zoom)=>156543.03392804097/2**zoom),matrixIds=resolutions.map((_,zoom)=>String(zoom));
function wmts(url:string,layer:string){return new WMTS({url,layer,matrixSet:'GoogleMapsCompatible',format:'image/jpeg',projection:'EPSG:3857',style:'default',crossOrigin:'anonymous',tileGrid:new WMTSTileGrid({origin:[-20037508.342789244,20037508.342789244],resolutions,matrixIds})})}
function source(id:TerrainTextureId){if(id==='osm')return new OSM({crossOrigin:'anonymous'});if(id==='pnoa')return wmts('https://www.ign.es/wmts/pnoa-ma','OI.OrthoimageCoverage');if(id==='copernicus-vhr-2021')return new TileWMS({url:COPERNICUS_VHR_2021_WMS,params:{LAYERS:COPERNICUS_VHR_2021_LAYER,TILED:true,FORMAT:'image/jpeg',TRANSPARENT:false},projection:'EPSG:4326',crossOrigin:'anonymous'});if(id==='topographic')return wmts('https://www.ign.es/wmts/mapa-raster','MTN');const aerial=id==='american'||id==='interministerial',plan=id==='minutas';return new TileWMS({url:aerial?'https://www.ign.es/wms/pnoa-historico':plan?'https://www.ign.es/wms/minutas-cartograficas':'https://www.ign.es/wms/primera-edicion-mtn',params:{LAYERS:id==='mtn50'?'MTN50':id==='mtn25'?'MTN25':id==='catastrones'?'catastrones':id==='minutas'?'Minutas':id==='american'?'AMS_1956-1957':'Interministerial_1973-1986',TILED:true,FORMAT:aerial?'image/jpeg':'image/png',TRANSPARENT:false},projection:'EPSG:3857',crossOrigin:'anonymous'})}

function capture(target:HTMLElement){const output=document.createElement('canvas'),context=output.getContext('2d');if(!context)throw new Error('No se pudo crear la textura cartográfica');output.width=target.clientWidth;output.height=target.clientHeight;context.fillStyle='#d8ddd9';context.fillRect(0,0,output.width,output.height);for(const canvas of target.querySelectorAll('canvas')){if(!canvas.width)continue;const opacity=Number(canvas.parentElement?.style.opacity||canvas.style.opacity||'1'),transform=canvas.style.transform,match=transform.match(/^matrix\(([^)]+)\)$/);context.save();context.globalAlpha=Number.isFinite(opacity)?opacity:1;if(match){const matrix=match[1].split(',').map(Number);context.setTransform(matrix[0],matrix[1],matrix[2],matrix[3],matrix[4],matrix[5])}context.drawImage(canvas,0,0);context.restore()}return output.toDataURL('image/png')}

export async function createTerrainTexture(id:'none'|TerrainTextureId,wgs84Extent:[number,number,number,number],externalLayers:readonly ExternalMapLayer[]=[]){
  const projected=transformExtent(wgs84Extent,'EPSG:4326','EPSG:3857'),ratio=(projected[2]-projected[0])/Math.max(1,projected[3]-projected[1]),width=ratio>=1?1600:Math.max(200,Math.round(1600*ratio)),height=ratio>=1?Math.max(200,Math.round(1600/ratio)):1600;
  const target=document.createElement('div');target.style.cssText=`position:fixed;left:-12000px;top:0;width:${width}px;height:${height}px`;document.body.appendChild(target);
  const plan=terrainTextureLayerPlan(id,externalLayers),layers:TileLayer[]=plan.map(item=>new TileLayer({source:item.external?createExternalMapSource(item.external):source(id as TerrainTextureId),opacity:item.opacity}));if(!layers.length)throw new Error('Seleccione al menos una capa cartográfica para preparar la textura 3D.');
  const map=new Map({target,layers,view:new View({center:[0,0],zoom:2}),controls:[]});
  map.getView().fit(projected,{size:[width,height],padding:[0,0,0,0]});
  try{return await new Promise<string>((resolve,reject)=>{const timeout=window.setTimeout(()=>reject(new Error('El mapa tardó demasiado en preparar la textura 3D')),20000);map.once('rendercomplete',()=>{window.clearTimeout(timeout);try{resolve(capture(target))}catch(error){reject(error)}});map.renderSync()})}finally{map.setTarget(undefined);target.remove()}
}
