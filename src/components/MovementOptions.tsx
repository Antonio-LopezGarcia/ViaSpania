import {useState} from 'react';
import {ProfileHelp} from './CalculationHelp';
import {translateText} from '../core/i18n';
import {MODELS} from '../core/costModels';
import {RANK_PENALTY_PRESETS} from '../core/rankedRoutes';
import {PROFILE_CATEGORIES} from '../core/profileCategories';
import type {Connectivity,ModelId} from '../types';
import {ComparisonModelSelector} from './ComparisonModelSelector';
import './movement-options.css';

interface Props {
 model:ModelId; onModel:(value:ModelId)=>void;
 comparisonModels?:readonly ModelId[]; onComparisonModels:(value:ModelId[])=>void;
 connectivity:Connectivity; onConnectivity:(value:Connectivity)=>void;
 allowAlternatives?:boolean;
 rankEnabled:boolean; onRankEnabled:(value:boolean)=>void;
 rankCount:number; onRankCount:(value:number)=>void;
 rankPenalty:number; onRankPenalty:(value:number)=>void;
 criticalSlope:number; onCriticalSlope:(value:number)=>void;
 ardigoSpeed:number; onArdigoSpeed:(value:number)=>void;
 icSex?:'male'|'female'; onIcSex?:(value:'male'|'female')=>void;
 icContext?:'paths'|'off-path'; onIcContext?:(value:'paths'|'off-path')=>void;
}
export function MovementOptions(props:Props){
 const [helpModel,setHelpModel]=useState<ModelId|null>(null);
 const active=props.comparisonModels??[props.model];
 return <section className="analysis-settings movement-options" aria-label="Opciones de desplazamiento">
  <b>Opciones de desplazamiento</b>
  {props.comparisonModels?<ComparisonModelSelector selected={props.comparisonModels} onChange={props.onComparisonModels} onHelp={setHelpModel}/>:<div className="movement-profile-control"><label>Perfil de desplazamiento<select value={props.model} onChange={event=>props.onModel(event.target.value as ModelId)}>{PROFILE_CATEGORIES.map(category=><optgroup key={category.name} label={category.name}>{category.models.map(id=><option key={id} value={id}>{MODELS[id].name}</option>)}</optgroup>)}</select></label><button type="button" className="profile-help-trigger" aria-label={translateText('Ayuda del perfil de desplazamiento')} onClick={()=>setHelpModel(props.model)}>?</button></div>}
  <label>Conectividad<select value={props.connectivity} onChange={event=>props.onConnectivity(Number(event.target.value) as Connectivity)}><option value={4}>4 vecinos · ortogonal</option><option value={8}>8 vecinos · diagonal</option><option value={16}>16 vecinos · rutas más suaves</option></select></label>
  {props.allowAlternatives!==false&&<div className="movement-option-group movement-alternatives"><label className="check"><input type="checkbox" checked={props.rankEnabled} onChange={event=>props.onRankEnabled(event.target.checked)}/>Calcular rutas subóptimas</label>
  {props.rankEnabled&&<><label>Número de rutas subóptimas<input type="number" min={2} max={10} value={props.rankCount} onChange={event=>props.onRankCount(Math.min(10,Math.max(2,Number(event.target.value)||2)))}/></label><label>Separación<select value={props.rankPenalty} onChange={event=>props.onRankPenalty(Number(event.target.value))}><option value={RANK_PENALTY_PRESETS.alta}>Alta</option><option value={RANK_PENALTY_PRESETS.media}>Media</option><option value={RANK_PENALTY_PRESETS.baja}>Baja</option></select></label><small className="hint">El número incluye la ruta óptima (rango 1). Los costes de las alternativas se evalúan sobre la superficie original.</small></>}
  </div>}
  {active.some(model=>model==='wheeled'||model==='ardigo'||model==='irmischer-clarke')&&<div className="movement-option-group movement-profile-parameters"><b>{translateText('Parámetros específicos del perfil')}</b><div className="movement-profile-parameters-grid">
  {active.includes('wheeled')&&<div className="movement-parameter-card"><b>{translateText('Parámetros vehículo con pendiente crítica')}</b><label>Pendiente crítica · vehículo<input aria-label="Pendiente crítica" type="number" min={1} max={100} value={props.criticalSlope} onChange={event=>props.onCriticalSlope(Math.min(100,Math.max(1,Number(event.target.value)||1)))}/><span>%</span></label></div>}
  {active.includes('ardigo')&&<div className="movement-parameter-card movement-ardigo"><b>{translateText('Parámetros Ardigò')}</b><label>Velocidad Ardigò<input aria-label="Velocidad Ardigò" type="number" min={0.2} max={15} step={0.1} value={props.ardigoSpeed} onChange={event=>props.onArdigoSpeed(Math.min(15,Math.max(0.2,Number(event.target.value)||0.2)))}/><span>m/s</span></label><div className="speed-presets"><button type="button" onClick={()=>props.onArdigoSpeed(1.2)}>Caminar · 1,2 m/s</button><button type="button" onClick={()=>props.onArdigoSpeed(3)}>Correr · 3 m/s</button><button type="button" onClick={()=>props.onArdigoSpeed(5.5)}>Bicicleta · 5,5 m/s</button></div><small className="hint">Valor configurable entre 0,2 y 15 m/s.</small></div>}
  {active.includes('irmischer-clarke')&&<div className="movement-parameter-card movement-irmischer-clarke"><b>{translateText('Parámetros Irmischer–Clarke')}</b><label>{translateText('Sexo/modelo')}<select value={props.icSex??'male'} onChange={event=>props.onIcSex?.(event.target.value as 'male'|'female')}><option value="male">{translateText('Masculino')}</option><option value="female">{translateText('Femenino')}</option></select></label><label>{translateText('Contexto de desplazamiento')}<select value={props.icContext??'paths'} onChange={event=>props.onIcContext?.(event.target.value as 'paths'|'off-path')}><option value="paths">{translateText('Por caminos')}</option><option value="off-path">{translateText('Campo a través')}</option></select></label></div>}
  </div></div>}
  {helpModel&&<ProfileHelp model={props.comparisonModels?helpModel:props.model} onClose={()=>setHelpModel(null)}/>}
 </section>;
}
