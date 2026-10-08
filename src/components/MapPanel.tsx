import {createLidarMapSource} from '../services/lidarMap';
import {pointColor} from '../core/points';
import {barrierMapStyle,facilitatorMapStyle} from './constraintMapFeatures';
import {barrierParts} from '../core/barriers';
import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature, { type FeatureLike } from 'ol/Feature';
import VectorTile from 'ol/VectorTile';
import { createEmpty, extend as extendExtent, isEmpty, type Extent } from 'ol/extent';
import type Projection from 'ol/proj/Projection';
import Point from 'ol/geom/Point';
import Circle from 'ol/geom/Circle';
import LineString from 'ol/geom/LineString';
import MultiLineString from 'ol/geom/MultiLineString';
import Polygon from 'ol/geom/Polygon';
import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import VectorTileLayer from 'ol/layer/VectorTile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import WMTS from 'ol/source/WMTS';
import TileWMS from 'ol/source/TileWMS';
import ImageStatic from 'ol/source/ImageStatic';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import ScaleLine from 'ol/control/ScaleLine';
import Attribution from 'ol/control/Attribution';
import DragBox from 'ol/interaction/DragBox';
import Draw from 'ol/interaction/Draw';
import Snap from 'ol/interaction/Snap';
import Modify from 'ol/interaction/Modify';
import Select from 'ol/interaction/Select';
import Translate from 'ol/interaction/Translate';
import { getArea as getGeodesicArea, getLength as getGeodesicLength } from 'ol/sphere';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import {placeMarkerStyle} from './placeMarkerStyle';
import {selectionMarkerStyle} from './selectionMarkerStyle';
import type { Barrier, EnabledCrossing, GeoPoint, PreferredCorridor } from '../types';
import { slopeColor } from '../core/routeSlope';
import { loadAppSettings } from '../core/appSettings';
import { translateText } from '../core/i18n';
import type { RouteResult } from '../types';
import { sampleRasterElevationsAt } from '../services/native';
import { ElevationProfileOverlay, type ElevationProfileRoute } from './ElevationProfileOverlay';
import {builtInMapAttribution} from '../core/mapSources';
import { fetchVectorTile } from '../services/native';
import { createExternalMapSource } from '../services/externalMapLayers';
import type { ExternalMapLayer } from '../core/externalMapLayers';
import { COPERNICUS_VHR_2021_LAYER, COPERNICUS_VHR_2021_WMS } from '../services/ogc';
import 'ol/ol.css';

export interface SharedMapView {
  extent?: [number,number,number,number];
  center: [number, number];
  resolution: number;
  rotation: number;
}

export type PointMode = 'pan' | 'select' | 'point' | 'move' | 'delete' | 'barrier' | 'corridor' | 'crossing' | 'poi' | 'select-barrier' | 'magic-ocean';
export type StudyExtent = [number, number, number, number];
export type ApproximationLineStyle='solid'|'dashed'|'dotted'|'dash-dot';
export interface ApproximationRoute {id:string;name:string;coordinates:[number,number][];color:string;lineStyle?:ApproximationLineStyle}
export type SelectableElement = {kind:'point';id:number}|{kind:'barrier';id:number}|{kind:'corridor'|'crossing'|'poi';id:string};

interface MapPanelProps {
  kind: 'osm' | 'pnoa' | 'historical';
  expanded?: boolean;
  navigationLayer?: 'osm' | 'opentopomap' | 'ign-topographic';
  orthophotoLayer?: 'pnoa' | 'ign-lidar' | 'copernicus-vhr-2021';
  historicalLayer?: 'osm' | 'opentopomap' | 'ign-topographic' | 'ign-lidar' | 'MTN50' | 'MTN25' | 'catastrones' | 'Minutas' | 'AMS_1956-1957' | 'Interministerial_1973-1986';
  viewState: SharedMapView;
  onViewChange: (view: SharedMapView) => void;
  points?: GeoPoint[];
  selectedPointId?: number | null;
  showPointLabels?: boolean;
  onPointNameChange?: (pointId:number,name:string)=>void;
  showMunicipalBoundaries?: boolean;
  showGeographicalNames?: boolean;
  showCrosshair?: boolean;
  showScale?: boolean;
  showCursorCoordinates?: boolean;
  pointMode?: PointMode;
  onPointModeChange?: (mode:PointMode)=>void;
  onPointMapAction?: (action: { type: 'place' | 'select' | 'move' | 'delete'; lon: number; lat: number; pointId?: number }) => void;
  areaDrawing?: boolean;
  studyExtent?: StudyExtent;
  onStudyExtent?: (extent: StudyExtent) => void;
  routeCoordinates?: [number, number][];
  routeSlopesPercent?: number[];
  routeOverlays?: { id: string; coordinates: [number,number][]; color: string }[];
  isochroneLines?: { level:number; coordinates:[number,number][]; color?:string; width?:number; label?:string; labelPoints?:[number,number][]; labelRotation?:number; halo?:string; labelColor?:string }[];
  peakLabels?: {coordinate:[number,number];label:string}[];
  isochroneSurface?: {imageUrl:string;extent:StudyExtent;opacity:number};
  barriers?: Barrier[];
  onBarriersChange?: (barriers: Barrier[])=>void;
  magicTolerance?: number;
  onMagicToleranceChange?: (value:number)=>void;
  oceanEditMode?: 'pan'|'edit'|'cut'|'join'|'delete';
  corridors?: PreferredCorridor[];
  crossings?: EnabledCrossing[];
  userLocation?: { lon:number; lat:number; accuracyM:number } | null;
  selectedBarrierIndex?: number | null;
  onBarrierPolyline?: (coordinates: [number, number][]) => void;
  onMagicOceanSeed?: (coordinate:[number,number])=>void;
  onFacilitatorPolyline?: (kind:'corridor'|'crossing',coordinates:[number,number][])=>void;
  onPointerCoordinate?: (coordinate:{lon:number;lat:number}|null)=>void;
  onMapPick?: (coordinate:[number,number])=>void;
  pickingViewshed?: boolean;
  placeMarkerCoordinates?: readonly {lon:number;lat:number}[];
  selectionMarkerCoordinate?: {lon:number;lat:number}|null;
  zoomToStudyExtentToken?: number|null;
  selectedElement?: SelectableElement|null;
  onElementMapAction?: (action:{type:'select'|'move'|'delete';element?:SelectableElement;lon:number;lat:number})=>void;
  externalLayer?: ExternalMapLayer;
  approximationRoutes?: ApproximationRoute[];
  onApproximationRoutesChange?: (routes:ApproximationRoute[])=>void;
  rasterPath?:string;
  measurementTools?:boolean;
}

const pnoaRes = Array.from({ length: 20 }, (_, zoom) => 156543.03392804097 / 2 ** zoom);
const ids = pnoaRes.map((_, zoom) => String(zoom));

function pointStyle(feature: Feature, selectedPointId?: number | null, showLabel=false, labelSize=11) {
  const selected = feature.get('pointId') === selectedPointId;
  const color = pointColor(feature.get('order')??0);
  return new Style({
    image: new CircleStyle({
      radius: selected ? 9 : 7,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: selected ? '#ffffff' : '#101713', width: selected ? 3 : 2 }),
    }),
    text: showLabel ? new Text({ text:String(feature.get('name')??''), offsetY:-(labelSize+6), font:`600 ${labelSize}px sans-serif`, fill:new Fill({color:'#fff'}), stroke:new Stroke({color:'#101713',width:3}) }) : undefined,
  });
}

function sameView(view: View, next: SharedMapView) {
  const center = view.getCenter();
  const resolution = view.getResolution();
  return Boolean(center && resolution && Math.abs(center[0] - next.center[0]) < 0.01 && Math.abs(center[1] - next.center[1]) < 0.01 && Math.abs(resolution - next.resolution) < 0.001 && Math.abs(view.getRotation() - next.rotation) < 0.00001);
}

function populatedPlacesUrl(extent: number[]) {
  const geographic=transformExtent(extent,'EPSG:3857','EPSG:4326');
  const params = new URLSearchParams({ SERVICE: 'WFS', VERSION: '2.0.0', REQUEST: 'GetFeature', TYPENAMES: 'gn:NamedPlace', OUTPUTFORMAT: 'application/geo+json', SRSNAME: 'EPSG:4326', COUNT: '5000', BBOX:`${geographic.join(',')},EPSG:4326` });
  return `https://www.ign.es/wfs-inspire/ngbe?${params.toString()}`;
}

function populatedPlaceStyle(feature: Feature,labelSize=11) {
  const type=feature.get('type') as {href?:string}|string|undefined,href=typeof type==='string'?type:type?.href;
  if(!href?.endsWith('/populatedPlace'))return undefined;
  const name = feature.get('name') as { GeographicalName?: { spelling?: { SpellingOfName?: { text?: string } } } } | undefined;
  const label = name?.GeographicalName?.spelling?.SpellingOfName?.text;
  if (!label) return undefined;
  return new Style({
    image: new CircleStyle({ radius: 3, fill: new Fill({ color: '#fff' }), stroke: new Stroke({ color: '#152019', width: 1.5 }) }),
    text: new Text({ text: label, offsetY: -(labelSize+5), font: `600 ${labelSize}px sans-serif`, fill: new Fill({ color: '#fff' }), stroke: new Stroke({ color: '#111', width: 3 }), overflow: false }),
  });
}

function populationTileStyle(feature:Feature,labelSize=11){const label=String(feature.get('nombre')??'').trim();if(!label)return undefined;return new Style({text:new Text({text:label,font:`700 ${labelSize}px sans-serif`,fill:new Fill({color:'#fff'}),stroke:new Stroke({color:'#111',width:3}),overflow:false,padding:[3,5,3,5]})})}
function populationTileSource(){const format=new MVT(),source=new VectorTileSource({format,url:'https://vt-poblaciones.ign.es/api.nuc/{z}/{x}/{y}.pbf',attributions:'Núcleos de población: IGN/CNIG · IGR Poblaciones'});source.setTileLoadFunction((rawTile,url)=>{const tile=rawTile as VectorTile<FeatureLike>;tile.setLoader((extent:Extent,_resolution:number,projection:Projection)=>{fetchVectorTile(url).then(base64=>{const binary=atob(base64),bytes=new Uint8Array(binary.length);for(let index=0;index<binary.length;index++)bytes[index]=binary.charCodeAt(index);tile.setFeatures(format.readFeatures(bytes.buffer,{extent,featureProjection:projection}))}).catch(()=>tile.setFeatures([]))})});return source}

