import {CONSTRAINT_COLORS} from '../core/constraintColors';
import Feature,{type FeatureLike} from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import {fromLonLat} from 'ol/proj';
import {Circle as CircleStyle,Fill,Stroke,Style,Text} from 'ol/style';
import type {Barrier,EnabledCrossing,PointOfInterest,PreferredCorridor} from '../types';
import {barrierParts} from '../core/barriers';

export function constraintMapFeatures(barriers:readonly Barrier[],corridors:readonly PreferredCorridor[],crossings:readonly EnabledCrossing[],points:readonly PointOfInterest[]){
 const features:Feature[]=[];
 const line=(coordinates:readonly [number,number][],kind:string,name:string,generatedBy?:string)=>{if(coordinates.length>=2)features.push(new Feature({geometry:new LineString(coordinates.map(coordinate=>fromLonLat(coordinate))),kind,name,generatedBy}))};
 barriers.forEach((item,index)=>barrierParts(item).forEach((part,partIndex)=>line(part,item.kind,partIndex===0?item.name?.trim()||`Barrera ${index+1}`:'',item.generatedBy)));
 corridors.forEach(item=>line(item.coordinates,'corridor',item.name));
 crossings.forEach(item=>line(item.coordinates,'crossing',item.name));
 points.forEach(item=>features.push(new Feature({geometry:new Point(fromLonLat([...item.coordinate])),kind:'poi',name:item.name})));
 return features;
}
const label=(feature:FeatureLike,visible:boolean,size=11)=>visible?new Text({text:String(feature.get('name')??''),offsetY:-(size+6),font:`600 ${size}px sans-serif`,fill:new Fill({color:'#fff'}),stroke:new Stroke({color:'#111',width:3})}):undefined;
export function barrierMapStyle(feature:FeatureLike,labels=false,size=11){
 if(feature.getGeometry()?.getType()==='Point')return new Style({image:new CircleStyle({radius:6,fill:new Fill({color:'#ff3b3b'}),stroke:new Stroke({color:'#fff',width:2})})});
 const isOceanMask=feature.get('generatedBy')==='magic-ocean',color=isOceanMask?CONSTRAINT_COLORS.oceanBarrier:feature.get('kind')==='penalty'?'#777':CONSTRAINT_COLORS.barrier,lineDash=isOceanMask?[1,6]:feature.get('kind')==='penalty'?[6,4]:undefined;
 return [new Style({stroke:new Stroke({color:feature.get('selected')?'#d8ff55':'#fff',width:feature.get('selected')?9:7,lineDash,lineCap:isOceanMask?'round':'butt'})}),new Style({stroke:new Stroke({color,width:4,lineDash,lineCap:isOceanMask?'round':'butt'}),text:label(feature,labels,size)})];
}
export function facilitatorMapStyle(feature:FeatureLike,labels=feature.getGeometry()?.getType()==='Point',size=11){
 if(feature.getGeometry()?.getType()==='Point')return new Style({image:new CircleStyle({radius:8,fill:new Fill({color:CONSTRAINT_COLORS.poi}),stroke:new Stroke({color:'#fff',width:2})}),text:label(feature,labels,size)});
 if(feature.get('kind')==='crossing')return [new Style({stroke:new Stroke({color:'#fff',width:7})}),new Style({stroke:new Stroke({color:CONSTRAINT_COLORS.crossing,width:4}),text:label(feature,labels,size)})];
 return new Style({stroke:new Stroke({color:CONSTRAINT_COLORS.corridor,width:5,lineDash:[10,5]}),text:label(feature,labels,size)});
}
