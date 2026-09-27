// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rasterColorPreview } from '../services/native';
import { useRasterPalette } from './useRasterPalette';

vi.mock('../services/native',()=>({rasterColorPreview:vi.fn()}));
const raster={path:'modelo.tif',previewDataUrl:'grises'};
const onNotice=vi.fn();
const initialPalette=()=>'grayscale';
function deferred(){
  let resolve!:(image:string)=>void;
  let reject!:(error:Error)=>void;
  const promise=new Promise<string>((ok,fail)=>{resolve=ok;reject=fail});
  return{promise,resolve,reject};
}
beforeEach(()=>{vi.resetAllMocks()});
afterEach(cleanup);

describe('paleta compartida de los visores',()=>{
  it('recolorea el MDT y devuelve la misma selección para el visor 3D',async()=>{
    vi.mocked(rasterColorPreview).mockResolvedValue('imagen-viridis');
    const {result}=renderHook(()=>useRasterPalette(raster,initialPalette,onNotice));
    expect(result.current.previewImage).toBe('grises');
    act(()=>result.current.setPalette('viridis'));
    expect(result.current.palette).toBe('viridis');
    await waitFor(()=>expect(result.current.previewImage).toBe('imagen-viridis'));
    expect(rasterColorPreview).toHaveBeenCalledWith('modelo.tif','viridis');
    act(()=>result.current.setPalette('grayscale'));
    expect(result.current.previewImage).toBe('grises');
    expect(rasterColorPreview).toHaveBeenCalledTimes(1);
  });

  it.each(['success','error'])('ignora una respuesta antigua (%s) tras cambiar rápidamente de paleta',async(outcome)=>{
    const first=deferred(),second=deferred();
    vi.mocked(rasterColorPreview).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const {result}=renderHook(()=>useRasterPalette(raster,initialPalette,onNotice));
    act(()=>result.current.setPalette('terrain'));
    act(()=>result.current.setPalette('alpine'));
    await act(async()=>{second.resolve('alta-montaña')});
    await act(async()=>{if(outcome==='success')first.resolve('terreno');else first.reject(new Error('Error antiguo'))});
    expect(result.current.palette).toBe('alpine');
    expect(result.current.previewImage).toBe('alta-montaña');
    expect(onNotice).toHaveBeenLastCalledWith('Paleta Alta montaña aplicada al MDT');
  });

  it('descarta una respuesta pendiente al volver a grises',async()=>{
    const request=deferred();
    vi.mocked(rasterColorPreview).mockReturnValue(request.promise);
    const {result}=renderHook(()=>useRasterPalette(raster,initialPalette,onNotice));
    act(()=>result.current.setPalette('terrain'));
    act(()=>result.current.setPalette('grayscale'));
    await act(async()=>{request.resolve('terreno')});
    expect(result.current.palette).toBe('grayscale');
    expect(result.current.previewImage).toBe('grises');
  });

  it('restaura grises para ambos visores si falla la paleta vigente',async()=>{
    vi.mocked(rasterColorPreview).mockRejectedValue(new Error('No se pudo colorear el MDT.'));
    const {result}=renderHook(()=>useRasterPalette(raster,initialPalette,onNotice));
    act(()=>result.current.setPalette('viridis'));
    await waitFor(()=>expect(result.current.palette).toBe('grayscale'));
    expect(result.current.previewImage).toBe('grises');
    expect(onNotice).toHaveBeenLastCalledWith('No se pudo colorear el MDT.');
  });

  it('conserva la selección al cargar otro raster y descarta la imagen del anterior',async()=>{
    const first=deferred(),second=deferred();
    vi.mocked(rasterColorPreview).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const {result,rerender}=renderHook(({source})=>useRasterPalette(source,()=>'terrain',onNotice),{initialProps:{source:raster}});
    rerender({source:{path:'nuevo.tif',previewDataUrl:'nuevo-grises'}});
    await act(async()=>{first.resolve('imagen-antigua')});
    expect(result.current.previewImage).toBe('nuevo-grises');
    await act(async()=>{second.resolve('imagen-nueva')});
    expect(result.current.palette).toBe('terrain');
    expect(result.current.previewImage).toBe('imagen-nueva');
    expect(rasterColorPreview).toHaveBeenLastCalledWith('nuevo.tif','terrain');
  });

  it('aplica la paleta de un proyecto cuando se carga su raster',async()=>{
    vi.mocked(rasterColorPreview).mockResolvedValue('imagen-hipsométrica');
    const initialProps:{source:typeof raster|null}={source:null};
    const {result,rerender}=renderHook(({source})=>useRasterPalette(source,initialPalette,onNotice),{initialProps});
    act(()=>result.current.setPalette('hypsometric'));
    expect(rasterColorPreview).not.toHaveBeenCalled();
    rerender({source:raster});
    await waitFor(()=>expect(result.current.previewImage).toBe('imagen-hipsométrica'));
    expect(result.current.palette).toBe('hypsometric');
  });
});
