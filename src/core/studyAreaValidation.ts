import type {Barrier, EnabledCrossing, GeoPoint, PointOfInterest, PreferredCorridor} from '../types';
import {barrierParts} from './barriers';

export type GeographicBounds=readonly [number,number,number,number];
export function containsCoordinate(bounds:GeographicBounds,coordinate:readonly [number,number]):boolean {
 const [west,south,east,north]=bounds,[lon,lat]=coordinate,epsilon=1e-6;
 return Number.isFinite(lon)&&Number.isFinite(lat)&&lat>=south-epsilon&&lat<=north+epsilon&&(west<=east?lon>=west-epsilon&&lon<=east+epsilon:lon>=west-epsilon||lon<=east+epsilon);
}

export function elementsOutsideArea(bounds:GeographicBounds, elements:{points:readonly GeoPoint[];barriers:readonly Barrier[];corridors:readonly PreferredCorridor[];crossings:readonly EnabledCrossing[];pointsOfInterest:readonly PointOfInterest[]}):string[]{
 const outside=(coordinate:readonly [number,number])=>!containsCoordinate(bounds,coordinate);
 return [
  ...elements.points.filter(p=>outside([p.lon,p.lat])).map(p=>`Punto «${p.name}»`),
  ...elements.barriers.flatMap((item,i)=>barrierParts(item).some(part=>part.some(outside))?[`Barrera «${item.name||i+1}»`]:[]),
  ...elements.corridors.filter(item=>item.coordinates.some(outside)).map(item=>`Corredor «${item.name}»`),
  ...elements.crossings.filter(item=>item.coordinates.some(outside)).map(item=>`Puente o paso «${item.name}»`),
  ...elements.pointsOfInterest.filter(item=>outside(item.coordinate)).map(item=>`Punto de interés «${item.name}»`),
 ];
}
