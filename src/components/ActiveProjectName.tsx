import {useLanguage} from '../core/i18n';

export function ActiveProjectName({name,title}:{name:string|null;title?:string}){
 const language=useLanguage();
 if(name)return <span className="active-project" title={title??name}>{name.replaceAll('_',' ')}</span>;
 const words=language==='en'?['Empty','project']:['Proyecto','vacío'];
 return <span className="active-project active-project-empty" aria-label={words.join(' ')} title={words.join(' ')}><span>{words[0]}</span><span>{words[1]}</span></span>;
}
