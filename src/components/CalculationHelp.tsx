import {useEffect,useState} from 'react';
import {CALCULATION_MODE_HELP,MODEL_HELP,type CalculationHelpMode} from '../core/calculationHelp';
import type {ModelId} from '../types';
import '../calculation-help.css';

interface Props{mode:CalculationHelpMode;model:ModelId;availableModels?:ModelId[];onClose:()=>void}

export function CalculationHelp({mode,model,availableModels,onClose}:Props){
  const choices=availableModels?.length?availableModels:[model];
  const [selected,setSelected]=useState<ModelId>(choices.includes(model)?model:choices[0]);
  useEffect(()=>{const close=(event:KeyboardEvent)=>event.key==='Escape'&&onClose();window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[onClose]);
  useEffect(()=>{setSelected(choices.includes(model)?model:choices[0])},[mode,model,availableModels]);
  const calculation=CALCULATION_MODE_HELP[mode],profile=MODEL_HELP[selected];
  return <section className="calculation-help-overlay" role="dialog" aria-modal="true" aria-labelledby="calculation-help-title">
    <div className="calculation-help-window">
      <header><div><small>Ayuda contextual de cálculos</small><h2 id="calculation-help-title">{calculation.name}</h2></div><button aria-label="Cerrar ayuda de cálculos" onClick={onClose}>×</button></header>
      <div className="calculation-help-body">
        <section><h3>Qué calcula este modo</h3><p>{calculation.summary}</p><ol>{calculation.process.map(item=><li key={item}>{item}</li>)}</ol><h4>Parámetros que puede modificar</h4><ul>{calculation.parameters.map(item=><li key={item}>{item}</li>)}</ul></section>
        {mode!=='viewshed'&&mode!=='contours'&&<section className="calculation-model-help">
          <label>Perfil explicado<select value={selected} onChange={event=>setSelected(event.target.value as ModelId)}>{choices.map(id=><option key={id} value={id}>{MODEL_HELP[id].name}</option>)}</select></label>
          <div className="calculation-help-heading"><div><small>{profile.family}</small><h3>{profile.name}</h3></div><span>{profile.directional?'Direccional':'No direccional'} · {profile.unit}</span></div>
          <p>{profile.purpose}</p><h4>Origen y autoría</h4><p>{profile.author}</p><h4>Formulación utilizada por ViaSpania</h4><code>{profile.formula}</code><h4>Variables consideradas</h4><ul>{profile.variables.map(item=><li key={item}>{item}</li>)}</ul><h4>Qué puede modificar en el programa</h4><ul>{profile.editable.map(item=><li key={item}>{item}</li>)}</ul><h4>Limitaciones</h4><ul>{profile.limits.map(item=><li key={item}>{item}</li>)}</ul><h4>Referencia</h4><p className="calculation-help-reference">{profile.reference}</p>
        </section>}
        <aside><b>Interpretación responsable</b><p>El resultado es un óptimo matemático condicionado por el modelo digital y los supuestos elegidos. No demuestra que exista un camino, permiso de paso, seguridad o transitabilidad real.</p></aside>
      </div>
    </div>
  </section>
}
