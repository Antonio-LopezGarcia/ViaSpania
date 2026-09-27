import {expect,it,vi} from 'vitest';
import {invoke as nativeInvoke} from '@tauri-apps/api/core';
import {invoke} from './processInvoke';
import {programProcesses} from '../core/processStatus';
vi.mock('@tauri-apps/api/core',()=>({invoke:vi.fn()}));
it.each(['download_mdt_tiles','process_raster','save_export_file','raster_color_preview'])('sigue %s hasta su finalización real',async command=>{
 let resolve!:(value:string)=>void;
 vi.mocked(nativeInvoke).mockImplementationOnce(()=>new Promise<string>(done=>{resolve=done}) as never);
 const request=invoke(command,{path:'modelo.tif'});
 expect(programProcesses.getSnapshot()).toBe('running');resolve('listo');
 await expect(request).resolves.toBe('listo');expect(programProcesses.getSnapshot()).toBe('success');
});
it('mantiene el error de guardado frente a sondeos del cursor',async()=>{
 vi.mocked(nativeInvoke).mockRejectedValueOnce(new Error('No se pudo guardar'));
 await expect(invoke('save_export_file')).rejects.toThrow('No se pudo guardar');
 expect(programProcesses.getSnapshot()).toBe('error');
 vi.mocked(nativeInvoke).mockResolvedValueOnce({elevationM:100});await invoke('sample_raster_elevation');
 expect(programProcesses.getSnapshot()).toBe('error');
});
