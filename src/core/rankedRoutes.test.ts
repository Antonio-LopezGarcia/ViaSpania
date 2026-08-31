import {describe,expect,it} from 'vitest';
import {costIncreasePercent,joinRouteSegments,sharedCellsPercent} from './rankedRoutes';

const route=(path:number[],cost:number)=>({model:'tobler' as const,direction:'',path,coordinates:path.map(value=>[value,value] as [number,number]),elevationsM:path.map(Number),slopesPercent:path.map(()=>0),cost,unit:'s',distanceM:cost,ascentM:1,descentM:2});
describe('rutas subóptimas',()=>{
 it('une tramos sin duplicar la celda de enlace',()=>expect(joinRouteSegments([route([1,2],10),route([2,3],15)],'A→B→C')).toMatchObject({path:[1,2,3],cost:25,distanceM:25,ascentM:2,descentM:4,direction:'A→B→C'}));
 it('calcula incremento sobre el óptimo',()=>expect(costIncreasePercent(125,100)).toBeCloseTo(25));
 it('mide el solapamiento con rutas anteriores',()=>expect(sharedCellsPercent([1,2,3,4],new Set([2,4,8]))).toBe(50));
});
