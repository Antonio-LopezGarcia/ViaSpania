import {beforeEach,expect,it,vi} from 'vitest';
import {calculateMovementRoutes} from './movementRoutes';
import {calculateRasterRoute,calculateRankedRasterRoute,type RouteRequest} from './native';
import type {RouteResult} from '../types';
vi.mock('./native',()=>({calculateRasterRoute:vi.fn(),calculateRankedRasterRoute:vi.fn()}));
beforeEach(()=>vi.resetAllMocks());
const request:RouteRequest={rasterPath:'/mdt.tif',start:[-3,40],end:[-3.1,40.1],model:'ardigo',barriers:[],connectivity:16,criticalSlopePercent:12,ardigoSpeedMs:3};
const optimal={model:'ardigo',path:[1,2],cost:10,unit:'J/kg',dataProvenance:{version:1,status:'recorded',attribution:'© Fuente de prueba'}} as unknown as RouteResult;
it('envía número y separación al motor y conserva costes, rangos y procedencia',async()=>{
 vi.mocked(calculateRankedRasterRoute).mockResolvedValue([{rank:1,result:{...optimal,rank:1},segments:[],costIncreasePercent:0,sharedCellsPercent:0},{rank:2,result:{...optimal,cost:12,rank:2},segments:[],costIncreasePercent:20,sharedCellsPercent:50}]);
 const results=await calculateMovementRoutes(request,true,4,0.03,'A → B');
 expect(calculateRankedRasterRoute).toHaveBeenCalledWith(request,4,0.03,'A → B');
 expect(calculateRasterRoute).not.toHaveBeenCalled();
 expect(results.map(result=>result.cost)).toEqual([10,12]);
 expect(results[1]).toMatchObject({rank:2,dataProvenance:optimal.dataProvenance,settings:{connectivity:16,ardigoSpeedMs:3}});
});
it('sin alternativas calcula una sola ruta y registra la pendiente del vehículo',async()=>{
 vi.mocked(calculateRasterRoute).mockResolvedValue({...optimal,dataProvenance:{version:1,status:'recorded',attribution:'© Fuente de prueba'}});
 const results=await calculateMovementRoutes({...request,model:'wheeled'},false,3,0.01,'A → B');
 expect(calculateRankedRasterRoute).not.toHaveBeenCalled();
 expect(results[0].settings).toEqual({connectivity:16,criticalSlopePercent:12,ardigoSpeedMs:undefined});
});
it('no presenta un resultado vacío como un cálculo correcto',async()=>{
 vi.mocked(calculateRankedRasterRoute).mockResolvedValue([]);
 await expect(calculateMovementRoutes(request,true,3,0.01,'A → B')).rejects.toThrow('No se pudo calcular ninguna ruta');
});
