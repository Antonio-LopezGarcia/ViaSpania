import type { Barrier, EnabledCrossing, GeoPoint, PreferredCorridor, RouteResult } from '../types';
import type { SharedMapView, StudyExtent } from './MapPanel';
import { SurfaceAnalysisViewer } from './SurfaceAnalysisViewer';

interface DisplayRoute {result:RouteResult;color:string;label:string}
interface Props {title:string;fileBase:string;points:GeoPoint[];selectedPointId:number|null;barriers:Barrier[];corridors:PreferredCorridor[];crossings:EnabledCrossing[];routes:DisplayRoute[];showElevationProfile?:boolean;initialView:SharedMapView;studyExtent:StudyExtent;mdtImageUrl:string;onClose:()=>void}

export function RouteViewer({routes,showElevationProfile=true,...props}:Props){
  return <SurfaceAnalysisViewer {...props} route={null} routes={routes.flatMap(item=>item.result.coordinates?[{coordinates:item.result.coordinates,color:item.color}]:[])} elevationProfiles={showElevationProfile?routes:[]}/>;
}
