import type {ReactNode} from 'react';
import type {Terrain3DLegendItem} from './Terrain3D';
export function Terrain3DLegend({title,items,onToggle,beforeItems,afterItems}:{title?:string;items:Terrain3DLegendItem[];onToggle:(id:string)=>void;beforeItems?:ReactNode;afterItems?:ReactNode}){
 return (items.length>0||beforeItems||afterItems)?<aside className="terrain-3d-result-legend"><b>{title}</b>{beforeItems}{items.map(item=><label key={item.id}><input type="checkbox" checked={item.visible} onChange={()=>onToggle(item.id)}/><i style={{background:item.color}}/><span>{item.label}</span></label>)}{afterItems}</aside>:null;
}
