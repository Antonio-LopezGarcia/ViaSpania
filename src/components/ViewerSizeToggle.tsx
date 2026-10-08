import {useLanguage,translateText} from '../core/i18n';
export function ViewerSizeToggle({viewer,expanded,onToggle,tutorialId}:{viewer:string;expanded:boolean;onToggle:()=>void;tutorialId?:string}){
 const en=useLanguage()==='en';
 return <button type="button" className="viewer-size-toggle" data-tutorial={tutorialId} aria-expanded={expanded} aria-label={en?`${expanded?'Restore':'Expand'} viewer: ${translateText(viewer)}`:expanded?`Restaurar visor de ${viewer}`:`Ampliar visor de ${viewer}`} title={expanded?'Restaurar visor':'Ampliar visor'} onClick={onToggle}><span aria-hidden="true">{expanded?'↙':'↗'}</span></button>;
}
