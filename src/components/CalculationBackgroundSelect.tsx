import {useEffect,useState} from 'react';
import {loadAppSettings} from '../core/appSettings';
import {calculationBackgroundOptions} from '../core/calculationBackgrounds';

export function useCalculationBackgrounds(includeTerrain=false){
 const [layers,setLayers]=useState(()=>loadAppSettings().externalMapLayers);
 useEffect(()=>{const update=()=>setLayers(loadAppSettings().externalMapLayers);window.addEventListener('viaspania-settings',update);return()=>window.removeEventListener('viaspania-settings',update)},[]);
 return {externalLayers:layers,options:calculationBackgroundOptions(layers,includeTerrain)};
}
export function CalculationBackgroundSelect({value,onChange,options}:{value:string;onChange:(value:string)=>void;options:readonly {id:string;name:string}[]}){
 return <select value={value} onChange={event=>onChange(event.target.value)}>{options.map(option=><option key={option.id} value={option.id} translate={option.id.startsWith('external:')?'no':undefined}>{option.name}</option>)}</select>;
}
