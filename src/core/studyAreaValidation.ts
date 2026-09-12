import type {Barrier, EnabledCrossing, GeoPoint, PointOfInterest, PreferredCorridor} from '../types';

export type GeographicBounds=readonly [number,number,number,number];
export function containsCoordinate(bounds:GeographicBounds,coordinate:readonly [number,number]):boolean {
 const [west,south,east,north]=bounds,[lon,lat]=coordinate;
 return Number.isFinite(lon)&&Number.isFinite(lat)&&lat>=south&&lat<=north&&(west<=east?lon>=west&&lon<=east:lon>=west||lon<=east);
}

export function elementsOutsideArea(bounds:GeographicBounds, elements:{points:readonly GeoPoint[];barriers:readonly Barrier[];corridors:readonly PreferredCorridor[];crossings:readonly EnabledCrossing[];pointsOfInterest:readonly PointOfInterest[]}):string[]{
 const outside=(coordinate:readonly [number,number])=>!containsCoordinate(bounds,coordinate);
 return [
  ...elements.points.filter(p=>outside([p.lon,p.lat])).map(p=>`Punto «${p.name}»`),
  ...elements.barriers.flatMap((item,i)=>item.coordinates.some(outside)?[`Barrera «${item.name||i+1}»`]:[]),
  ...elements.corridors.filter(item=>item.coordinates.some(outside)).map(item=>`Corredor «${item.name}»`),
  ...elements.crossings.filter(item=>item.coordinates.some(outside)).map(item=>`Puente o paso «${item.name}»`),
  ...elements.pointsOfInterest.filter(item=>outside(item.coordinate)).map(item=>`Punto de interés «${item.name}»`),
 ];
}
