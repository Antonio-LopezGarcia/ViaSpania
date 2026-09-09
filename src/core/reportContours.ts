import type {ContourResult} from '../types';
import {levelColor} from './comparisonColors';

/** Reuses the calculated WGS84 geometry and the viewer's elevation colour scale. */
export function reportContourOverlay(result:ContourResult|null){
 if(!result?.lines.length)return {lines:[],legend:[],caption:''};
 const levels=[...new Set(result.lines.map(line=>line.level))].sort((a,b)=>a-b);
 const color=(level:number)=>levelColor(levels.indexOf(level),levels.length);
 // Five reference heights keep the legend readable even for dense contour sets.
 const referenceLevels=levels.filter((_,index)=>levels.length<=5||Array.from({length:5},(_,i)=>Math.round(i*(levels.length-1)/4)).includes(index));
 return {
  lines:result.lines.map(line=>({...line,color:color(line.level)})),
  legend:referenceLevels.map(level=>({label:`Altitud · ${level} m`,color:color(level)})),
  caption:`Curvas de nivel: ${levels[0]}–${levels.at(-1)} m · equidistancia ${result.intervalM} m · MDT ${result.resolutionM} m · ${result.source}`,
 };
}

/** Same WGS84 extent-to-pixel transform as the report basemap and project overlays. */
export function reportContourPoint([lon,lat]:readonly [number,number],[west,south,east,north]:readonly [number,number,number,number],width:number,height:number):[number,number]{
 return [(lon-west)/(east-west)*width,(north-lat)/(north-south)*height];
}
