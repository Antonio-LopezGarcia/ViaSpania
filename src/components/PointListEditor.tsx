import {pointColor} from '../core/points';
import type { GeoPoint } from '../types';
import './point-list-editor.css';

export function PointListEditor({points,selectedPointId,onSelect,onRename,onDelete,onReorder}:{points:GeoPoint[];selectedPointId:number|null;onSelect:(id:number)=>void;onRename:(id:number,name:string)=>void;onDelete:(id:number)=>void;onReorder?:(id:number,offset:number)=>void}){
  return <section className="analysis-settings waypoint-panel" aria-label="Puntos de paso">
    <b>Puntos de paso</b>
    {!points.length?<p className="hint point-empty">No hay puntos seleccionados. Añádalos en el panel de selección.</p>:<>
      <small className="hint">Coordenadas WGS84 (latitud, longitud)</small>
      <div className="point-list">{points.map((point,index)=><div key={point.id} className={selectedPointId===point.id?'selected':''} onClick={()=>onSelect(point.id)}>
        <i style={{background:pointColor(index)}} aria-hidden="true"/>
        <span><small>{`Punto ${index+1}`}</small><input aria-label={`Nombre del punto ${point.id}`} title="Pulse el nombre para renombrar el punto" maxLength={20} value={point.name} onFocus={()=>onSelect(point.id)} onClick={event=>event.stopPropagation()} onChange={event=>onRename(point.id,event.target.value)}/>
        <small>({point.lat.toFixed(5)}, {point.lon.toFixed(5)})</small></span>
        {onReorder&&<div className="point-order-controls"><button type="button" disabled={index===0} aria-label={`Subir punto ${index+1}`} onClick={event=>{event.stopPropagation();onReorder(point.id,-1)}}>↑ Subir</button><button type="button" disabled={index===points.length-1} aria-label={`Bajar punto ${index+1}`} onClick={event=>{event.stopPropagation();onReorder(point.id,1)}}>↓ Bajar</button></div>}
        <button type="button" aria-label={`Eliminar punto ${point.id}`} title="Eliminar punto" onClick={event=>{event.stopPropagation();onDelete(point.id)}}>×</button>
      </div>)}</div>
    </>}
  </section>;
}
