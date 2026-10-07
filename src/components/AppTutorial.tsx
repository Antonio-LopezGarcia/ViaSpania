import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { completeTutorial, shouldStartTutorial, tutorialCompleted } from '../core/tutorial';
import type { AppSettings } from '../core/appSettings';
import {useLanguage,translateText} from '../core/i18n';
import '../tutorial.css';

type WorkflowStep={selector:string;title:string;text:string;titleEn:string;textEn:string;titleIt:string;textIt:string};
/**
 * Keep this sequence organised by work phase. New tools belong in the phase
 * where their input first becomes available, rather than at the end of the tour.
 */
export const WORKFLOW_STEPS:readonly WorkflowStep[]=[
  {selector:'[data-tutorial="new-project"]',title:'1. Crear o abrir un proyecto',text:'Cree un proyecto para guardar el trabajo, o abra uno existente desde la cabecera.',titleEn:'1. Create or open a project',textEn:'Create a project to save your work, or open an existing one from the header.',titleIt:'1. Crea o apri un progetto',textIt:'Crea un progetto per salvare il lavoro oppure aprine uno esistente dalla barra in alto.'},
  {selector:'[data-tutorial="study-area"]',title:'2. Elegir el área',text:'En Navegación, busque la zona y marque dos esquinas con «Seleccionar área».',titleEn:'2. Choose an area',textEn:'In Navigation, find the location and mark two corners with “Select area”.',titleIt:'2. Scegli l’area',textIt:'In Navigazione, cerca la zona e indica due angoli con «Seleziona area».'},
  {selector:'.model-load-toggle',title:'3. Cargar el terreno',text:'Abra «Cargar modelo» y descargue un MDT para analizar rutas, o importe un archivo local.',titleEn:'3. Load terrain',textEn:'Open “Load model” and download a DTM for route analysis, or import a local file.',titleIt:'3. Carica il terreno',textIt:'Apri «Carica modello» e scarica un MDT per analizzare i percorsi, oppure importa un file locale.'},
  {selector:'[data-tutorial="create-point"]',title:'4. Añadir puntos y condiciones de paso',text:'En Selección, añada los puntos de origen y destino, barreras y facilitadores. Puede mover o eliminar elementos. Deshacer y Rehacer, debajo de «Eliminar elemento», recorren el historial de cambios de puntos, barreras, facilitadores y máscaras marítimas. Use Ctrl+Z para deshacer y Ctrl+Mayús+Z para rehacer (Ctrl+Y para rehacer en Windows); en macOS, ⌘Z y ⇧⌘Z. También puede posar el puntero sobre cada botón para consultar su atajo.',titleEn:'4. Add points and passage conditions',textEn:'In Selection, add origin and destination points, barriers and facilitators. You can move or delete elements. Undo and Redo, below “Delete feature”, step through changes to points, barriers, facilitators and marine masks. Use Ctrl+Z to undo and Ctrl+Shift+Z to redo (Ctrl+Y to redo on Windows); on macOS use ⌘Z and ⇧⌘Z. Hover over either button to see its shortcut.',titleIt:'4. Aggiungi punti e condizioni di passaggio',textIt:'In Selezione, aggiungi i punti di origine e destinazione, le barriere e i facilitatori. Puoi spostare o eliminare gli elementi. Annulla e Ripeti, sotto «Elimina elemento», scorrono la cronologia delle modifiche a punti, barriere, facilitatori e maschere marine. Usa Ctrl+Z per annullare e Ctrl+Maiusc+Z per ripetere (Ctrl+Y per ripetere su Windows); su macOS usa ⌘Z e ⇧⌘Z. Passa il puntatore su ciascun pulsante per vedere la scorciatoia.'},
  {selector:'[data-tutorial="analysis-ruta"]',title:'5. Calcular una ruta',text:'Elija Ruta simple y un perfil de desplazamiento. Calcule la ida para ver la ruta de menor coste entre los dos puntos.',titleEn:'5. Calculate a route',textEn:'Choose Simple route and a travel profile. Calculate the outbound route to find the least-cost path between the two points.',titleIt:'5. Calcola un percorso',textIt:'Scegli Percorso semplice e un profilo di spostamento. Calcola l’andata per trovare il percorso a costo minimo tra i due punti.'},
  {selector:'[data-tutorial="save-project"]',title:'6. Guardar o exportar',text:'Guarde el proyecto para continuar más tarde. Use Exportar resultados para guardar la ruta calculada.',titleEn:'6. Save or export',textEn:'Save the project to continue later. Use Export results to save the calculated route.',titleIt:'6. Salva o esporta',textIt:'Salva il progetto per continuare più tardi. Usa Esporta risultati per salvare il percorso calcolato.'},
];

