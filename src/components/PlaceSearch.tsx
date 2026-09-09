import {createPortal} from 'react-dom';
import {useEffect,useRef,useState} from 'react';
import {parseSearchCoordinates} from '../core/coordinateSearch';
import {gazetteer,projectCoordinate,type GazetteerContext,type GazetteerResult} from '../services/gazetteer';
import '../place-search.css';
export function PlaceSearch({context,onSelect,rasterPath}:{context:GazetteerContext;rasterPath?:string;onSelect:(place:GazetteerResult)=>void}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[results,setResults]=useState<GazetteerResult[]>([]),[active,setActive]=useState(0),[selected,setSelected]=useState<GazetteerResult|null>(null),[message,setMessage]=useState('');const generation=useRef(0);
 const trigger=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLElement>(null);
 const close=()=>{generation.current++;setResults([]);setOpen(false);trigger.current?.focus()};
 useEffect(()=>{if(open)dialog.current?.querySelector<HTMLInputElement>('input')?.focus()},[open]);
 const [busy,setBusy]=useState(false);
 useEffect(()=>()=>{generation.current++},[]);
 const choose=async(p:GazetteerResult)=>{
  const id=++generation.current;setBusy(true);setResults([]);setMessage('Transformando coordenadas…');
  try{
   const projected=await projectCoordinate(p,rasterPath);
   if(id!==generation.current)return;
   onSelect(p);setQuery('');setSelected(p);
   setMessage(`${projected.coordinate.map(value=>value.toFixed(3)).join(', ')} · ${projected.crs}`);
  }catch(error){if(id===generation.current)setMessage(`No se pudo transformar la posición al CRS del proyecto. ${error instanceof Error?error.message:String(error)}`)}finally{setBusy(false)}
 };
 const search=async()=>{if(busy||query.trim().length<3)return;const id=++generation.current;setBusy(true);setResults([]);setMessage('');try{
  const coordinates=parseSearchCoordinates(query);
  if(coordinates){const [longitude,latitude]=coordinates;await choose({source:'coordinates',sourceId:`${longitude},${latitude}`,displayName:`${latitude}, ${longitude}`,longitude,latitude,featureType:'coordenadas',country:'',admin1:'',admin2:''});return}
  setMessage('Buscando en GeoNames…');const items=await gazetteer.search(query,context);if(id===generation.current){setResults(items);setActive(0);setMessage(items.length?'':'Sin resultados.')}
 }catch(e){if(id===generation.current)setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
 return <div className="place-search"><button ref={trigger} className="area-tool" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)}><svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m12 12 6 6" stroke="currentColor" strokeWidth="2"/></svg> Buscar lugar</button>{open&&createPortal(<div className="place-search-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section ref={dialog} className="place-search-panel" role="dialog" aria-modal="true" aria-labelledby="place-search-title" onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();close()}if(e.key==='Tab'){const controls=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]');if(!controls?.length)return;const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}}><header className="place-search-header"><h2 id="place-search-title">Buscar lugar</h2><button aria-label="Cerrar búsqueda de lugar" onClick={close}>×</button></header><input autoFocus placeholder="Nombre o latitud, longitud" aria-describedby="coordinate-search-help" aria-label="Buscar lugar" role="combobox" aria-expanded={results.length>0} aria-controls="place-results" aria-autocomplete="list" aria-activedescendant={results.length?`place-${active}`:undefined} value={query} onChange={e=>{generation.current++;setQuery(e.target.value);setResults([]);setMessage('')}} onKeyDown={e=>{if(e.key==='Enter'&&!results.length){e.preventDefault();void search()}if(results.length&&['ArrowDown','ArrowUp','Enter'].includes(e.key)){e.preventDefault();if(e.key==='Enter')choose(results[active]);else setActive(i=>(i+(e.key==='ArrowDown'?1:-1)+results.length)%results.length)}}}/><p id="coordinate-search-help">Coordenadas WGS84: latitud, longitud en grados decimales. Ejemplo: 40.4168, -3.7038. Use punto decimal.</p><div className="place-search-actions"><button className="place-search-submit" disabled={busy||query.trim().length<3} onClick={()=>void search()}>{busy?'Buscando…':'Buscar lugar'}</button></div><ul id="place-results" role="listbox">{results.map((p,i)=><li role="option" aria-selected={i===active} id={`place-${i}`} key={`${p.source}:${p.sourceId}`} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(p)}><b translate="no">{p.displayName}</b><span><span translate="no">{[p.admin2,p.admin1,p.country].filter(Boolean).join(' · ')}</span> · {p.featureType}</span></li>)}</ul>{selected&&<div className="place-search-selection"><b translate="no">{selected.displayName}</b><small>{selected.latitude}, {selected.longitude} — EPSG:4326 (latitud, longitud){selected.source==='geonames'?` · GeoNames #${selected.sourceId}`:''}</small></div>}<p role="status">{message}</p></section></div>,document.body)}</div>
}
