// @vitest-environment jsdom
import {beforeEach,expect,it,vi} from 'vitest';
import {invoke} from '@tauri-apps/api/core';
import {save} from '@tauri-apps/plugin-dialog';
import {saveProjectFile} from './exports';
vi.mock('@tauri-apps/plugin-dialog',()=>({open:vi.fn(),save:vi.fn()}));
vi.mock('@tauri-apps/api/core',()=>({invoke:vi.fn()}));
beforeEach(()=>vi.resetAllMocks());
const points=[{id:1,lon:-3,lat:40}];
const serialize=(projectName:string)=>JSON.stringify({projectName,points});
it('guarda el trabajo sin proyecto previo y sobrescribe su archivo en el siguiente guardado',async()=>{
 vi.mocked(save).mockResolvedValueOnce('/trabajo/Mi estudio.json');
 const first=await saveProjectFile(null,'Proyecto',serialize);
 expect(first).toEqual({path:'/trabajo/Mi estudio.json',name:'Mi_estudio',text:serialize('Mi_estudio')});
 expect(invoke).toHaveBeenLastCalledWith('save_export_file',{path:first!.path,text:first!.text,base64:null});
 await saveProjectFile(first!.path,first!.name,serialize);
 expect(save).toHaveBeenCalledTimes(1);
 expect(invoke).toHaveBeenCalledTimes(2);
});
it('conserva el nombre interno de un proyecto abierto al sobrescribir',async()=>{
 const result=await saveProjectFile('/trabajo/archivo.json','Nombre elegido',serialize);
 expect(save).not.toHaveBeenCalled();
 expect(result?.name).toBe('Nombre elegido');
});
it('cancelar no escribe ni serializa el proyecto',async()=>{
 vi.mocked(save).mockResolvedValueOnce(null);
 const snapshot=vi.fn(serialize);
 expect(await saveProjectFile(null,'Proyecto',snapshot)).toBeNull();
 expect(snapshot).not.toHaveBeenCalled();
 expect(invoke).not.toHaveBeenCalled();
});
it('propaga el error de escritura sin devolver un guardado correcto',async()=>{
 vi.mocked(save).mockResolvedValueOnce('/trabajo/Proyecto.json');
 vi.mocked(invoke).mockRejectedValueOnce(new Error('No se pudo escribir el archivo'));
 await expect(saveProjectFile(null,'Proyecto',serialize)).rejects.toThrow('No se pudo escribir el archivo');
});
