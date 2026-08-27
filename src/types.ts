export type PointRole = 'inicio' | 'final' | 'multipunto';
export interface GeoPoint { id: number; name: string; comments: string; lon: number; lat: number; crs: 'EPSG:4326'; role: PointRole }
export interface SelectionStats { areaKm2: number; widthM: number; heightM: number; rows: number; columns: number; cells: number; diskMb: number; memoryMb: number }
export type ModelId = 'tobler' | 'tobler-off' | 'marquez-perez' | 'kondo-seino' | 'rees' | 'gkrs' | 'tripcevich' | 'alberti' | 'pandolf' | 'pandolf-corrected' | 'minetti' | 'herzog' | 'ardigo' | 'wheeled' | 'eastman';
export type Connectivity = 4 | 8 | 16;
export type BarrierKind = 'absolute' | 'penalty';
export interface Barrier { name?:string;coordinates: [number,number][]; kind: BarrierKind; value: number }
export interface PreferredCorridor { id:string; name:string; coordinates:readonly [number,number][]; widthM:number; costMultiplier:number }
export type EnabledCrossingKind = 'bridge' | 'ford' | 'tunnel';
export interface EnabledCrossing { id:string; name:string; coordinates:readonly [number,number][]; kind:EnabledCrossingKind; crossingCostMultiplier:number; barrierId?:string }
export type PointOfInterestMode = 'influence' | 'single-visit' | 'waypoint';
export interface PointOfInterest { id:string; name:string; category:string; coordinate:readonly [number,number]; influenceRadiusM:number; attraction:number; mode:PointOfInterestMode }
export interface RouteResult { model: ModelId; direction: string; path: number[]; coordinates?: [number,number][]; elevationsM?: number[]; slopesPercent?: number[]; cost: number; unit: string; distanceM: number; ascentM: number; descentM: number; source?: string; surfaceReused?: boolean; settings?: { connectivity: Connectivity; criticalSlopePercent?: number; ardigoSpeedMs?: number } }
export interface IsochroneLine { level:number; coordinates:[number,number][] }
export interface IsochroneResult { model:ModelId; unit:string; interval:number; maxCost:number; reachableCells:number; lines:IsochroneLine[]; surfaceWidth:number; surfaceHeight:number; surfaceValues:number[]; surfaceReused:boolean; source:string }
export interface LcpCorridorResult { model:ModelId; unit:string; optimalCost:number; thresholdPercent:number; corridorCells:number; surfaceWidth:number; surfaceHeight:number; surfaceValues:number[]; surfaceReused:boolean; source:string }
export interface ContourResult { intervalM:number; lines:IsochroneLine[]; minElevationM:number; maxElevationM:number; rasterCrs:string; resolutionM:number; nodataCells:number; source:string }
export interface ViewshedObserverResult { observerId:string; observerName:string; coordinate:[number,number]; groundElevationM:number; observerHeightM:number; surfaceWidth:number; surfaceHeight:number; surfaceValues:number[]; visibleCells:number; validCells:number }
export interface ViewshedResult { observers:ViewshedObserverResult[]; rasterCrs:string; resolutionM:number; source:string; limitation:string }
