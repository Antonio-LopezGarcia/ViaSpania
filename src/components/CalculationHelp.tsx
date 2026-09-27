import {useEffect} from 'react';
import {CALCULATION_MODE_HELP,MODEL_HELP,type CalculationHelpMode} from '../core/calculationHelp';
import {CALCULATION_MODE_HELP_EN,MODEL_HELP_EN,MODEL_FORMULAS_EN} from '../core/calculationHelp.en';
import {useLanguage,translateText} from '../core/i18n';
import type {ModelId} from '../types';
import '../calculation-help.css';

type Props={mode:CalculationHelpMode;model?:never;onClose:()=>void}|{mode?:never;model:ModelId;onClose:()=>void};

export function ProfileHelp({model,onClose}:{model:ModelId;onClose:()=>void}){
  return <CalculationHelp model={model} onClose={onClose}/>;
}

export function CalculationHelp({mode,model,onClose}:Props){
  const language=useLanguage(),en=language==='en';
  useEffect(()=>{const close=(event:KeyboardEvent)=>event.key==='Escape'&&onClose();window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[onClose]);
  const calculation=mode?(en?CALCULATION_MODE_HELP_EN[mode]:CALCULATION_MODE_HELP[mode]):undefined;
  const profile=model?(en?{...MODEL_HELP[model],...MODEL_HELP_EN[model]}:MODEL_HELP[model]):undefined;
  return <section className="calculation-help-overlay" role="dialog" aria-modal="true" aria-labelledby="calculation-help-title">
    <div className="calculation-help-window">
      <header><div><small>{profile?(en?'Profile explained':translateText('Perfil explicado',language)):(en?'Calculation context help':translateText('Ayuda contextual de cálculos',language))}</small><h2 id="calculation-help-title">{calculation?.name??translateText(profile!.name)}</h2></div><button aria-label={profile?(en?'Close profile help':translateText('Cerrar ayuda del perfil',language)):(en?'Close calculation help':translateText('Cerrar ayuda de cálculos',language))} onClick={onClose}>×</button></header>
      <div className="calculation-help-body">
        {calculation&&<section><h3>{en?'What this mode calculates':translateText('Qué calcula este modo',language)}</h3><p>{calculation.summary}</p><ol>{calculation.process.map(item=><li key={item}>{item}</li>)}</ol><h4>{en?'Parameters you can change':translateText('Parámetros que puede modificar',language)}</h4><ul>{calculation.parameters.map(item=><li key={item}>{item}</li>)}</ul></section>}
        {profile&&model&&<section className="calculation-model-help">
          <div className="calculation-help-heading"><div><small>{translateText(profile.family)}</small><h3>{translateText(profile.name)}</h3></div><span>{profile.directional?(en?'Directional':translateText('Direccional',language)):(en?'Non-directional':translateText('No direccional',language))} · {profile.unit}</span></div>
          <p>{profile.purpose}</p><h4>{en?'Origin and authorship':translateText('Origen y autoría',language)}</h4><p>{profile.author}</p><h4>{en?'Formulation used by ViaSpania':translateText('Formulación utilizada por ViaSpania',language)}</h4><code>{en?MODEL_FORMULAS_EN[model]:profile.formula}</code><h4>{en?'Variables considered':translateText('Variables consideradas',language)}</h4><ul>{profile.variables.map(item=><li key={item}>{item}</li>)}</ul><h4>{en?'What can be changed in the application':translateText('Qué puede modificar en el programa',language)}</h4><ul>{profile.editable.map(item=><li key={item}>{item}</li>)}</ul><h4>{en?'Limitations':translateText('Limitaciones',language)}</h4><ul>{profile.limits.map(item=><li key={item}>{item}</li>)}</ul><h4>{en?'Reference':translateText('Referencia',language)}</h4><p className="calculation-help-reference">{translateText(profile.reference)}</p>
        </section>}
        {calculation&&<aside><b>{en?'Responsible interpretation':translateText('Interpretación responsable',language)}</b><p>{en?'The result is a mathematical optimum conditioned by the digital model and selected assumptions. It does not demonstrate that a path, right of way, safety or real passability exists.':translateText('El resultado es un óptimo matemático condicionado por el modelo digital y los supuestos elegidos. No demuestra que exista un camino, permiso de paso, seguridad o transitabilidad real.',language)}</p></aside>}
      </div>
    </div>
  </section>
}
