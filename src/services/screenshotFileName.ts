import {normalizeProjectName} from '../core/projectFiles';

const counts=new Map<string,number>();
/** Reserve a unique screenshot name before opening the save dialog, including cancellations. */
export function nextScreenshotFileName(projectName:string){
 const project=normalizeProjectName(projectName)||'Proyecto',now=new Date(),stamp=[now.getDate(),now.getHours(),now.getMinutes()].map(value=>String(value).padStart(2,'0')).join(''),base=`${project}_captura_${stamp}.png`,key=`viaspania.screenshot-name.${base}`;
 let previous=counts.get(key)??0;
 try{const stored=Number(localStorage.getItem(key));if(Number.isSafeInteger(stored)&&stored>previous)previous=stored}catch{/* Session counters remain available when storage is disabled. */}
 const sequence=previous+1;counts.set(key,sequence);
 try{localStorage.setItem(key,String(sequence))}catch{/* Keep the in-memory reservation. */}
 return `${project}_captura_${stamp}${sequence>1?`_${sequence}`:''}.png`;
}
