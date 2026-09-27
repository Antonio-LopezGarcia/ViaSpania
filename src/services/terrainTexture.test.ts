import {describe,expect,it} from 'vitest';
import {terrainTextureLayerPlan,terrainTextureSize} from './terrainTexture';
import type {ExternalMapLayer} from '../core/externalMapLayers';

const layer=(id:string,opacity:number):ExternalMapLayer=>({id,name:id,url:`https://tiles.example/${id}/{z}/{x}/{y}.png`,viewer:'historical',protocol:'xyz',opacity});

describe('composición cartográfica del visor 3D',()=>{
 it('mantiene la base debajo y el orden configurado de las capas externas',()=>{
  const plan=terrainTextureLayerPlan('topographic',[layer('histórica',.4),layer('ortofoto',.8)]);
  expect(plan.map(item=>item.id)).toEqual(['built-in:topographic','histórica','ortofoto']);
  expect(plan.map(item=>item.opacity)).toEqual([1,.4,.8]);
 });
 it('permite usar únicamente capas externas',()=>expect(terrainTextureLayerPlan('none',[layer('raster',.55)]).map(item=>item.id)).toEqual(['raster']));
});

describe('resolución de la textura 3D',()=>{
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
