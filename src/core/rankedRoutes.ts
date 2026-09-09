import type {RankedRouteResult,RouteResult} from '../types';

export const RANK_PENALTY_PRESETS={baja:0.1,media:0.03,alta:0.01} as const;

export function costIncreasePercent(cost:number,optimalCost:number){
 return optimalCost>0?(cost/optimalCost-1)*100:0;
}

export function sharedCellsPercent(path:readonly number[],reference:ReadonlySet<number>){
 if(!path.length)return 0;
 return path.filter(cell=>reference.has(cell)).length/path.length*100;
}

export function joinRouteSegments(segments:readonly RouteResult[],direction:string):RouteResult{
 if(!segments.length)throw new Error('No hay tramos para formar el itinerario.');
 const join=<T>(values:(T[]|undefined)[])=>values.flatMap((value,index)=>index?value?.slice(1)??[]:value??[]);
 return {...segments[0],requiredWaypoints:segments.flatMap(segment=>segment.requiredWaypoints??[]),direction,path:join(segments.map(item=>item.path)),coordinates:join(segments.map(item=>item.coordinates)),elevationsM:join(segments.map(item=>item.elevationsM)),slopesPercent:join(segments.map(item=>item.slopesPercent)),cost:segments.reduce((sum,item)=>sum+item.cost,0),distanceM:segments.reduce((sum,item)=>sum+item.distanceM,0),ascentM:segments.reduce((sum,item)=>sum+item.ascentM,0),descentM:segments.reduce((sum,item)=>sum+item.descentM,0),surfaceReused:segments.every(item=>item.surfaceReused),source:`${segments[0].source??'GeoTIFF'} · itinerario de ${segments.length} tramo(s)`};
}

export function rankResult(rank:number,result:RouteResult,optimalCost:number,previousCells:ReadonlySet<number>):RankedRouteResult{
 return{rank,result,costIncreasePercent:costIncreasePercent(result.cost,optimalCost),sharedCellsPercent:sharedCellsPercent(result.path,previousCells)};
}
