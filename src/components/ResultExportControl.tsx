import {useMemo,useState} from 'react';
import type {ResultExportItem,ResultExportGroup} from '../core/resultExports';
import {translateText,useLanguage} from '../core/i18n';
import '../result-export.css';

const GROUPS:ResultExportGroup[]=['Datos del proyecto','Máscaras marítimas','Rutas de aproximación','Rutas simples','Rutas comparativas','Matriz de conexiones','Ruta Secuencial','Pasillos','Isócronas','Visibilidad','Curvas de nivel'];

export function ResultExportControl({items,loading,onExport}:{items:ResultExportItem[];loading:boolean;onExport:(ids:string[])=>Promise<void>}){
 const language=useLanguage(),[open,setOpen]=useState(false),[openGroup,setOpenGroup]=useState<ResultExportGroup|null>(null),[selected,setSelected]=useState<Set<string>>(new Set());
 const availableIds=useMemo(()=>new Set(items.map(item=>item.id)),[items]),chosen=[...selected].filter(id=>availableIds.has(id));
 const translated=(value:string)=>{
  const selectedModel=value.match(/^(.*) seleccionado$/);
  if(selectedModel&&language!=='es')return `${translateText(selectedModel[1],language)} ${language==='en'?'selected':'selezionato'}`;
  return language==='es'?value:translateText(value,language);
 };
 const toggle=(id:string)=>setSelected(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next});
 return <>
  <button data-tutorial="export-results" onClick={()=>{setSelected(new Set());setOpenGroup(null);setOpen(true)}}>Exportar resultados</button>
  {open&&<section className="result-export-backdrop"><div className="result-export-dialog" role="dialog" aria-label="Exportar resultados">
   <header><div><b>Exportar resultados</b><span>Seleccione los elementos calculados que se guardarán en una carpeta.</span></div><button aria-label="Cerrar exportación" onClick={()=>setOpen(false)}>×</button></header>
   <div className="result-export-toolbar"><button onClick={()=>setSelected(new Set(items.map(item=>item.id)))}>Seleccionar todo</button><button onClick={()=>setSelected(new Set())}>Deseleccionar todo</button><span>{language==='en'?`${chosen.length} selected`:translateText(`${chosen.length} seleccionado(s)`,language)}</span></div>
   <div className="result-export-groups">{GROUPS.map(group=>{
    const groupItems=items.filter(item=>item.group===group);
    if(!groupItems.length)return null;
    const groupChosen=groupItems.filter(item=>selected.has(item.id)).length;
    return <details className="result-export-category" key={group} open={openGroup===group}>
     <summary onClick={event=>{event.preventDefault();setOpenGroup(current=>current===group?null:group)}}><span>{translated(group)}</span><small>{language==='en'?`${groupChosen} of ${groupItems.length} selected`:translateText(`${groupChosen} de ${groupItems.length} seleccionados`,language)}</small></summary>
     <div className="result-export-category-items">{groupItems.map(item=><label key={item.id}><input type="checkbox" checked={selected.has(item.id)} onChange={()=>toggle(item.id)}/><span><b title={translated(item.label)}>{translated(item.label)}</b><small><em>{item.format}</em><span title={item.fileName}>{item.fileName}</span></small></span></label>)}</div>
    </details>;
   })}</div>
   <footer><button onClick={()=>setOpen(false)}>Cancelar</button><button className="primary" disabled={!chosen.length||loading} onClick={async()=>{await onExport(chosen);setOpen(false)}}>{loading?'Exportando…':language==='en'?`Export ${chosen.length} items`:translateText(`Exportar ${chosen.length} elemento(s)`,language)}</button></footer>
  </div></section>}
 </>;
}
