import {useState} from 'react';
import type { Barrier, EnabledCrossing, GeoPoint, PreferredCorridor, RouteResult } from '../types';
import type { SharedMapView, StudyExtent } from './MapPanel';
import { SurfaceAnalysisViewer } from './SurfaceAnalysisViewer';

interface DisplayRoute {result:RouteResult;color:string;label:string;id?:string}
interface Props {title:string;points:GeoPoint[];selectedPointId:number|null;barriers:Barrier[];corridors:PreferredCorridor[];crossings:EnabledCrossing[];routes:DisplayRoute[];contours?:{level:number;coordinates:[number,number][]}[];showElevationProfile?:boolean;routeLegendTitle?:string;hiddenRouteIds?:ReadonlySet<string>;onToggleRoute?:(id:string)=>void;initialView:SharedMapView;studyExtent:StudyExtent;imageExtent?:StudyExtent;mdtImageUrl:string;rasterPath?:string;onClose:()=>void}

export function RouteViewer({routes,contours,showElevationProfile=true,routeLegendTitle='Rutas visibles',hiddenRouteIds,onToggleRoute,...props}:Props){
  const [localHidden,setLocalHidden]=useState<Set<number>>(()=>new Set()),hidden=(index:number,item:DisplayRoute)=>hiddenRouteIds?hiddenRouteIds.has(item.id??String(index)):localHidden.has(index),visible=routes.filter((item,index)=>!hidden(index,item)),toggle=(index:number,item:DisplayRoute)=>{if(hiddenRouteIds&&onToggleRoute){onToggleRoute(item.id??String(index));return}setLocalHidden(current=>{const next=new Set(current);if(next.has(index))next.delete(index);else next.add(index);return next})};
  const legend=<aside className="route-comparison-legend"><b>{routeLegendTitle}</b>{routes.map((item,index)=><label key={`${item.label}-${index}`}><input type="checkbox" checked={!hidden(index,item)} onChange={()=>toggle(index,item)}/><i style={{background:item.color}}/><span>{item.label}</span></label>)}</aside>;
  return <SurfaceAnalysisViewer {...props} route={null} contours={contours} routes={visible.flatMap(item=>item.result.coordinates?[{coordinates:item.result.coordinates,color:item.color}]:[])} elevationProfiles={showElevationProfile?visible:[]} legend={legend}/>;
}
