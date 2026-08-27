import type { GeoPoint } from '../types';

export function PointListEditor({points,selectedPointId,onSelect,onRename,onDelete}:{points:GeoPoint[];selectedPointId:number|null;onSelect:(id:number)=>void;onRename:(id:number,name:string)=>void;onDelete:(id:number)=>void}){
  if(!points.length)return <p className="hint point-empty">No hay puntos seleccionados. Añádalos sobre la ortofotografía o impórtelos.</p>;
  return <div className="point-list">{points.map(point=><div key={point.id} className={selectedPointId===point.id?'selected':''} onClick={()=>onSelect(point.id)}><i className={point.role}/><span><input aria-label={`Nombre del punto ${point.id}`} maxLength={20} value={point.name} onClick={event=>event.stopPropagation()} onChange={event=>onRename(point.id,event.target.value)}/><small>{point.role} · {point.lat.toFixed(5)}, {point.lon.toFixed(5)}</small></span><button aria-label={`Eliminar ${point.name}`} onClick={event=>{event.stopPropagation();onDelete(point.id)}}>×</button></div>)}</div>;
}
