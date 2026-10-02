import {useRef,useState,type PointerEvent} from 'react';
import type {RouteResult} from '../types';
import {elevationProfileSamples,profileExtent,sequenceElevationProfiles} from '../core/elevationProfile';
import '../elevation-profile.css';

export interface ElevationProfileRoute{label:string;color:string;result:RouteResult}

export function ElevationProfileOverlay({routes,compact=false,movable=false,placement='bottom-left'}:{routes:ElevationProfileRoute[];compact?:boolean;movable?:boolean;placement?:'bottom-left'|'bottom-right'}){
 const[collapsed,setCollapsed]=useState(false),[offset,setOffset]=useState({x:0,y:0}),drag=useRef<{pointerId:number;pointerX:number;pointerY:number;offsetX:number;offsetY:number;rect:DOMRect;parent:DOMRect}|null>(null),rawSeries=routes.map(route=>({...route,samples:elevationProfileSamples(route.result)})).filter(item=>item.samples.length>1),sequential=routes.length>1&&routes.every(route=>route.label.startsWith('Tramo ')),sequencedSamples=sequential?sequenceElevationProfiles(rawSeries.map(item=>item.samples)):rawSeries.map(item=>item.samples),series=rawSeries.map((item,index)=>({...item,samples:sequencedSamples[index]})),extent=profileExtent(series.map(item=>item.samples)),showSeriesLegend=routes.every(route=>route.label==='Ida'||route.label==='Vuelta');
 if(!extent)return null;
 const startDrag=(event:PointerEvent<HTMLElement>)=>{if(!movable||(event.target instanceof Element&&event.target.closest('button')))return;const panel=event.currentTarget.parentElement;if(!panel?.parentElement)return;drag.current={pointerId:event.pointerId,pointerX:event.clientX,pointerY:event.clientY,offsetX:offset.x,offsetY:offset.y,rect:panel.getBoundingClientRect(),parent:panel.parentElement.getBoundingClientRect()};event.currentTarget.setPointerCapture(event.pointerId)};
 const moveDrag=(event:PointerEvent<HTMLElement>)=>{const state=drag.current;if(!state||state.pointerId!==event.pointerId)return;const dx=Math.max(state.parent.left-state.rect.left,Math.min(state.parent.right-state.rect.right,event.clientX-state.pointerX)),dy=Math.max(state.parent.top-state.rect.top,Math.min(state.parent.bottom-state.rect.bottom,event.clientY-state.pointerY));setOffset({x:state.offsetX+dx,y:state.offsetY+dy})};
 const endDrag=(event:PointerEvent<HTMLElement>)=>{if(drag.current?.pointerId===event.pointerId){drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}};
 const width=560,height=190,left=48,right=14,top=27,bottom=34,plotWidth=width-left-right,plotHeight=height-top-bottom,x=(distance:number)=>left+distance/Math.max(1,extent.maxDistanceM)*plotWidth,y=(elevation:number)=>top+(extent.maxElevationM-elevation)/(extent.maxElevationM-extent.minElevationM)*plotHeight,km=extent.maxDistanceM>=1000,gridStep=km?5000:5,gridDistances=Array.from({length:Math.floor(extent.maxDistanceM/gridStep)},(_,index)=>(index+1)*gridStep).filter(distance=>plotWidth*gridStep/Math.max(1,extent.maxDistanceM)>=18);
 return <aside className={`elevation-profile-overlay${collapsed?' collapsed':''}${compact?' compact':''}${movable?' movable':''}${placement==='bottom-right'?' bottom-right':''}`} style={movable?{transform:`translate(${offset.x}px, ${offset.y}px)`}:undefined} aria-label="Perfil altimétrico de la ruta">
  <header onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}><b>Perfil altimétrico</b>{showSeriesLegend&&<span>{series.map(item=><i key={item.label}><em style={{background:item.color}}/>{item.label}</i>)}</span>}<button style={{marginLeft:'auto'}} aria-label={collapsed?'Mostrar perfil altimétrico':'Ocultar perfil altimétrico'} onClick={()=>setCollapsed(value=>!value)}>{collapsed?'▴':'▾'}</button>{movable&&<small className="elevation-profile-drag-hint" aria-hidden="true">⠿</small>}</header>
  {!collapsed&&<svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cota en metros según distancia acumulada">
   <rect x={left} y={top} width={plotWidth} height={plotHeight}/>
   {gridDistances.map(distance=><line key={distance} className="distance-grid-line" x1={x(distance)} y1={top} x2={x(distance)} y2={height-bottom}/>)}
   {[0,.5,1].map(value=>{const elevation=extent.maxElevationM-(extent.maxElevationM-extent.minElevationM)*value,position=y(elevation);return <g key={value}><line x1={left} y1={position} x2={width-right} y2={position}/><text x={left-7} y={position+4} textAnchor="end">{elevation.toFixed(0)}</text></g>})}
   {[0,.5,1].map(value=>{const distance=extent.maxDistanceM*value,position=x(distance);return <g key={value}><line x1={position} y1={top} x2={position} y2={height-bottom}/><text x={position} y={height-12} textAnchor="middle">{(km?distance/1000:distance).toFixed(value===0?0:1)}</text></g>})}
   {series.map(item=><polyline key={item.label} points={item.samples.map(sample=>`${x(sample.distanceM)},${y(sample.elevationM)}`).join(' ')} style={{stroke:item.color}}/>)}
   <text className="axis-label" x={12} y={17}>Cota (m)</text><text className="axis-label" x={width-right-18} y={height-12} textAnchor="end">Distancia ({km?'km':'m'})</text>
  </svg>}
 </aside>
}
