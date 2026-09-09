import {describe,expect,it} from 'vitest';
import {terrainTextureLayerPlan} from './terrainTexture';
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
