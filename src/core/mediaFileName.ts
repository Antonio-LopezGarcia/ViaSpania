import type {AnimationMode} from './animationTimeline';
import {normalizeProjectName} from './projectFiles';

export type MediaKind='v'|'gif'|'frame';
const modeCodes:Record<AnimationMode,string>={orbit:'orbit',routes:'rts',flyover:'fly'};
export function mediaFileName(projectName:string,kind:MediaKind,mode:AnimationMode,date:Date,sequence=1){
 const project=normalizeProjectName(projectName)||'Proyecto';
 const stamp=[date.getDate(),date.getHours(),date.getMinutes()].map(value=>String(value).padStart(2,'0')).join('');
 const suffix=sequence>1?`_${sequence}`:'';
 return `${project}_${kind}${kind==='frame'?'':`_${modeCodes[mode]}`}_${stamp}${suffix}.${kind==='v'?'avi':kind==='gif'?'gif':'png'}`;
}