function measurementCoordinates(line:LineString,maxSamples=120):[number,number][]{
  const coordinates=line.getCoordinates();if(coordinates.length<2)return[];
  const lengths=coordinates.slice(1).map((coordinate,index)=>Math.hypot(coordinate[0]-coordinates[index][0],coordinate[1]-coordinates[index][1])),total=lengths.reduce((sum,value)=>sum+value,0);
  if(!(total>0))return[];
  const count=Math.min(maxSamples,Math.max(2,Math.ceil(total/25))),samples:[number,number][]=[];
  for(let index=0;index<=count;index++){
    let remaining=total*index/count,segment=0;
    while(segment<lengths.length-1&&remaining>lengths[segment]){remaining-=lengths[segment];segment++}
    const ratio=lengths[segment]?Math.min(1,remaining/lengths[segment]):0,a=coordinates[segment],b=coordinates[segment+1];
    samples.push(toLonLat([a[0]+(b[0]-a[0])*ratio,a[1]+(b[1]-a[1])*ratio]) as [number,number]);
  }
  return samples;
}

function measurementEndCaps(line:LineString,resolution:number):LineString[]{
  const coordinates=line.getCoordinates();if(coordinates.length<2)return[];const size=Math.max(resolution,0.01)*6;
  return [[coordinates[0],coordinates[1]],[coordinates.at(-1)!,coordinates.at(-2)!]].flatMap(([point,neighbor])=>{const dx=point[0]-neighbor[0],dy=point[1]-neighbor[1],length=Math.hypot(dx,dy);if(!length)return[];const perpendicular=[-dy/length*size,dx/length*size];return[new LineString([[point[0]-perpendicular[0],point[1]-perpendicular[1]],[point[0]+perpendicular[0],point[1]+perpendicular[1]]])]});
}

async function sampleMeasurementProfile(rasterPath:string,coordinates:[number,number][],id:string):Promise<ElevationProfileRoute|null>{
  let elevations:(number|null)[];
  try{elevations=await sampleRasterElevationsAt(rasterPath,coordinates)}catch{return null}
  const valid=coordinates.map((coordinate,index)=>({coordinate,elevation:elevations[index]})).filter((item):item is {coordinate:[number,number];elevation:number}=>item.elevation!==null);
  if(valid.length<2)return null;
  let distanceM=0,ascentM=0,descentM=0;
  for(let index=1;index<valid.length;index++){const [lon1,lat1]=valid[index-1].coordinate,[lon2,lat2]=valid[index].coordinate,radians=Math.PI/180,dLat=(lat2-lat1)*radians,dLon=(lon2-lon1)*radians,a=Math.sin(dLat/2)**2+Math.cos(lat1*radians)*Math.cos(lat2*radians)*Math.sin(dLon/2)**2,segment=2*6371008.8*Math.asin(Math.min(1,Math.sqrt(a))),rise=valid[index].elevation-valid[index-1].elevation;distanceM+=segment;if(rise>0)ascentM+=rise;else descentM-=rise}
  const result:RouteResult={model:'tobler',direction:'Medición',path:[],coordinates:valid.map(item=>item.coordinate),elevationsM:valid.map(item=>item.elevation),cost:0,unit:'m',distanceM,ascentM,descentM};
  return{label:`Medición ${id}`,color:'#d8ff55',result};
}