export function AppTutorial({settings,startToken=0,autoStart=true}:{settings:AppSettings;startToken?:number;autoStart?:boolean}){
  const language=useLanguage();
  const [open,setOpen]=useState(()=>autoStart&&shouldStartTutorial(settings.tutorialEnabled,tutorialCompleted()));
  const [index,setIndex]=useState(0),[rect,setRect]=useState<DOMRect|null>(null);
  const dialogRef=useRef<HTMLDivElement>(null),previousStartToken=useRef(startToken),step=WORKFLOW_STEPS[index],title=language==='en'?step.titleEn:language==='it'?step.titleIt:step.title,text=language==='en'?step.textEn:language==='it'?step.textIt:step.text;
  useEffect(()=>{if(startToken!==previousStartToken.current){previousStartToken.current=startToken;setIndex(0);setOpen(true)}},[startToken]);
  useLayoutEffect(()=>{
    if(!open)return;
    const element=document.querySelector(step.selector);
    if(!(element instanceof HTMLElement)){setRect(null);return}
    element.scrollIntoView?.({block:'nearest',inline:'nearest'});
    const update=()=>{const bounds=element.getBoundingClientRect();setRect(bounds.width>0&&bounds.height>0?bounds:null)};
    update();
    window.addEventListener('resize',update);
    window.addEventListener('scroll',update,true);
    return()=>{window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true)};
  },[open,step]);
  useEffect(()=>{if(!open)return;dialogRef.current?.focus();const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){completeTutorial();setOpen(false)}else if(event.key==='ArrowRight')setIndex(value=>Math.min(WORKFLOW_STEPS.length-1,value+1));else if(event.key==='ArrowLeft')setIndex(value=>Math.max(0,value-1))};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[open,index]);
  if(!open)return null;
  const finish=()=>{completeTutorial();setOpen(false)},below=rect?rect.bottom+330<window.innerHeight:true;
  return <section className="tutorial-layer" aria-label="Tutorial de ViaSpania">
    {rect&&<div className="tutorial-shades" aria-hidden="true"><i style={{left:0,top:0,right:0,height:Math.max(0,rect.top-5)}}/><i style={{left:0,top:Math.max(0,rect.top-5),width:Math.max(0,rect.left-5),height:rect.height+10}}/><i style={{left:rect.right+5,top:Math.max(0,rect.top-5),right:0,height:rect.height+10}}/><i style={{left:0,top:rect.bottom+5,right:0,bottom:0}}/></div>}
    {rect&&<div className="tutorial-highlight" style={{left:rect.left-5,top:rect.top-5,width:rect.width+10,height:rect.height+10}}/>}
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="tutorial-title" tabIndex={-1} className={`tutorial-card ${below?'below':'above'}`} style={rect?{left:Math.max(16,Math.min(rect.left,window.innerWidth-396)),top:below?rect.bottom+14:Math.max(16,rect.top-214)}:undefined}>
      <div className="tutorial-progress"><span>{language==='en'?`Step ${index+1} of ${WORKFLOW_STEPS.length}`:translateText(`Paso ${index+1} de ${WORKFLOW_STEPS.length}`,language)}</span><button aria-label={language==='en'?'Exit tutorial':translateText('Salir del tutorial',language)} onClick={finish}>{language==='en'?'Exit':translateText('Salir',language)}</button></div>
      <b id="tutorial-title">{title}</b><p>{text}</p>
      <nav className="tutorial-step-picker" aria-label={language==='en'?'Go directly to a step':translateText('Ir directamente a un paso',language)}>{WORKFLOW_STEPS.map((item,stepIndex)=>{const itemTitle=language==='en'?item.titleEn:item.title;return <button key={item.title} className={stepIndex===index?'active':''} aria-label={language==='en'?`Go to step ${stepIndex+1}: ${itemTitle}`:translateText(`Ir al paso ${stepIndex+1}: ${itemTitle}`,language)} onClick={()=>setIndex(stepIndex)}>{stepIndex+1}</button>})}</nav>
      <footer><button disabled={index===0} onClick={()=>setIndex(value=>value-1)}>{language==='en'?'Previous':language==='it'?'Indietro':translateText('Anterior',language)}</button><button className="primary" onClick={()=>index===WORKFLOW_STEPS.length-1?finish():setIndex(value=>value+1)}>{index===WORKFLOW_STEPS.length-1?(language==='en'?'Finish':language==='it'?'Fine':'Terminar'):(language==='en'?'Next':language==='it'?'Avanti':'Siguiente')}</button></footer>
    </div>
  </section>;
}
