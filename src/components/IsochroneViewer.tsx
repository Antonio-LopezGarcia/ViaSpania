import type { Barrier, EnabledCrossing, GeoPoint, IsochroneResult, PreferredCorridor, RouteResult } from '../types';
import type { SharedMapView, StudyExtent } from './MapPanel';
import { SurfaceAnalysisViewer } from './SurfaceAnalysisViewer';
import {locale} from '../core/i18n';

interface Props {result:IsochroneResult;points:GeoPoint[];selectedPointId:number|null;barriers:Barrier[];corridors:PreferredCorridor[];crossings:EnabledCrossing[];route:RouteResult|null;initialView:SharedMapView;studyExtent:StudyExtent;mdtImageUrl:string;onClose:()=>void}
const formatLevel=(level:number,unit:string)=>unit==='s'?`${(level/60).toLocaleString(locale(),{maximumFractionDigits:1})} min`:`${level.toLocaleString(locale(),{maximumFractionDigits:1})} ${unit}`;
export function IsochroneViewer({result,...props}:Props){const levels=[...new Set(result.lines.map(line=>line.level))].sort((a,b)=>a-b);const legend=<div className="isochrone-viewer-legend"><b>Isócronas calculadas</b>{levels.map((level,index)=><span key={level}><i style={{background:`hsl(${205-(levels.length<2?1:index/(levels.length-1))*165} 95% 58%)`}}/>{formatLevel(level,result.unit)}</span>)}</div>;return <SurfaceAnalysisViewer {...props} route={null} showRouteLayer={false} title={`Visor de isócronas · ${result.model}`} fileBase={`isocronas-${result.model}`} lines={result.lines} legend={legend}/>}
