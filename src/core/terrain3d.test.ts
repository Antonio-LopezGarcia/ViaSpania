import { describe,expect,it } from 'vitest';
import { highestTerrainPoint,terrainLineSamplingStride } from './terrain3d';

describe('punto más alto del MDT 3D',()=>{it('conserva la elevación y la convierte a WGS84',()=>{const point=highestTerrainPoint({width:3,height:2,widthM:20,heightM:10,minElevationM:1,maxElevationM:9,elevations:[1,2,3,4,9,5],wgs84Extent:[-4,40,-1,42]});expect(point).toMatchObject({lon:-2.5,lat:40,elevationM:9,row:1,column:1})});it('tolera una malla sin valores válidos',()=>expect(highestTerrainPoint({width:2,height:2,widthM:1,heightM:1,minElevationM:0,maxElevationM:0,elevations:[NaN,NaN,NaN,NaN],wgs84Extent:[0,0,1,1]})).toBeNull())});
describe('presupuesto de líneas 3D',()=>{it('conserva todas las líneas pequeñas y muestrea resultados masivos',()=>{expect(terrainLineSamplingStride([{coordinates:[0,1,2]}],10)).toBe(1);expect(terrainLineSamplingStride([{coordinates:Array.from({length:1001})}],100)).toBe(10)})});
