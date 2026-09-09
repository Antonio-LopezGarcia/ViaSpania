import {barrierMapStyle,facilitatorMapStyle} from './constraintMapFeatures';
import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature, { type FeatureLike } from 'ol/Feature';
import VectorTile from 'ol/VectorTile';
import type { Extent } from 'ol/extent';
import type Projection from 'ol/proj/Projection';
import Point from 'ol/geom/Point';
import Circle from 'ol/geom/Circle';
import LineString from 'ol/geom/LineString';
import MultiLineString from 'ol/geom/MultiLineString';
import { fromExtent as polygonFromExtent } from 'ol/geom/Polygon';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import VectorLayer from 'ol/layer/Vector';
import VectorTileLayer from 'ol/layer/VectorTile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import WMTS from 'ol/source/WMTS';
import TileWMS from 'ol/source/TileWMS';
import ImageStatic from 'ol/source/ImageStatic';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import ScaleLine from 'ol/control/ScaleLine';
import DragBox from 'ol/interaction/DragBox';
import Draw from 'ol/interaction/Draw';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import {selectionMarkerStyle} from './selectionMarkerStyle';
import type { Barrier, EnabledCrossing, GeoPoint, PointRole, PreferredCorridor } from '../types';
import { slopeColor } from '../core/routeSlope';
import { loadAppSettings } from '../core/appSettings';
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

export type PointMode = 'pan' | 'select' | 'start' | 'end' | 'multipoint' | 'move' | 'delete' | 'barrier' | 'corridor' | 'crossing' | 'poi' | 'select-barrier';
export type StudyExtent = [number, number, number, number];
export type SelectableElement = {kind:'point';id:number}|{kind:'barrier';id:number}|{kind:'corridor'|'crossing'|'poi';id:string};

interface MapPanelProps {
  kind: 'osm' | 'pnoa' | 'historical';
  expanded?: boolean;
  navigationLayer?: 'osm' | 'ign-topographic';
  orthophotoLayer?: 'pnoa' | 'copernicus-vhr-2021';
  historicalLayer?: 'MTN50' | 'MTN25' | 'catastrones' | 'Minutas' | 'AMS_1956-1957' | 'Interministerial_1973-1986';
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
  onPointMapAction?: (action: { type: 'place' | 'select' | 'move' | 'delete'; lon: number; lat: number; pointId?: number; role?: PointRole }) => void;
  areaDrawing?: boolean;
  studyExtent?: StudyExtent;
  onStudyExtent?: (extent: StudyExtent) => void;
  routeCoordinates?: [number, number][];
  routeSlopesPercent?: number[];
  routeOverlays?: { id: string; coordinates: [number,number][]; color: string }[];
  isochroneLines?: { level:number; coordinates:[number,number][] }[];
  isochroneSurface?: {imageUrl:string;extent:StudyExtent;opacity:number};
  barriers?: Barrier[];
  corridors?: PreferredCorridor[];
  crossings?: EnabledCrossing[];
  userLocation?: { lon:number; lat:number; accuracyM:number } | null;
  selectedBarrierIndex?: number | null;
  onBarrierPolyline?: (coordinates: [number, number][]) => void;
  onFacilitatorPolyline?: (kind:'corridor'|'crossing',coordinates:[number,number][])=>void;
  onPointerCoordinate?: (coordinate:{lon:number;lat:number}|null)=>void;
  selectionMarkerCoordinate?: {lon:number;lat:number}|null;
  zoomToStudyExtentToken?: number|null;
  selectedElement?: SelectableElement|null;
  onElementMapAction?: (action:{type:'select'|'move'|'delete';element?:SelectableElement;lon:number;lat:number})=>void;
  externalLayer?: ExternalMapLayer;
}

const pnoaRes = Array.from({ length: 20 }, (_, zoom) => 156543.03392804097 / 2 ** zoom);
const ids = pnoaRes.map((_, zoom) => String(zoom));

