import {useState} from 'react';
import type {RouteResult} from '../types';
import {elevationProfileSamples,profileExtent,sequenceElevationProfiles} from '../core/elevationProfile';
import '../elevation-profile.css';

export interface ElevationProfileRoute{label:string;color:string;result:RouteResult}

export function ElevationProfileOverlay({routes}:{routes:ElevationProfileRoute[]}){
 const[collapsed,setCollapsed]=useState(false),rawSeries=routes.map(route=>({...route,samples:elevationProfileSamples(route.result)})).filter(item=>item.samples.length>1),sequential=routes.length>1&&routes.every(route=>route.label.startsWith('Tramo ')),sequencedSamples=sequential?sequenceElevationProfiles(rawSeries.map(item=>item.samples)):rawSeries.map(item=>item.samples),series=rawSeries.map((item,index)=>({...item,samples:sequencedSamples[index]})),extent=profileExtent(series.map(item=>item.samples)),showSeriesLegend=routes.every(route=>route.label==='Ida'||route.label==='Vuelta');
 if(!extent)return null;
 const width=560,height=190,left=48,right=14,top=27,bottom=34,plotWidth=width-left-right,plotHeight=height-top-bottom,x=(distance:number)=>left+distance/Math.max(1,extent.maxDistanceM)*plotWidth,y=(elevation:number)=>top+(extent.maxElevationM-elevation)/(extent.maxElevationM-extent.minElevationM)*plotHeight,km=extent.maxDistanceM>=1000;
 return <aside className={`elevation-profile-overlay${collapsed?' collapsed':''}`} aria-label="Perfil altimétrico de la ruta">
  <header><b>Perfil altimétrico</b>{showSeriesLegend&&<span>{series.map(item=><i key={item.label}><em style={{background:item.color}}/>{item.label}</i>)}</span>}<button style={{marginLeft:'auto'}} aria-label={collapsed?'Mostrar perfil altimétrico':'Ocultar perfil altimétrico'} onClick={()=>setCollapsed(value=>!value)}>{collapsed?'▴':'▾'}</button></header>
  {!collapsed&&<svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cota en metros según distancia acumulada">
   <rect x={left} y={top} width={plotWidth} height={plotHeight}/>
   {[0,.5,1].map(value=>{const elevation=extent.maxElevationM-(extent.maxElevationM-extent.minElevationM)*value,position=y(elevation);return <g key={value}><line x1={left} y1={position} x2={width-right} y2={position}/><text x={left-7} y={position+4} textAnchor="end">{elevation.toFixed(0)}</text></g>})}
   {[0,.5,1].map(value=>{const distance=extent.maxDistanceM*value,position=x(distance);return <g key={value}><line x1={position} y1={top} x2={position} y2={height-bottom}/><text x={position} y={height-12} textAnchor="middle">{(km?distance/1000:distance).toFixed(value===0?0:1)}</text></g>})}
   {series.map(item=><polyline key={item.label} points={item.samples.map(sample=>`${x(sample.distanceM)},${y(sample.elevationM)}`).join(' ')} style={{stroke:item.color}}/>)}
   <text className="axis-label" x={12} y={17}>Cota (m)</text><text className="axis-label" x={width-right} y={height-12} textAnchor="end">Distancia ({km?'km':'m'})</text>
  </svg>}
 </aside>
}
