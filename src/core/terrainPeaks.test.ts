import {describe,expect,it} from 'vitest';
import {terrainPeaks} from './terrainPeaks';
import type {TerrainMesh} from '../services/native';

function mesh(elevations:number[],validCells?:boolean[],side=5):TerrainMesh{
  return{width:side,height:side,widthM:side*800,heightM:side*800,minElevationM:0,maxElevationM:100,elevations,validCells,wgs84Extent:[-4,0,0,4]};
}

describe('terrainPeaks',()=>{
  it('returns separated local maxima with cell-center WGS84 coordinates and rank',()=>{
    const elevations=Array.from({length:49},(_,index)=>index===24?100:index===40?90:10);
    const peaks=terrainPeaks(mesh(elevations,undefined,7),2,100);
    expect(peaks).toHaveLength(2);
    expect(peaks[0]).toEqual({lon:-2,lat:2,elevationM:100,rank:1});
    expect(peaks[1]?.elevationM).toBe(90);
    expect(peaks[1]?.rank).toBe(2);
    expect(peaks[1]?.lon).toBeCloseTo(-0.8571428571);
    expect(peaks[1]?.lat).toBeCloseTo(0.8571428571);
  });

  it('skips invalid and non-finite cells and applies the requested extent',()=>{
    const elevations=Array.from({length:25},()=>10);
    elevations[12]=100;
    elevations[18]=80;
    elevations[7]=70;
    elevations[6]=Number.NaN;
    const validCells=Array.from({length:25},()=>true);
    validCells[12]=false;
    const peaks=terrainPeaks(mesh(elevations,validCells),4,0,[-2.2,0,-1.8,4]);
    expect(peaks).toHaveLength(1);
    expect(peaks[0]).toMatchObject({elevationM:70,rank:1});
    expect(peaks[0]?.lon).toBeCloseTo(-2);
    expect(peaks[0]?.lat).toBeCloseTo(2.8);
  });

  it('keeps tied local maxima deterministic and honours the limit',()=>{
    const elevations=Array.from({length:25},()=>0);
    elevations[6]=elevations[18]=50;
    expect(terrainPeaks(mesh(elevations),1,0).map(peak=>peak.rank)).toEqual([1]);
    expect(terrainPeaks(mesh(elevations),4,0).map(peak=>peak.elevationM)).toEqual([50,50]);
  });
});
