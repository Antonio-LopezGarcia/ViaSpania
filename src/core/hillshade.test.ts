import {describe,it,expect} from 'vitest';
import type {TerrainMesh} from '../services/native';
import {terrainHillshade,hillshadeBrightness,hillshadeFootprint,sampleHillshade} from './hillshade';
const mesh=(elevations:number[],extra:Partial<TerrainMesh>={}):TerrainMesh=>({width:3,height:3,widthM:20,heightM:20,minElevationM:0,maxElevationM:40,elevations,wgs84Extent:[0,0,1,1],...extra});
describe('relieve sombreado común',()=>{
 it('ilumina una superficie plana uniformemente, incluidos los bordes y cotas cero',()=>{
  const result=terrainHillshade(mesh(Array(9).fill(0)));
  result.forEach(value=>expect(value).toBeCloseTo(Math.SQRT1_2));
 });
 it('distingue laderas orientadas hacia el noroeste y hacia el sureste',()=>{
  const facing=terrainHillshade(mesh([0,10,20,10,20,30,20,30,40]));
  const away=terrainHillshade(mesh([40,30,20,30,20,10,20,10,0]));
  facing.forEach(value=>expect(value).toBeCloseTo((1+Math.SQRT1_2)/Math.sqrt(3)));
  away.forEach(value=>expect(value).toBe(0));
 });
 it('usa distancias horizontales en metros y respeta tamaños de celda distintos',()=>{
  const a=terrainHillshade(mesh([0,10,20,20,30,40,40,50,60],{heightM:40}));
  const b=terrainHillshade(mesh([0,10,20,10,20,30,20,30,40]));
  expect([...a]).toEqual([...b]);
 });
 it('excluye NoData y valores no finitos sin crear pendientes en sus vecinos',()=>{
  for(const invalid of [-9999,NaN,Infinity]){
   const result=terrainHillshade(mesh([10,10,10,10,invalid,10,10,10,10],{validCells:[true,true,true,true,false,true,true,true,true]}));
   expect(result[4]).toBe(1);
   result.forEach((value,i)=>{if(i!==4)expect(value).toBeCloseTo(Math.SQRT1_2)});
  }
 });
 it('no altera las elevaciones y tolera mallas degeneradas',()=>{
  const source=mesh(Array(9).fill(25));const original=[...source.elevations];terrainHillshade(source);
  expect(source.elevations).toEqual(original);
  expect([...terrainHillshade({...source,widthM:0})]).toEqual(Array(9).fill(1));
 });
 it('permite desactivar el efecto y conserva luz ambiente incluso en sombra total',()=>{
  expect(hillshadeBrightness(0,0)).toBe(1);
  expect(hillshadeBrightness(0,1)).toBe(.25);
  expect(hillshadeBrightness(1,1)).toBe(1);
  expect(hillshadeBrightness(0,NaN)).toBe(1);
 });
 it('alinea el recorte nativo con el raster completo e interpola sin escalones',()=>{
  const footprint=hillshadeFootprint(mesh(Array(9).fill(0)),{size:[4,4],geoTransform:[0,10,0,0,0,-10]});
  expect(footprint).toEqual([.5,.5]);
  const shade=new Float32Array([0,1,0,1]);
  expect(sampleHillshade(shade,2,2,0,0,footprint)).toBe(1);
  expect(sampleHillshade(shade,2,2,.5,.5,footprint)).toBe(.5);
  expect(sampleHillshade(shade,2,2,.25,.5,footprint)).toBe(0);
 });
});
