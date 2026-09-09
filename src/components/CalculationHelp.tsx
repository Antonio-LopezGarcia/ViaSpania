import {useEffect,useState} from 'react';
import {CALCULATION_MODE_HELP,MODEL_HELP,type CalculationHelpMode} from '../core/calculationHelp';
import {CALCULATION_MODE_HELP_EN,MODEL_HELP_EN,MODEL_FORMULAS_EN} from '../core/calculationHelp.en';
import {useLanguage,translateText} from '../core/i18n';
import type {ModelId} from '../types';
import '../calculation-help.css';

interface Props{mode:CalculationHelpMode;model:ModelId;availableModels?:ModelId[];onClose:()=>void}

export function CalculationHelp({mode,model,availableModels,onClose}:Props){
  const language=useLanguage(),en=language==='en';
  const choices=availableModels?.length?availableModels:[model];
  const [selected,setSelected]=useState<ModelId>(choices.includes(model)?model:choices[0]);
  useEffect(()=>{const close=(event:KeyboardEvent)=>event.key==='Escape'&&onClose();window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[onClose]);
  useEffect(()=>{setSelected(choices.includes(model)?model:choices[0])},[mode,model,availableModels]);
  const calculation=en?CALCULATION_MODE_HELP_EN[mode]:CALCULATION_MODE_HELP[mode],profile=en?{...MODEL_HELP[selected],...MODEL_HELP_EN[selected]}:MODEL_HELP[selected];
  return <section className="calculation-help-overlay" role="dialog" aria-modal="true" aria-labelledby="calculation-help-title">
    <div className="calculation-help-window">
      <header><div><small>{en?'Calculation context help':'Ayuda contextual de cálculos'}</small><h2 id="calculation-help-title">{calculation.name}</h2></div><button aria-label={en?'Close calculation help':'Cerrar ayuda de cálculos'} onClick={onClose}>×</button></header>
      <div className="calculation-help-body">
        <section><h3>{en?'What this mode calculates':'Qué calcula este modo'}</h3><p>{calculation.summary}</p><ol>{calculation.process.map(item=><li key={item}>{item}</li>)}</ol><h4>{en?'Parameters you can change':'Parámetros que puede modificar'}</h4><ul>{calculation.parameters.map(item=><li key={item}>{item}</li>)}</ul></section>
        {mode!=='viewshed'&&mode!=='contours'&&<section className="calculation-model-help">
          <label>{en?'Profile explained':'Perfil explicado'}<select value={selected} onChange={event=>setSelected(event.target.value as ModelId)}>{choices.map(id=><option key={id} value={id}>{translateText(MODEL_HELP[id].name)}</option>)}</select></label>
          <div className="calculation-help-heading"><div><small>{translateText(profile.family)}</small><h3>{translateText(profile.name)}</h3></div><span>{profile.directional?'Direccional':'No direccional'} · {profile.unit}</span></div>
          <p>{profile.purpose}</p><h4>{en?'Origin and authorship':'Origen y autoría'}</h4><p>{profile.author}</p><h4>{en?'Formulation used by ViaSpania':'Formulación utilizada por ViaSpania'}</h4><code>{en?MODEL_FORMULAS_EN[selected]:profile.formula}</code><h4>{en?'Variables considered':'Variables consideradas'}</h4><ul>{profile.variables.map(item=><li key={item}>{item}</li>)}</ul><h4>{en?'What can be changed in the application':'Qué puede modificar en el programa'}</h4><ul>{profile.editable.map(item=><li key={item}>{item}</li>)}</ul><h4>{en?'Limitations':'Limitaciones'}</h4><ul>{profile.limits.map(item=><li key={item}>{item}</li>)}</ul><h4>{en?'Reference':'Referencia'}</h4><p className="calculation-help-reference">{translateText(profile.reference)}</p>
        </section>}
        <aside><b>{en?'Responsible interpretation':'Interpretación responsable'}</b><p>{en?'The result is a mathematical optimum conditioned by the digital model and selected assumptions. It does not demonstrate that a path, right of way, safety or real passability exists.':'El resultado es un óptimo matemático condicionado por el modelo digital y los supuestos elegidos. No demuestra que exista un camino, permiso de paso, seguridad o transitabilidad real.'}</p></aside>
      </div>
    </div>
  </section>
}
