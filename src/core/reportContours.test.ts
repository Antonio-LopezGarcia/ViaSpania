import {describe,expect,it} from 'vitest';
import {reportContourOverlay} from './reportContours';
import {levelColor} from './comparisonColors';
import type {ContourResult} from '../types';
const result:ContourResult={intervalM:10,minElevationM:0,maxElevationM:100,rasterCrs:'EPSG:25830',resolutionM:5,nodataCells:0,source:'IGN',lines:Array.from({length:11},(_,i)=>({level:i*10,coordinates:[[-3,40],[-2.9,40.1]]}))};
describe('report contour overlay',()=>{
 it('preserves WGS84 geometry and viewer colours without mutating the result',()=>{
  const overlay=reportContourOverlay(result);
  expect(overlay.lines).toHaveLength(11);
  overlay.lines.forEach((line,i)=>{expect(line.coordinates).toBe(result.lines[i].coordinates);expect(line.color).toBe(levelColor(i,11))});
  expect(result.lines[0]).not.toHaveProperty('color');
 });
 it('bounds the legend and includes units, interval and source',()=>{
  const overlay=reportContourOverlay(result);
  expect(overlay.legend).toHaveLength(5);
  expect(overlay.legend[0].label).toContain('0 m');
  expect(overlay.legend.at(-1)?.label).toContain('100 m');
  expect(overlay.caption).toContain('equidistancia 10 m');
  expect(overlay.caption).toContain('IGN');
 });
 it('omits disabled and empty curves',()=>{
  expect(reportContourOverlay(null).lines).toEqual([]);
  expect(reportContourOverlay({...result,lines:[]}).legend).toEqual([]);
 });
});

import {reportContourPoint} from './reportContours';
it('aligns WGS84 contours to the basemap corners and centre',()=>{
 const extent=[-4,39,-2,41] as const;
 expect(reportContourPoint([-4,41],extent,1600,900)).toEqual([0,0]);
 expect(reportContourPoint([-2,39],extent,1600,900)).toEqual([1600,900]);
 expect(reportContourPoint([-3,40],extent,1600,900)).toEqual([800,450]);
});
