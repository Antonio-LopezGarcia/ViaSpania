import type {Terrain3DLegendItem} from './Terrain3D';
export function Terrain3DLegend({title,items,onToggle}:{title?:string;items:Terrain3DLegendItem[];onToggle:(id:string)=>void}){
 return items.length>0?<aside className="terrain-3d-result-legend"><b>{title}</b>{items.map(item=><label key={item.id}><input type="checkbox" checked={item.visible} onChange={()=>onToggle(item.id)}/><i style={{background:item.color}}/><span>{item.label}</span></label>)}</aside>:null;
}
