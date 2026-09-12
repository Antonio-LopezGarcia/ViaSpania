import {useId,type ReactNode} from 'react';
import {useLanguage} from '../core/i18n';
import '../model-load-panel.css';

export function ModelLoadPanel({expanded,onExpandedChange,children}:{expanded:boolean;onExpandedChange:(expanded:boolean)=>void;children:ReactNode}){
  const id=useId(),language=useLanguage();
  return <section className="model-load-panel">
    <button type="button" className="model-load-toggle" aria-expanded={expanded} aria-controls={id} onClick={()=>onExpandedChange(!expanded)}>
      <span className="model-load-label"><span className="model-load-download-icon" aria-hidden="true">⇩</span>{language==='en'?'Load model':'Cargar modelo'}</span><span aria-hidden="true">{expanded?'▴':'▾'}</span>
    </button>
    <div id={id} className="model-load-content" hidden={!expanded}>{children}</div>
  </section>;
}
