import {withRasterProvenance} from '../core/resultProvenance';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { Barrier, Connectivity, ContourResult, EnabledCrossing, IsochroneResult, LcpCorridorResult, ModelId, PointOfInterest, PreferredCorridor, RankedRouteResult, RouteResult, ViewshedResult } from '../types';
import { loadAppSettings } from '../core/appSettings';
import {requiredRouteWaypoints} from '../core/facilitators';
import {joinRouteSegments,rankResult} from '../core/rankedRoutes';
let activeCorridors:PreferredCorridor[]=[];let activeCrossings:EnabledCrossing[]=[];
let activePointsOfInterest:PointOfInterest[]=[];
export function setActiveFacilitators(corridors:PreferredCorridor[],crossings:EnabledCrossing[],points:PointOfInterest[]=[]){activeCorridors=corridors;activeCrossings=crossings;activePointsOfInterest=points}

export interface NativeStatus { rustVersion:string; gdalVersion:string; projVersion:string; gdalAvailable:boolean; totalMemoryBytes?:number }
export interface DownloadProgress { receivedBytes:number; totalBytes?:number; percent?:number }
export interface IsochroneProgress { phase:string; percent:number; processedCells:number; totalCells:number }
export interface RasterResult { dataAttribution?:string; path:string; bytes:number; metadata:Record<string,unknown>; previewDataUrl:string }
export interface RasterSample { lon:number; lat:number; elevationM?:number }
export interface TerrainMesh { validCells?:boolean[]; width:number; height:number; widthM:number; heightM:number; minElevationM:number; maxElevationM:number; elevations:number[]; wgs84Extent:[number,number,number,number] }

export const hasNativeBackend = () => isTauri();
export const nativeStatus = () => invoke<NativeStatus>('native_status');
export const fetchNativeCapabilities = (url:string) => invoke<string>('fetch_capabilities',{url});
export const downloadWcs = (requestUrl:string,filename:string) => invoke<RasterResult>('download_wcs',{requestUrl,filename});
export const cancelWcs = () => invoke<void>('cancel_wcs');
export const onWcsProgress = (callback:(progress:DownloadProgress)=>void):Promise<UnlistenFn> => listen<DownloadProgress>('wcs-progress',event=>callback(event.payload));
export const processRaster = (request:{inputPath:string;outputName:string;targetCrs:string;resolutionM?:number;cutlinePath?:string}) => invoke<RasterResult>('process_raster',{request});
export const processRemoteCogs = (request:{urls:string[];outputName:string;targetCrs:string;resolutionM:number;boundsWgs84:[number,number,number,number]}) => invoke<RasterResult>('process_remote_cogs',{request});
export const inspectGeospatialFile = (path:string) => invoke<Record<string,unknown>>('inspect_geospatial_file',{path});
export const rasterColorPreview = (path:string,palette:string) => invoke<string>('raster_color_preview',{path,palette});
export const fetchMapImage = (url:string) => invoke<string>('fetch_map_image',{url});
export const fetchVectorTile = (url:string) => invoke<string>('fetch_vector_tile',{url});
export type RouteRequest={rasterPath:string;start:[number,number];end:[number,number];model:ModelId;barriers:Barrier[];corridors?:PreferredCorridor[];crossings?:EnabledCrossing[];pointsOfInterest?:PointOfInterest[];connectivity:Connectivity;criticalSlopePercent:number;ardigoSpeedMs:number};
const invokeRoute=(request:RouteRequest,start:[number,number],end:[number,number],rankPenalizedCells:number[]=[],rankPenalty=1)=>withRasterProvenance(request.rasterPath,()=>invoke<RouteResult>('calculate_raster_route',{request:{...request,start,end,corridors:request.corridors??activeCorridors,crossings:request.crossings??activeCrossings,pointsOfInterest:(request.pointsOfInterest??activePointsOfInterest).filter(point=>point.mode==='influence'),rankPenalizedCells,rankPenalty,maxCells:loadAppSettings().processingCellLimit}}));
const routeWithWaypoints=async(request:RouteRequest,rankPenalizedCells:number[]=[],rankPenalty=1)=>{
 const points=request.pointsOfInterest??activePointsOfInterest;
 const orderedWaypoints=requiredRouteWaypoints(request.start,points,request.crossings??activeCrossings);
 const waypoints=orderedWaypoints.map(point=>[...point.coordinate] as [number,number]);
 const stops:[number,number][]=[request.start,...waypoints,request.end];
 if(stops.length===2)return invokeRoute(request,request.start,request.end,rankPenalizedCells,rankPenalty);
 const segments:RouteResult[]=[];
 for(let index=1;index<stops.length;index++)segments.push(await invokeRoute(request,stops[index-1],stops[index],rankPenalizedCells,rankPenalty));
 const coordinates=segments.flatMap((segment,index)=>{
  const segmentCoordinates=(segment.coordinates??[]).map(coordinate=>[...coordinate] as [number,number]);
  if(!segmentCoordinates.length)return [];
  // El motor trabaja por celdas del MDT. Conservamos el paso obligatorio exacto
  // en la geometría publicada, además de usarlo como extremo de ambos cálculos.
  segmentCoordinates[0]=[...stops[index]];
  segmentCoordinates[segmentCoordinates.length-1]=[...stops[index+1]];
  return index?segmentCoordinates.slice(1):segmentCoordinates;
 });
 return{...joinRouteSegments(segments,'origen→pasos obligatorios por proximidad→destino'),requiredWaypoints:orderedWaypoints,coordinates,source:`${segments[0].source} · ${waypoints.length} vértice(s) de paso obligatorio: ${[...new Set(orderedWaypoints.map(point=>point.name))].join(", ")}`};
}