export function MapPanel(props: MapPanelProps) {
  const { kind, viewState, onViewChange, points = [], selectedPointId, pointMode = 'select', onPointMapAction, areaDrawing = false, studyExtent, onStudyExtent } = props;
  const [mapLoadError,setMapLoadError]=useState('');
  const [pointNameEditorClosed,setPointNameEditorClosed]=useState(false);
  useEffect(()=>setPointNameEditorClosed(false),[selectedPointId]);
  const selectedPoint=points.find(point=>point.id===selectedPointId);
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const pointSourceRef = useRef(new VectorSource());
  const areaSourceRef = useRef(new VectorSource());
  const routeSourceRef = useRef(new VectorSource());
  const isochroneSourceRef = useRef(new VectorSource());
  const barrierSourceRef = useRef(new VectorSource());
  const facilitatorSourceRef = useRef(new VectorSource());
  const locationSourceRef = useRef(new VectorSource());
  const placeMarkerSourceRef = useRef(new VectorSource());
  const selectionMarkerSourceRef = useRef(new VectorSource());
  const selectionMarkerFeatureRef = useRef<Feature<Point> | null>(null);
  const approximationSourceRef = useRef(new VectorSource());
  const measurementSourceRef = useRef(new VectorSource());
  const [measurementMode,setMeasurementMode]=useState<'pan'|'distance'|'area'>('pan');
  const measurementModeRef=useRef(measurementMode);measurementModeRef.current=measurementMode;
  const [measurementRevision,setMeasurementRevision]=useState(0);
  const [measurementProfiles,setMeasurementProfiles]=useState<ElevationProfileRoute[]>([]);
  const [showMeasurementProfile,setShowMeasurementProfile]=useState(false);
  const measurementProfileGeneration=useRef(0);
  const measurementDrawRefs=useRef<Draw[]>([]);
  const oceanSourceRef = useRef(new VectorSource());
  const oceanSnapRef=useRef<Snap|null>(null);
  const oceanModifyRef=useRef<Modify|null>(null),oceanSelectRef=useRef<Select|null>(null),oceanTranslateRef=useRef<Translate|null>(null);
  const oceanModeRef=useRef<'pan'|'edit'|'cut'|'join'|'delete'>('pan');
  const oceanMode=props.oceanEditMode??'pan';oceanModeRef.current=oceanMode;
  const oceanJoinRef=useRef<{feature:Feature;end:0|1}|null>(null);
  const approximationRoutesRef=useRef<ApproximationRoute[]>(props.approximationRoutes??[]);
  const approximationUndoRef=useRef<ApproximationRoute[][]>([]);
  const approximationRedoRef=useRef<ApproximationRoute[][]>([]);
  const [approximationHistoryRevision,setApproximationHistoryRevision]=useState(0);
  const approximationDrawRef=useRef<Draw|null>(null);
  const approximationSnapRef=useRef<Snap|null>(null);
  const [approximationColor,setApproximationColor]=useState('#d8ff55');const approximationColorRef=useRef(approximationColor);approximationColorRef.current=approximationColor;
  const [approximationLineStyle,setApproximationLineStyle]=useState<ApproximationLineStyle>('solid');const approximationLineStyleRef=useRef(approximationLineStyle);approximationLineStyleRef.current=approximationLineStyle;
  const [approximationVisible,setApproximationVisible]=useState(true);const [zoomToApproximationToken,setZoomToApproximationToken]=useState(0);
  const [approximationMode,setApproximationMode]=useState<'pan'|'draw'|'edit'|'delete'|'cut'|'join'>('draw');const approximationModeRef=useRef(approximationMode);approximationModeRef.current=approximationMode;const joinEndpointRef=useRef<{feature:Feature;end:0|1}|null>(null);const [joinHint,setJoinHint]=useState('');
  const syncingRef = useRef(false);
  const barrierDrawRef = useRef<Draw | null>(null);
  const propsRef = useRef(props);
  const [mapPreferences,setMapPreferences]=useState(()=>loadAppSettings());
  const [showConstraints,setShowConstraints]=useState(true),[showLabels,setShowLabels]=useState(()=>loadAppSettings().showPointLabels);
  const effectiveShowLabels=props.expanded===undefined?(props.showPointLabels??mapPreferences.showPointLabels):showLabels;
  propsRef.current = props;
  const copyApproximationRoutes=(routes:readonly ApproximationRoute[])=>routes.map(route=>({...route,lineStyle:route.lineStyle??'solid',coordinates:route.coordinates.map(coordinate=>[coordinate[0],coordinate[1]] as [number,number])}));
  const commitApproximationRoutes=(routes:ApproximationRoute[])=>{const next=copyApproximationRoutes(routes),current=approximationRoutesRef.current;if(JSON.stringify(current)===JSON.stringify(next))return;approximationUndoRef.current=[...approximationUndoRef.current,copyApproximationRoutes(current)].slice(-100);approximationRedoRef.current=[];approximationRoutesRef.current=next;propsRef.current.onApproximationRoutesChange?.(copyApproximationRoutes(next));setApproximationHistoryRevision(value=>value+1)};
  const oceanSnapshot=()=>{const mask=(propsRef.current.barriers??[]).find(item=>item.generatedBy==='magic-ocean');return mask?JSON.parse(JSON.stringify(mask)) as Barrier:null};
  const commitOcean=()=>{const lines=oceanSourceRef.current.getFeatures().filter(feature=>feature.get('oceanLine')).map(feature=>(feature.getGeometry() as LineString).getCoordinates().map(coordinate=>toLonLat(coordinate) as [number,number])).filter(line=>line.length>=2);const current=oceanSnapshot();if(!current)return;const next={...current,coordinates:lines[0]??current.coordinates,additionalParts:lines.slice(1)};if(JSON.stringify(next)===JSON.stringify(current))return;propsRef.current.onBarriersChange?.([...(propsRef.current.barriers??[]).filter(item=>item.generatedBy!=='magic-ocean'),next]);};
  const undoApproximation=()=>{const previous=approximationUndoRef.current.pop();if(!previous)return;approximationRedoRef.current.push(copyApproximationRoutes(approximationRoutesRef.current));approximationRoutesRef.current=copyApproximationRoutes(previous);propsRef.current.onApproximationRoutesChange?.(copyApproximationRoutes(previous));setApproximationHistoryRevision(value=>value+1)};
  const redoApproximation=()=>{const next=approximationRedoRef.current.pop();if(!next)return;approximationUndoRef.current.push(copyApproximationRoutes(approximationRoutesRef.current));approximationRoutesRef.current=copyApproximationRoutes(next);propsRef.current.onApproximationRoutesChange?.(copyApproximationRoutes(next));setApproximationHistoryRevision(value=>value+1)};
  useEffect(()=>{const refresh=()=>setMapPreferences(loadAppSettings());window.addEventListener('viaspania-settings',refresh);return()=>window.removeEventListener('viaspania-settings',refresh)},[]);

  useEffect(() => {
    if (!host.current) return;
    const source = propsRef.current.externalLayer?createExternalMapSource(propsRef.current.externalLayer):kind === 'osm'
      ? propsRef.current.navigationLayer === 'opentopomap'
        ? new XYZ({url:'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',crossOrigin:'anonymous',attributions:builtInMapAttribution('opentopomap')})
        : propsRef.current.navigationLayer === 'ign-topographic'
        ? new WMTS({
            url: 'https://www.ign.es/wmts/mapa-raster',
            layer: 'MTN',
            matrixSet: 'GoogleMapsCompatible',
            format: 'image/jpeg',
            projection: 'EPSG:3857',
            tileGrid: new WMTSTileGrid({
              origin: [-20037508.342789244, 20037508.342789244],
              resolutions: pnoaRes,
              matrixIds: ids,
            }),
            style: 'default',
            crossOrigin: 'anonymous',
            attributions: builtInMapAttribution('ign-topographic'),
          })
        : new OSM({ attributions: builtInMapAttribution('osm') })
      : kind === 'pnoa' && propsRef.current.orthophotoLayer === 'ign-lidar' ? createLidarMapSource()
      : kind === 'pnoa' && propsRef.current.orthophotoLayer === 'copernicus-vhr-2021' ? new TileWMS({
          url: COPERNICUS_VHR_2021_WMS,
          params: { LAYERS: COPERNICUS_VHR_2021_LAYER, TILED: true, FORMAT: 'image/jpeg', TRANSPARENT: false },
          projection: 'EPSG:4326',
          crossOrigin: 'anonymous',
          attributions: builtInMapAttribution('copernicus-vhr-2021'),
        })
      : kind === 'pnoa' ? new WMTS({
          url: 'https://www.ign.es/wmts/pnoa-ma',
          layer: 'OI.OrthoimageCoverage',
          matrixSet: 'GoogleMapsCompatible',
          format: 'image/jpeg',
          projection: 'EPSG:3857',
          tileGrid: new WMTSTileGrid({ origin: [-20037508.342789244, 20037508.342789244], resolutions: pnoaRes, matrixIds: ids }),
          style: 'default',
          attributions: builtInMapAttribution('pnoa'),
        }) : (() => {
          const layer = propsRef.current.historicalLayer ?? 'MTN50';
          if(layer==='osm')return new OSM({crossOrigin:'anonymous',attributions:builtInMapAttribution('osm')});
          if(layer==='ign-topographic')return new WMTS({url:'https://www.ign.es/wmts/mapa-raster',layer:'MTN',matrixSet:'GoogleMapsCompatible',format:'image/jpeg',projection:'EPSG:3857',tileGrid:new WMTSTileGrid({origin:[-20037508.342789244,20037508.342789244],resolutions:pnoaRes,matrixIds:ids}),style:'default',crossOrigin:'anonymous',attributions:builtInMapAttribution('ign-topographic')});
          if(layer==='opentopomap')return new XYZ({url:'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',crossOrigin:'anonymous',attributions:builtInMapAttribution('opentopomap')});
          if(layer==='ign-lidar')return createLidarMapSource();
          const minutas = layer === 'Minutas';
          const aerial = layer === 'AMS_1956-1957' || layer === 'Interministerial_1973-1986';
          return new TileWMS({
            url: aerial ? 'https://www.ign.es/wms/pnoa-historico' : minutas ? 'https://www.ign.es/wms/minutas-cartograficas' : 'https://www.ign.es/wms/primera-edicion-mtn',
            params: { LAYERS: layer, TILED: true, FORMAT: aerial ? 'image/jpeg' : 'image/png', TRANSPARENT: !aerial },
            projection: 'EPSG:3857',
            crossOrigin: 'anonymous',
            attributions: builtInMapAttribution(layer),
          });
        })();
    setMapLoadError('');
    const lidarSelected=!propsRef.current.externalLayer&&(kind==='pnoa'?propsRef.current.orthophotoLayer==='ign-lidar':kind==='historical'&&propsRef.current.historicalLayer==='ign-lidar');
    const lidarError=()=>setMapLoadError('No se pudo cargar el mapa LiDAR del IGN. Compruebe la conexión o seleccione otra cartografía.');
    if(lidarSelected)source.on('tileloaderror',lidarError);
    const labelSize=mapPreferences.labelTextSizePx??11;
    const pointLayer = new VectorLayer({ source: pointSourceRef.current, style: feature => pointStyle(feature as Feature, propsRef.current.selectedPointId, effectiveShowLabels,labelSize), zIndex: 20 });
    const referenceLayers = kind === 'pnoa' && (propsRef.current.orthophotoLayer ?? 'pnoa') === 'pnoa' ? [
      ...((propsRef.current.showMunicipalBoundaries??mapPreferences.showMunicipalBoundaries) ? [new TileLayer({ source: new TileWMS({
        url: 'https://www.ign.es/wms-inspire/unidades-administrativas',
        params: { LAYERS: 'AU.AdministrativeBoundary', STYLES: 'LimitesRojo', TILED: true, FORMAT: 'image/png', TRANSPARENT: true },
        projection: 'EPSG:3857', crossOrigin: 'anonymous', attributions: 'Límites municipales: IGN/CNIG',
      }) })] : []),
      ...((propsRef.current.showGeographicalNames??mapPreferences.showUrbanNames) ? [new VectorTileLayer({
        source: populationTileSource(),
        style: feature => populationTileStyle(feature as Feature,labelSize),
        declutter: true,
        minZoom: 8,
      })] : []),
    ] : [];
    const areaLayer = new VectorLayer({
      source: areaSourceRef.current,
      style: feature => feature.getGeometry()?.getType()==='Point'
        ? new Style({ image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#d8ff55' }), stroke: new Stroke({ color: '#101713', width: 2 }) }) })
        : new Style({ fill: new Fill({ color: 'rgba(216,255,85,.12)' }), stroke: new Stroke({ color: '#d8ff55', width: 2, lineDash: [7, 5] }) }),
      zIndex: 15,
    });
    const routeLayer = new VectorLayer({
      source: routeSourceRef.current,
      style: feature => [
        new Style({ stroke: new Stroke({ color: 'rgba(5, 15, 18, .9)', width: 9, lineCap: 'round', lineJoin: 'round' }) }),
        new Style({ stroke: new Stroke({ color: feature.get('color')??slopeColor(Number(feature.get('slope')??0)), width: 4, lineCap: 'round', lineJoin: 'round' }) }),
      ],
      zIndex: 18,
    });
    const approximationLayer=new VectorLayer({source:approximationSourceRef.current,visible:approximationVisible,style:feature=>{const style=String(feature.get('lineStyle')??'solid'),lineDash=style==='dashed'?[12,8]:style==='dotted'?[1,7]:style==='dash-dot'?[12,6,2,6]:undefined;return[new Style({stroke:new Stroke({color:'#101713',width:9,lineCap:'round',lineJoin:'round',lineDash})}),new Style({stroke:new Stroke({color:String(feature.get('color')??'#d8ff55'),width:5,lineCap:'round',lineJoin:'round',lineDash})})]},zIndex:24});
    const measurementLayer=new VectorLayer({
      source:measurementSourceRef.current,
      style:(feature,resolution)=>{
        const geometry=feature.getGeometry();
        const area=geometry?.getType()==='Polygon';
        const value=geometry?(area?getGeodesicArea(geometry as import('ol/geom/Polygon').default,{projection:'EPSG:3857'}):getGeodesicLength(geometry as LineString,{projection:'EPSG:3857'})):0;
        const label=area?(value>=1_000_000?`${(value/1_000_000).toFixed(2)} km²`:`${Math.round(value)} m²`):(value>=1000?`${(value/1000).toFixed(2)} km`:`${Math.round(value)} m`);
        const text=new Text({text:label,font:'bold 13px sans-serif',fill:new Fill({color:'#fff'}),stroke:new Stroke({color:'#101713',width:4}),backgroundFill:new Fill({color:'#101713dd'}),padding:[4,6,4,6],overflow:true});
        const styles:Style[]=[
          new Style({stroke:new Stroke({color:'#101713',width:7,lineCap:'round',lineJoin:'round'}),fill:new Fill({color:'rgba(216,255,85,.16)'})}),
          new Style({stroke:new Stroke({color:'#d8ff55',width:3,lineCap:'round',lineJoin:'round'}),fill:new Fill({color:'rgba(216,255,85,.16)'})}),
        ];
        if(geometry instanceof LineString){
          for(const cap of measurementEndCaps(geometry,resolution)){
            styles.push(new Style({geometry:cap,stroke:new Stroke({color:'#101713',width:7,lineCap:'round'})}));
            styles.push(new Style({geometry:cap,stroke:new Stroke({color:'#d8ff55',width:3,lineCap:'round'})}));
          }
        }
        styles.push(new Style({text,geometry:geometry instanceof LineString?new Point(geometry.getCoordinateAt(.5)):undefined}));
        return styles;
      },
      zIndex:26,
    });
    const oceanLayer=new VectorLayer({source:oceanSourceRef.current,style:[new Style({stroke:new Stroke({color:'#fff',width:8,lineCap:'round',lineJoin:'round',lineDash:[1,6]})}),new Style({stroke:new Stroke({color:'#168cff',width:4,lineCap:'round',lineJoin:'round',lineDash:[1,6]})})],zIndex:23});
    const isochroneLayer = new VectorLayer({
      source: isochroneSourceRef.current,
      style: feature => {const color=String(feature.get('color')??'#ffffff'),width=Number(feature.get('width')??2),label=String(feature.get('label')??''),halo=String(feature.get('halo')??'#101713');if(feature.get('labelOnly'))return new Style({text:new Text({text:label,rotation:Number(feature.get('rotation')??0),font:'600 12px sans-serif',fill:new Fill({color}),stroke:new Stroke({color:halo,width:4}),overflow:true})});return new Style({stroke:new Stroke({color,width})})},
      zIndex:17,
      declutter:true,
    });
    const barrierLayer = new VectorLayer({
      source: barrierSourceRef.current,
      style: feature => barrierMapStyle(feature,effectiveShowLabels,labelSize),
      visible:showConstraints,
      zIndex: 19,
    });
    const facilitatorLayer=new VectorLayer({source:facilitatorSourceRef.current,style:feature=>facilitatorMapStyle(feature,effectiveShowLabels,labelSize),visible:showConstraints,zIndex:19});
    const locationLayer=new VectorLayer({source:locationSourceRef.current,zIndex:25,style:feature=>feature.getGeometry()?.getType()==='Circle'?new Style({fill:new Fill({color:'rgba(60,150,255,.16)'}),stroke:new Stroke({color:'rgba(90,180,255,.8)',width:2})}):new Style({image:new CircleStyle({radius:7,fill:new Fill({color:'#168cff'}),stroke:new Stroke({color:'#fff',width:3})})})});
    const selectionMarkerLayer=new VectorLayer({source:selectionMarkerSourceRef.current,zIndex:30,style:selectionMarkerStyle()});
    const isochroneSurfaceLayer=propsRef.current.isochroneSurface?new ImageLayer({source:new ImageStatic({url:propsRef.current.isochroneSurface.imageUrl,imageExtent:transformExtent(propsRef.current.isochroneSurface.extent,'EPSG:4326','EPSG:3857'),projection:'EPSG:3857'}),opacity:propsRef.current.isochroneSurface.opacity,zIndex:16}):null;
    const map = new Map({
      target: host.current,
      layers: [new TileLayer({ source }), ...referenceLayers, areaLayer, ...(isochroneSurfaceLayer?[isochroneSurfaceLayer]:[]), isochroneLayer, routeLayer, oceanLayer, approximationLayer, measurementLayer, barrierLayer, facilitatorLayer, pointLayer,locationLayer,new VectorLayer({source:placeMarkerSourceRef.current,zIndex:29,style:placeMarkerStyle()}),selectionMarkerLayer],
      view: new View({ center: viewState.center, resolution: viewState.resolution, rotation: viewState.rotation }),
      controls: [new Attribution({collapsible:false}), ...(loadAppSettings().showScales ? [new ScaleLine()] : [])],
    });
    mapRef.current = map;
    const distanceDraw=new Draw({source:measurementSourceRef.current,type:'LineString',minPoints:2,stopClick:true}),areaDraw=new Draw({source:measurementSourceRef.current,type:'Polygon',minPoints:3,stopClick:true});
    distanceDraw.setActive(false);areaDraw.setActive(false);
    for(const draw of [distanceDraw,areaDraw])draw.on('drawend',event=>{const feature=event.feature,geometry=feature.getGeometry();feature.set('measurement',true);if(geometry instanceof LineString||geometry instanceof Polygon){for(const previous of measurementSourceRef.current.getFeatures()){if(previous===feature)continue;const previousGeometry=previous.getGeometry();if(geometry instanceof LineString&&previousGeometry instanceof LineString||geometry instanceof Polygon&&previousGeometry instanceof Polygon)measurementSourceRef.current.removeFeature(previous)}}measurementProfileGeneration.current++;setMeasurementProfiles([]);setShowMeasurementProfile(false);window.setTimeout(()=>setMeasurementRevision(value=>value+1),0)});
    measurementDrawRefs.current=[distanceDraw,areaDraw];map.addInteraction(distanceDraw);map.addInteraction(areaDraw);
    const approximationDraw=new Draw({source:approximationSourceRef.current,type:'LineString',minPoints:2,stopClick:true});approximationDraw.setActive(false);
    approximationDraw.on('drawend',event=>{const feature=event.feature,geometry=feature.getGeometry();if(!(geometry instanceof LineString))return;const drawn=geometry.getCoordinates(),existing=approximationSourceRef.current.getFeatures().filter(item=>item!==feature&&item.get('approximationRoute'));let joined=false;for(const item of existing){const line=item.getGeometry();if(!(line instanceof LineString))continue;const current=line.getCoordinates(),first=drawn[0],last=drawn.at(-1)!,head=current[0],tail=current.at(-1)!,near=(a:number[],b:number[])=>Math.hypot(a[0]-b[0],a[1]-b[1])<2;if(near(first,tail)){line.setCoordinates([...current,...drawn.slice(1)]);joined=true;break}if(near(last,head)){line.setCoordinates([...drawn.slice(0,-1),...current]);joined=true;break}if(near(first,head)){line.setCoordinates([...drawn.slice(1).reverse(),...current]);joined=true;break}if(near(last,tail)){line.setCoordinates([...current,...drawn.slice(0,-1).reverse()]);joined=true;break}}if(joined)approximationSourceRef.current.removeFeature(feature);else{feature.set('color',approximationColorRef.current);feature.set('lineStyle',approximationLineStyleRef.current);feature.set('approximationRoute',true);feature.setId(`aproximacion-${Date.now()}`)}window.setTimeout(()=>{const routes=approximationSourceRef.current.getFeatures().filter(item=>item.get('approximationRoute')).map((item,index)=>({id:String(item.getId()??`aproximacion-${index+1}`),name:`Ruta de aproximación ${index+1}`,coordinates:(item.getGeometry() as LineString).getCoordinates().map(coordinate=>toLonLat(coordinate) as [number,number]),color:String(item.get('color')??approximationColorRef.current),lineStyle:String(item.get('lineStyle')??approximationLineStyleRef.current) as ApproximationLineStyle}));commitApproximationRoutes(routes)},0)});
    approximationDrawRef.current=approximationDraw;map.addInteraction(approximationDraw);
    const approximationModify=new Modify({source:approximationSourceRef.current});approximationModify.setActive(false);map.addInteraction(approximationModify);approximationModify.on('modifyend',()=>{const routes=approximationSourceRef.current.getFeatures().filter(feature=>feature.get('approximationRoute')).map((feature,index)=>({id:String(feature.getId()??`aproximacion-${index+1}`),name:`Ruta de aproximación ${index+1}`,coordinates:(feature.getGeometry() as LineString).getCoordinates().map(coordinate=>toLonLat(coordinate) as [number,number]),color:String(feature.get('color')??approximationColor),lineStyle:String(feature.get('lineStyle')??approximationLineStyleRef.current) as ApproximationLineStyle}));commitApproximationRoutes(routes)});
    approximationSnapRef.current=new Snap({source:approximationSourceRef.current});approximationSnapRef.current.setActive(false);map.addInteraction(approximationSnapRef.current);
    const approximationSelect=new Select({layers:[approximationLayer],hitTolerance:8});approximationSelect.setActive(false);map.addInteraction(approximationSelect);const approximationTranslate=new Translate({features:approximationSelect.getFeatures()});approximationTranslate.setActive(false);map.addInteraction(approximationTranslate);approximationTranslate.on('translateend',()=>{const routes=approximationSourceRef.current.getFeatures().filter(feature=>feature.get('approximationRoute')).map((feature,index)=>({id:String(feature.getId()??`aproximacion-${index+1}`),name:`Ruta de aproximación ${index+1}`,coordinates:(feature.getGeometry() as LineString).getCoordinates().map(coordinate=>toLonLat(coordinate) as [number,number]),color:String(feature.get('color')??approximationColorRef.current),lineStyle:String(feature.get('lineStyle')??approximationLineStyleRef.current) as ApproximationLineStyle}));commitApproximationRoutes(routes)});
    approximationSelect.on('select',event=>{const mode=approximationModeRef.current;if(mode==='cut'){for(const feature of event.selected){const geometry=feature.getGeometry();if(!(geometry instanceof LineString))continue;const coordinates=geometry.getCoordinates();let bestSegment=-1,bestT=0,bestDistance=Infinity,bestPixel:[number,number]=[0,0];for(let index=0;index<coordinates.length-1;index++){const a=map.getPixelFromCoordinate(coordinates[index]),b=map.getPixelFromCoordinate(coordinates[index+1]),dx=b[0]-a[0],dy=b[1]-a[1],length2=dx*dx+dy*dy;if(!length2)continue;const t=Math.max(0,Math.min(1,((event.mapBrowserEvent.pixel[0]-a[0])*dx+(event.mapBrowserEvent.pixel[1]-a[1])*dy)/length2)),pixel:[number,number]=[a[0]+t*dx,a[1]+t*dy],distance=Math.hypot(pixel[0]-event.mapBrowserEvent.pixel[0],pixel[1]-event.mapBrowserEvent.pixel[1]);if(distance<bestDistance){bestSegment=index;bestT=t;bestDistance=distance;bestPixel=pixel}}if(bestSegment<0||bestDistance>14||bestT<.03||bestT>.97)continue;const aPixel=map.getPixelFromCoordinate(coordinates[bestSegment]),bPixel=map.getPixelFromCoordinate(coordinates[bestSegment+1]),segmentLength=Math.hypot(bPixel[0]-aPixel[0],bPixel[1]-aPixel[1]),halfGap=Math.min(4,segmentLength*bestT*.4,segmentLength*(1-bestT)*.4);if(halfGap<.5)continue;const unit:[number,number]=[(bPixel[0]-aPixel[0])/segmentLength,(bPixel[1]-aPixel[1])/segmentLength],beforeCoordinate=map.getCoordinateFromPixel([bestPixel[0]-unit[0]*halfGap,bestPixel[1]-unit[1]*halfGap]),afterCoordinate=map.getCoordinateFromPixel([bestPixel[0]+unit[0]*halfGap,bestPixel[1]+unit[1]*halfGap]),first=new Feature(new LineString([...coordinates.slice(0,bestSegment+1),beforeCoordinate])),second=new Feature(new LineString([afterCoordinate,...coordinates.slice(bestSegment+1)]));for(const part of [first,second]){part.set('approximationRoute',true);part.set('color',feature.get('color'));part.set('lineStyle',feature.get('lineStyle')??approximationLineStyleRef.current);part.setId(`aproximacion-${Date.now()}-${Math.random().toString(36).slice(2,6)}`);approximationSourceRef.current.addFeature(part)}approximationSourceRef.current.removeFeature(feature)}}else if(mode==='delete'){for(const feature of event.selected)approximationSourceRef.current.removeFeature(feature)}else return;const routes=approximationSourceRef.current.getFeatures().filter(feature=>feature.get('approximationRoute')).map((feature,index)=>({id:String(feature.getId()??`aproximacion-${index+1}`),name:`Ruta de aproximación ${index+1}`,coordinates:(feature.getGeometry() as LineString).getCoordinates().map(coordinate=>toLonLat(coordinate) as [number,number]),color:String(feature.get('color')??approximationColorRef.current),lineStyle:String(feature.get('lineStyle')??approximationLineStyleRef.current) as ApproximationLineStyle}));commitApproximationRoutes(routes);approximationSelect.getFeatures().clear()});
    if(kind==='pnoa'){
      const oceanModify=new Modify({source:oceanSourceRef.current});oceanModify.setActive(false);oceanModifyRef.current=oceanModify;map.addInteraction(oceanModify);oceanModify.on('modifyend',commitOcean);
      const oceanSelect=new Select({layers:[oceanLayer],hitTolerance:9});oceanSelect.setActive(false);oceanSelectRef.current=oceanSelect;map.addInteraction(oceanSelect);
      const oceanTranslate=new Translate({features:oceanSelect.getFeatures()});oceanTranslate.setActive(false);oceanTranslateRef.current=oceanTranslate;map.addInteraction(oceanTranslate);oceanTranslate.on('translateend',commitOcean);
      oceanSelect.on('select',event=>{const mode=oceanModeRef.current;if(mode==='delete'){for(const feature of event.selected)oceanSourceRef.current.removeFeature(feature);commitOcean()}else if(mode==='cut'){for(const feature of event.selected){const line=feature.getGeometry();if(!(line instanceof LineString))continue;const coordinates=line.getCoordinates(),pixel=event.mapBrowserEvent.pixel;let best=-1,tBest=0,dBest=Infinity;for(let i=0;i<coordinates.length-1;i++){const a=map.getPixelFromCoordinate(coordinates[i]),b=map.getPixelFromCoordinate(coordinates[i+1]),dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;if(!l)continue;const t=Math.max(0,Math.min(1,((pixel[0]-a[0])*dx+(pixel[1]-a[1])*dy)/l)),d=Math.hypot(a[0]+t*dx-pixel[0],a[1]+t*dy-pixel[1]);if(d<dBest){best=i;tBest=t;dBest=d}}if(best<0||dBest>14||tBest<.03||tBest>.97)continue;const a=map.getPixelFromCoordinate(coordinates[best]),b=map.getPixelFromCoordinate(coordinates[best+1]),length=Math.hypot(b[0]-a[0],b[1]-a[1]),gap=Math.min(8,length*tBest*.4,length*(1-tBest)*.4);if(gap<.5)continue;const unit:[number,number]=[(b[0]-a[0])/length,(b[1]-a[1])/length],before=map.getCoordinateFromPixel([pixel[0]-unit[0]*gap/2,pixel[1]-unit[1]*gap/2]),after=map.getCoordinateFromPixel([pixel[0]+unit[0]*gap/2,pixel[1]+unit[1]*gap/2]),first=new Feature(new LineString([...coordinates.slice(0,best+1),before])),second=new Feature(new LineString([after,...coordinates.slice(best+1)]));first.set('oceanLine',true);second.set('oceanLine',true);oceanSourceRef.current.addFeature(first);oceanSourceRef.current.addFeature(second);oceanSourceRef.current.removeFeature(feature)}commitOcean()}oceanSelect.getFeatures().clear()});
      oceanSnapRef.current=new Snap({source:oceanSourceRef.current});map.addInteraction(oceanSnapRef.current);
    }
    if(kind==='osm'){
      const dragBox=new DragBox({condition:()=>Boolean(propsRef.current.areaDrawing)});
      dragBox.on('boxend',()=>{const projected=dragBox.getGeometry().getExtent(),extent=transformExtent(projected,'EPSG:3857','EPSG:4326') as StudyExtent;propsRef.current.onStudyExtent?.(extent)});
      map.addInteraction(dragBox);
    }
    if(kind==='pnoa'){
      const barrierDraw=new Draw({source:barrierSourceRef.current,type:'LineString',condition:()=>['barrier','corridor','crossing'].includes(propsRef.current.pointMode??''),stopClick:true});barrierDraw.setActive(false);
      barrierDraw.on('drawend',event=>{
        const geometry=event.feature.getGeometry();
        if(!(geometry instanceof LineString))return;
        const coordinates=geometry.getCoordinates().map(coordinate=>toLonLat(coordinate) as [number,number]);
        const mode=propsRef.current.pointMode;if(coordinates.length>=2){if(mode==='barrier')propsRef.current.onBarrierPolyline?.(coordinates);else if(mode==='corridor'||mode==='crossing'){window.setTimeout(()=>{barrierSourceRef.current.removeFeature(event.feature);event.feature.set('kind',mode);facilitatorSourceRef.current.addFeature(event.feature)},0);if(propsRef.current.onFacilitatorPolyline)propsRef.current.onFacilitatorPolyline(mode,coordinates);else window.dispatchEvent(new CustomEvent('viaspania-add-facilitator',{detail:{kind:mode,coordinates}}))}}
      });
      barrierDrawRef.current=barrierDraw;
      barrierDraw.setActive(['barrier','corridor','crossing'].includes(propsRef.current.pointMode??''));
      map.addInteraction(barrierDraw);
    }
    map.on('moveend', () => {
      if (syncingRef.current) { syncingRef.current = false; return; }
      const view = map.getView();
      const center = view.getCenter();
      const resolution = view.getResolution();
      if (center && resolution) propsRef.current.onViewChange({ center: [center[0], center[1]], resolution, rotation: view.getRotation(), extent: transformExtent(view.calculateExtent(map.getSize()), view.getProjection(), 'EPSG:4326') as [number,number,number,number] });
    });
    map.on('pointermove',event=>{
      const [lon,lat]=toLonLat(event.coordinate);
      propsRef.current.onPointerCoordinate?.({lon,lat});
    });
    const leave=()=>propsRef.current.onPointerCoordinate?.(null);
    const contextMenu=(event:MouseEvent)=>{if(!['barrier','corridor','crossing'].includes(propsRef.current.pointMode??''))return;const draw=barrierDrawRef.current,sketch=draw?.getOverlay().getSource()?.getFeatures()[0]?.getGeometry();if(!(sketch instanceof LineString))return;const coordinates=sketch.getCoordinates(),lastCreated=coordinates.at(-2);if(!lastCreated)return;const eventPixel=map.getEventPixel(event),lastPixel=map.getPixelFromCoordinate(lastCreated);if(Math.hypot(eventPixel[0]-lastPixel[0],eventPixel[1]-lastPixel[1])>12)return;event.preventDefault();draw?.finishDrawing()};
    map.getViewport().addEventListener('mouseleave',leave);
    map.getViewport().addEventListener('contextmenu',contextMenu);
    map.on('singleclick', event => {
      if(propsRef.current.pickingViewshed){const coordinate=toLonLat(event.coordinate) as [number,number];propsRef.current.onMapPick?.(coordinate);return}
      if(kind==='pnoa'&&propsRef.current.expanded&&oceanModeRef.current==='join'){
        const hits=map.getFeaturesAtPixel(event.pixel,{layerFilter:layer=>layer===oceanLayer,hitTolerance:10}).filter((feature):feature is Feature=>feature instanceof Feature&&Boolean(feature.get('oceanLine'))),hit=hits[0];if(!hit)return;const line=hit.getGeometry();if(!(line instanceof LineString))return;const coords=line.getCoordinates(),first=map.getPixelFromCoordinate(coords[0]),last=map.getPixelFromCoordinate(coords.at(-1)!),firstDistance=Math.hypot(event.pixel[0]-first[0],event.pixel[1]-first[1]),lastDistance=Math.hypot(event.pixel[0]-last[0],event.pixel[1]-last[1]),end:0|1=firstDistance<lastDistance?0:1,selected=oceanJoinRef.current;if(Math.min(firstDistance,lastDistance)>16)return;if(!selected){oceanJoinRef.current={feature:hit,end};return}if(selected.feature===hit){oceanJoinRef.current={feature:hit,end};return}const a=(selected.feature.getGeometry() as LineString).getCoordinates(),b=coords,selectedCoordinate=a[selected.end===0?0:a.length-1],hitCoordinate=b[end===0?0:b.length-1],selectedPixel=map.getPixelFromCoordinate(selectedCoordinate),hitPixel=map.getPixelFromCoordinate(hitCoordinate);if(Math.hypot(selectedPixel[0]-hitPixel[0],selectedPixel[1]-hitPixel[1])>16){oceanJoinRef.current={feature:hit,end};return}const merged=new Feature(new LineString([...(selected.end===0?[...a].reverse():a),...(end===0?b.slice(1):[...b].reverse().slice(1))]));merged.set('oceanLine',true);oceanSourceRef.current.removeFeature(selected.feature);oceanSourceRef.current.removeFeature(hit);oceanSourceRef.current.addFeature(merged);oceanJoinRef.current=null;commitOcean();return;
      }
      if (kind === 'osm' && propsRef.current.areaDrawing) return;
      if(kind==='historical'&&approximationModeRef.current==='join'){
        const hits=map.getFeaturesAtPixel(event.pixel,{layerFilter:layer=>layer===approximationLayer,hitTolerance:12}).filter((feature):feature is Feature=>feature instanceof Feature&&Boolean(feature.get('approximationRoute'))),hit=hits.find(feature=>feature!==joinEndpointRef.current?.feature)??hits[0];
        if(!hit){joinEndpointRef.current=null;setJoinHint('Pulse sobre un extremo de una ruta.');return}
        const geometry=hit.getGeometry();if(!(geometry instanceof LineString))return;
        const coordinates=geometry.getCoordinates(),firstPixel=map.getPixelFromCoordinate(coordinates[0]),lastPixel=map.getPixelFromCoordinate(coordinates.at(-1)!),firstDistance=Math.hypot(event.pixel[0]-firstPixel[0],event.pixel[1]-firstPixel[1]),lastDistance=Math.hypot(event.pixel[0]-lastPixel[0],event.pixel[1]-lastPixel[1]);
        const endpoint:{feature:Feature;end:0|1}={feature:hit,end:firstDistance<=lastDistance?0:1},endpointDistance=Math.min(firstDistance,lastDistance);
        if(endpointDistance>16){setJoinHint('Pulse cerca de un extremo de la línea.');return}
        const selected=joinEndpointRef.current;
        if(!selected){joinEndpointRef.current=endpoint;setJoinHint('Extremo marcado. Pulse el extremo próximo de otra línea.');return}
        if(selected.feature===endpoint.feature){joinEndpointRef.current=endpoint;setJoinHint('Elija un extremo de otra línea.');return}
        const firstGeometry=selected.feature.getGeometry(),secondGeometry=endpoint.feature.getGeometry();if(!(firstGeometry instanceof LineString)||!(secondGeometry instanceof LineString)){joinEndpointRef.current=null;return}
        const firstCoords=firstGeometry.getCoordinates(),secondCoords=secondGeometry.getCoordinates(),joinA=map.getPixelFromCoordinate(firstCoords[selected.end===0?0:firstCoords.length-1]),joinB=map.getPixelFromCoordinate(secondCoords[endpoint.end===0?0:secondCoords.length-1]);
        if(Math.hypot(joinA[0]-joinB[0],joinA[1]-joinB[1])>16){joinEndpointRef.current=endpoint;setJoinHint('Los extremos están separados. Acerque uno mediante snap y vuelva a seleccionarlos.');return}
        const orientedFirst=selected.end===0?[...firstCoords].reverse():[...firstCoords],orientedSecond=endpoint.end===0?[...secondCoords]:[...secondCoords].reverse(),joined=new Feature(new LineString([...orientedFirst.slice(0,-1),orientedFirst.at(-1)!,...orientedSecond.slice(1)]));joined.set('approximationRoute',true);joined.set('color',selected.feature.get('color')??endpoint.feature.get('color')??approximationColorRef.current);joined.set('lineStyle',selected.feature.get('lineStyle')??approximationLineStyleRef.current);joined.setId(`aproximacion-${Date.now()}`);approximationSourceRef.current.removeFeature(selected.feature);approximationSourceRef.current.removeFeature(endpoint.feature);approximationSourceRef.current.addFeature(joined);joinEndpointRef.current=null;setJoinHint('Líneas unidas.');const routes=approximationSourceRef.current.getFeatures().filter(feature=>feature.get('approximationRoute')).map((feature,index)=>({id:String(feature.getId()??`aproximacion-${index+1}`),name:`Ruta de aproximación ${index+1}`,coordinates:(feature.getGeometry() as LineString).getCoordinates().map(coordinate=>toLonLat(coordinate) as [number,number]),color:String(feature.get('color')??approximationColorRef.current),lineStyle:String(feature.get('lineStyle')??approximationLineStyleRef.current) as ApproximationLineStyle}));commitApproximationRoutes(routes);return;
      }
      if (kind !== 'pnoa' || propsRef.current.areaDrawing) return;
      const currentMode = propsRef.current.pointMode ?? 'select';
      if(currentMode==='magic-ocean'){
        const coordinate=toLonLat(event.coordinate);
        window.dispatchEvent(new CustomEvent('viaspania-magic-ocean-seed',{detail:{coordinate:[coordinate[0],coordinate[1]]}}));
        return;
      }
      if (currentMode === 'barrier'||currentMode==='corridor'||currentMode==='crossing') {
        return;
      }
      if(currentMode==='select-barrier'){
        const barrier=map.forEachFeatureAtPixel(event.pixel,feature=>feature.get('barrierIndex')!=null?feature:undefined,{hitTolerance:10});
        const barrierIndex=barrier?.get('barrierIndex') as number|undefined;
        window.dispatchEvent(new CustomEvent('viaspania-select-barrier',{detail:{barrierIndex:barrierIndex??null}}));
        return;
      }
      if(['select','move','delete'].includes(currentMode)&&propsRef.current.onElementMapAction){
        const hit=map.forEachFeatureAtPixel(event.pixel,feature=>feature.get('elementKind')?feature:undefined,{hitTolerance:10});
        const coordinate=toLonLat(event.coordinate),element=hit?{kind:hit.get('elementKind'),id:hit.get('elementId')} as SelectableElement:undefined;
        if(currentMode==='select'&&element?.kind==='point')setPointNameEditorClosed(false);
        propsRef.current.onElementMapAction({type:currentMode as 'select'|'move'|'delete',element,lon:coordinate[0],lat:coordinate[1]});
        return;
      }
      const hit = map.forEachFeatureAtPixel(event.pixel, feature => feature.get('pointId') ? feature : undefined, { hitTolerance: 8 });
      const coordinate = toLonLat(event.coordinate);
      if(currentMode==='select'&&hit)setPointNameEditorClosed(false);
      if(currentMode==='poi'){window.dispatchEvent(new CustomEvent('viaspania-add-poi',{detail:{coordinate:[coordinate[0],coordinate[1]]}}));return}
      const pointId = hit?.get('pointId') as number | undefined;
      if (currentMode === 'select' && pointId) propsRef.current.onPointMapAction?.({ type: 'select', pointId, lon: coordinate[0], lat: coordinate[1] });
      else if (currentMode === 'delete' && pointId) propsRef.current.onPointMapAction?.({ type: 'delete', pointId, lon: coordinate[0], lat: coordinate[1] });
      else if (currentMode === 'move' && pointId) propsRef.current.onPointMapAction?.({ type: 'select', pointId, lon: coordinate[0], lat: coordinate[1] });
      else if (currentMode === 'move' && propsRef.current.selectedPointId != null) propsRef.current.onPointMapAction?.({ type: 'move', pointId: propsRef.current.selectedPointId, lon: coordinate[0], lat: coordinate[1] });
      else if (currentMode === 'point') propsRef.current.onPointMapAction?.({ type: 'place', lon: coordinate[0], lat: coordinate[1] });
    });
      return () => { if(lidarSelected)source.un('tileloaderror',lidarError);map.getViewport().removeEventListener('mouseleave',leave);map.getViewport().removeEventListener('contextmenu',contextMenu);barrierDrawRef.current=null;approximationDrawRef.current=null;approximationSnapRef.current=null;measurementDrawRefs.current=[];mapRef.current = null; map.setTarget(undefined); };
  }, [kind, props.historicalLayer, props.navigationLayer, props.orthophotoLayer, props.externalLayer?.id, props.externalLayer?.url, props.showMunicipalBoundaries, props.showGeographicalNames, props.showPointLabels, props.showScale, props.isochroneSurface?.imageUrl, props.isochroneSurface?.opacity, mapPreferences,showConstraints,effectiveShowLabels]);

  useEffect(()=>{approximationRoutesRef.current=copyApproximationRoutes(props.approximationRoutes??[])},[props.approximationRoutes]);
  useEffect(()=>{const onKeyDown=(event:KeyboardEvent)=>{if(kind!=='historical'||!propsRef.current.expanded||!(event.metaKey||event.ctrlKey)||event.key.toLowerCase()!=='z')return;const target=event.target;if(target instanceof HTMLElement&&(target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target.tagName)))return;event.preventDefault();if(event.shiftKey)redoApproximation();else undoApproximation()};window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown)},[kind]);
  useEffect(()=>{const source=approximationSourceRef.current;source.clear();for(const route of props.approximationRoutes??[]){if(route.coordinates.length<2)continue;const feature=new Feature(new LineString(route.coordinates.map(coordinate=>fromLonLat(coordinate))));feature.set('approximationRoute',true);feature.set('color',route.color);feature.set('lineStyle',route.lineStyle??'solid');feature.setId(route.id);source.addFeature(feature)}},[props.approximationRoutes]);
  useEffect(()=>{const source=approximationSourceRef.current;for(const feature of source.getFeatures())if(feature.get('approximationRoute'))feature.set('color',approximationColor);mapRef.current?.getLayers().changed();const routes=source.getFeatures().filter(feature=>feature.get('approximationRoute')).map((feature,index)=>({id:String(feature.getId()??`aproximacion-${index+1}`),name:`Ruta de aproximación ${index+1}`,coordinates:(feature.getGeometry() as LineString).getCoordinates().map(coordinate=>toLonLat(coordinate) as [number,number]),color:approximationColor,lineStyle:String(feature.get('lineStyle')??approximationLineStyleRef.current) as ApproximationLineStyle}));if(routes.length)commitApproximationRoutes(routes)},[approximationColor]);
  useEffect(()=>{const source=approximationSourceRef.current;for(const feature of source.getFeatures())if(feature.get('approximationRoute'))feature.set('lineStyle',approximationLineStyle);mapRef.current?.getLayers().changed();const routes=source.getFeatures().filter(feature=>feature.get('approximationRoute')).map((feature,index)=>({id:String(feature.getId()??`aproximacion-${index+1}`),name:`Ruta de aproximación ${index+1}`,coordinates:(feature.getGeometry() as LineString).getCoordinates().map(coordinate=>toLonLat(coordinate) as [number,number]),color:String(feature.get('color')??approximationColorRef.current),lineStyle:approximationLineStyle}));if(routes.length)commitApproximationRoutes(routes)},[approximationLineStyle]);
  useEffect(()=>{approximationDrawRef.current?.setActive(Boolean(props.expanded&&kind==='historical'&&approximationMode==='draw'));const map=mapRef.current;if(map){const modify=map.getInteractions().getArray().find(interaction=>interaction instanceof Modify) as Modify|undefined;modify?.setActive(Boolean(props.expanded&&kind==='historical'&&approximationMode==='edit'));const select=map.getInteractions().getArray().find(interaction=>interaction instanceof Select) as Select|undefined;select?.setActive(Boolean(props.expanded&&kind==='historical'&&(approximationMode==='edit'||approximationMode==='delete'||approximationMode==='cut')));const snap=approximationSnapRef.current;snap?.setActive(Boolean(props.expanded&&kind==='historical'&&approximationMode!=='delete'&&approximationMode!=='pan'))}},[props.expanded,kind,approximationMode]);
  const inlineMeasurementTools=Boolean(props.measurementTools&&!(props.expanded&&kind==='historical'));
  useEffect(()=>{const enabled=Boolean(props.measurementTools||props.expanded&&kind==='historical');measurementDrawRefs.current[0]?.setActive(enabled&&measurementMode==='distance');measurementDrawRefs.current[1]?.setActive(enabled&&measurementMode==='area')},[props.expanded,props.measurementTools,kind,measurementMode]);
  useEffect(()=>{measurementProfileGeneration.current++;setShowMeasurementProfile(false);setMeasurementProfiles([]);return()=>{measurementProfileGeneration.current++}},[props.rasterPath]);
  const openMeasurementProfile=()=>{if(!props.rasterPath)return;const lines=measurementSourceRef.current.getFeatures().filter(feature=>feature.getGeometry() instanceof LineString);if(!lines.length)return;const generation=++measurementProfileGeneration.current;setMeasurementProfiles([]);setShowMeasurementProfile(true);void Promise.all(lines.map(async feature=>{const id=String(feature.getId()??`medicion-${Date.now()}`);feature.setId(id);return sampleMeasurementProfile(props.rasterPath!,measurementCoordinates(feature.getGeometry() as LineString),id)})).then(results=>{if(generation===measurementProfileGeneration.current)setMeasurementProfiles(results.filter((profile):profile is ElevationProfileRoute=>profile!==null))})};
  const toggleMeasurementProfile=()=>{if(showMeasurementProfile){setShowMeasurementProfile(false);measurementProfileGeneration.current++;return}openMeasurementProfile()};
  const hasMeasurementLines=measurementSourceRef.current.getFeatures().some(feature=>feature.getGeometry() instanceof LineString);
  useEffect(()=>{const source=oceanSourceRef.current;source.clear();const mask=(props.barriers??[]).find(item=>item.generatedBy==='magic-ocean');if(mask)for(const part of barrierParts(mask)){const feature=new Feature(new LineString(part.map(coordinate=>fromLonLat(coordinate))));feature.set('oceanLine',true);source.addFeature(feature)}},[props.barriers]);
  useEffect(()=>{const enabled=Boolean(kind==='pnoa'&&props.expanded);oceanModifyRef.current?.setActive(enabled&&oceanMode==='edit');oceanSelectRef.current?.setActive(enabled&&['edit','cut','delete'].includes(oceanMode));oceanTranslateRef.current?.setActive(enabled&&oceanMode==='edit');oceanSnapRef.current?.setActive(enabled&&oceanMode!=='pan'&&oceanMode!=='delete')},[props.expanded,kind,oceanMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || sameView(map.getView(), viewState)) return;
    syncingRef.current = true;
    map.getView().setCenter(viewState.center);
    map.getView().setResolution(viewState.resolution);
    map.getView().setRotation(viewState.rotation);
  }, [viewState]);

  useEffect(() => {
    const source = pointSourceRef.current;
    source.clear();
    source.addFeatures(points.map((point,index) => {
      const feature = new Feature({ geometry: new Point(fromLonLat([point.lon, point.lat])), pointId: point.id, order:index, name: point.name, elementKind:'point', elementId:point.id });
      feature.setId(`point-${point.id}`);
      return feature;
    }));
    mapRef.current?.getLayers().changed();
  }, [points, selectedPointId]);

  useEffect(() => {
    const source = areaSourceRef.current;
    source.clear();
    if (!studyExtent) return;
    const projected = transformExtent(studyExtent, 'EPSG:4326', 'EPSG:3857');
    source.addFeature(new Feature(polygonFromExtent(projected)));
  }, [studyExtent]);

  useEffect(() => {
    const source = routeSourceRef.current;
    source.clear();
    const coordinates = props.routeCoordinates;
    if (coordinates && coordinates.length >= 2) for(let index=1;index<coordinates.length;index++){
      const feature=new Feature(new LineString([fromLonLat(coordinates[index-1]),fromLonLat(coordinates[index])]));
      feature.set('slope',props.routeSlopesPercent?.[index]??0);source.addFeature(feature);
    }
    for(const overlay of props.routeOverlays??[]){if(overlay.coordinates.length<2)continue;const feature=new Feature(new LineString(overlay.coordinates.map(coordinate=>fromLonLat(coordinate))));feature.set('color',overlay.color);feature.setId(overlay.id);source.addFeature(feature)}
  }, [props.routeCoordinates,props.routeSlopesPercent,props.routeOverlays]);

  useEffect(()=>{
    const source=isochroneSourceRef.current;source.clear();
    const lines=props.isochroneLines??[],levels=[...new Set(lines.map(line=>line.level))].sort((a,b)=>a-b);
    for(const [index,level] of levels.entries()){const levelLines=lines.filter(line=>line.level===level&&line.coordinates.length>=2),segments=levelLines.map(line=>line.coordinates.map(coordinate=>fromLonLat(coordinate)));if(!segments.length)continue;const feature=new Feature(new MultiLineString(segments)),sample=lines.find(line=>line.level===level)!,ratio=levels.length<2?1:index/(levels.length-1);feature.set('color',sample.color??`hsl(${205-ratio*165} 95% 58%)`);if(sample.width)feature.set('width',sample.width);if(sample.halo)feature.set('halo',sample.halo);source.addFeature(feature);if(sample.label){for(const line of levelLines)for(const coordinate of line.labelPoints??[]){const labelFeature=new Feature(new Point(fromLonLat(coordinate)));labelFeature.setProperties({label:sample.label,color:sample.labelColor??sample.color??'#111111',halo:sample.halo??'#ffffff',rotation:line.labelRotation??0,labelOnly:true});source.addFeature(labelFeature)}}}
    for(const peak of props.peakLabels??[]){const feature=new Feature(new Point(fromLonLat(peak.coordinate)));feature.setProperties({label:peak.label,color:'#111111',halo:'#ffffff',labelOnly:true});source.addFeature(feature)}
  },[props.isochroneLines,props.peakLabels]);

  useEffect(() => {
    const source=barrierSourceRef.current;
    source.clear();
    for(const [barrierIndex,barrier] of (props.barriers??[]).entries()){
      for(const [partIndex,part] of barrierParts(barrier).entries()){if(part.length<2)continue;const feature=new Feature(new LineString(part.map(coordinate=>fromLonLat(coordinate))));feature.set('kind',barrier.kind);feature.set('generatedBy',barrier.generatedBy);feature.set('name',partIndex===0?barrier.name?.trim()||`Barrera ${barrierIndex+1}`:'');feature.set('value',barrier.value);feature.set('barrierIndex',barrierIndex);feature.set('elementKind','barrier');feature.set('elementId',barrierIndex);feature.set('selected',props.selectedElement?.kind==='barrier'&&props.selectedElement.id===barrierIndex);source.addFeature(feature);}
    }
  }, [props.barriers,props.selectedElement]);
  useEffect(()=>{const source=facilitatorSourceRef.current;source.clear();for(const item of props.corridors??[]){const feature=new Feature(new LineString(item.coordinates.map(coordinate=>fromLonLat(coordinate))));feature.set('kind','corridor');feature.set('name',item.name);feature.set('elementKind','corridor');feature.set('elementId',item.id);source.addFeature(feature)}for(const item of props.crossings??[]){const feature=new Feature(new LineString(item.coordinates.map(coordinate=>fromLonLat(coordinate))));feature.set('kind','crossing');feature.set('name',item.name);feature.set('elementKind','crossing');feature.set('elementId',item.id);source.addFeature(feature)}},[props.corridors,props.crossings]);
  useEffect(()=>{const sync=(event:Event)=>{const detail=(event as CustomEvent<{corridors:PreferredCorridor[];crossings:EnabledCrossing[];points:{id:string;name:string;coordinate:readonly [number,number]}[]}>).detail,source=facilitatorSourceRef.current;source.clear();for(const item of detail.corridors){const feature=new Feature(new LineString(item.coordinates.map(coordinate=>fromLonLat([...coordinate]))));feature.set('kind','corridor');feature.set('name',item.name);feature.set('elementKind','corridor');feature.set('elementId',item.id);source.addFeature(feature)}for(const item of detail.crossings){const feature=new Feature(new LineString(item.coordinates.map(coordinate=>fromLonLat([...coordinate]))));feature.set('kind','crossing');feature.set('name',item.name);feature.set('elementKind','crossing');feature.set('elementId',item.id);source.addFeature(feature)}for(const item of detail.points){const feature=new Feature(new Point(fromLonLat([...item.coordinate])));feature.set('kind','poi');feature.set('name',item.name);feature.set('elementKind','poi');feature.set('elementId',item.id);source.addFeature(feature)}};window.addEventListener('viaspania-facilitators-changed',sync);return()=>window.removeEventListener('viaspania-facilitators-changed',sync)},[]);

  useEffect(()=>{const source=locationSourceRef.current;source.clear();const location=props.userLocation;if(!location)return;const center=fromLonLat([location.lon,location.lat]),mercatorRadius=location.accuracyM/Math.max(.1,Math.cos(location.lat*Math.PI/180));source.addFeatures([new Feature(new Circle(center,mercatorRadius)),new Feature(new Point(center))])},[props.userLocation]);

  useEffect(()=>{const source=placeMarkerSourceRef.current;source.clear();source.addFeatures((props.placeMarkerCoordinates??[]).map(coordinate=>new Feature(new Point(fromLonLat([coordinate.lon,coordinate.lat])))))},[props.placeMarkerCoordinates]);
  useEffect(()=>{const source=selectionMarkerSourceRef.current,coordinate=props.selectionMarkerCoordinate;if(!coordinate){if(selectionMarkerFeatureRef.current)source.removeFeature(selectionMarkerFeatureRef.current);selectionMarkerFeatureRef.current=null;return}const projected=fromLonLat([coordinate.lon,coordinate.lat]);if(selectionMarkerFeatureRef.current)selectionMarkerFeatureRef.current.getGeometry()?.setCoordinates(projected);else{const feature=new Feature(new Point(projected));selectionMarkerFeatureRef.current=feature;source.addFeature(feature)}},[props.selectionMarkerCoordinate]);

  useEffect(()=>{const map=mapRef.current;if(!map||!studyExtent||props.zoomToStudyExtentToken==null)return;map.getView().fit(transformExtent(studyExtent,'EPSG:4326','EPSG:3857'),{padding:[36,36,36,36],duration:250})},[props.zoomToStudyExtentToken,studyExtent]);
  useEffect(()=>{
    const map=mapRef.current;
    if(!map||!props.expanded||!studyExtent)return;
    const frame=requestAnimationFrame(()=>{
      map.updateSize();
      map.getView().fit(transformExtent(studyExtent,'EPSG:4326','EPSG:3857'),{padding:[48,48,48,48],duration:0});
    });
    return()=>cancelAnimationFrame(frame);
  },[props.expanded,studyExtent]);
  useEffect(()=>{const map=mapRef.current;if(!map||!zoomToApproximationToken)return;const extent=createEmpty();for(const feature of approximationSourceRef.current.getFeatures()){const geometry=feature.getGeometry();if(geometry instanceof LineString||geometry instanceof MultiLineString)extendExtent(extent,geometry.getExtent())}if(!isEmpty(extent))map.getView().fit(extent,{padding:[80,80,80,80],duration:300,maxZoom:18})},[zoomToApproximationToken]);

  useEffect(()=>{const drawing=['barrier','corridor','crossing'].includes(pointMode);barrierDrawRef.current?.setActive(drawing);if(!drawing)barrierDrawRef.current?.abortDrawing()},[pointMode]);

  return <>
    <div className={`map ${loadAppSettings().showCrosshairs?'map-crosshair':''}`} ref={host} />
    {mapLoadError&&<div role="alert">{mapLoadError}</div>}
    {props.expanded&&<div className="mdt-constraint-controls"><label><input type="checkbox" checked={showConstraints} onChange={event=>setShowConstraints(event.target.checked)}/>{translateText('Mostrar barreras y facilitadores')}</label><label><input type="checkbox" checked={showLabels} onChange={event=>setShowLabels(event.target.checked)}/>{translateText('Mostrar etiquetas')}</label></div>}
    {props.expanded&&kind==='historical'&&<div className="tools point-tools approximation-tools" aria-label={translateText('Herramientas de rutas y mediciones')}><b>{translateText('Rutas de aproximación')}</b><div className="point-tool-row"><button type="button" className={approximationMode==='pan'?'active':''} aria-pressed={approximationMode==='pan'} onClick={()=>{joinEndpointRef.current=null;setJoinHint('');setMeasurementMode('pan');setApproximationMode('pan')}}><span className="point-tool-symbol approximation-pan-symbol"><svg className="tool-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11V5a1.5 1.5 0 0 1 3 0v5-6a1.5 1.5 0 0 1 3 0v6-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v5c0 5-3 8-8 8h-1c-2 0-3-1-4-3l-3-5a1.6 1.6 0 0 1 2.7-1.7L8 13"/></svg></span>{translateText('Desplazar mapa')}</button><button type="button" className={approximationMode==='draw'?'active':''} aria-pressed={approximationMode==='draw'} onClick={()=>{joinEndpointRef.current=null;setJoinHint('');setMeasurementMode('pan');setApproximationMode('draw')}}><span className="point-tool-symbol">╱</span>{translateText('Dibujar ruta')}</button><button type="button" className={approximationMode==='edit'?'active':''} aria-pressed={approximationMode==='edit'} onClick={()=>{joinEndpointRef.current=null;setJoinHint('');setMeasurementMode('pan');setApproximationMode('edit')}}><span className="point-tool-symbol">↔</span>{translateText('Desplazar / editar')}</button><button type="button" className={approximationMode==='cut'?'active':''} aria-pressed={approximationMode==='cut'} onClick={()=>{joinEndpointRef.current=null;setJoinHint('');setMeasurementMode('pan');setApproximationMode('cut')}}><span className="point-tool-symbol">✂</span>{translateText('Cortar línea')}</button><button type="button" className={approximationMode==='join'?'active':''} aria-pressed={approximationMode==='join'} onClick={()=>{joinEndpointRef.current=null;setJoinHint('Pulse sobre un extremo de una ruta.');setMeasurementMode('pan');setApproximationMode('join')}}><span className="point-tool-symbol">⛓</span>{translateText('Unir líneas')}</button><button type="button" className={approximationMode==='delete'?'active':''} aria-pressed={approximationMode==='delete'} onClick={()=>{joinEndpointRef.current=null;setJoinHint('');setMeasurementMode('pan');setApproximationMode('delete')}}><span className="point-tool-symbol">×</span>{translateText('Borrar línea')}</button><button type="button" disabled={!props.approximationRoutes?.length} onClick={()=>setZoomToApproximationToken(value=>value+1)}><span className="point-tool-symbol">⊕</span>{translateText('Zoom a la ruta')}</button><button type="button" disabled={!approximationUndoRef.current.length} data-history-revision={approximationHistoryRevision} onClick={undoApproximation}><span className="point-tool-symbol">↶</span>{translateText('Deshacer')}</button><button type="button" disabled={!approximationRedoRef.current.length} data-history-revision={approximationHistoryRevision} onClick={redoApproximation}><span className="point-tool-symbol">↷</span>{translateText('Rehacer')}</button></div>{joinHint&&approximationMode==='join'&&<small className="approximation-join-hint">{translateText(joinHint)}</small>}<label className="approximation-color-control">{translateText('Color de línea')} <input type="color" value={approximationColor} onChange={event=>setApproximationColor(event.target.value)}/></label><label className="approximation-line-style-control">{translateText('Estilo')} <select value={approximationLineStyle} onChange={event=>setApproximationLineStyle(event.target.value as ApproximationLineStyle)}><option value="solid">{translateText('Continua')}</option><option value="dashed">{translateText('Discontinua')}</option><option value="dotted">{translateText('Punteada')}</option><option value="dash-dot">{translateText('Trazo y punto')}</option></select></label><label className="approximation-visibility-control"><input type="checkbox" checked={approximationVisible} onChange={event=>{setApproximationVisible(event.target.checked);mapRef.current?.getLayers().getArray().find(layer=>layer instanceof VectorLayer&&layer.getSource()===approximationSourceRef.current)?.setVisible(event.target.checked)}}/>{translateText('Mostrar rutas')}</label><b className="measurement-tools-title">{translateText('Mediciones')}</b><div className="point-tool-row"><button type="button" className={measurementMode==='distance'?'active':''} aria-pressed={measurementMode==='distance'} onClick={()=>{setApproximationMode('pan');setMeasurementMode(measurementMode==='distance'?'pan':'distance')}}><span className="point-tool-symbol"><svg className="tool-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 19 14-14M7.5 16.5l-2-2m5-1-2-2m5-1-2-2m5-1-2-2"/><path d="M15 5h4v4"/></svg></span>{translateText('Medir distancia')}</button>{hasMeasurementLines&&props.rasterPath&&<button type="button" className={showMeasurementProfile?'active':''} aria-pressed={showMeasurementProfile} onClick={toggleMeasurementProfile}><span className="point-tool-symbol"><svg className="tool-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M1 20 8.2 6.5l4.1 7.1 3.1-4.2L23 20H1Z"/></svg></span>{translateText('Perfil de distancia')}</button>}<button type="button" className={measurementMode==='area'?'active':''} aria-pressed={measurementMode==='area'} onClick={()=>{setApproximationMode('pan');setMeasurementMode(measurementMode==='area'?'pan':'area')}}><span className="point-tool-symbol">⬠</span>{translateText('Medir área')}</button>{measurementSourceRef.current.getFeatures().length>0&&<button type="button" onClick={()=>{measurementSourceRef.current.clear();setMeasurementProfiles([]);setShowMeasurementProfile(false);measurementProfileGeneration.current++;setMeasurementRevision(value=>value+1)}}><span className="point-tool-symbol">×</span>{translateText('Borrar medidas')}</button>}</div>{measurementMode!=='pan'&&<small className="approximation-join-hint">{measurementMode==='distance'?translateText('Haz clic para añadir puntos y doble clic para terminar la distancia.'):translateText('Haz clic para marcar el contorno y doble clic para terminar el área.')}</small>}<span hidden>{measurementRevision}</span></div>}

    {inlineMeasurementTools&&<aside className="measurement-tools-float" aria-label={translateText('Herramientas de rutas y mediciones')}><b>{translateText('Mediciones')}</b><button className={measurementMode==='distance'?'active':''} aria-pressed={measurementMode==='distance'} onClick={()=>setMeasurementMode(measurementMode==='distance'?'pan':'distance')}><span className="point-tool-symbol"><svg className="tool-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 19 14-14M7.5 16.5l-2-2m5-1-2-2m5-1-2-2m5-1-2-2"/><path d="M15 5h4v4"/></svg></span>{translateText('Medir distancia')}</button>{hasMeasurementLines&&props.rasterPath&&<button className={showMeasurementProfile?'active':''} aria-pressed={showMeasurementProfile} onClick={toggleMeasurementProfile}><span className="point-tool-symbol"><svg className="tool-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M1 20 8.2 6.5l4.1 7.1 3.1-4.2L23 20H1Z"/></svg></span>{translateText('Perfil de distancia')}</button>}<button className={measurementMode==='area'?'active':''} aria-pressed={measurementMode==='area'} onClick={()=>setMeasurementMode(measurementMode==='area'?'pan':'area')}><span className="point-tool-symbol">⬠</span>{translateText('Medir área')}</button>{measurementSourceRef.current.getFeatures().length>0&&<button onClick={()=>{measurementSourceRef.current.clear();setMeasurementProfiles([]);setShowMeasurementProfile(false);measurementProfileGeneration.current++;setMeasurementRevision(value=>value+1)}}><span className="point-tool-symbol">×</span>{translateText('Borrar medidas')}</button>}{measurementMode!=='pan'&&<small>{measurementMode==='distance'?translateText('Haz clic para añadir puntos y doble clic para terminar la distancia.'):translateText('Haz clic para marcar el contorno y doble clic para terminar el área.')}</small>}<span hidden>{measurementRevision}</span></aside>}
    {Boolean(showMeasurementProfile&&(props.expanded&&kind==='historical'||props.measurementTools)&&props.rasterPath&&measurementProfiles.length>0)&&<ElevationProfileOverlay routes={measurementProfiles} movable placement="bottom-right" />}
    {kind==='pnoa'&&selectedPoint&&!pointNameEditorClosed&&<div className="point-name-editor" onKeyDown={event=>{if(!event.nativeEvent.isComposing&&(event.key==='Enter'||event.key==='Escape')){event.preventDefault();event.stopPropagation();setPointNameEditorClosed(true)}}}>
      <label><span>{translateText('Nombre del punto')}</span><input value={selectedPoint.name} maxLength={20} onChange={event=>props.onPointNameChange?props.onPointNameChange(selectedPoint.id,event.target.value):window.dispatchEvent(new CustomEvent('viaspania-rename-point',{detail:{pointId:selectedPoint.id,name:event.target.value}}))}/></label>
      <button type="button" className="point-name-close" aria-label={translateText('Cerrar nombre del punto')} title={translateText('Cerrar nombre del punto')} onClick={()=>setPointNameEditorClosed(true)}>×</button>
      <small>{Array.from(selectedPoint.name).length}/20</small>
    </div>}
  </>;
}
