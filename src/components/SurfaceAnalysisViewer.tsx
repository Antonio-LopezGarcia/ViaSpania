import { type ReactNode, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import type { Barrier, EnabledCrossing, GeoPoint, PreferredCorridor, RouteResult } from '../types';
import { savePdfExport, savePngExport } from '../services/exports';
import { MapPanel, type SharedMapView, type StudyExtent } from './MapPanel';
import { MdtMapPanel } from './MdtMapPanel';
import {ElevationProfileOverlay,type ElevationProfileRoute} from './ElevationProfileOverlay';

type Background = 'pnoa' | 'copernicus-vhr-2021' | 'mdt' | 'topographic' | 'historical';
interface VisibleElements { points:boolean; labels:boolean; barriers:boolean; facilitators:boolean; route:boolean }

interface Props {
  title:string;
  fileBase:string;
  points:GeoPoint[];
  selectedPointId:number|null;
  barriers:Barrier[];
  corridors:PreferredCorridor[];
  crossings:EnabledCrossing[];
  route:RouteResult|null;
  routes?:{coordinates:[number,number][];color:string}[];
  elevationProfiles?:ElevationProfileRoute[];
  initialView:SharedMapView;
  studyExtent:StudyExtent;
  mdtImageUrl:string;
  surfaceImageUrl?:string;
  initialOpacity?:number;
  surfaceLabel?:string;
  lines?:{level:number;coordinates:[number,number][]}[];
  legend?:ReactNode;
  showRouteLayer?:boolean;
  onClose:()=>void;
}

function captureMap(element:HTMLElement){
  const bounds=element.getBoundingClientRect(),canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  if(!context)throw new Error('No se pudo preparar la captura del visor.');
  canvas.width=Math.max(1,Math.round(bounds.width));canvas.height=Math.max(1,Math.round(bounds.height));context.fillStyle='#07100d';context.fillRect(0,0,canvas.width,canvas.height);
  for(const source of element.querySelectorAll('canvas')){if(!source.width)continue;const opacity=Number(source.parentElement?.style.opacity||source.style.opacity||'1'),transform=source.style.transform,match=transform.match(/^matrix\(([^)]+)\)$/);context.save();context.globalAlpha=Number.isFinite(opacity)?opacity:1;if(match){const matrix=match[1].split(',').map(Number);context.setTransform(matrix[0],matrix[1],matrix[2],matrix[3],matrix[4],matrix[5])}context.drawImage(source,0,0);context.restore()}
  return canvas;
}

