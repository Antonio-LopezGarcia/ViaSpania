import {CalculationBackgroundSelect,useCalculationBackgrounds} from './CalculationBackgroundSelect';
import {calculationBackgroundOptions} from '../core/calculationBackgrounds';
import type {ExternalMapLayer} from '../core/externalMapLayers';
import {createExternalMapSource} from '../services/externalMapLayers';
import {CONSTRAINT_COLORS} from '../core/constraintColors';
import { useEffect, useMemo, useRef, useState } from 'react';
import Feature from 'ol/Feature';
import OLMap from 'ol/Map';
import View from 'ol/View';
import LineString from 'ol/geom/LineString';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { defaults as defaultControls, ScaleLine } from 'ol/control';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import type { Barrier, EnabledCrossing, GeoPoint, ModelId, PointOfInterest, PreferredCorridor, RouteResult } from '../types';
import { MODELS } from '../core/costModels';
import { comparisonRouteColor } from '../core/comparisonColors';
import { COPERNICUS_VHR_2021_LAYER, COPERNICUS_VHR_2021_WMS } from '../services/ogc';
import type { SharedMapView, StudyExtent } from './MapPanel';
import 'ol/ol.css';
import '../comparison-viewer.css';
import '../comparison-viewer-label.css';
import { ViewerIcon } from './ViewerIcon';
import {ElevationProfileOverlay} from './ElevationProfileOverlay';

type Background=string;
interface Layers { barriers:boolean; crossings:boolean; pointsOfInterest:boolean; corridors:boolean; pointLabels:boolean; scale:boolean }

const resolutions=Array.from({length:20},(_,zoom)=>156543.03392804097/2**zoom),matrixIds=resolutions.map((_,zoom)=>String(zoom));

function wmts(url:string,layer:string,format='image/jpeg'){return new WMTS({url,layer,matrixSet:'GoogleMapsCompatible',format,projection:'EPSG:3857',style:'default',crossOrigin:'anonymous',tileGrid:new WMTSTileGrid({origin:[-20037508.342789244,20037508.342789244],resolutions,matrixIds}),attributions:'IGN/CNIG'})}
function backgroundSource(background:Background,externalLayers:readonly ExternalMapLayer[]){
  const external=externalLayers.find(layer=>`external:${layer.id}`===background);if(external)return createExternalMapSource(external);
  if(background==='osm')return new OSM({crossOrigin:'anonymous'});
  if(background==='pnoa')return wmts('https://www.ign.es/wmts/pnoa-ma','OI.OrthoimageCoverage');
  if(background==='copernicus-vhr-2021')return new TileWMS({url:COPERNICUS_VHR_2021_WMS,params:{LAYERS:COPERNICUS_VHR_2021_LAYER,TILED:true,FORMAT:'image/jpeg',TRANSPARENT:false},projection:'EPSG:4326',crossOrigin:'anonymous',attributions:'Copernicus Land Monitoring Service · EEA · VHR 2021 · 2 m'});
  if(background==='topographic')return wmts('https://www.ign.es/wmts/mapa-raster','MTN');
  const aerial=background==='american'||background==='interministerial',plan=background==='minutas';
  return new TileWMS({url:aerial?'https://www.ign.es/wms/pnoa-historico':plan?'https://www.ign.es/wms/minutas-cartograficas':'https://www.ign.es/wms/primera-edicion-mtn',params:{LAYERS:background==='mtn50'?'MTN50':background==='mtn25'?'MTN25':background==='catastrones'?'catastrones':background==='minutas'?'Minutas':background==='american'?'AMS_1956-1957':'Interministerial_1973-1986',TILED:true,FORMAT:aerial?'image/jpeg':'image/png',TRANSPARENT:!aerial},projection:'EPSG:3857',crossOrigin:'anonymous',attributions:'IGN/CNIG'});
}
function sameView(view:View,next:SharedMapView){const center=view.getCenter(),resolution=view.getResolution();return Boolean(center&&resolution&&Math.abs(center[0]-next.center[0])<.01&&Math.abs(center[1]-next.center[1])<.01&&Math.abs(resolution-next.resolution)<.001&&Math.abs(view.getRotation()-next.rotation)<.00001)}
function pointStyle(feature:Feature,labels:boolean){const role=feature.get('role'),color=role==='inicio'?'#59d2ff':role==='final'?'#ff796f':'#d8ff55';return new Style({image:new CircleStyle({radius:6,fill:new Fill({color}),stroke:new Stroke({color:'#fff',width:2})}),text:labels?new Text({text:String(feature.get('name')??''),offsetY:-16,font:'600 11px sans-serif',fill:new Fill({color:'#fff'}),stroke:new Stroke({color:'#101713',width:3})}):undefined})}

