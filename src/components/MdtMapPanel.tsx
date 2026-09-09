import {constraintMapFeatures,barrierMapStyle,facilitatorMapStyle} from './constraintMapFeatures';
import { useEffect, useRef, useState } from 'react';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import MultiLineString from 'ol/geom/MultiLineString';
import Point from 'ol/geom/Point';
import Circle from 'ol/geom/Circle';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import ImageStatic from 'ol/source/ImageStatic';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import View from 'ol/View';
import ScaleLine from 'ol/control/ScaleLine';
import type { GeoPoint,Barrier,PreferredCorridor,EnabledCrossing,PointOfInterest } from '../types';
import type { SharedMapView, StudyExtent } from './MapPanel';
import '../mdt-map.css';
import { loadAppSettings } from '../core/appSettings';
import {selectionMarkerStyle} from './selectionMarkerStyle';

interface MdtMapPanelProps {
  barriers?:Barrier[];corridors?:PreferredCorridor[];crossings?:EnabledCrossing[];pointsOfInterest?:PointOfInterest[];
  expanded?:boolean;
  imageUrl: string;
  studyExtent: StudyExtent;
  viewState: SharedMapView;
  onViewChange: (view: SharedMapView) => void;
  points: GeoPoint[];
  selectedPointId: number | null;
  routes: { coordinates: [number, number][]; color: string }[];
  isochroneLines?: {level:number;coordinates:[number,number][]}[];
  isochroneSurface?: {imageUrl:string;opacity:number};
  onHover: (coordinate: [number, number] | null) => void;
  userLocation?: { lon:number; lat:number; accuracyM:number } | null;
  zoomToStudyExtentToken?: number|null;
  hoverEnabled?: boolean;
  onPointerCoordinate?: (coordinate:{lon:number;lat:number}|null)=>void;
  selectionMarkerCoordinate?: {lon:number;lat:number}|null;
}

const EMPTY_BARRIERS:Barrier[]=[],EMPTY_CORRIDORS:PreferredCorridor[]=[],EMPTY_CROSSINGS:EnabledCrossing[]=[],EMPTY_POIS:PointOfInterest[]=[];
const EMPTY_ISOCHRONE_LINES:{level:number;coordinates:[number,number][]}[]=[];

function sameView(view: View, next: SharedMapView) {
  const center = view.getCenter(), resolution = view.getResolution();
  return Boolean(center && resolution && Math.abs(center[0]-next.center[0])<.01 && Math.abs(center[1]-next.center[1])<.01 && Math.abs(resolution-next.resolution)<.001 && Math.abs(view.getRotation()-next.rotation)<.00001);
}

