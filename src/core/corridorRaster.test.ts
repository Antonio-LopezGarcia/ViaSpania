import {describe,it,expect} from 'vitest';
import {corridorRasterPixels,corridorRasterUvs} from './corridorRaster';

describe('raster del corredor',()=>{
 it('conserva el gradiente 2D y hace transparentes NoData y celdas ausentes',()=>{
  expect(Array.from(corridorRasterPixels(4,2,[0,.05,.1,-1,NaN,Infinity,.2],10))).toEqual([
   25,225,70,255,140,168,70,255,255,110,70,255,0,0,0,0,
   0,0,0,0,0,0,0,0,255,110,70,255,0,0,0,0,
  ]);
 });
 it('usa el umbral del resultado y admite un umbral cero',()=>{
  expect(Array.from(corridorRasterPixels(1,1,[.05],5))).toEqual([255,110,70,255]);
  expect(Array.from(corridorRasterPixels(1,1,[0],0))).toEqual([25,225,70,255]);
 });
 it('orienta norte arriba y alinea una malla recortada sin estirar el raster',()=>{
  expect(Array.from(corridorRasterUvs(2,2,[-4,36,-2,38],[-4,36,-2,38]))).toEqual([0,0,1,0,0,1,1,1]);
  expect(Array.from(corridorRasterUvs(2,2,[-3.5,36.5,-2.5,37.5],[-4,36,-2,38]))).toEqual([.25,.25,.75,.25,.25,.75,.75,.75]);
 });
});
