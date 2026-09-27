import {useSyncExternalStore,type ReactNode} from 'react';
import {useLanguage,translateText} from '../core/i18n';
import {calculationSnapshot,subscribeCalculation,cancelCalculation} from '../services/calculationTasks';
export function CalculationButton({mode,disabled,onClick,onError,children}:{mode:string;disabled?:boolean;onClick:()=>unknown;onError:(message:string)=>void;children:ReactNode}){
 const task=useSyncExternalStore(subscribeCalculation,calculationSnapshot),language=useLanguage(),en=language==='en',own=task?.mode===mode;
 return <button className="primary wide" disabled={own?task.cancelling:Boolean(task)||disabled} onClick={()=>{if(own)void cancelCalculation().catch(error=>onError(error instanceof Error?error.message:String(error)));else onClick()}}>{own?(task.cancelling?(en?'Cancelling…':translateText('Cancelando…',language)):(en?'Cancel calculation':translateText('Cancelar cálculo',language))):children}</button>;
}