interface MapProps {routes:RouteResult[];colors:Map<ModelId,string>;points:GeoPoint[];barriers:Barrier[];corridors:PreferredCorridor[];crossings:EnabledCrossing[];pointsOfInterest:PointOfInterest[];layers:Layers;background:Background;externalLayers:readonly ExternalMapLayer[];viewState:SharedMapView;onViewChange:(view:SharedMapView)=>void;label:string;studyExtent:StudyExtent}
function ComparisonMap({routes,colors,points,barriers,corridors,crossings,pointsOfInterest,layers,background,externalLayers,viewState,onViewChange,label,studyExtent}:MapProps){
  const host=useRef<HTMLDivElement>(null),mapRef=useRef<OLMap|null>(null),syncing=useRef(false),onViewChangeRef=useRef(onViewChange);onViewChangeRef.current=onViewChange;
  useEffect(()=>{if(!host.current)return;const routeSource=new VectorSource(),pointSource=new VectorSource(),auxiliarySource=new VectorSource();
    for(const route of routes){if(!route.coordinates||route.coordinates.length<2)continue;const feature=new Feature(new LineString(route.coordinates.map(coordinate=>fromLonLat(coordinate))));feature.set('model',route.model);routeSource.addFeature(feature)}
    for(const point of points){const feature=new Feature(new Point(fromLonLat([point.lon,point.lat])));feature.setProperties({role:point.role,name:point.name,kind:'route-point'});pointSource.addFeature(feature)}
    if(layers.barriers)for(const [index,barrier] of barriers.entries()){const feature=new Feature(new LineString(barrier.coordinates.map(coordinate=>fromLonLat(coordinate))));feature.setProperties({kind:'barrier',barrierKind:barrier.kind,name:barrier.name?.trim()||`Barrera ${index+1}`});auxiliarySource.addFeature(feature)}
    if(layers.corridors)for(const corridor of corridors){const feature=new Feature(new LineString(corridor.coordinates.map(coordinate=>fromLonLat([...coordinate]))));feature.setProperties({kind:'corridor',name:corridor.name});auxiliarySource.addFeature(feature)}
    if(layers.crossings)for(const crossing of crossings){const feature=new Feature(new LineString(crossing.coordinates.map(coordinate=>fromLonLat([...coordinate]))));feature.setProperties({kind:'crossing',name:crossing.name});auxiliarySource.addFeature(feature)}
    if(layers.pointsOfInterest)for(const poi of pointsOfInterest){const feature=new Feature(new Point(fromLonLat([...poi.coordinate])));feature.setProperties({kind:'poi',name:poi.name});auxiliarySource.addFeature(feature)}
    const coverageSource=new VectorSource({features:[new Feature(polygonFromExtent(transformExtent(studyExtent,'EPSG:4326','EPSG:3857')))]});
    const coverageLayer=new VectorLayer({source:coverageSource,style:new Style({fill:new Fill({color:'rgba(216,255,85,.08)'}),stroke:new Stroke({color:'#d8ff55',width:2,lineDash:[7,5]})}),zIndex:9});
    const routeLayer=new VectorLayer({source:routeSource,style:feature=>[new Style({stroke:new Stroke({color:'#08110ddd',width:8})}),new Style({stroke:new Stroke({color:colors.get(feature.get('model') as ModelId)??'#fff',width:4})})],zIndex:10});
    const auxiliaryLayer=new VectorLayer({source:auxiliarySource,zIndex:11,style:feature=>{const kind=feature.get('kind'),name=String(feature.get('name')??''),text=layers.pointLabels&&name?new Text({text:name,offsetY:kind==='poi'?-15:-10,font:'600 10px sans-serif',fill:new Fill({color:'#fff'}),stroke:new Stroke({color:'#101713',width:3})}):undefined;if(kind==='poi')return new Style({image:new CircleStyle({radius:6,fill:new Fill({color:CONSTRAINT_COLORS.poi}),stroke:new Stroke({color:'#fff',width:2})}),text});return new Style({stroke:new Stroke({color:kind==='barrier'?(feature.get('barrierKind')==='absolute'?'#050505':'#777'):kind==='corridor'?CONSTRAINT_COLORS.corridor:CONSTRAINT_COLORS.crossing,width:kind==='crossing'?6:4,lineDash:kind==='barrier'&&feature.get('barrierKind')==='penalty'?[6,4]:kind==='corridor'?[10,5]:undefined}),text})}});
    const pointLayer=new VectorLayer({source:pointSource,style:feature=>pointStyle(feature as Feature,layers.pointLabels),zIndex:12});
    const controls=layers.scale?defaultControls().extend([new ScaleLine()]):defaultControls();
    const map=new OLMap({target:host.current,layers:[new TileLayer({source:backgroundSource(background,externalLayers)}),coverageLayer,routeLayer,auxiliaryLayer,pointLayer],view:new View({center:viewState.center,resolution:viewState.resolution,rotation:viewState.rotation}),controls});mapRef.current=map;map.getView().fit(transformExtent(studyExtent,'EPSG:4326','EPSG:3857'),{padding:[46,46,46,46]});
    map.on('moveend',()=>{if(syncing.current){syncing.current=false;return}const view=map.getView(),center=view.getCenter(),resolution=view.getResolution();if(center&&resolution)onViewChangeRef.current({center:[center[0],center[1]],resolution,rotation:view.getRotation()})});return()=>{mapRef.current=null;map.setTarget(undefined)};
  },[routes,colors,points,barriers,corridors,crossings,pointsOfInterest,layers,background,externalLayers,studyExtent]);
  useEffect(()=>{const map=mapRef.current;if(!map||sameView(map.getView(),viewState))return;syncing.current=true;map.getView().setCenter(viewState.center);map.getView().setResolution(viewState.resolution);map.getView().setRotation(viewState.rotation)},[viewState]);
  return <div className="comparison-map"><div ref={host}/><span className="comparison-map-label">{label} · {calculationBackgroundOptions(externalLayers).find(option=>option.id===background)?.name}</span></div>;
}

