import {afterEach,expect,it,vi} from 'vitest';
import {invoke} from '@tauri-apps/api/core';
import {calculateRasterRoute,calculateRankedRasterRoute,calculateRankedRasterItineraries,setActiveFacilitators,type RouteRequest} from './native';
vi.mock('@tauri-apps/api/core',()=>({invoke:vi.fn(),isTauri:()=>true}));
vi.mock('../core/appSettings',()=>({loadAppSettings:()=>({processingCellLimit:1000})}));
const request:RouteRequest={rasterPath:'/mdt.tif',start:[0,0],end:[4,0],model:'tobler',barriers:[],connectivity:8,criticalSlopePercent:20,ardigoSpeedMs:1,crossings:[{id:'b',name:'Puente',kind:'bridge',coordinates:[[1,0],[2,0]],crossingCostMultiplier:1,required:true}]};
function engine(){vi.mocked(invoke).mockImplementation(async(_command,args)=>{const r=(args as {request:RouteRequest}).request;return {model:'tobler',direction:'',path:[r.start[0],r.end[0]],coordinates:[r.start,r.end],cost:1,unit:'s',distanceM:1,ascentM:0,descentM:0,source:'MDT'} as never})}
afterEach(()=>{vi.resetAllMocks();setActiveFacilitators([],[],[])});
it('calcula realmente los tramos de entrada, cruce y salida',async()=>{
 engine();const result=await calculateRasterRoute(request);
 expect(invoke).toHaveBeenCalledTimes(3);
 expect(result.coordinates).toEqual([[0,0],[1,0],[2,0],[4,0]]);
 expect(result.cost).toBe(3);expect(result.requiredWaypoints?.map(p=>p.name)).toEqual(['Puente','Puente']);
});
it('impone los cruces también en rutas alternativas',async()=>{
 engine();const ranked=await calculateRankedRasterRoute(request,1,.1,'ida');
 expect(ranked[0].result.coordinates).toEqual([[0,0],[1,0],[2,0],[4,0]]);
 expect(ranked[0].result.requiredWaypoints).toHaveLength(2);
});
it('conserva la agrupación por tramo de multirruta y el sentido de vuelta',async()=>{
 engine();const ranked=await calculateRankedRasterItineraries(request,[[0,0],[4,0],[0,0]],1,1,'ida y vuelta');
 expect(ranked[0].segments).toHaveLength(2);
 expect(ranked[0].segments[1].coordinates).toEqual([[4,0],[2,0],[1,0],[0,0]]);
});
it('permite desactivar y sustituir los cruces activos',async()=>{
 engine();setActiveFacilitators([],request.crossings!);
 await calculateRasterRoute({...request,crossings:[]});expect(invoke).toHaveBeenCalledTimes(1);
});
it('propaga un puente inalcanzable sin devolver una ruta parcial',async()=>{
 vi.mocked(invoke).mockRejectedValue(new Error('No existe ruta'));
 await expect(calculateRasterRoute(request)).rejects.toThrow('No existe ruta');
});
