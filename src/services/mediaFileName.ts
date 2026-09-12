import type {AnimationMode} from '../core/animationTimeline';
import {mediaFileName,type MediaKind} from '../core/mediaFileName';
const counts=new Map<string,number>();
/** Reserve before opening the save dialog, including cancelled exports. */
export function nextMediaFileName(projectName:string,kind:MediaKind,mode:AnimationMode){
 const now=new Date(),base=mediaFileName(projectName,kind,mode,now),key=`viaspania.media-name.${base}`;
 let previous=counts.get(key)??0;
 try{const stored=Number(localStorage.getItem(key));if(Number.isSafeInteger(stored)&&stored>previous)previous=stored}catch{/* Session counters remain available when storage is disabled. */}
 const sequence=previous+1;counts.set(key,sequence);
 try{localStorage.setItem(key,String(sequence))}catch{/* Keep the in-memory reservation. */}
 return mediaFileName(projectName,kind,mode,now,sequence);
}
