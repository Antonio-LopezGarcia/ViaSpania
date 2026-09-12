// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {setLanguage} from '../core/i18n';
import {openProjectFile,savePdfExport,saveTextExport,startVideoExport} from './exports';
import {open,save} from '@tauri-apps/plugin-dialog';
vi.mock('@tauri-apps/plugin-dialog',()=>({open:vi.fn().mockResolvedValue(null),save:vi.fn().mockResolvedValue(null)}));
vi.mock('@tauri-apps/api/core',()=>({invoke:vi.fn().mockResolvedValue('test-session')}));
afterEach(()=>{setLanguage('es');vi.clearAllMocks()});
it('utiliza inglés en los filtros de los diálogos nativos',async()=>{
 setLanguage('en');await openProjectFile();expect(open).toHaveBeenCalledWith(expect.objectContaining({filters:[{name:'ViaSpania project',extensions:['json']}]}));
 await savePdfExport(new Uint8Array(),'report.pdf');expect(save).toHaveBeenLastCalledWith(expect.objectContaining({filters:[{name:'PDF report',extensions:['pdf']}]}));
 await saveTextExport('',{defaultName:'project.json',label:'Proyecto ViaSpania',extensions:['json']});expect(save).toHaveBeenLastCalledWith(expect.objectContaining({filters:[{name:'ViaSpania project',extensions:['json']}]}));
 const video=await startVideoExport();await video.finish(new Uint8Array(),new Uint8Array(),'video.avi');expect(save).toHaveBeenLastCalledWith(expect.objectContaining({filters:[{name:'AVI video (MJPEG)',extensions:['avi']}]}));
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
