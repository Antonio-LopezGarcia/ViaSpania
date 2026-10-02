import type { Barrier, EnabledCrossing, GeoPoint, LcpCorridorResult, PreferredCorridor, RouteResult } from '../types';
import type { SharedMapView, StudyExtent } from './MapPanel';
import { SurfaceAnalysisViewer } from './SurfaceAnalysisViewer';
import {locale} from '../core/i18n';

interface Props {result:LcpCorridorResult;contours?:{level:number;coordinates:[number,number][]}[];points:GeoPoint[];selectedPointId:number|null;barriers:Barrier[];corridors:PreferredCorridor[];crossings:EnabledCrossing[];route:RouteResult|null;initialView:SharedMapView;studyExtent:StudyExtent;imageExtent?:StudyExtent;mdtImageUrl:string;rasterPath?:string;surfaceImageUrl:string;initialOpacity:number;onClose:()=>void}
export function LcpCorridorViewer({result,contours,...props}:Props){const legend=<div className="isochrone-viewer-legend"><b>Pasillo LCP</b><span><i style={{background:'#19df46'}}/>Óptimo</span><span><i style={{background:'#ff6e46'}}/>Límite +{result.thresholdPercent.toLocaleString(locale())} %</span><small>{result.corridorCells.toLocaleString(locale())} celdas</small></div>;return <SurfaceAnalysisViewer {...props} contours={contours} title={`Visor de pasillos · ${result.model}`} surfaceLabel="Superficie del pasillo" legend={legend}/>}
