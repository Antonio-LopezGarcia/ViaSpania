import {MODELS} from '../core/costModels';
import type {ModelId} from '../types';

export function ComparisonModelSelector({selected,onChange}:{selected:readonly ModelId[];onChange:(models:ModelId[])=>void}){
 const models=Object.keys(MODELS) as ModelId[];
 return <details className="comparison-model-disclosure">
  <summary>Perfiles de desplazamiento · {selected.length} de {models.length} seleccionados</summary>
  <div className="comparison-profile-selection comparison-route-profiles">
   <label className="check"><input type="checkbox" checked={selected.length===models.length} onChange={event=>onChange(event.target.checked?models:[])}/> Seleccionar todos</label>
   {models.map(candidate=><label className="check" key={candidate}><input type="checkbox" checked={selected.includes(candidate)} onChange={event=>onChange(event.target.checked?[...selected,candidate]:selected.filter(value=>value!==candidate))}/>{MODELS[candidate].name}</label>)}
  </div>
 </details>;
}
