import {invoke} from '@tauri-apps/api/core';
import {trackProcess,type ProcessHandle} from '../core/processStatus';
import {CALCULATION_CANCELLED} from '../core/calculationCancellation';
export interface CalculationTask {readonly id:string;readonly mode:string;readonly cancelling:boolean}
let active:CalculationTask|null=null;
const listeners=new Set<()=>void>();
const publish=()=>listeners.forEach(listener=>listener());
export const calculationSnapshot=()=>active;
export const subscribeCalculation=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}};
export function checkCalculation(){if(active?.cancelling)throw new Error(CALCULATION_CANCELLED)}
export async function cancelCalculation(){
 if(!active||active.cancelling)return;
 const task=active;active={...task,cancelling:true};publish();
 try{await invoke('cancel_calculation',{calculationId:task.id})}catch(error){if(active?.id===task.id){active={...task,cancelling:false};publish()}throw error}
}
export async function runCalculation<T>(mode:string,work:(process:ProcessHandle)=>Promise<T>):Promise<T>{
 if(active)throw new Error('Ya hay un cálculo en curso');
 const task={id:crypto.randomUUID(),mode,cancelling:false};active=task;publish();
 try{return await trackProcess(work)}finally{
  // All calls belonging to this task have settled before releasing its native token.
  await invoke('release_calculation',{calculationId:task.id}).catch(()=>{});
  if(active?.id===task.id){active=null;publish()}
 }
}
