import { describe,expect,it } from 'vitest';
import { highestTerrainPoint,terrainLineSamplingStride,terrainTriangleIndices } from './terrain3d';

describe('huecos sin datos en 3D',()=>{it('no conecta triángulos con nodata y conserva el cero válido',()=>{
 const mesh={width:2,height:2,widthM:10,heightM:10,minElevationM:0,maxElevationM:20,elevations:[0,10,20,0],wgs84Extent:[0,0,1,1] as [number,number,number,number],validCells:[true,true,true,false]};
 expect(terrainTriangleIndices(mesh)).toEqual([0,2,1]);
 expect(terrainTriangleIndices({...mesh,validCells:[false,false,false,false]})).toEqual([]);
 expect(highestTerrainPoint({...mesh,validCells:[true,true,false,false]})?.elevationM).toBe(10);
})});

describe('punto más alto del MDT 3D',()=>{it('conserva la elevación y la convierte a WGS84',()=>{const point=highestTerrainPoint({width:3,height:2,widthM:20,heightM:10,minElevationM:1,maxElevationM:9,elevations:[1,2,3,4,9,5],wgs84Extent:[-4,40,-1,42]});expect(point).toMatchObject({lon:-2.5,lat:40,elevationM:9,row:1,column:1})});it('tolera una malla sin valores válidos',()=>expect(highestTerrainPoint({width:2,height:2,widthM:1,heightM:1,minElevationM:0,maxElevationM:0,elevations:[NaN,NaN,NaN,NaN],wgs84Extent:[0,0,1,1]})).toBeNull())});
describe('presupuesto de líneas 3D',()=>{it('conserva todas las líneas pequeñas y muestrea resultados masivos',()=>{expect(terrainLineSamplingStride([{coordinates:[0,1,2]}],10)).toBe(1);expect(terrainLineSamplingStride([{coordinates:Array.from({length:1001})}],100)).toBe(10)})});
