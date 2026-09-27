import {isCalculationCancelled} from './calculationCancellation';
export type ProcessStatus = 'success' | 'running' | 'error';
export interface ProcessHandle { fail(error?:unknown):void; finish():void }

/** Tracks a batch of overlapping operations; an error survives until the batch ends. */
export class ProcessTracker {
 private active=0;
 private failed=false;
 private status:ProcessStatus='success';
 private listeners=new Set<()=>void>();
 getSnapshot=()=>this.status;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener)}};
 private publish(){
  const next=this.active?'running':this.failed?'error':'success';
  if(next===this.status)return;
  this.status=next;
  this.listeners.forEach(listener=>listener());
 }
 begin():ProcessHandle {
  if(!this.active)this.failed=false;
  this.active++;
  this.publish();
  let finished=false;
  return {
   fail:(error)=>{if(!finished&&!isCalculationCancelled(error))this.failed=true},
   finish:()=>{if(finished)return;finished=true;this.active--;this.publish()},
  };
 }
 async run<T>(work:(process:ProcessHandle)=>Promise<T>):Promise<T>{
  const process=this.begin();
  try{return await work(process)}catch(error){process.fail(error);throw error}finally{process.finish()}
 }
}
export const programProcesses=new ProcessTracker();
export const trackProcess=<T>(work:(process:ProcessHandle)=>Promise<T>)=>programProcesses.run(work);
