import {useState} from 'react';
import type { Barrier, EnabledCrossing, GeoPoint, PreferredCorridor, RouteResult } from '../types';
import type { SharedMapView, StudyExtent } from './MapPanel';
import { SurfaceAnalysisViewer } from './SurfaceAnalysisViewer';

interface DisplayRoute {result:RouteResult;color:string;label:string}
interface Props {title:string;points:GeoPoint[];selectedPointId:number|null;barriers:Barrier[];corridors:PreferredCorridor[];crossings:EnabledCrossing[];routes:DisplayRoute[];showElevationProfile?:boolean;routeLegendTitle?:string;initialView:SharedMapView;studyExtent:StudyExtent;mdtImageUrl:string;onClose:()=>void}

export function RouteViewer({routes,showElevationProfile=true,routeLegendTitle='Rutas visibles',...props}:Props){
  const [hidden,setHidden]=useState<Set<number>>(()=>new Set()),visible=routes.filter((_,index)=>!hidden.has(index)),toggle=(index:number)=>setHidden(current=>{const next=new Set(current);if(next.has(index))next.delete(index);else next.add(index);return next});
  const legend=<aside className="route-comparison-legend"><b>{routeLegendTitle}</b>{routes.map((item,index)=><label key={`${item.label}-${index}`}><input type="checkbox" checked={!hidden.has(index)} onChange={()=>toggle(index)}/><i style={{background:item.color}}/><span>{item.label}</span></label>)}</aside>;
  return <SurfaceAnalysisViewer {...props} route={null} routes={visible.flatMap(item=>item.result.coordinates?[{coordinates:item.result.coordinates,color:item.color}]:[])} elevationProfiles={showElevationProfile?visible:[]} legend={legend}/>;
}
