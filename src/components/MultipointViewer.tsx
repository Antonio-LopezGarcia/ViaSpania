import { useState } from 'react';
import type { Barrier, EnabledCrossing, GeoPoint, PreferredCorridor, RouteResult } from '../types';
import { indexedRouteColor } from '../core/comparisonColors';
import type { SharedMapView, StudyExtent } from './MapPanel';
import { RouteViewer } from './RouteViewer';
import { ViewerIcon } from './ViewerIcon';

interface MultipointConnection { fromId:number; toId:number; result:RouteResult }
interface Props { connections:MultipointConnection[];points:GeoPoint[];selectedPointId:number|null;barriers:Barrier[];corridors:PreferredCorridor[];crossings:EnabledCrossing[];initialView:SharedMapView;studyExtent:StudyExtent|null;mdtImageUrl?:string }

export function MultipointViewer({connections,points,selectedPointId,barriers,corridors,crossings,initialView,studyExtent,mdtImageUrl}:Props){
  const [open,setOpen]=useState(false),routes=connections.map(connection=>{const originIndex=points.findIndex(point=>point.id===connection.fromId),from=points.find(point=>point.id===connection.fromId)?.name??String(connection.fromId),to=points.find(point=>point.id===connection.toId)?.name??String(connection.toId);return{result:connection.result,color:indexedRouteColor(originIndex),label:`${from} → ${to}`}});
  return <>{connections.length>0&&<button className="secondary wide viewer-button" disabled={!studyExtent||!mdtImageUrl} onClick={()=>setOpen(true)}><ViewerIcon/>Abrir visor multipunto</button>}{open&&studyExtent&&mdtImageUrl&&<RouteViewer title="Visor multipunto" points={points} selectedPointId={selectedPointId} barriers={barriers} corridors={corridors} crossings={crossings} routes={routes} initialView={initialView} studyExtent={studyExtent} mdtImageUrl={mdtImageUrl} onClose={()=>setOpen(false)}/>}</>;
}