export const calculateRasterRoute=(request:RouteRequest):Promise<RouteResult>=>routeWithWaypoints(request);

export interface RankedItinerary extends RankedRouteResult{segments:RouteResult[]}
export async function calculateRankedRasterItineraries(request:RouteRequest,stops:readonly [number,number][],k:number,penalty:number,direction:string):Promise<RankedItinerary[]>{
 if(stops.length<2)throw new Error('El itinerario requiere al menos dos puntos.');
 if(k<1||k>10)throw new Error('El número de alternativas debe estar entre 1 y 10.');
 if(!(penalty>0&&penalty<=1))throw new Error('La separación de alternativas no es válida.');
 const results:RankedItinerary[]=[],penalized=new Set<number>(),signatures=new Set<string>();
 let optimalCost=0;
 for(let rank=1;rank<=k;rank++){
  const segments:RouteResult[]=[];
  for(let index=1;index<stops.length;index++)segments.push(await routeWithWaypoints({...request,start:[...stops[index-1]],end:[...stops[index]]},[...penalized],rank===1?1:penalty));
  const result=joinRouteSegments(segments,direction),signature=result.path.join(',');
  if(signatures.has(signature))break;
  signatures.add(signature);if(rank===1)optimalCost=result.cost;
  const ranked=rankResult(rank,result,optimalCost,penalized),metadata={rank,costIncreasePercent:ranked.costIncreasePercent,sharedCellsPercent:ranked.sharedCellsPercent};ranked.result={...ranked.result,...metadata};results.push({...ranked,segments:segments.map(segment=>({...segment,...metadata}))});
  result.path.forEach(cell=>penalized.add(cell));
 }
 return results;
}
export function calculateRankedRasterRoute(request:RouteRequest,k:number,penalty:number,direction:string){
 return calculateRankedRasterItineraries(request,[request.start,request.end],k,penalty,direction);
}
export const calculateRasterIsochrones = (request:{rasterPath:string;origins:[number,number][];model:ModelId;barriers:Barrier[];corridors?:PreferredCorridor[];crossings?:EnabledCrossing[];pointsOfInterest?:PointOfInterest[];connectivity:Connectivity;criticalSlopePercent:number;ardigoSpeedMs:number;interval:number;maxLevels:number}) => withRasterProvenance(request.rasterPath,()=>invoke<IsochroneResult>('calculate_raster_isochrones',{request:{...request,corridors:request.corridors??activeCorridors,crossings:request.crossings??activeCrossings,pointsOfInterest:(request.pointsOfInterest??activePointsOfInterest).filter(point=>point.mode==='influence'),maxCells:loadAppSettings().processingCellLimit}}));
export const calculateRasterLcpCorridor = (request:{rasterPath:string;start:[number,number];end:[number,number];model:ModelId;barriers:Barrier[];corridors?:PreferredCorridor[];crossings?:EnabledCrossing[];pointsOfInterest?:PointOfInterest[];connectivity:Connectivity;criticalSlopePercent:number;ardigoSpeedMs:number;thresholdPercent:number}) => withRasterProvenance(request.rasterPath,()=>invoke<LcpCorridorResult>('calculate_raster_lcp_corridor',{request:{...request,corridors:request.corridors??activeCorridors,crossings:request.crossings??activeCrossings,pointsOfInterest:(request.pointsOfInterest??activePointsOfInterest).filter(point=>point.mode==='influence'),maxCells:loadAppSettings().processingCellLimit}}));
export const cancelRasterIsochrones = () => invoke<void>('cancel_raster_isochrones');
export const onIsochroneProgress = (callback:(progress:IsochroneProgress)=>void):Promise<UnlistenFn> => listen<IsochroneProgress>('isochrone-progress',event=>callback(event.payload));
export const sampleRasterElevation = (rasterPath:string,xRatio:number,yRatio:number) => invoke<RasterSample>('sample_raster_elevation',{rasterPath,xRatio,yRatio});
export const sampleRasterElevationAt = (rasterPath:string,lon:number,lat:number) => invoke<RasterSample>('sample_raster_elevation_at',{rasterPath,lon,lat});
export const generateTerrainMesh = (rasterPath:string,maxSize=450) => invoke<TerrainMesh>('generate_terrain_mesh',{rasterPath,maxSize});
export const calculateContours = (rasterPath:string,intervalM:number) => withRasterProvenance(rasterPath,()=>invoke<ContourResult>('calculate_contours',{request:{rasterPath,intervalM}}));
export const calculateViewshed = (rasterPath:string,observers:{id:string;name:string;coordinate:[number,number]}[],observerHeightM:number):Promise<ViewshedResult> => withRasterProvenance(rasterPath,()=>invoke<ViewshedResult>('calculate_viewshed',{request:{rasterPath,observers,observerHeightM}}));
