import {describe,expect,it} from 'vitest';
import {terrainTextureLayerPlan,terrainTextureOptions,terrainTextureSize} from './terrainTexture';
import {DEFAULT_APP_SETTINGS} from '../core/appSettings';
import type {ExternalMapLayer} from '../core/externalMapLayers';

const layer=(id:string,opacity:number):ExternalMapLayer=>({id,name:id,url:`https://tiles.example/${id}/{z}/{x}/{y}.png`,viewer:'historical',protocol:'xyz',opacity});

describe('composición cartográfica del visor 3D',()=>{
 it('mantiene la base debajo y el orden configurado de las capas externas',()=>{
  const plan=terrainTextureLayerPlan('topographic',[layer('histórica',.4),layer('ortofoto',.8)]);
  expect(plan.map(item=>item.id)).toEqual(['built-in:topographic','histórica','ortofoto']);
  expect(plan.map(item=>item.opacity)).toEqual([1,.4,.8]);
 });
 it('permite usar únicamente capas externas',()=>expect(terrainTextureLayerPlan('none',[layer('raster',.55)]).map(item=>item.id)).toEqual(['raster']));
 it('ofrece OpenTopoMap y nuevas capas importadas compatibles con el visor',()=>{
  const installed={...layer('instalada',1),protocol:'wms' as const,url:'https://tiles.example/wms',layerName:'base',version:'1.3.0' as const,format:'image/png',transparent:true};
  expect(terrainTextureOptions(DEFAULT_APP_SETTINGS.enabledMapSources,[installed])).toContainEqual({id:'opentopomap',name:'OpenTopoMap'});
  expect(terrainTextureOptions(DEFAULT_APP_SETTINGS.enabledMapSources,[installed])).toContainEqual({id:'external:instalada',name:'instalada · externa'});
  expect(terrainTextureLayerPlan('none',[installed])[0].external).toBe(installed);
 });
});

describe('resolución de la textura 3D',()=>{
 it('dimensiona un extent Web Mercator en metros sin volver a proyectarlo',()=>{
  expect(terrainTextureSize([-400000,4800000,-390000,4810000])).toEqual({width:4096,height:4096});
 });
 it('genera detalle 4K manteniendo la proporción del terreno',()=>{
  expect(terrainTextureSize([0,0,2000,1000])).toEqual({width:4096,height:2048});
  expect(terrainTextureSize([0,0,1000,2000])).toEqual({width:2048,height:4096});
  expect(terrainTextureSize([0,0,1000,1000])).toEqual({width:4096,height:4096});
 });
 it('no ensancha las áreas estrechas',()=>expect(terrainTextureSize([0,0,10000,100])).toEqual({width:4096,height:41}));
 it('rechaza extensiones vacías o inválidas',()=>{
  for(const extent of [[0,0,0,1],[0,0,1,NaN],[2,0,1,1]])expect(()=>terrainTextureSize(extent)).toThrow('extensión');
 });
});
