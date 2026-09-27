import {calculationSnapshot,checkCalculation} from './calculationTasks';
import {invoke as nativeInvoke,type InvokeArgs,type InvokeOptions} from '@tauri-apps/api/core';
import {trackProcess} from '../core/processStatus';

// Health checks and cursor sampling are background observations, not user jobs.
const observations=new Set(['native_status','sample_raster_elevation','sample_raster_elevation_at','fetch_vector_tile']);
export function invoke<T>(command:string,args?:InvokeArgs,options?:InvokeOptions):Promise<T>{
 const calculation=command.startsWith('calculate_')?calculationSnapshot():null;
 if(calculation){checkCalculation();args={...args,calculationId:calculation.id}}
 const call=()=>options?nativeInvoke<T>(command,args,options):args?nativeInvoke<T>(command,args):nativeInvoke<T>(command);
 if(observations.has(command)||command.startsWith('cancel_'))return call();
 return trackProcess(async()=>{const result=await call();if(calculation)checkCalculation();return result});
}