interface Props {results:RouteResult[];points:GeoPoint[];barriers:Barrier[];corridors:PreferredCorridor[];crossings:EnabledCrossing[];pointsOfInterest:PointOfInterest[];initialView:SharedMapView;studyExtent:StudyExtent}
export function ComparisonViewer({results,points,barriers,corridors,crossings,pointsOfInterest,initialView,studyExtent}:Props){
  const [open,setOpen]=useState(false),[mode,setMode]=useState<'split'|'overlay'>('overlay'),[left,setLeft]=useState<ModelId>(results[0]?.model??'tobler'),[right,setRight]=useState<ModelId>(results[1]?.model??results[0]?.model??'tobler'),[visible,setVisible]=useState<ModelId[]>(()=>results.map(result=>result.model)),[sharedView,setSharedView]=useState(initialView),[overlayBackground,setOverlayBackground]=useState<Background>('pnoa'),[leftBackground,setLeftBackground]=useState<Background>('pnoa'),[rightBackground,setRightBackground]=useState<Background>('pnoa'),[layers,setLayers]=useState<Layers>({barriers:true,crossings:true,pointsOfInterest:true,corridors:true,pointLabels:true,scale:true});
  const order=useMemo(()=>results.map(result=>result.model),[results]),colors=useMemo(()=>new Map(order.map(model=>[model,comparisonRouteColor(model,order)])),[order]),leftRoutes=useMemo(()=>results.filter(result=>result.model===left),[results,left]),rightRoutes=useMemo(()=>results.filter(result=>result.model===right),[results,right]),visibleRoutes=useMemo(()=>results.filter(result=>visible.includes(result.model)),[results,visible]),profileResults=mode==='overlay'?visibleRoutes:[...leftRoutes,...rightRoutes.filter(result=>result.model!==left)];
  useEffect(()=>{if(!results.some(result=>result.model===left))setLeft(results[0]?.model??'tobler');if(!results.some(result=>result.model===right))setRight(results[1]?.model??results[0]?.model??'tobler');setVisible(current=>current.filter(model=>results.some(result=>result.model===model)).concat(results.map(result=>result.model).filter(model=>!current.includes(model))))},[results,left,right]);
  const {externalLayers,options}=useCalculationBackgrounds();
  const selectedBackground=(value:string)=>options.some(option=>option.id===value)?value:'pnoa';
  const common={externalLayers,colors,points,barriers,corridors,crossings,pointsOfInterest,layers,viewState:sharedView,onViewChange:setSharedView,studyExtent};
  const backgroundSelect=(value:Background,onChange:(value:Background)=>void)=><CalculationBackgroundSelect value={selectedBackground(value)} onChange={onChange} options={options}/>;
  return <>{results.length>0&&<button className="secondary wide viewer-button" onClick={()=>{setSharedView(initialView);setMode('overlay');setOpen(true)}}><ViewerIcon/>Abrir visor de comparación</button>}{open&&results.length>0&&<section className="comparison-overlay">
    <div className="comparison-toolbar"><strong>{mode==='overlay'?'Visor de superposición':'Visor dual'}</strong><div className="comparison-mode"><button className={mode==='overlay'?'active':''} onClick={()=>setMode('overlay')}>Visor de superposición</button><button className={mode==='split'?'active':''} onClick={()=>setMode('split')}>Visor dual</button></div><button onClick={()=>setOpen(false)}>Cerrar</button></div>
    <div className="comparison-options"><b>Capas</b>{([['barriers','Barreras'],['crossings','Puentes y pasos'],['pointsOfInterest','Puntos de interés'],['corridors','Corredores'],['pointLabels','Etiquetas de puntos'],['scale','Escala']] as const).map(([key,label])=><label key={key}><input type="checkbox" checked={layers[key]} onChange={event=>setLayers(current=>({...current,[key]:event.target.checked}))}/>{label}</label>)}</div>
    <div className="comparison-capture">{mode==='split'?<div className="comparison-split"><div className="comparison-pane"><div className="comparison-pane-controls"><label>Modelo<select value={left} onChange={event=>setLeft(event.target.value as ModelId)}>{results.map(result=><option key={result.model} value={result.model}>{MODELS[result.model].name}</option>)}</select></label><label>Mapa{backgroundSelect(leftBackground,setLeftBackground)}</label></div><ComparisonMap {...common} routes={leftRoutes} background={selectedBackground(leftBackground)} label={MODELS[left].name}/></div><div className="comparison-pane"><div className="comparison-pane-controls"><label>Modelo<select value={right} onChange={event=>setRight(event.target.value as ModelId)}>{results.map(result=><option key={result.model} value={result.model}>{MODELS[result.model].name}</option>)}</select></label><label>Mapa{backgroundSelect(rightBackground,setRightBackground)}</label></div><ComparisonMap {...common} routes={rightRoutes} background={selectedBackground(rightBackground)} label={MODELS[right].name}/></div></div>:<div className="comparison-overlay-mode"><ComparisonMap {...common} routes={visibleRoutes} background={selectedBackground(overlayBackground)} label={`${visible.length} modelos visibles`}/><aside><label>Mapa de fondo{backgroundSelect(overlayBackground,setOverlayBackground)}</label><b>Modelos superpuestos</b>{results.map(result=><label key={result.model}><input type="checkbox" checked={visible.includes(result.model)} onChange={event=>setVisible(current=>event.target.checked?[...current,result.model]:current.filter(model=>model!==result.model))}/><i style={{background:colors.get(result.model)}}/>{MODELS[result.model].name}</label>)}</aside></div>}<ElevationProfileOverlay routes={profileResults.map(result=>({result,label:MODELS[result.model].name,color:colors.get(result.model)??'#fff'}))}/></div>
  </section>}</>;
}