function pointStyle(feature: Feature, selectedPointId?: number | null, showLabel=false, labelSize=11) {
  const role = feature.get('role') as PointRole;
  const selected = feature.get('pointId') === selectedPointId;
  const color = role === 'inicio' ? '#59d2ff' : role === 'final' ? '#ff796f' : '#d8ff55';
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

export function MapPanel(props: MapPanelProps) {
  const { kind, viewState, onViewChange, points = [], selectedPointId, pointMode = 'select', onPointMapAction, areaDrawing = false, studyExtent, onStudyExtent } = props;
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const pointSourceRef = useRef(new VectorSource());
  const areaSourceRef = useRef(new VectorSource());
  const routeSourceRef = useRef(new VectorSource());
  const isochroneSourceRef = useRef(new VectorSource());
  const barrierSourceRef = useRef(new VectorSource());
  const facilitatorSourceRef = useRef(new VectorSource());
  const locationSourceRef = useRef(new VectorSource());
  const selectionMarkerSourceRef = useRef(new VectorSource());
  const syncingRef = useRef(false);
  const barrierDrawRef = useRef<Draw | null>(null);
  const propsRef = useRef(props);
  const [mapPreferences,setMapPreferences]=useState(()=>loadAppSettings());
  const [showConstraints,setShowConstraints]=useState(true),[showLabels,setShowLabels]=useState(()=>loadAppSettings().showPointLabels);
  const effectiveShowLabels=props.expanded===undefined?(props.showPointLabels??mapPreferences.showPointLabels):showLabels;
  propsRef.current = props;
  useEffect(()=>{const refresh=()=>setMapPreferences(loadAppSettings());window.addEventListener('viaspania-settings',refresh);return()=>window.removeEventListener('viaspania-settings',refresh)},[]);

  useEffect(() => {
    if (!host.current) return;
    const source = propsRef.current.externalLayer?createExternalMapSource(propsRef.current.externalLayer):kind === 'osm'
      ? propsRef.current.navigationLayer === 'ign-topographic'
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
    const labelSize=mapPreferences.labelTextSizePx??11;
    const pointLayer = new VectorLayer({ source: pointSourceRef.current, style: feature => pointStyle(feature as Feature, propsRef.current.selectedPointId, effectiveShowLabels,labelSize), zIndex: 20 });
    const referenceLayers = kind === 'pnoa' && propsRef.current.orthophotoLayer !== 'copernicus-vhr-2021' ? [
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
    const isochroneLayer = new VectorLayer({
      source: isochroneSourceRef.current,
      style: feature => new Style({ stroke:new Stroke({color:String(feature.get('color')??'#ffffff'),width:2}) }),
      zIndex:17,
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
      layers: [new TileLayer({ source }), ...referenceLayers, areaLayer, ...(isochroneSurfaceLayer?[isochroneSurfaceLayer]:[]), isochroneLayer, routeLayer, barrierLayer, facilitatorLayer, pointLayer,locationLayer,selectionMarkerLayer],
      view: new View({ center: viewState.center, resolution: viewState.resolution, rotation: viewState.rotation }),
      controls: loadAppSettings().showScales ? [new ScaleLine()] : [],
    });
    mapRef.current = map;
    if(kind==='osm'){
      const dragBox=new DragBox({condition:()=>Boolean(propsRef.current.areaDrawing)});
      dragBox.on('boxend',()=>{const projected=dragBox.getGeometry().getExtent(),extent=transformExtent(projected,'EPSG:3857','EPSG:4326') as StudyExtent;propsRef.current.onStudyExtent?.(extent)});
      map.addInteraction(dragBox);
    }
    if(kind==='pnoa'){
      const barrierDraw=new Draw({source:barrierSourceRef.current,type:'LineString',condition:()=>['barrier','corridor','crossing'].includes(propsRef.current.pointMode??''),stopClick:true});
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
      if (kind === 'osm' && propsRef.current.areaDrawing) return;
      if (kind !== 'pnoa' || propsRef.current.areaDrawing) return;
      const currentMode = propsRef.current.pointMode ?? 'select';
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
        propsRef.current.onElementMapAction({type:currentMode as 'select'|'move'|'delete',element,lon:coordinate[0],lat:coordinate[1]});
        return;
      }
      const hit = map.forEachFeatureAtPixel(event.pixel, feature => feature.get('pointId') ? feature : undefined, { hitTolerance: 8 });
      const coordinate = toLonLat(event.coordinate);
      if(currentMode==='poi'){window.dispatchEvent(new CustomEvent('viaspania-add-poi',{detail:{coordinate:[coordinate[0],coordinate[1]]}}));return}
      const pointId = hit?.get('pointId') as number | undefined;
      if (currentMode === 'select' && pointId) propsRef.current.onPointMapAction?.({ type: 'select', pointId, lon: coordinate[0], lat: coordinate[1] });
      else if (currentMode === 'delete' && pointId) propsRef.current.onPointMapAction?.({ type: 'delete', pointId, lon: coordinate[0], lat: coordinate[1] });
      else if (currentMode === 'move' && pointId) propsRef.current.onPointMapAction?.({ type: 'select', pointId, lon: coordinate[0], lat: coordinate[1] });
      else if (currentMode === 'move' && propsRef.current.selectedPointId != null) propsRef.current.onPointMapAction?.({ type: 'move', pointId: propsRef.current.selectedPointId, lon: coordinate[0], lat: coordinate[1] });
      else if (currentMode === 'start') propsRef.current.onPointMapAction?.({ type: 'place', role: 'inicio', lon: coordinate[0], lat: coordinate[1] });
      else if (currentMode === 'end') propsRef.current.onPointMapAction?.({ type: 'place', role: 'final', lon: coordinate[0], lat: coordinate[1] });
      else if (currentMode === 'multipoint') propsRef.current.onPointMapAction?.({ type: 'place', role: 'multipunto', lon: coordinate[0], lat: coordinate[1] });
    });
    return () => { map.getViewport().removeEventListener('mouseleave',leave);map.getViewport().removeEventListener('contextmenu',contextMenu);barrierDrawRef.current=null;mapRef.current = null; map.setTarget(undefined); };
  }, [kind, props.historicalLayer, props.navigationLayer, props.orthophotoLayer, props.externalLayer?.id, props.externalLayer?.url, props.showMunicipalBoundaries, props.showGeographicalNames, props.showPointLabels, props.showScale, props.isochroneSurface?.imageUrl, props.isochroneSurface?.opacity, mapPreferences,showConstraints,effectiveShowLabels]);

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
    source.addFeatures(points.map(point => {
      const feature = new Feature({ geometry: new Point(fromLonLat([point.lon, point.lat])), pointId: point.id, role: point.role, name: point.name, elementKind:'point', elementId:point.id });
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
    for(const [index,level] of levels.entries()){const segments=lines.filter(line=>line.level===level&&line.coordinates.length>=2).map(line=>line.coordinates.map(coordinate=>fromLonLat(coordinate)));if(!segments.length)continue;const feature=new Feature(new MultiLineString(segments));const ratio=levels.length<2?1:index/(levels.length-1);feature.set('color',`hsl(${205-ratio*165} 95% 58%)`);source.addFeature(feature)}
  },[props.isochroneLines]);

  useEffect(() => {
    const source=barrierSourceRef.current;
    source.clear();
    for(const [barrierIndex,barrier] of (props.barriers??[]).entries()){
      if(barrier.coordinates.length>=2){const feature=new Feature(new LineString(barrier.coordinates.map(coordinate=>fromLonLat(coordinate))));feature.set('kind',barrier.kind);feature.set('name',barrier.name?.trim()||`Barrera ${barrierIndex+1}`);feature.set('value',barrier.value);feature.set('barrierIndex',barrierIndex);feature.set('elementKind','barrier');feature.set('elementId',barrierIndex);feature.set('selected',props.selectedElement?.kind==='barrier'&&props.selectedElement.id===barrierIndex);source.addFeature(feature);}
    }
  }, [props.barriers,props.selectedElement]);
  useEffect(()=>{const source=facilitatorSourceRef.current;source.clear();for(const item of props.corridors??[]){const feature=new Feature(new LineString(item.coordinates.map(coordinate=>fromLonLat(coordinate))));feature.set('kind','corridor');feature.set('name',item.name);feature.set('elementKind','corridor');feature.set('elementId',item.id);source.addFeature(feature)}for(const item of props.crossings??[]){const feature=new Feature(new LineString(item.coordinates.map(coordinate=>fromLonLat(coordinate))));feature.set('kind','crossing');feature.set('name',item.name);feature.set('elementKind','crossing');feature.set('elementId',item.id);source.addFeature(feature)}},[props.corridors,props.crossings]);
  useEffect(()=>{const sync=(event:Event)=>{const detail=(event as CustomEvent<{corridors:PreferredCorridor[];crossings:EnabledCrossing[];points:{id:string;name:string;coordinate:readonly [number,number]}[]}>).detail,source=facilitatorSourceRef.current;source.clear();for(const item of detail.corridors){const feature=new Feature(new LineString(item.coordinates.map(coordinate=>fromLonLat([...coordinate]))));feature.set('kind','corridor');feature.set('name',item.name);feature.set('elementKind','corridor');feature.set('elementId',item.id);source.addFeature(feature)}for(const item of detail.crossings){const feature=new Feature(new LineString(item.coordinates.map(coordinate=>fromLonLat([...coordinate]))));feature.set('kind','crossing');feature.set('name',item.name);feature.set('elementKind','crossing');feature.set('elementId',item.id);source.addFeature(feature)}for(const item of detail.points){const feature=new Feature(new Point(fromLonLat([...item.coordinate])));feature.set('kind','poi');feature.set('name',item.name);feature.set('elementKind','poi');feature.set('elementId',item.id);source.addFeature(feature)}};window.addEventListener('viaspania-facilitators-changed',sync);return()=>window.removeEventListener('viaspania-facilitators-changed',sync)},[]);

  useEffect(()=>{const source=locationSourceRef.current;source.clear();const location=props.userLocation;if(!location)return;const center=fromLonLat([location.lon,location.lat]),mercatorRadius=location.accuracyM/Math.max(.1,Math.cos(location.lat*Math.PI/180));source.addFeatures([new Feature(new Circle(center,mercatorRadius)),new Feature(new Point(center))])},[props.userLocation]);

  useEffect(()=>{const source=selectionMarkerSourceRef.current;source.clear();const coordinate=props.selectionMarkerCoordinate;if(coordinate)source.addFeature(new Feature(new Point(fromLonLat([coordinate.lon,coordinate.lat]))))},[props.selectionMarkerCoordinate]);

  useEffect(()=>{const map=mapRef.current;if(!map||!studyExtent||props.zoomToStudyExtentToken==null)return;map.getView().fit(transformExtent(studyExtent,'EPSG:4326','EPSG:3857'),{padding:[36,36,36,36],duration:250})},[props.zoomToStudyExtentToken,studyExtent]);

  useEffect(()=>{const drawing=['barrier','corridor','crossing'].includes(pointMode);barrierDrawRef.current?.setActive(drawing);if(!drawing)barrierDrawRef.current?.abortDrawing()},[pointMode]);

  return <>
    <div className={`map ${loadAppSettings().showCrosshairs?'map-crosshair':''}`} ref={host} />
    {props.expanded&&<div className="mdt-constraint-controls"><label><input type="checkbox" checked={showConstraints} onChange={event=>setShowConstraints(event.target.checked)}/>Mostrar barreras y facilitadores</label><label><input type="checkbox" checked={showLabels} onChange={event=>setShowLabels(event.target.checked)}/>Mostrar etiquetas</label></div>}
    {kind==='pnoa'&&selectedPointId!=null&&points.find(point=>point.id===selectedPointId)&&<label className="point-name-editor"><span>Nombre del punto</span><input value={points.find(point=>point.id===selectedPointId)?.name??''} maxLength={20} onChange={event=>props.onPointNameChange?props.onPointNameChange(selectedPointId,event.target.value):window.dispatchEvent(new CustomEvent('viaspania-rename-point',{detail:{pointId:selectedPointId,name:event.target.value}}))}/><small>{Array.from(points.find(point=>point.id===selectedPointId)?.name??'').length}/20</small></label>}
  </>;
}
