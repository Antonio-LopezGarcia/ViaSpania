import {translateText} from '../core/i18n';
import {MODELS} from '../core/costModels';
import type {ModelId} from '../types';
import {PROFILE_CATEGORIES} from '../core/profileCategories';

export function ComparisonModelSelector({selected,onChange,onHelp}:{onHelp?:(model:ModelId)=>void;selected:readonly ModelId[];onChange:(models:ModelId[])=>void}){
 const models=PROFILE_CATEGORIES.flatMap(category=>category.models);
 return <details className="comparison-model-disclosure">
  <summary>Perfiles de desplazamiento · {selected.length} de {models.length} seleccionados</summary>
  <div className="comparison-profile-selection comparison-route-profiles">
   <label className="check"><input type="checkbox" checked={selected.length===models.length} onChange={event=>onChange(event.target.checked?models:[])}/> Seleccionar todos</label>
   {PROFILE_CATEGORIES.map(category=><section className="comparison-profile-category" key={category.name}><b>{category.name}</b>{category.models.map(candidate=><div className="movement-profile-control" key={candidate}><label className="check"><input type="checkbox" checked={selected.includes(candidate)} onChange={event=>onChange(event.target.checked?[...selected,candidate]:selected.filter(value=>value!==candidate))}/>{MODELS[candidate].name}</label>{onHelp&&<button type="button" className="profile-help-trigger" aria-label={`${translateText('Ayuda del perfil de desplazamiento')}: ${translateText(MODELS[candidate].name)}`} onClick={()=>onHelp(candidate)}>?</button>}</div>)}</section>)}
  </div>
 </details>;
}
