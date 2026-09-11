import type {RouteResult} from '../types';
import {calculateRasterRoute,calculateRankedRasterRoute,type RouteRequest} from './native';

/** Returns the optimum first, with every route evaluated on the original surface. */
export async function calculateMovementRoutes(request:RouteRequest,enabled:boolean,count:number,penalty:number,direction:string):Promise<RouteResult[]> {
 const results=enabled?(await calculateRankedRasterRoute(request,count,penalty,direction)).map(item=>item.result):[await calculateRasterRoute(request)];
 if(!results.length)throw new Error('No se pudo calcular ninguna ruta para los puntos seleccionados.');
 return results.map(result=>({...result,direction,settings:{connectivity:request.connectivity,criticalSlopePercent:request.model==='wheeled'?request.criticalSlopePercent:undefined,ardigoSpeedMs:request.model==='ardigo'?request.ardigoSpeedMs:undefined}}));
}
