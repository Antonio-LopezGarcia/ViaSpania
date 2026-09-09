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
