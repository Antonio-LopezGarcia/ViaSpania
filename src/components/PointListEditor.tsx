import type { GeoPoint } from '../types';
import './point-list-editor.css';

export function PointListEditor({points,selectedPointId,onSelect,onRename,onDelete}:{points:GeoPoint[];selectedPointId:number|null;onSelect:(id:number)=>void;onRename:(id:number,name:string)=>void;onDelete:(id:number)=>void}){
  return <section className="analysis-settings waypoint-panel" aria-label="Puntos de paso">
    <b>Puntos de paso</b>
    {!points.length?<p className="hint point-empty">No hay puntos seleccionados. Añádalos en el panel de selección.</p>:<>
      <small className="hint">Coordenadas WGS84 (latitud, longitud)</small>
      <div className="point-list">{points.map(point=><div key={point.id} className={selectedPointId===point.id?'selected':''} onClick={()=>onSelect(point.id)}>
        <i className={point.role} aria-hidden="true"/>
        <span><input aria-label={`Nombre del punto ${point.id}`} title="Pulse el nombre para renombrar el punto" maxLength={20} value={point.name} onFocus={()=>onSelect(point.id)} onClick={event=>event.stopPropagation()} onChange={event=>onRename(point.id,event.target.value)}/>
        <small>({point.lat.toFixed(5)}, {point.lon.toFixed(5)})</small></span>
        <button type="button" aria-label={`Eliminar punto ${point.id}`} title="Eliminar punto" onClick={event=>{event.stopPropagation();onDelete(point.id)}}>×</button>
      </div>)}</div>
    </>}
  </section>;
}