export function MdtMapPanel({barriers=EMPTY_BARRIERS,corridors=EMPTY_CORRIDORS,crossings=EMPTY_CROSSINGS,pointsOfInterest=EMPTY_POIS,expanded=false,imageUrl,studyExtent,viewState,onViewChange,points,selectedPointId,routes,isochroneLines=EMPTY_ISOCHRONE_LINES,isochroneSurface,onHover,userLocation,zoomToStudyExtentToken,hoverEnabled=true,onPointerCoordinate,selectionMarkerCoordinate}:MdtMapPanelProps){
  const [showConstraints,setShowConstraints]=useState(true),[showLabels,setShowLabels]=useState(false);
  const [preferencesVersion,setPreferencesVersion]=useState(0),preferences=loadAppSettings();
  const constraintSource=useRef(new VectorSource()),constraintLayer=useRef(new VectorLayer({source:constraintSource.current,zIndex:2.5}));
  const pointSource=useRef(new VectorSource()),pointLayer=useRef(new VectorLayer({source:pointSource.current,zIndex:3}));
  useEffect(()=>{constraintSource.current.clear();constraintSource.current.addFeatures(constraintMapFeatures(barriers,corridors,crossings,pointsOfInterest))},[barriers,corridors,crossings,pointsOfInterest]);
  useEffect(()=>{const size=loadAppSettings().labelTextSizePx??11;constraintLayer.current.setVisible(showConstraints);constraintLayer.current.setStyle(feature=>['absolute','penalty'].includes(feature.get('kind'))?barrierMapStyle(feature,showLabels,size):facilitatorMapStyle(feature,showLabels,size))},[showConstraints,showLabels,preferencesVersion]);
  useEffect(()=>{pointSource.current.clear();pointSource.current.addFeatures(points.map(point=>new Feature({geometry:new Point(fromLonLat([point.lon,point.lat])),point})))},[points]);
  useEffect(()=>{const size=loadAppSettings().labelTextSizePx??11;pointLayer.current.setStyle(feature=>{const point=feature.get('point') as GeoPoint,selected=point.id===selectedPointId,color=point.role==='inicio'?'#59d2ff':point.role==='final'?'#ff796f':'#d8ff55';return new Style({image:new CircleStyle({radius:selected?9:7,fill:new Fill({color}),stroke:new Stroke({color:selected?'#fff':'#101713',width:selected?3:2})}),text:showLabels?new Text({text:point.name,offsetY:-(size+6),font:`600 ${size}px sans-serif`,fill:new Fill({color:'#fff'}),stroke:new Stroke({color:'#101713',width:3})}):undefined})})},[selectedPointId,showLabels,preferencesVersion]);
  useEffect(()=>{const refresh=()=>setPreferencesVersion(value=>value+1);window.addEventListener('viaspania-settings',refresh);return()=>window.removeEventListener('viaspania-settings',refresh)},[]);
  const host=useRef<HTMLDivElement>(null),mapRef=useRef<Map|null>(null),syncing=useRef(false),onViewChangeRef=useRef(onViewChange),onHoverRef=useRef(onHover),onPointerCoordinateRef=useRef(onPointerCoordinate),selectionMarkerSourceRef=useRef(new VectorSource());
  onViewChangeRef.current=onViewChange;onHoverRef.current=onHover;onPointerCoordinateRef.current=onPointerCoordinate;
  useEffect(()=>{
    if(!host.current)return;
    const imageExtent=transformExtent(studyExtent,'EPSG:4326','EPSG:3857');
    const routeSource=new VectorSource();
    const isochroneSource=new VectorSource(),levels=[...new Set(isochroneLines.map(line=>line.level))].sort((a,b)=>a-b);
    const locationSource=new VectorSource();
    const coverageSource=new VectorSource({features:[new Feature(polygonFromExtent(imageExtent))]});
    if(userLocation){const center=fromLonLat([userLocation.lon,userLocation.lat]),radius=userLocation.accuracyM/Math.max(.1,Math.cos(userLocation.lat*Math.PI/180));locationSource.addFeatures([new Feature(new Circle(center,radius)),new Feature(new Point(center))])}
    for(const route of routes){if(route.coordinates.length<2)continue;const feature=new Feature(new LineString(route.coordinates.map(coordinate=>fromLonLat(coordinate))));feature.set('color',route.color);routeSource.addFeature(feature)}
    for(const [index,level] of levels.entries()){const segments=isochroneLines.filter(line=>line.level===level&&line.coordinates.length>=2).map(line=>line.coordinates.map(coordinate=>fromLonLat(coordinate)));if(!segments.length)continue;const feature=new Feature(new MultiLineString(segments));const ratio=levels.length<2?1:index/(levels.length-1);feature.set('color',`hsl(${205-ratio*165} 95% 58%)`);isochroneSource.addFeature(feature)}
    const map=new Map({target:host.current,layers:[constraintLayer.current,
      new ImageLayer({source:new ImageStatic({url:imageUrl,imageExtent,projection:'EPSG:3857'}),zIndex:1}),
      new VectorLayer({source:coverageSource,zIndex:2,style:new Style({fill:new Fill({color:'rgba(216,255,85,.04)'}),stroke:new Stroke({color:'#d8ff55',width:2,lineDash:[7,5]})})}),
      ...(isochroneSurface?[new ImageLayer({source:new ImageStatic({url:isochroneSurface.imageUrl,imageExtent,projection:'EPSG:3857'}),opacity:isochroneSurface.opacity,zIndex:1.5})]:[]),
      new VectorLayer({source:isochroneSource,zIndex:2,style:feature=>new Style({stroke:new Stroke({color:String(feature.get('color')??'#fff'),width:2})})}),
      new VectorLayer({source:routeSource,zIndex:2,style:feature=>[new Style({stroke:new Stroke({color:'rgba(5,15,18,.92)',width:9,lineCap:'round',lineJoin:'round'})}),new Style({stroke:new Stroke({color:String(feature.get('color')??'#00f0ff'),width:4,lineCap:'round',lineJoin:'round'})})]}),
      pointLayer.current,
      new VectorLayer({source:locationSource,zIndex:4,style:feature=>feature.getGeometry()?.getType()==='Circle'?new Style({fill:new Fill({color:'rgba(60,150,255,.16)'}),stroke:new Stroke({color:'rgba(90,180,255,.8)',width:2})}):new Style({image:new CircleStyle({radius:7,fill:new Fill({color:'#168cff'}),stroke:new Stroke({color:'#fff',width:3})})})}),
      new VectorLayer({source:selectionMarkerSourceRef.current,zIndex:8,style:selectionMarkerStyle()}),
    ],view:new View({center:viewState.center,resolution:viewState.resolution,rotation:viewState.rotation}),controls:preferences.showScales?[new ScaleLine()]:[]});
    mapRef.current=map;
    map.on('moveend',()=>{if(syncing.current){syncing.current=false;return}const view=map.getView(),center=view.getCenter(),resolution=view.getResolution();if(center&&resolution)onViewChangeRef.current({center:[center[0],center[1]],resolution,rotation:view.getRotation()})});
    map.on('pointermove',event=>{const coordinate=toLonLat(event.coordinate) as [number,number];onPointerCoordinateRef.current?.({lon:coordinate[0],lat:coordinate[1]});if(hoverEnabled)onHoverRef.current(coordinate)});
    const leave=()=>{onPointerCoordinateRef.current?.(null);if(hoverEnabled)onHoverRef.current(null)};map.getViewport().addEventListener('mouseleave',leave);
    return()=>{map.getViewport().removeEventListener('mouseleave',leave);mapRef.current=null;map.setTarget(undefined)};
  },[imageUrl,studyExtent,routes,isochroneLines,isochroneSurface?.imageUrl,isochroneSurface?.opacity,userLocation,preferencesVersion,hoverEnabled]);
  useEffect(()=>{const source=selectionMarkerSourceRef.current;source.clear();if(selectionMarkerCoordinate)source.addFeature(new Feature(new Point(fromLonLat([selectionMarkerCoordinate.lon,selectionMarkerCoordinate.lat]))))},[selectionMarkerCoordinate]);
  useEffect(()=>{const map=mapRef.current;if(!map||sameView(map.getView(),viewState))return;syncing.current=true;map.getView().setCenter(viewState.center);map.getView().setResolution(viewState.resolution);map.getView().setRotation(viewState.rotation)},[viewState]);
  useEffect(()=>{const map=mapRef.current;if(!map||zoomToStudyExtentToken==null)return;map.getView().fit(transformExtent(studyExtent,'EPSG:4326','EPSG:3857'),{padding:[36,36,36,36],duration:250})},[zoomToStudyExtentToken,studyExtent]);
  return <div className="mdt-map"><div ref={host} className="mdt-map-canvas"/>{expanded&&<div className="mdt-constraint-controls"><label><input type="checkbox" checked={showConstraints} onChange={event=>setShowConstraints(event.target.checked)}/>Mostrar barreras y facilitadores</label><label><input type="checkbox" checked={showLabels} onChange={event=>setShowLabels(event.target.checked)}/>Mostrar etiquetas</label></div>}{preferences.showCrosshairs&&<div className="mdt-crosshair"/>}</div>;
}
