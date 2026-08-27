import type {RouteResult} from '../types';

export interface ElevationProfileSample{distanceM:number;elevationM:number}

function segmentDistanceM(a:readonly [number,number],b:readonly [number,number]){
 const radiusM=6371008.8,toRadians=Math.PI/180,lat1=a[1]*toRadians,lat2=b[1]*toRadians,dLat=(b[1]-a[1])*toRadians,dLon=(b[0]-a[0])*toRadians;
 const value=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
 return 2*radiusM*Math.asin(Math.min(1,Math.sqrt(value)));
}

export function elevationProfileSamples(route:Pick<RouteResult,'coordinates'|'elevationsM'>):ElevationProfileSample[]{
 const coordinates=route.coordinates??[],elevations=route.elevationsM??[];
 if(coordinates.length<2||coordinates.length!==elevations.length)return[];
 let distanceM=0;
 return coordinates.map((coordinate,index)=>{if(index)distanceM+=segmentDistanceM(coordinates[index-1],coordinate);return{distanceM,elevationM:elevations[index]}});
}

export function profileExtent(series:readonly (readonly ElevationProfileSample[])[]){
 const samples=series.flat(),elevations=samples.map(sample=>sample.elevationM),maxDistanceM=Math.max(0,...samples.map(sample=>sample.distanceM));
 if(!samples.length)return null;
 const rawMin=Math.min(...elevations),rawMax=Math.max(...elevations),padding=Math.max(1,(rawMax-rawMin)*.08);
 return{minElevationM:rawMin-padding,maxElevationM:rawMax+padding,maxDistanceM};
}

export function sequenceElevationProfiles(series:readonly (readonly ElevationProfileSample[])[]){
 let offsetM=0;
 return series.map(samples=>{const shifted=samples.map(sample=>({...sample,distanceM:sample.distanceM+offsetM}));offsetM=shifted.at(-1)?.distanceM??offsetM;return shifted});
}
