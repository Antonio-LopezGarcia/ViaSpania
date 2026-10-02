import {CalculationBackgroundSelect,useCalculationBackgrounds} from './CalculationBackgroundSelect';
import {calculationMapProps} from '../core/calculationBackgrounds';
import { type ReactNode, useMemo, useState } from 'react';
import type { Barrier, EnabledCrossing, GeoPoint, PreferredCorridor, RouteResult } from '../types';
import { MapPanel, type SharedMapView, type StudyExtent } from './MapPanel';
import { MdtMapPanel } from './MdtMapPanel';
import {ElevationProfileOverlay,type ElevationProfileRoute} from './ElevationProfileOverlay';
import {levelColor} from '../core/comparisonColors';

interface VisibleElements { points:boolean; labels:boolean; barriers:boolean; facilitators:boolean; route:boolean }

interface Props {
  title:string;
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
  imageExtent?:StudyExtent;
  mdtImageUrl:string;
  rasterPath?:string;
  surfaceImageUrl?:string;
  initialOpacity?:number;
  surfaceLabel?:string;
  lines?:{level:number;coordinates:[number,number][]}[];
  contours?:{level:number;coordinates:[number,number][]}[];
  legend?:ReactNode;
  showRouteLayer?:boolean;
  onClose:()=>void;
}

export function SurfaceAnalysisViewer({title,points,selectedPointId,barriers,corridors,crossings,route,routes:providedRoutes,elevationProfiles=[],initialView,studyExtent,imageExtent,mdtImageUrl,rasterPath,surfaceImageUrl,initialOpacity=.55,surfaceLabel,lines=[],contours=[],legend,showRouteLayer=true,onClose}:Props){
  const [view,setView]=useState(initialView),[background,setBackground]=useState<string>('pnoa'),[showSurface,setShowSurface]=useState(true),[showContours,setShowContours]=useState(false),[opacity,setOpacity]=useState(initialOpacity),[elements,setElements]=useState<VisibleElements>({points:true,labels:true,barriers:true,facilitators:true,route:true}),[zoomToExtentToken,setZoomToExtentToken]=useState<number|null>(0);
  const {externalLayers,options}=useCalculationBackgrounds(true),activeBackground=options.some(option=>option.id===background)?background:'pnoa';
  const visiblePoints=elements.points?points:[],routeCoordinates=showRouteLayer&&elements.route&&!providedRoutes?route?.coordinates??[]:[],routes=showRouteLayer&&elements.route?(providedRoutes??(routeCoordinates.length>1?[{coordinates:routeCoordinates,color:'#00f0ff'}]:[])):[];
  const surfaceExtent=imageExtent??studyExtent,surface=showSurface&&surfaceImageUrl?{imageUrl:surfaceImageUrl,extent:surfaceExtent,opacity}:undefined,mdtSurface=showSurface&&surfaceImageUrl?{imageUrl:surfaceImageUrl,opacity}:undefined;
  const contourLevels=useMemo(()=>[...new Set(contours.map(line=>line.level))].sort((a,b)=>a-b),[contours]),visibleLines=showContours?[...lines,...contours.map(line=>({...line,color:levelColor(contourLevels.indexOf(line.level),contourLevels.length)}))]:lines;
  const contourLegend=showContours&&contourLevels.length>0?<div className="isochrone-viewer-legend contour-viewer-legend"><b>Curvas de nivel</b>{contourLevels.map((level,index)=><span key={level}><i style={{background:levelColor(index,contourLevels.length)}}/>{level.toLocaleString('es-ES',{maximumFractionDigits:1})} m</span>)}</div>:null;
  const map=activeBackground==='mdt'
    ? <MdtMapPanel imageUrl={mdtImageUrl} rasterPath={rasterPath} measurementTools studyExtent={studyExtent} imageExtent={imageExtent} viewState={view} onViewChange={setView} points={visiblePoints} selectedPointId={selectedPointId} routes={routes} isochroneLines={visibleLines} isochroneSurface={mdtSurface} onHover={()=>{}} zoomToStudyExtentToken={zoomToExtentToken}/>
    : <MapPanel {...calculationMapProps(activeBackground,externalLayers)} rasterPath={rasterPath} measurementTools viewState={view} onViewChange={setView} points={visiblePoints} selectedPointId={selectedPointId} showPointLabels={elements.labels} studyExtent={studyExtent} zoomToStudyExtentToken={zoomToExtentToken} routeCoordinates={routeCoordinates} routeOverlays={providedRoutes?routes.map((item,index)=>({...item,id:`surface-route-${index}`})):undefined} isochroneLines={visibleLines} isochroneSurface={surface} barriers={elements.barriers?barriers:[]} corridors={elements.facilitators?corridors:[]} crossings={elements.facilitators?crossings:[]}/>;
  return <section className="isochrone-viewer-overlay surface-analysis-viewer" role="dialog" aria-label={title}>
    <button className="surface-viewer-close" aria-label={`Cerrar ${title}`} title="Cerrar visor" onClick={onClose}>×</button>
    <header className="isochrone-viewer-toolbar">
      <strong>{title}</strong><label>Fondo <CalculationBackgroundSelect value={activeBackground} onChange={setBackground} options={options}/></label>
      {surfaceImageUrl&&<><label className="check"><input type="checkbox" checked={showSurface} onChange={event=>setShowSurface(event.target.checked)}/>{surfaceLabel}</label>{showSurface&&<label>Opacidad <input type="range" min="0.15" max="0.9" step="0.05" value={opacity} onChange={event=>setOpacity(Number(event.target.value))}/><span>{Math.round(opacity*100)} %</span></label>}</>}
      <button onClick={()=>setZoomToExtentToken(value=>(value??0)+1)}>Zoom al área seleccionada</button><button onClick={()=>setView(initialView)}>Restablecer vista</button>
    </header>
    <div className="surface-viewer-elements"><b>Elementos</b>{([['points','Puntos'],['labels','Nombres'],['barriers','Barreras'],['facilitators','Facilitadores']] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={elements[key]} onChange={event=>setElements(current=>({...current,[key]:event.target.checked}))}/>{label}</label>)}{showRouteLayer&&<label><input type="checkbox" checked={elements.route} disabled={!route?.coordinates?.length&&!providedRoutes?.length} onChange={event=>setElements(current=>({...current,route:event.target.checked}))}/>{providedRoutes?'Tramos calculados':'Ruta calculada'}</label>}{contours.length>0&&<label><input type="checkbox" checked={showContours} onChange={event=>setShowContours(event.target.checked)}/>Curvas de nivel</label>}</div>
    <div className="isochrone-viewer-map">{map}{legend}{contourLegend}{elevationProfiles.length>0&&<ElevationProfileOverlay movable routes={elevationProfiles}/>}</div>
  </section>;
}
