import {CalculationBackgroundSelect,useCalculationBackgrounds} from './CalculationBackgroundSelect';
import {calculationMapProps} from '../core/calculationBackgrounds';
import { type ReactNode, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import type { Barrier, EnabledCrossing, GeoPoint, PreferredCorridor, RouteResult, ViewshedObserverResult } from '../types';
import { MapPanel, type SharedMapView, type StudyExtent } from './MapPanel';
import { MdtMapPanel } from './MdtMapPanel';
import {ElevationProfileOverlay,type ElevationProfileRoute} from './ElevationProfileOverlay';
import {levelColor} from '../core/comparisonColors';
import {DEFAULT_CONTOUR_DISPLAY_STYLE,type ContourDisplayStyle} from '../core/contourDisplayStyle';
import {calculateViewshed} from '../services/native';
import {trackProcess} from '../core/processStatus';
import {translateText,useLanguage} from '../core/i18n';

function contourSegmentLength(a:[number,number],b:[number,number]){const radians=(value:number)=>value*Math.PI/180,lat1=radians(a[1]),lat2=radians(b[1]),dLat=lat2-lat1,dLon=radians(b[0]-a[0]),h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
function contourLength(coordinates:[number,number][]){return coordinates.slice(1).reduce((sum,point,index)=>sum+contourSegmentLength(coordinates[index],point),0)}
function contourLabelPoint(coordinates:[number,number][]):{coordinate:[number,number];rotation:number}|null{
  if(coordinates.length<5){const index=Math.floor(coordinates.length/2),a=coordinates[Math.max(0,index-1)],b=coordinates[Math.min(coordinates.length-1,index+1)];return coordinates[index]?{coordinate:coordinates[index],rotation:uprightLabelRotation(a,b)}:null}
  const cumulative=[0];for(let index=1;index<coordinates.length;index++)cumulative.push(cumulative[index-1]+contourSegmentLength(coordinates[index-1],coordinates[index]));
  const total=cumulative.at(-1)??0;if(total<=0)return null;
  let bestIndex=Math.floor(coordinates.length/2),bestScore=Infinity;
  for(let index=2;index<coordinates.length-2;index++){
    const progress=cumulative[index]/total;if(progress<.2||progress>.8)continue;
    const a=coordinates[index-2],b=coordinates[index],c=coordinates[index+2],scale=Math.cos(b[1]*Math.PI/180),ux=(b[0]-a[0])*scale,uy=b[1]-a[1],vx=(c[0]-b[0])*scale,vy=c[1]-b[1],denominator=Math.hypot(ux,uy)*Math.hypot(vx,vy);
    if(denominator===0)continue;
    const cosine=Math.max(-1,Math.min(1,(ux*vx+uy*vy)/denominator)),score=Math.acos(cosine)+Math.abs(progress-.5)*.15;
    if(score<bestScore){bestScore=score;bestIndex=index}
  }
  const a=coordinates[Math.max(0,bestIndex-2)],b=coordinates[Math.min(coordinates.length-1,bestIndex+2)];
  return coordinates[bestIndex]?{coordinate:coordinates[bestIndex],rotation:uprightLabelRotation(a,b)}:null;
}
function clipContourSegment(a:[number,number],b:[number,number],extent:[number,number,number,number]):[[number,number],[number,number]]|null{
  const [west,south,east,north]=extent,dx=b[0]-a[0],dy=b[1]-a[1];let start=0,end=1;
  for(const [p,q] of [[-dx,a[0]-west],[dx,east-a[0]],[-dy,a[1]-south],[dy,north-a[1]]] as [number,number][]){if(p===0){if(q<0)return null;continue}const ratio=q/p;if(p<0)start=Math.max(start,ratio);else end=Math.min(end,ratio);if(start>end)return null}
  return [[a[0]+start*dx,a[1]+start*dy],[a[0]+end*dx,a[1]+end*dy]];
}
function contourLabelPointInExtent(coordinates:[number,number][],extent:[number,number,number,number]){
  let longest:[[number,number],[number,number]]|null=null,length=0;
  for(let index=1;index<coordinates.length;index++){const segment=clipContourSegment(coordinates[index-1],coordinates[index],extent);if(!segment)continue;const segmentLength=contourSegmentLength(segment[0],segment[1]);if(segmentLength>length){longest=segment;length=segmentLength}}
  return longest?contourLabelPoint(longest):null;
}
function uprightLabelRotation(a:[number,number],b:[number,number]){const dx=(b[0]-a[0])*Math.cos((a[1]+b[1])*.5*Math.PI/180),dy=b[1]-a[1];let angle=Math.atan2(-dy,dx);if(angle>Math.PI/2)angle-=Math.PI;if(angle< -Math.PI/2)angle+=Math.PI;return angle}

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
  viewshedResults?:ViewshedObserverResult[];
  visibleViewshedIds?:string[];
  onViewshedVisibilityChange?:(id:string,visible:boolean)=>void;
  lines?:{level:number;coordinates:[number,number][]}[];
  peakLabels?:{coordinate:[number,number];label:string}[];
  showPeaks?:boolean;
  onShowPeaksChange?:(show:boolean)=>void;
  onPeakViewChange?:(extent:StudyExtent,limit:number,globalView:boolean)=>void;
  contourDisplayStyle?:ContourDisplayStyle;
  contourIntervalM?:number;
  onContourDisplayStyleChange?:(style:ContourDisplayStyle)=>void;
  contours?:{level:number;coordinates:[number,number][]}[];
  legend?:ReactNode;
  showRouteLayer?:boolean;
  onClose:()=>void;
}

export function SurfaceAnalysisViewer({title,points,selectedPointId,barriers,corridors,crossings,route,routes:providedRoutes,elevationProfiles=[],initialView,studyExtent,imageExtent,mdtImageUrl,rasterPath,surfaceImageUrl,initialOpacity=.55,surfaceLabel,viewshedResults=[],visibleViewshedIds,onViewshedVisibilityChange,lines=[],contours=[],peakLabels=[],showPeaks=true,onShowPeaksChange,onPeakViewChange,contourDisplayStyle,contourIntervalM,onContourDisplayStyleChange,legend,showRouteLayer=true,onClose}:Props){
  const contourMode=title==='Curvas de nivel';
  const language=useLanguage(),isViewshed=title.startsWith('Visibilidad');
  const [view,setView]=useState(initialView),[background,setBackground]=useState<string>('pnoa'),[showSurface,setShowSurface]=useState(true),[showContours,setShowContours]=useState(false),[opacity,setOpacity]=useState(initialOpacity),[elements,setElements]=useState<VisibleElements>({points:true,labels:true,barriers:true,facilitators:true,route:true}),[zoomToExtentToken,setZoomToExtentToken]=useState<number|null>(0),[localContourStyle,setLocalContourStyle]=useState(DEFAULT_CONTOUR_DISPLAY_STYLE),[showElevationLabels,setShowElevationLabels]=useState(true);
  const [viewshedMode,setViewshedMode]=useState<'both'|'visible'|'hidden'>('visible'),[observerHeight,setObserverHeight]=useState(1.7),[selectingObserver,setSelectingObserver]=useState(false),[viewshedBusy,setViewshedBusy]=useState(false),[viewshedError,setViewshedError]=useState(''),[pickedViewsheds,setPickedViewsheds]=useState<ViewshedObserverResult[]>([]),[visiblePickedIds,setVisiblePickedIds]=useState<string[]>([]);
  const [viewshedPanelCollapsed,setViewshedPanelCollapsed]=useState(false),[viewshedPanelOffset,setViewshedPanelOffset]=useState({x:0,y:0}),viewshedPanelDrag=useRef<{pointerId:number;pointerX:number;pointerY:number;offsetX:number;offsetY:number;rect:DOMRect;parent:DOMRect}|null>(null),mapContainer=useRef<HTMLDivElement>(null);
  const displayStyle=contourDisplayStyle??localContourStyle,contourColor=displayStyle.color,contourStyle=displayStyle.mode,majorInterval=displayStyle.majorInterval,changeContourStyle=(update:Partial<ContourDisplayStyle>)=>{const next={...displayStyle,...update};setLocalContourStyle(next);onContourDisplayStyleChange?.(next)};
  const {externalLayers,options}=useCalculationBackgrounds(true),activeBackground=options.some(option=>option.id===background)?background:'pnoa';
  const visiblePoints=elements.points?points:[],routeCoordinates=showRouteLayer&&elements.route&&!providedRoutes?route?.coordinates??[]:[],routes=showRouteLayer&&elements.route?(providedRoutes??(routeCoordinates.length>1?[{coordinates:routeCoordinates,color:'#00f0ff'}]:[])):[];
  const allViewsheds=[...viewshedResults,...pickedViewsheds],activeViewsheds=allViewsheds.filter(item=>pickedViewsheds.some(picked=>picked.observerId===item.observerId)?visiblePickedIds.includes(item.observerId):(visibleViewshedIds?.includes(item.observerId)??true));
  const combinedViewshedImage=useMemo(()=>{if(!isViewshed)return surfaceImageUrl??'';if(!activeViewsheds.length)return allViewsheds.length?'':surfaceImageUrl??'';const first=activeViewsheds[0],scale=Math.min(1,2048/first.surfaceWidth,2048/first.surfaceHeight),width=Math.max(1,Math.floor(first.surfaceWidth*scale)),height=Math.max(1,Math.floor(first.surfaceHeight*scale)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d');if(!context)return surfaceImageUrl??'';const image=context.createImageData(width,height);for(let row=0;row<height;row++)for(let col=0;col<width;col++){const pixel=Math.min(first.surfaceHeight-1,Math.floor(row/scale))*first.surfaceWidth+Math.min(first.surfaceWidth-1,Math.floor(col/scale));let visible=false,known=false;for(const result of activeViewsheds){const value=result.surfaceValues[pixel];if(value<0||!Number.isFinite(value))continue;known=true;if(value>0){visible=true;break}}if(!known)continue;const isVisible=visible;if(viewshedMode==='visible'&&!isVisible||viewshedMode==='hidden'&&isVisible)continue;const offset=(row*width+col)*4;image.data.set(isVisible?[35,225,105,210]:[235,70,70,185],offset)}context.putImageData(image,0,0);return canvas.toDataURL('image/png')},[isViewshed,activeViewsheds,allViewsheds.length,surfaceImageUrl,viewshedMode]);
  const shownSurfaceImage=isViewshed?combinedViewshedImage:surfaceImageUrl;
  const surfaceExtent=imageExtent??studyExtent,surface=showSurface&&shownSurfaceImage?{imageUrl:shownSurfaceImage,extent:surfaceExtent,opacity}:undefined,mdtSurface=showSurface&&shownSurfaceImage?{imageUrl:shownSurfaceImage,opacity}:undefined;
  const pickViewshed=(coordinate:[number,number])=>{if(!rasterPath||viewshedBusy)return;setSelectingObserver(false);setViewshedBusy(true);setViewshedError('');void trackProcess(async process=>{try{const result=await calculateViewshed(rasterPath,[{id:`interactive-map-${Date.now()}`,name:`${translateText('Punto',language)} ${coordinate[0].toFixed(5)}, ${coordinate[1].toFixed(5)}`,coordinate}],observerHeight),observer=result.observers[0];if(!observer)throw new Error(translateText('No se pudo calcular la visibilidad desde el punto seleccionado.',language));setPickedViewsheds(current=>[...current,observer]);setVisiblePickedIds(current=>[...current,observer.observerId]);setViewshedMode('visible')}catch(error){process.fail();setViewshedError(error instanceof Error?error.message:translateText('No se pudo calcular la visibilidad desde el punto seleccionado.',language))}finally{setViewshedBusy(false)}})};
  const startViewshedPanelDrag=(event:PointerEvent<HTMLElement>)=>{if(event.target instanceof Element&&event.target.closest('button'))return;const panel=event.currentTarget.parentElement,parent=mapContainer.current;if(!panel||!parent)return;viewshedPanelDrag.current={pointerId:event.pointerId,pointerX:event.clientX,pointerY:event.clientY,offsetX:viewshedPanelOffset.x,offsetY:viewshedPanelOffset.y,rect:panel.getBoundingClientRect(),parent:parent.getBoundingClientRect()};event.currentTarget.setPointerCapture(event.pointerId)};
  const moveViewshedPanelDrag=(event:PointerEvent<HTMLElement>)=>{const drag=viewshedPanelDrag.current;if(!drag||drag.pointerId!==event.pointerId)return;const dx=Math.max(drag.parent.left-drag.rect.left,Math.min(drag.parent.right-drag.rect.right,event.clientX-drag.pointerX)),dy=Math.max(drag.parent.top-drag.rect.top,Math.min(drag.parent.bottom-drag.rect.bottom,event.clientY-drag.pointerY));setViewshedPanelOffset({x:drag.offsetX+dx,y:drag.offsetY+dy})};
  const endViewshedPanelDrag=(event:PointerEvent<HTMLElement>)=>{if(viewshedPanelDrag.current?.pointerId===event.pointerId){viewshedPanelDrag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}};
  const contourLevels=useMemo(()=>[...new Set((contourMode?lines:contours).map(line=>line.level))].sort((a,b)=>a-b),[contourMode,lines,contours]);
  const studyWidthM=(studyExtent[2]-studyExtent[0])*111320*Math.cos((studyExtent[1]+studyExtent[3])*.5*Math.PI/180),studyHeightM=(studyExtent[3]-studyExtent[1])*110540,viewWidthM=view.extent?(view.extent[2]-view.extent[0])*111320*Math.cos((view.extent[1]+view.extent[3])*.5*Math.PI/180):0,viewHeightM=view.extent?(view.extent[3]-view.extent[1])*110540:0,zoomFactor=viewWidthM>0&&viewHeightM>0?Math.max(1,Math.min(studyWidthM/viewWidthM,studyHeightM/viewHeightM)):initialView.resolution/Math.max(view.resolution,Number.EPSILON),globalPeakView=zoomFactor<1.15,zoomPeakLimit=globalPeakView?1:zoomFactor<2.5?3:6,labelInterval=zoomFactor<2?(majorInterval||5)*2:(majorInterval||5),labelsPerLevel=zoomFactor<2?1:2,highZoom=zoomFactor>=4;
  useEffect(()=>{if(contourMode&&view.extent)onPeakViewChange?.(view.extent,showPeaks?zoomPeakLimit:0,globalPeakView)},[contourMode,view.extent,showPeaks,zoomPeakLimit,globalPeakView,onPeakViewChange]);
  const isLabelledContourLevel=(level:number)=>{const index=contourLevels.indexOf(level),contourIndex=contourIntervalM&&contourIntervalM>0?Math.round(level/contourIntervalM):index;return index===0||index===contourLevels.length-1||((contourIndex%labelInterval)+labelInterval)%labelInterval===0};
  const labelledLines=contourMode?lines.filter(line=>isLabelledContourLevel(line.level)):[];
  const labelledSegmentsByLevel=new Map<number,{line:{level:number;coordinates:[number,number][]};length:number}[]>();
  const labelPointsByLine=new Map<{level:number;coordinates:[number,number][]},{coordinate:[number,number];rotation:number}>();
  if(highZoom&&view.extent){for(const line of labelledLines){const labelPoint=contourLabelPointInExtent(line.coordinates,view.extent);if(labelPoint){labelledSegmentsByLevel.set(line.level,[...(labelledSegmentsByLevel.get(line.level)??[]),{line,length:contourLength(line.coordinates)}]);labelPointsByLine.set(line,labelPoint)}}}
  else for(const line of labelledLines){const labelPoint=contourLabelPoint(line.coordinates);if(!labelPoint)continue;const segments=labelledSegmentsByLevel.get(line.level)??[];segments.push({line,length:contourLength(line.coordinates)});labelledSegmentsByLevel.set(line.level,segments);labelPointsByLine.set(line,labelPoint)}
  const spacedLabelLines=new Set<{level:number;coordinates:[number,number][]}>(),acceptedLabelCoordinates:[number,number][]=[];
  const rankedLabelLines=[...labelPointsByLine.entries()].sort((a,b)=>contourLength(b[0].coordinates)-contourLength(a[0].coordinates));
  for(const [line,labelPoint] of rankedLabelLines){const [lon,lat]=labelPoint.coordinate,minDistance=view.resolution*260*Math.cos(lat*Math.PI/180),tooClose=acceptedLabelCoordinates.some(([otherLon,otherLat])=>Math.hypot((lon-otherLon)*111320*Math.cos((lat+otherLat)*.5*Math.PI/180),(lat-otherLat)*110540)<minDistance);if(!tooClose){spacedLabelLines.add(line);acceptedLabelCoordinates.push(labelPoint.coordinate)}}
  const labelledMasterSegments=new Set<{level:number;coordinates:[number,number][]}>();
  for(const segments of labelledSegmentsByLevel.values())for(const segment of segments.sort((a,b)=>b.length-a.length).slice(0,highZoom?segments.length:labelsPerLevel))if(spacedLabelLines.has(segment.line))labelledMasterSegments.add(segment.line);
  const styleContourLine=(line:{level:number;coordinates:[number,number][]},labelThisSegment=false)=>{const levelIndex=contourLevels.indexOf(line.level),contourIndex=contourIntervalM&&contourIntervalM>0?Math.round(line.level/contourIntervalM):levelIndex,major=majorInterval!==0&&((contourIndex%majorInterval)+majorInterval)%majorInterval===0,colorByElevation=contourMode&&contourStyle==='elevation',lineColor=contourMode&&!colorByElevation?contourColor:levelColor(levelIndex,contourLevels.length),label=contourMode&&showElevationLabels&&isLabelledContourLevel(line.level)?`${line.level.toLocaleString('es-ES',{maximumFractionDigits:1})} m`:undefined,labelPoint=label&&labelThisSegment?(labelPointsByLine.get(line)??contourLabelPoint(line.coordinates)):null,labelPoints=labelPoint? [labelPoint.coordinate]:undefined,labelRotation=labelPoint?.rotation;return{...line,color:lineColor,width:contourMode?(major?2.2:1):undefined,label,labelPoints,labelRotation,halo:contourMode?(colorByElevation?'#ffffff':contourColor==='#111111'?'#ffffff':'#111111'):undefined,labelColor:colorByElevation?'#111111':lineColor}};
  const visibleLines=contourMode?lines.map(line=>styleContourLine(line,labelledMasterSegments.has(line))):showContours?[...lines,...contours.map(line=>styleContourLine(line))]:lines;
  const contourLegend=showContours&&contourLevels.length>0?<div className="isochrone-viewer-legend contour-viewer-legend"><b>Curvas de nivel</b>{contourLevels.map((level,index)=><span key={level}><i style={{background:levelColor(index,contourLevels.length)}}/>{level.toLocaleString('es-ES',{maximumFractionDigits:1})} m</span>)}</div>:null;
  const map=activeBackground==='mdt'
    ? <MdtMapPanel imageUrl={mdtImageUrl} rasterPath={rasterPath} measurementTools studyExtent={studyExtent} imageExtent={imageExtent} viewState={view} onViewChange={setView} points={visiblePoints} selectedPointId={selectedPointId} routes={routes} isochroneLines={visibleLines} peakLabels={peakLabels} isochroneSurface={mdtSurface} onHover={()=>{}} onMapPick={selectingObserver?pickViewshed:undefined} zoomToStudyExtentToken={zoomToExtentToken}/>
    : <MapPanel {...calculationMapProps(activeBackground,externalLayers)} rasterPath={rasterPath} measurementTools viewState={view} onViewChange={setView} points={visiblePoints} selectedPointId={selectedPointId} showPointLabels={elements.labels} studyExtent={studyExtent} zoomToStudyExtentToken={zoomToExtentToken} routeCoordinates={routeCoordinates} routeOverlays={providedRoutes?routes.map((item,index)=>({...item,id:`surface-route-${index}`})):undefined} isochroneLines={visibleLines} peakLabels={peakLabels} isochroneSurface={surface} onMapPick={selectingObserver?pickViewshed:undefined} pickingViewshed={selectingObserver} barriers={elements.barriers?barriers:[]} corridors={elements.facilitators?corridors:[]} crossings={elements.facilitators?crossings:[]}/>;
  return <section className="isochrone-viewer-overlay surface-analysis-viewer" role="dialog" aria-label={title}>
    <button className="surface-viewer-close" aria-label={`Cerrar ${title}`} title="Cerrar visor" onClick={onClose}>×</button>
    <header className="isochrone-viewer-toolbar">
      <strong>{title}</strong><label>Fondo <CalculationBackgroundSelect value={activeBackground} onChange={setBackground} options={options}/></label>
      {contourMode&&<><label>Estilo <select value={contourStyle} onChange={event=>changeContourStyle({mode:event.target.value as 'topographic'|'elevation'})}><option value="topographic">Topográfico</option><option value="elevation">Color por altitud</option></select></label>{contourStyle==='topographic'&&<label>Trazo <select value={contourColor} onChange={event=>changeContourStyle({color:event.target.value as ContourDisplayStyle['color']})}><option value="#ffffff">Blanco</option><option value="#111111">Negro</option><option value="#ff8c00">Naranja</option><option value="#d8ff55">Lima</option></select></label>}<label>Curva maestra <select value={majorInterval} onChange={event=>changeContourStyle({majorInterval:Number(event.target.value) as 0|3|5|10})}><option value={0}>Sin curva maestra</option><option value={3}>Cada 3 curvas</option><option value={5}>Cada 5 curvas</option><option value={10}>Cada 10 curvas</option></select></label></>}
      {surfaceImageUrl&&!isViewshed&&<><label className="check"><input type="checkbox" checked={showSurface} onChange={event=>setShowSurface(event.target.checked)}/>{surfaceLabel}</label>{showSurface&&<label>Opacidad <input type="range" min="0.15" max="0.9" step="0.05" value={opacity} onChange={event=>setOpacity(Number(event.target.value))}/><span>{Math.round(opacity*100)} %</span></label>}</>}
      {!contourMode&&<><button onClick={()=>setZoomToExtentToken(value=>(value??0)+1)}>Zoom al área seleccionada</button><button onClick={()=>setView(initialView)}>Restablecer vista</button></>}
    </header>
    <div className="surface-viewer-elements"><b>Elementos</b>{([['points','Puntos'],['labels','Nombres'],['barriers','Barreras'],['facilitators','Facilitadores']] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={elements[key]} onChange={event=>setElements(current=>({...current,[key]:event.target.checked}))}/>{label}</label>)}{showRouteLayer&&<label><input type="checkbox" checked={elements.route} disabled={!route?.coordinates?.length&&!providedRoutes?.length} onChange={event=>setElements(current=>({...current,route:event.target.checked}))}/>{providedRoutes?'Tramos calculados':'Ruta calculada'}</label>}{contours.length>0&&<label><input type="checkbox" checked={showContours} onChange={event=>setShowContours(event.target.checked)}/>Curvas de nivel</label>}{contourMode&&<><label><input type="checkbox" checked={showElevationLabels} onChange={event=>setShowElevationLabels(event.target.checked)}/>Mostrar cotas</label>{onShowPeaksChange&&<label><input type="checkbox" checked={showPeaks} onChange={event=>onShowPeaksChange(event.target.checked)}/>Mostrar cumbres</label>}</>}</div>

    <div ref={mapContainer} className={`isochrone-viewer-map${selectingObserver?' viewshed-picking':''}`}>{map}{(!contourMode||contourStyle==='elevation')&&legend}{contourLegend}{elevationProfiles.length>0&&<ElevationProfileOverlay movable routes={elevationProfiles}/>}{isViewshed&&<section className={`terrain-viewshed-panel ${viewshedPanelCollapsed?'collapsed':''}`} style={{transform:`translate(${viewshedPanelOffset.x}px, ${viewshedPanelOffset.y}px)`}}><div className="terrain-viewshed-header" onPointerDown={startViewshedPanelDrag} onPointerMove={moveViewshedPanelDrag} onPointerUp={endViewshedPanelDrag} onPointerCancel={endViewshedPanelDrag}><b>{translateText('Panel de visibilidad',language)}</b><button type="button" aria-label={translateText(viewshedPanelCollapsed?'Desplegar panel de visibilidad':'Plegar panel de visibilidad',language)} title={translateText(viewshedPanelCollapsed?'Desplegar':'Plegar',language)} onClick={()=>setViewshedPanelCollapsed(value=>!value)}>{viewshedPanelCollapsed?'▾':'▴'}</button><small aria-hidden="true">⠿</small></div>{!viewshedPanelCollapsed&&<div className="terrain-viewshed-settings">{allViewsheds.length>0&&<div className="terrain-viewshed-observers" aria-label={translateText('Observadores calculados',language)}>{allViewsheds.map((item,index)=>{const picked=pickedViewsheds.some(result=>result.observerId===item.observerId),checked=picked?visiblePickedIds.includes(item.observerId):(visibleViewshedIds?.includes(item.observerId)??true);return <label className="terrain-viewshed-observer" key={item.observerId}><input type="checkbox" checked={checked} onChange={event=>picked?setVisiblePickedIds(current=>event.target.checked?[...current,item.observerId]:current.filter(id=>id!==item.observerId)):onViewshedVisibilityChange?.(item.observerId,event.target.checked)}/><span>{item.observerId.startsWith('interactive-')?`${translateText('Punto de observación',language)} (${item.coordinate[0].toFixed(5)}, ${item.coordinate[1].toFixed(5)})`:item.observerName||`${translateText('Punto',language)} ${index+1}`}</span></label>})}</div>}<label>{translateText('Áreas visibles',language)}<select aria-label={translateText('Áreas del viewshed 3D',language)} value={viewshedMode} onChange={event=>setViewshedMode(event.target.value as typeof viewshedMode)}><option value="both">{translateText('Visibles e invisibles',language)}</option><option value="visible">{translateText('Solo visibles',language)}</option><option value="hidden">{translateText('Solo invisibles',language)}</option></select></label><button type="button" className={`terrain-viewshed-pick${selectingObserver?' active':''}`} disabled={viewshedBusy||!rasterPath} onClick={()=>{setViewshedError('');setSelectingObserver(value=>!value)}}>{translateText(viewshedBusy?'Calculando visibilidad…':selectingObserver?'Cancelar selección':'Calcular desde un punto del terreno',language)}</button>{selectingObserver&&!viewshedBusy&&<small>{translateText('Haz clic en cualquier punto de la superficie del terreno.',language)}</small>}{viewshedError&&<small role="alert">{viewshedError}</small>}<label>{translateText('Altura del observador',language)}<span className="terrain-viewshed-height"><input aria-label={translateText('Altura del observador desde el terreno',language)} type="number" min="0" max="1000" step="0.1" value={observerHeight} onChange={event=>setObserverHeight(Math.max(0,Number(event.target.value)||0))}/> m</span></label><label className="terrain-viewshed-opacity"><span>{translateText('Opacidad',language)}</span><output>{Math.round(opacity*100)} %</output><input aria-label={translateText('Opacidad del viewshed 3D',language)} type="range" min="0" max="1" step="0.01" value={opacity} onChange={event=>setOpacity(Number(event.target.value))}/></label></div>}</section>}</div>
  </section>;
}
