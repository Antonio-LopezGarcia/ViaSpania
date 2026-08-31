import type { Barrier, EnabledCrossing, GeoPoint, LcpCorridorResult, PreferredCorridor, RouteResult } from '../types';
import type { SharedMapView, StudyExtent } from './MapPanel';
import { SurfaceAnalysisViewer } from './SurfaceAnalysisViewer';
import {locale} from '../core/i18n';

interface Props {result:LcpCorridorResult;points:GeoPoint[];selectedPointId:number|null;barriers:Barrier[];corridors:PreferredCorridor[];crossings:EnabledCrossing[];route:RouteResult|null;initialView:SharedMapView;studyExtent:StudyExtent;mdtImageUrl:string;surfaceImageUrl:string;initialOpacity:number;onClose:()=>void}
export function LcpCorridorViewer({result,...props}:Props){const legend=<div className="isochrone-viewer-legend"><b>Pasillo LCP</b><span><i style={{background:'#19df46'}}/>Óptimo</span><span><i style={{background:'#ff6e46'}}/>Límite +{result.thresholdPercent.toLocaleString(locale())} %</span><small>{result.corridorCells.toLocaleString(locale())} celdas</small></div>;return <SurfaceAnalysisViewer {...props} title={`Visor de pasillos · ${result.model}`} fileBase={`pasillo-lcp-${result.model}`} surfaceLabel="Superficie del pasillo" legend={legend}/>}
