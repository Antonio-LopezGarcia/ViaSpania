// @vitest-environment jsdom
import {act,cleanup,renderHook,waitFor} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {generateTerrainMesh,type RasterResult,type TerrainMesh} from '../services/native';
import {shadePreview,useHillshadePreview} from './useHillshadePreview';
vi.mock('../services/native',()=>({generateTerrainMesh:vi.fn()}));
const raster:RasterResult={path:'mdt.tif',bytes:1,metadata:{},previewDataUrl:'base'};
const mesh:TerrainMesh={width:2,height:2,widthM:10,heightM:10,minElevationM:0,maxElevationM:0,elevations:[0,0,0,0],wgs84Extent:[0,0,1,1]};
const notice=vi.fn();
let pixels:Uint8ClampedArray;
beforeEach(()=>{
 vi.clearAllMocks();pixels=new Uint8ClampedArray([200,150,100,0]);
 vi.stubGlobal('Image',class{src='';naturalWidth=1;naturalHeight=1;decode(){return Promise.resolve()}});
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:vi.fn(),getImageData:()=>({data:pixels}),putImageData:vi.fn()} as unknown as CanvasRenderingContext2D);
 vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('sombreado');
 vi.mocked(generateTerrainMesh).mockResolvedValue(mesh);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
it('mezcla la paleta sin modificar el canal alfa',async()=>{
 await shadePreview('base',mesh,1);expect(pixels[0]).toBeLessThan(200);expect(pixels[1]).toBeLessThan(150);expect(pixels[3]).toBe(0);
});
it('reutiliza la malla al cambiar intensidad y vuelve inmediatamente a la imagen original al desactivar',async()=>{
 const {result,rerender}=renderHook(({intensity})=>useHillshadePreview(raster,'base',intensity,notice),{initialProps:{intensity:.65}});
 await waitFor(()=>expect(result.current).toBe('sombreado'));
 rerender({intensity:.5});await waitFor(()=>expect(result.current).toBe('sombreado'));
 expect(generateTerrainMesh).toHaveBeenCalledTimes(1);
 rerender({intensity:0});expect(result.current).toBe('base');
});
it('descarta mallas antiguas tras cambiar de raster',async()=>{
 let resolve!:(mesh:TerrainMesh)=>void;
 vi.mocked(generateTerrainMesh).mockReturnValueOnce(new Promise(ok=>{resolve=ok}));
 const {result,rerender}=renderHook(({source,image})=>useHillshadePreview(source,image,.65,notice),{initialProps:{source:raster,image:'base'}});
 rerender({source:{...raster,path:'nuevo.tif'},image:'nueva'});
 await waitFor(()=>expect(result.current).toBe('sombreado'));
 await act(async()=>{resolve(mesh)});
 expect(result.current).toBe('sombreado');expect(generateTerrainMesh).toHaveBeenCalledTimes(2);
});
it('muestra errores en español y mantiene la imagen disponible',async()=>{
 vi.mocked(generateTerrainMesh).mockRejectedValue(new Error('gdal failed'));
 const {result}=renderHook(()=>useHillshadePreview(raster,'base',.65,notice));
 await waitFor(()=>expect(notice).toHaveBeenCalledWith('No se pudo calcular el relieve sombreado del MDT.'));
 expect(result.current).toBe('base');
});
