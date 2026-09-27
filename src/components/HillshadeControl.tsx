import './hillshade-control.css';
export function HillshadeControl({value,onChange,disabled=false}:{value:number;onChange:(value:number)=>void;disabled?:boolean}){
 return <label className="hillshade-control" title="Sombreado compartido por el MDT y el visor 3D. Luz del noroeste a 45°.">Hillshade <input aria-label="Intensidad de hillshade" type="range" min="0" max="1" step="0.05" value={value} disabled={disabled} onChange={event=>onChange(Number(event.target.value))}/><span>{Math.round(value*100)} %</span></label>;
}
