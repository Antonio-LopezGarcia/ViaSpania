import {expect,it,vi} from 'vitest';
import {invoke as nativeInvoke} from '@tauri-apps/api/core';
import {invoke} from './processInvoke';
import {runCalculation,cancelCalculation,calculationSnapshot} from './calculationTasks';
import {programProcesses} from '../core/processStatus';
vi.mock('@tauri-apps/api/core',()=>({invoke:vi.fn(async()=>{})}));
it('descarta un resultado tardío y no inicia más tramos después de cancelar',async()=>{
 let finish!:(value:string)=>void;
 vi.mocked(nativeInvoke).mockImplementation(async command=>command==='calculate_raster_route'?await new Promise<string>(resolve=>{finish=resolve}):undefined);
 const publish=vi.fn();
 const work=runCalculation('comparison',async()=>{const first=await invoke('calculate_raster_route',{request:{}});publish(first);await invoke('calculate_raster_route',{request:{}})});
 const id=calculationSnapshot()!.id;await cancelCalculation();finish('resultado obsoleto');
 await expect(work).rejects.toThrow('Cálculo cancelado');expect(publish).not.toHaveBeenCalled();
 expect(vi.mocked(nativeInvoke).mock.calls.filter(call=>call[0]==='calculate_raster_route')).toHaveLength(1);
 expect(nativeInvoke).toHaveBeenCalledWith('release_calculation',{calculationId:id});expect(calculationSnapshot()).toBeNull();expect(programProcesses.getSnapshot()).toBe('success');
});
it('permite reintentar cancelar cuando falla la comunicación con el motor',async()=>{
 let finish!:()=>void;
 vi.mocked(nativeInvoke).mockImplementation(async command=>{if(command==='cancel_calculation')throw new Error('No se pudo cancelar')});
 const work=runCalculation('contours',()=>new Promise<void>(resolve=>{finish=resolve}));
 await expect(cancelCalculation()).rejects.toThrow('No se pudo cancelar');expect(calculationSnapshot()?.cancelling).toBe(false);
 finish();await work;expect(calculationSnapshot()).toBeNull();
});