export function SurfaceAnalysisViewer({title,fileBase,points,selectedPointId,barriers,corridors,crossings,route,routes:providedRoutes,elevationProfiles=[],initialView,studyExtent,mdtImageUrl,surfaceImageUrl,initialOpacity=.55,surfaceLabel,lines=[],legend,showRouteLayer=true,onClose}:Props){
  const [view,setView]=useState(initialView),[background,setBackground]=useState<Background>('pnoa'),[showSurface,setShowSurface]=useState(true),[opacity,setOpacity]=useState(initialOpacity),[elements,setElements]=useState<VisibleElements>({points:true,labels:true,barriers:true,facilitators:true,route:true}),[status,setStatus]=useState(''),[zoomToExtentToken,setZoomToExtentToken]=useState<number|null>(null);
  const captureRef=useRef<HTMLDivElement>(null),visiblePoints=elements.points?points:[],routeCoordinates=showRouteLayer&&elements.route&&!providedRoutes?route?.coordinates??[]:[],routes=showRouteLayer&&elements.route?(providedRoutes??(routeCoordinates.length>1?[{coordinates:routeCoordinates,color:'#00f0ff'}]:[])):[];
  const surface=showSurface&&surfaceImageUrl?{imageUrl:surfaceImageUrl,extent:studyExtent,opacity}:undefined,mdtSurface=showSurface&&surfaceImageUrl?{imageUrl:surfaceImageUrl,opacity}:undefined;
  const map=background==='mdt'
    ? <MdtMapPanel imageUrl={mdtImageUrl} studyExtent={studyExtent} viewState={view} onViewChange={setView} points={visiblePoints} selectedPointId={selectedPointId} routes={routes} isochroneLines={lines} isochroneSurface={mdtSurface} onHover={()=>{}} zoomToStudyExtentToken={zoomToExtentToken}/>
    : <MapPanel kind={background==='historical'?'historical':background==='topographic'?'osm':'pnoa'} navigationLayer={background==='topographic'?'ign-topographic':undefined} orthophotoLayer={background==='copernicus-vhr-2021'?'copernicus-vhr-2021':'pnoa'} historicalLayer="MTN50" viewState={view} onViewChange={setView} points={visiblePoints} selectedPointId={selectedPointId} showPointLabels={elements.labels} studyExtent={studyExtent} zoomToStudyExtentToken={zoomToExtentToken} routeCoordinates={routeCoordinates} routeOverlays={providedRoutes?routes.map((item,index)=>({...item,id:`surface-route-${index}`})):undefined} isochroneLines={lines} isochroneSurface={surface} barriers={elements.barriers?barriers:[]} corridors={elements.facilitators?corridors:[]} crossings={elements.facilitators?crossings:[]}/>;
  const exportImage=async(format:'png'|'pdf')=>{if(!captureRef.current)return;setStatus(`Preparando ${format.toUpperCase()}…`);try{const canvas=captureMap(captureRef.current),data=canvas.toDataURL('image/png');if(format==='png')await savePngExport(data,`${fileBase}.png`);else{const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'}),width=pdf.internal.pageSize.getWidth(),height=pdf.internal.pageSize.getHeight(),margin=8,ratio=Math.min((width-margin*2)/canvas.width,(height-margin*2)/canvas.height);pdf.addImage(data,'PNG',(width-canvas.width*ratio)/2,(height-canvas.height*ratio)/2,canvas.width*ratio,canvas.height*ratio);await savePdfExport(new Uint8Array(pdf.output('arraybuffer')),`${fileBase}.pdf`)}setStatus('Exportación terminada.')}catch(error){setStatus(error instanceof Error?error.message:String(error))}};
  return <section className="isochrone-viewer-overlay surface-analysis-viewer" role="dialog" aria-label={title}>
    <button className="surface-viewer-close" aria-label={`Cerrar ${title}`} title="Cerrar visor" onClick={onClose}>×</button>
    <header className="isochrone-viewer-toolbar">
      <strong>{title}</strong><label>Fondo <select value={background} onChange={event=>setBackground(event.target.value as Background)}><option value="pnoa">PNOA · España</option><option value="copernicus-vhr-2021">Copernicus VHR 2021 · Europa · 2 m</option><option value="mdt">Modelo Digital del Terreno</option><option value="topographic">Topográfico IGN</option><option value="historical">Cartografía histórica MTN50</option></select></label>
      {surfaceImageUrl&&<><label className="check"><input type="checkbox" checked={showSurface} onChange={event=>setShowSurface(event.target.checked)}/>{surfaceLabel}</label>{showSurface&&<label>Opacidad <input type="range" min="0.15" max="0.9" step="0.05" value={opacity} onChange={event=>setOpacity(Number(event.target.value))}/><span>{Math.round(opacity*100)} %</span></label>}</>}
      <button onClick={()=>void exportImage('png')}>Exportar PNG</button><button onClick={()=>void exportImage('pdf')}>Exportar PDF</button><button onClick={()=>window.print()}>Imprimir</button><button onClick={()=>setZoomToExtentToken(value=>(value??0)+1)}>Zoom al área seleccionada</button><button onClick={()=>setView(initialView)}>Restablecer vista</button>
    </header>
    <div className="surface-viewer-elements"><b>Elementos</b>{([['points','Puntos'],['labels','Nombres'],['barriers','Barreras'],['facilitators','Facilitadores']] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={elements[key]} onChange={event=>setElements(current=>({...current,[key]:event.target.checked}))}/>{label}</label>)}{showRouteLayer&&<label><input type="checkbox" checked={elements.route} disabled={!route?.coordinates?.length&&!providedRoutes?.length} onChange={event=>setElements(current=>({...current,route:event.target.checked}))}/>{providedRoutes?'Tramos calculados':'Ruta calculada'}</label>}{status&&<span>{status}</span>}</div>
    <div className="isochrone-viewer-map" ref={captureRef}>{map}{legend}{elevationProfiles.length>0&&<ElevationProfileOverlay routes={elevationProfiles}/>}</div>
  </section>;
}
