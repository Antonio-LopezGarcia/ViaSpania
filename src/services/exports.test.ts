// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {setLanguage} from '../core/i18n';
import {openProjectFile,savePdfExport,saveTextExport,startVideoExport} from './exports';
import {open,save} from '@tauri-apps/plugin-dialog';
import {invoke} from '@tauri-apps/api/core';
vi.mock('@tauri-apps/plugin-dialog',()=>({open:vi.fn().mockResolvedValue(null),save:vi.fn().mockResolvedValue(null)}));
vi.mock('@tauri-apps/api/core',()=>({invoke:vi.fn().mockResolvedValue('test-session')}));
afterEach(()=>{setLanguage('es');vi.clearAllMocks()});
it('utiliza inglés en los filtros de los diálogos nativos',async()=>{
 setLanguage('en');await openProjectFile();expect(open).toHaveBeenCalledWith(expect.objectContaining({filters:[{name:'ViaSpania project',extensions:['json']}]}));
 await savePdfExport(new Uint8Array(),'report.pdf');expect(save).toHaveBeenLastCalledWith(expect.objectContaining({filters:[{name:'PDF report',extensions:['pdf']}]}));
 await saveTextExport('',{defaultName:'project.json',label:'Proyecto ViaSpania',extensions:['json']});expect(save).toHaveBeenLastCalledWith(expect.objectContaining({filters:[{name:'ViaSpania project',extensions:['json']}]}));
 vi.mocked(save).mockResolvedValueOnce('/destino/video.avi');
 const video=await startVideoExport();await video!.finish(new Uint8Array(),new Uint8Array(),'video.avi');expect(save).toHaveBeenLastCalledWith(expect.objectContaining({filters:[{name:'AVI video (MJPEG)',extensions:['avi']}]}));
 await startVideoExport('mp4','video.avi');expect(save).toHaveBeenLastCalledWith({defaultPath:'video.mp4',filters:[{name:'MP4 video (H.264)',extensions:['mp4']}]});
});

it('elige el destino AVI antes de renderizar y no vuelve a abrir el diálogo al terminar',async()=>{
 vi.mocked(save).mockResolvedValueOnce('/destino/vídeo.avi');
 const session=await startVideoExport();
 expect(save).toHaveBeenCalledWith(expect.objectContaining({defaultPath:'video.avi'}));
 await session!.append(new Uint8Array([1,2,3]));
 await session!.finish(new Uint8Array([4]),new Uint8Array([5]),'video.avi');
 expect(save).toHaveBeenCalledOnce();
 expect(invoke).toHaveBeenLastCalledWith('video_export_finish',{id:'test-session',path:'/destino/vídeo.avi',header:[4],index:[5]});
});

it.each(['mp4','MP4'])('elige %s antes de renderizar y convierte al terminar sin otro diálogo',async extension=>{
 vi.mocked(save).mockResolvedValueOnce(`/destino/vídeo.${extension}`);
 const session=await startVideoExport('mp4','Proyecto_v_001.avi');
 expect(save).toHaveBeenCalledWith({defaultPath:'Proyecto_v_001.mp4',filters:[{name:'Vídeo MP4 (H.264)',extensions:['mp4']}]});
 expect(vi.mocked(save).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(invoke).mock.invocationCallOrder[0]);
 await session!.append(new Uint8Array([1,2,3]));
 await session!.finish(new Uint8Array([4]),new Uint8Array([5]),'ignored.avi');
 expect(save).toHaveBeenCalledOnce();
 expect(invoke).toHaveBeenLastCalledWith('video_export_finish',{id:'test-session',path:`/destino/vídeo.${extension}`,header:[4],index:[5]});
});

it('cancelar el diálogo no convierte y un fallo conserva el mensaje con la ruta del AVI',async()=>{
 const session=await startVideoExport();
 expect(session).toBeNull();
 expect(invoke).not.toHaveBeenCalledWith('video_export_finish',expect.anything());
 vi.mocked(save).mockResolvedValueOnce('/destino/video.mp4');
 const mp4=await startVideoExport('mp4');
 vi.mocked(invoke).mockRejectedValueOnce('No se pudo guardar el MP4. El AVI se conserva en /tmp/original.avi.');
 await expect(mp4!.finish(new Uint8Array(),new Uint8Array(),'video.avi')).rejects.toContain('/tmp/original.avi');
});

it('cancelar el destino MP4 no crea un AVI temporal',async()=>{
 expect(await startVideoExport('mp4')).toBeNull();
 expect(invoke).not.toHaveBeenCalled();
});

it('no cambia a AVI si se escribe una extensión incompatible al elegir MP4',async()=>{
 vi.mocked(save).mockResolvedValueOnce('/destino/video.avi');
 await expect(startVideoExport('mp4')).rejects.toThrow('Seleccione un archivo MP4.');
 expect(invoke).not.toHaveBeenCalled();
});

it('acompaña GeoTIFF y GeoPackage con atribuciones y no oculta fallos al guardarlas',async()=>{
 const {invoke}=await import('@tauri-apps/api/core');const {saveResultBundle}=await import('./exports');
 vi.mocked(open).mockResolvedValueOnce('/resultados');
 await saveResultBundle([{fileName:'terreno.tif',rasterPath:'/original.tif'},{fileName:'puntos.gpkg',geoPackageLayers:[{name:'puntos',geoJson:'{}'}]}],['© Fuente original']);
 for(const name of ['terreno.tif','puntos.gpkg'])expect(invoke).toHaveBeenCalledWith('save_export_file',expect.objectContaining({path:`/resultados/${name}.attribution.txt`,text:expect.stringContaining('© Fuente original')}));
 vi.mocked(open).mockResolvedValueOnce('/resultados');vi.mocked(invoke).mockRejectedValueOnce(new Error('Disco lleno'));
 await expect(saveResultBundle([{fileName:'datos.txt',text:'datos'}],['© Fuente'])).rejects.toThrow('Disco lleno');
});

it('no sustituye la procedencia de un resultado antiguo por la de otro resultado',async()=>{
 const {invoke}=await import('@tauri-apps/api/core');const {saveResultBundle}=await import('./exports');
 vi.mocked(open).mockResolvedValueOnce('/resultados');
 await saveResultBundle([{fileName:'antiguo.geojson',text:'{}',attributions:['REQUIERE REVISIÓN: fuente histórica desconocida']},{fileName:'nuevo.geojson',text:'{}',attributions:['© Fuente nueva']}]);
 const oldNotice=vi.mocked(invoke).mock.calls.find(([command,args])=>command==='save_export_file'&&(args as {path?:string})?.path==='/resultados/antiguo.geojson.attribution.txt')?.[1] as {text:string};
 expect(oldNotice.text).toContain('REQUIERE REVISIÓN');expect(oldNotice.text).not.toContain('Fuente nueva');
});
