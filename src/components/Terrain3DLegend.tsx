import type {ReactNode} from 'react';
import type {Terrain3DLegendItem} from './Terrain3D';
export function Terrain3DLegend({title,items,onToggle,beforeItems,afterItems}:{title?:string;items:Terrain3DLegendItem[];onToggle:(id:string)=>void;beforeItems?:ReactNode;afterItems?:ReactNode}){
 const hasRange=items.some(item=>item.range);
 return (items.length>0||beforeItems||afterItems)?<aside className={`terrain-3d-result-legend${hasRange?' has-cost-range':''}`}><b>{title}</b>{beforeItems}{items.map(item=><label key={item.id} className={item.range?'terrain-cost-range-item':undefined}><input type="checkbox" checked={item.visible} onChange={()=>onToggle(item.id)}/>{item.range?<span className="terrain-cost-range-content"><strong>{item.label}</strong><i style={{background:item.color}}/><span className="terrain-cost-range-values"><span>{item.range.min.toLocaleString(undefined,{maximumFractionDigits:2})} {item.range.unit}</span><span>{item.range.max.toLocaleString(undefined,{maximumFractionDigits:2})} {item.range.unit}</span></span></span>:<><i style={{background:item.color}}/><span>{item.label}</span></>}</label>)}{afterItems}</aside>:null;
}
