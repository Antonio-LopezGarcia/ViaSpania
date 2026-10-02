import {Terrain3DLegend} from './Terrain3DLegend';
import {pointColor} from '../core/points';
import {trackProcess} from '../core/processStatus';
import {corridorRasterPixels,corridorRasterUvs,type CorridorRaster} from '../core/corridorRaster';
import {hillshadeBrightness,terrainHillshade} from '../core/hillshade';
import {CONSTRAINT_COLORS} from '../core/constraintColors';
import {barrierParts} from '../core/barriers';
import { useEffect,useRef,useState } from 'react';
import * as THREE from 'three';
import {fromLonLat,toLonLat} from 'ol/proj';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { Barrier,EnabledCrossing,GeoPoint,PointOfInterest,PreferredCorridor } from '../types';
import type { TerrainMesh } from '../services/native';
import {chooseIsochroneLabel,isochroneLabelCandidates,type LabelledTerrainLine,type LabelRect} from '../core/isochrone3dLabels';
import { highestTerrainPoint,terrainLineSamplingStride,terrainTriangleIndices } from '../core/terrain3d';
import { animationRouteProgress,exportFrameProgress,gifExportPlan,prepareRoutePath,sampleRoutePath,flyoverCamera,videoExportPlan,type AnimationMode,type TimelineState } from '../core/animationTimeline';
import { MjpegAviStream } from '../core/mjpegAvi';
import { GifEncoder } from '../core/gifEncoder';
import {nextMediaFileName} from '../services/mediaFileName';
import {nextScreenshotFileName} from '../services/screenshotFileName';
import { saveMediaExport,savePngExport,startVideoExport } from '../services/exports';
import { terrainPaletteRgb } from '../core/terrainPalette';
import { drawViaSpaniaWatermark } from '../core/exportWatermark';
import {cameraHeading,drawVideoCompass,drawVideoAttribution} from '../core/videoOverlays';
import {drawVideoContourLegend,isVisibleContourLegendItem,videoContourLegendItems} from '../core/videoContourLegend';
import {drawVideoRouteLegend,videoRouteLegendItems} from '../core/videoRouteLegend';
import {drawAnimatedElevationProfile,videoProfileSeries} from '../core/videoElevationProfile';
import {translateText,useLanguage} from '../core/i18n';
import {loadAppSettings} from '../core/appSettings';
import {VideoExportDialog} from './VideoExportDialog';

export interface Terrain3DLegendItem{id:string;label:string;color:string;visible:boolean;range?:{min:number;max:number;unit:string}}
export interface Terrain3DLine extends LabelledTerrainLine{}
interface Props {hillshade?:number;projectName?:string;mesh:TerrainMesh;exaggeration:number;palette:string;points:GeoPoint[];routeCoordinates?:[number,number][];routes?:{coordinates:[number,number][];color:string;label?:string;result?:{elevationsM?:number[]};durationSeconds?:number}[];routeWidth?:number;routeColor?:string;isochroneLines?:Terrain3DLine[];corridorRaster?:CorridorRaster|null;corridorSurface?:{width:number;height:number;values:number[];kind?:'corridor'|'viewshed'|'accumulated';maxCost?:number;opacity?:number}|null;legendTitle?:string;legendItems?:Terrain3DLegendItem[];onToggleLegendItem?:(id:string)=>void;showPointLabels?:boolean;showHighestPoint?:boolean;showScale?:boolean;textureDataUrl?:string|null;textureLoading?:boolean;textureAttribution?:string;barriers?:Barrier[];corridors?:PreferredCorridor[];crossings?:EnabledCrossing[];pointsOfInterest?:PointOfInterest[];onSnapshotReady:(snapshot:()=>string)=>void;onVideoExported?:()=>void;onCameraChange?:(view:{inclination:number;orientation:number})=>void;resetToken:number;initialInclination?:number;initialOrientation?:number;hideAnimationPanel?:boolean}
function colorFor(value:number,min:number,max:number,palette:string){return new THREE.Color().setRGB(...terrainPaletteRgb(value,min,max,palette))}
const EMPTY:never[]=[];
export function formatDisplayedAngle(value:number){const rounded=Number(value.toFixed(2));return String(Object.is(rounded,-0)?0:rounded)}
interface AnimationScene {
 canvas:HTMLCanvasElement;
 lineColor:(level:number,color?:string)=>string|undefined;
 renderAt:(mode:AnimationMode,progress:number,inclination?:number,orientation?:number,routeIndex?:number,zoom?:number)=>number;
 preview:(mode:AnimationMode,inclination:number,orientation:number,routeIndex:number,zoom:number)=>void;
 isReady:()=>boolean;
 beginExport:(width:number,height:number)=>()=>void;
}
function labelSprite(text:string,accent:string){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;let labelWidth=470;const c=canvas.getContext('2d');if(c){c.font='600 30px sans-serif';const width=Math.min(470,c.measureText(text).width+38);labelWidth=width;c.fillStyle='rgba(7,16,13,.88)';c.strokeStyle=accent;c.lineWidth=3;c.beginPath();c.roundRect((512-width)/2,8,width,72,14);c.fill();c.stroke();c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,44,440)}const texture=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));sprite.userData.texture=texture;sprite.userData.labelWidthRatio=labelWidth/512;return sprite}

export function Terrain3D({projectName='Proyecto',hillshade=0,mesh,exaggeration,palette,points,routeCoordinates=EMPTY,routes=EMPTY,routeWidth=4,routeColor='',isochroneLines=EMPTY,corridorSurface=null,corridorRaster=null,legendTitle,legendItems=EMPTY,onToggleLegendItem,showPointLabels=false,showHighestPoint=false,showScale=false,textureDataUrl,textureLoading=false,textureAttribution,barriers=EMPTY,corridors=EMPTY,crossings=EMPTY,pointsOfInterest=EMPTY,onSnapshotReady,onVideoExported,onCameraChange,resetToken,initialInclination=32,initialOrientation=45,hideAnimationPanel=false}:Props){
 const language=useLanguage();
 const [viewshedMode,setViewshedMode]=useState<'both'|'visible'|'hidden'>('both'),[viewshedOpacity,setViewshedOpacity]=useState(.78),[accumulatedOpacity,setAccumulatedOpacity]=useState(corridorSurface?.opacity??.55);
 // Keep the 3D adjustment local; the raster opacity remains the initial default.
 const [corridorOpacityOverride,setCorridorOpacity]=useState<number|null>(null);
 const corridorOpacity=corridorOpacityOverride??corridorRaster?.opacity??.6;
 const corridorMaterial=useRef<THREE.MeshBasicMaterial|null>(null);
 const accumulatedSurfaceCloud=useRef<THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>|null>(null);
 const viewshedClouds=useRef<{cloud:THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>;visibleArea:boolean}[]>([]);
 const updateViewshed=()=>viewshedClouds.current.forEach(({cloud,visibleArea})=>{cloud.visible=viewshedMode==='both'||(viewshedMode==='visible')===visibleArea;cloud.material.opacity=viewshedOpacity});
 const [videoDialogOpen,setVideoDialogOpen]=useState(false),[converting,setConverting]=useState(false);
 const labelSettings=loadAppSettings(),labelTextSizePx=labelSettings.labelTextSizePx??11,label3dOffsetM=Math.max(0,labelSettings.label3dOffsetM??20),label3dLeaderLine=labelSettings.label3dLeaderLine??true;
 const [timeline,setTimeline]=useState<TimelineState>({mode:'orbit',progress:0,playing:false,speed:1,durationSeconds:20}),[resolution,setResolution]=useState<[number,number]>([1920,1080]),[exportStatus,setExportStatus]=useState(''),[animationCollapsed,setAnimationCollapsed]=useState(false),[orbitInclination,setOrbitInclination]=useState(initialInclination),[cameraOrientation,setCameraOrientation]=useState(initialOrientation),[exporting,setExporting]=useState(false),[followRoute,setFollowRoute]=useState(0),[followZoom,setFollowZoom]=useState(15),[exportCompass,setExportCompass]=useState(false),[exportProfile,setExportProfile]=useState(false),[exportContourLegend,setExportContourLegend]=useState(false),[exportRouteLegend,setExportRouteLegend]=useState(false);
 const timelineRef=useRef(timeline),orbitInclinationRef=useRef(orbitInclination),cameraOrientationRef=useRef(cameraOrientation),host=useRef<HTMLDivElement>(null),resetRef=useRef<(()=>void)|null>(null),savedCameraRef=useRef<{position:[number,number,number];target:[number,number,number]}|null>(null),routeMaterialsRef=useRef<{material:LineMaterial;line:Line2;points:THREE.Vector3[];durationSeconds?:number}[]>([]),compassNeedle=useRef<HTMLDivElement>(null),compassReading=useRef<HTMLSpanElement>(null),tiltNeedle=useRef<HTMLDivElement>(null),tiltReading=useRef<HTMLSpanElement>(null),animationRef=useRef<AnimationScene|null>(null),cancelExportRef=useRef(false),exportingRef=useRef(false);
 const snapshotCallback=useRef(onSnapshotReady);snapshotCallback.current=onSnapshotReady;
 useEffect(()=>{timelineRef.current=timeline},[timeline]);
 useEffect(()=>{orbitInclinationRef.current=orbitInclination},[orbitInclination]);
 useEffect(()=>{cameraOrientationRef.current=cameraOrientation},[cameraOrientation]);
 useEffect(()=>{resetRef.current?.();savedCameraRef.current=null},[resetToken]);
 useEffect(()=>{routeMaterialsRef.current.forEach(({material})=>{material.linewidth=routeWidth;if(routeColor)material.color.set(routeColor);material.needsUpdate=true})},[routeWidth,routeColor]);
 useEffect(()=>{if(!host.current)return;const scene=new THREE.Scene();scene.background=new THREE.Color('#07100d');const span=Math.max(mesh.widthM,mesh.heightM),range=Math.max(mesh.maxElevationM-mesh.minElevationM,1),lift=Math.max(range*.014*exaggeration,span*.0015),camera=new THREE.PerspectiveCamera(46,1,1,span*12),renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.current.appendChild(renderer.domElement);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.screenSpacePanning=true;
  const shade=hillshade>0?terrainHillshade(mesh):null;
  const [west,south,east,north]=mesh.wgs84Extent,[mapWest,mapSouth,mapEast,mapNorth]=mesh.projectedExtent3857??(()=>{const a=fromLonLat([west,south]),b=fromLonLat([east,north]);return[a[0],a[1],b[0],b[1]] as [number,number,number,number]})(),mapCenterX=(mapWest+mapEast)/2,mapCenterY=(mapSouth+mapNorth)/2,mapCellWidth=(mapEast-mapWest)/mesh.width,mapCellHeight=(mapNorth-mapSouth)/mesh.height,mapScale=Math.cos(((south+north)/2)*Math.PI/180);
  const positions=new Float32Array(mesh.width*mesh.height*3),colors=new Float32Array(mesh.width*mesh.height*3),uvs=new Float32Array(mesh.width*mesh.height*2);for(let row=0;row<mesh.height;row++)for(let col=0;col<mesh.width;col++){const i=row*mesh.width+col,o=i*3,e=mesh.elevations[i],color=colorFor(e,mesh.minElevationM,mesh.maxElevationM,palette);positions[o]=(mapWest+(col+.5)*mapCellWidth-mapCenterX)*mapScale;positions[o+1]=(e-mesh.minElevationM)*exaggeration;positions[o+2]=(mapCenterY-(mapNorth-(row+.5)*mapCellHeight))*mapScale;const brightness=shade?hillshadeBrightness(shade[i],hillshade):1;// Palette and 2D hillshade use sRGB display values; vertex colors must be linear.
color.multiplyScalar(brightness).convertSRGBToLinear();const textureShade=new THREE.Color().setRGB(brightness,brightness,brightness,THREE.SRGBColorSpace);colors.set(textureDataUrl?[textureShade.r,textureShade.g,textureShade.b]:[color.r,color.g,color.b],o);uvs.set([(col+.5)/mesh.width,1-(row+.5)/mesh.height],i*2)}const indices=terrainTriangleIndices(mesh);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();let textureReady=!textureDataUrl,textureError=false;const texture=textureDataUrl?new THREE.TextureLoader().load(textureDataUrl,()=>{textureReady=true},undefined,()=>{textureError=true}):null;if(texture){texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();}const terrainMaterial=new THREE.MeshBasicMaterial({vertexColors:!texture||hillshade>0,map:texture,side:THREE.DoubleSide,toneMapped:false});const terrain=new THREE.Mesh(geometry,terrainMaterial);terrain.name='terrain-surface';scene.add(terrain,new THREE.HemisphereLight(0xcde8ff,0x182018,1.5));
  const elevationAt=(lon:number,lat:number)=>{const projected=fromLonLat([lon,lat]),x=Math.max(0,Math.min(mesh.width-1,(projected[0]-mapWest)/mapCellWidth-.5)),z=Math.max(0,Math.min(mesh.height-1,(mapNorth-projected[1])/mapCellHeight-.5)),col=Math.floor(x),row=Math.floor(z),right=Math.min(col+1,mesh.width-1),bottom=Math.min(row+1,mesh.height-1),tx=x-col,tz=z-row;
 const top=mesh.elevations[row*mesh.width+col]*(1-tx)+mesh.elevations[row*mesh.width+right]*tx,low=mesh.elevations[bottom*mesh.width+col]*(1-tx)+mesh.elevations[bottom*mesh.width+right]*tx;
 return(top*(1-tz)+low*tz-mesh.minElevationM)*exaggeration},point=(lon:number,lat:number,above=0)=>{const projected=fromLonLat([lon,lat]);return new THREE.Vector3((projected[0]-mapCenterX)*mapScale,elevationAt(lon,lat)+above,(mapCenterY-projected[1])*mapScale)},objects:THREE.Object3D[]=[],lineMaterials:LineMaterial[]=[],labelSprites:{sprite:THREE.Sprite;ratio:number}[]=[],markerLabels:{sprite:THREE.Sprite;leader?:THREE.Line;anchor:THREE.Vector3;radius:number}[]=[];
  const addLine=(coordinates:readonly (readonly [number,number])[],color:THREE.ColorRepresentation,width=2,above=lift,dotted=false)=>{if(coordinates.length<2)return null;const values:number[]=[];coordinates.forEach(([lon,lat])=>{const p=point(lon,lat,above);values.push(p.x,p.y,p.z)});const g=new LineGeometry();g.setPositions(values);const m=new LineMaterial({color:new THREE.Color(color).getHex(),linewidth:width,dashed:dotted,dashSize:1,gapSize:2});const line=new Line2(g,m);line.computeLineDistances();scene.add(line);objects.push(line);lineMaterials.push(m);return line};
  const addLabel=(anchor:THREE.Vector3,text:string,color:number)=>{const sprite=labelSprite(text,`#${color.toString(16).padStart(6,'0')}`),labelPosition=anchor.clone().add(new THREE.Vector3(0,label3dOffsetM,0)),sizeRatio=labelTextSizePx/11;sprite.position.copy(labelPosition);sprite.scale.set(span*.18*sizeRatio,span*.034*sizeRatio,1);labelSprites.push({sprite,ratio:sizeRatio});scene.add(sprite);objects.push(sprite);let leader:THREE.Line|undefined;if(label3dLeaderLine&&label3dOffsetM>0){const geometry=new THREE.BufferGeometry().setFromPoints([anchor,labelPosition]),line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color,depthTest:false,depthWrite:false,transparent:true,opacity:.9}));line.renderOrder=29;scene.add(line);objects.push(line);leader=line}return{sprite,leader}};
  const addLineLabel=(coordinates:readonly (readonly [number,number])[],text:string,color:number,above:number)=>{if(!showPointLabels||!text.trim()||coordinates.length<2)return;const from=coordinates[Math.floor((coordinates.length-1)/2)],to=coordinates[Math.ceil((coordinates.length-1)/2)];addLabel(point((from[0]+to[0])/2,(from[1]+to[1])/2,above),text,color)};
  const addMarker=(lon:number,lat:number,color:number,scale=1,label?:string)=>{const radius=Math.max(span*.006*scale,2),marker=new THREE.Mesh(new THREE.SphereGeometry(radius,14,10),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.25,depthTest:false,depthWrite:false,transparent:true})),markerPosition=point(lon,lat,Math.max(lift*1.8,radius));marker.position.copy(markerPosition);marker.name='point-marker';marker.renderOrder=30;scene.add(marker);objects.push(marker);if(label){const annotation=addLabel(markerPosition,label,color);annotation.sprite.renderOrder=31;markerLabels.push({...annotation,anchor:markerPosition,radius})}};
  addLine([[west,north],[east,north],[east,south],[west,south],[west,north]],0xd8ff55,2.5,lift*2.1);
  const renderedRoutes=routes.length?routes:routeCoordinates.length>1?[{coordinates:routeCoordinates,color:'#00f0ff'}]:[];routeMaterialsRef.current=renderedRoutes.flatMap(route=>{const line=addLine(route.coordinates,routeColor||route.color,routeWidth,lift*1.3),routePoints=route.coordinates.map(([lon,lat])=>point(lon,lat,lift*1.3));return line?[{material:line.material as LineMaterial,line,points:routePoints,durationSeconds:route.durationSeconds}]:[]});const animatedRoutes=routeMaterialsRef.current.map(item=>{
 item.material.depthTest=false;item.material.depthWrite=false;item.line.renderOrder=30;
 const head=new THREE.Mesh(new THREE.SphereGeometry(Math.max(span*.004,2),12,8),new THREE.MeshBasicMaterial({color:'#ffffff',depthTest:false,depthWrite:false,transparent:true}));
 head.visible=false;head.renderOrder=1001;head.frustumCulled=false;
 const coreMaterial=new THREE.MeshBasicMaterial({depthTest:false,depthWrite:false,transparent:true});coreMaterial.color=item.material.color;
 const core=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),coreMaterial);core.renderOrder=1002;core.frustumCulled=false;scene.add(head,core);core.visible=false;objects.push(head,core);
 return{...item,head,core,path:prepareRoutePath(item.points.map(p=>p.toArray()))};
 });barriers.forEach((item,index)=>{const coast=item.generatedBy==='magic-ocean',color=coast?Number(CONSTRAINT_COLORS.oceanBarrier.replace('#','0x')):item.kind==='absolute'?0x050505:0x888888;barrierParts(item).forEach((part,partIndex)=>{addLine(part,color,3,lift*1.5,coast);if(partIndex===0)addLineLabel(part,item.name?.trim()||`Barrera ${index+1}`,color,lift*1.5)})});corridors.forEach(item=>{addLine(item.coordinates,Number(CONSTRAINT_COLORS.corridor.replace('#','0x')),4,lift*1.4);addLineLabel(item.coordinates,item.name,Number(CONSTRAINT_COLORS.corridor.replace('#','0x')),lift*1.4)});const levels=[...new Set(isochroneLines.map(item=>item.level))].sort((a,b)=>a-b),lineStride=terrainLineSamplingStride(isochroneLines),lineGroups=new Map<string,{values:number[];color:THREE.Color}>();let contourSegment=0;isochroneLines.forEach(item=>{const ratio=levels.length<2?0:levels.indexOf(item.level)/(levels.length-1),fallback=new THREE.Color().setHSL((205-ratio*165)/360,.95,.58),group=lineGroups.get(`${item.level}:${item.color??""}`)??{values:[],color:item.color?new THREE.Color(item.color):fallback};lineGroups.set(`${item.level}:${item.color??""}`,group);for(let index=1;index<item.coordinates.length;index++){if(contourSegment++%lineStride)continue;const from=point(item.coordinates[index-1][0],item.coordinates[index-1][1],lift*1.7),to=point(item.coordinates[index][0],item.coordinates[index][1],lift*1.7);group.values.push(from.x,from.y,from.z,to.x,to.y,to.z)}});lineGroups.forEach(group=>{if(!group.values.length)return;const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(group.values,3));const line=new THREE.LineSegments(lineGeometry,new THREE.LineBasicMaterial({color:group.color,depthTest:true}));scene.add(line);objects.push(line);}) ;crossings.forEach(item=>{addLine(item.coordinates,Number(CONSTRAINT_COLORS.crossing.replace('#','0x')),5,lift*1.9);addLineLabel(item.coordinates,item.name,Number(CONSTRAINT_COLORS.crossing.replace('#','0x')),lift*1.9)});
  if(corridorRaster){
   const rasterTexture=new THREE.DataTexture(corridorRasterPixels(corridorRaster.width,corridorRaster.height,corridorRaster.values,corridorRaster.thresholdPercent),corridorRaster.width,corridorRaster.height,THREE.RGBAFormat);
   rasterTexture.colorSpace=THREE.SRGBColorSpace;rasterTexture.flipY=false;rasterTexture.magFilter=THREE.NearestFilter;rasterTexture.minFilter=THREE.NearestFilter;rasterTexture.generateMipmaps=false;rasterTexture.needsUpdate=true;
   const rasterGeometry=geometry.clone();
   rasterGeometry.setAttribute('uv',new THREE.BufferAttribute(corridorRasterUvs(mesh.width,mesh.height,mesh.wgs84Extent,corridorRaster.extent),2));
   const material=new THREE.MeshBasicMaterial({map:rasterTexture,transparent:true,opacity:corridorOpacity,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
   corridorMaterial.current=material;
   const overlay=new THREE.Mesh(rasterGeometry,material);overlay.name='corridor-raster';overlay.renderOrder=20;overlay.userData.texture=rasterTexture;scene.add(overlay);objects.push(overlay);
  }
  if(corridorSurface){for(const visibleArea of corridorSurface.kind==='viewshed'?[true,false]:[true]){const values:number[]=[],surfaceColors:number[]=[],stride=Math.max(1,Math.ceil(Math.sqrt(corridorSurface.width*corridorSurface.height/40000)));for(let row=0;row<corridorSurface.height;row+=stride)for(let col=0;col<corridorSurface.width;col+=stride){const value=corridorSurface.values[row*corridorSurface.width+col];if(value<0||!Number.isFinite(value)||(corridorSurface.kind==='viewshed'&&(value>0)!==visibleArea))continue;const p=point(west+(east-west)*col/Math.max(corridorSurface.width-1,1),north-(north-south)*row/Math.max(corridorSurface.height-1,1),lift*1.35),ratio=corridorSurface.kind==='accumulated'?Math.min(1,value/Math.max(corridorSurface.maxCost??1,1)):0,color=corridorSurface.kind==='viewshed'?new THREE.Color(value>0?0x23e169:0xeb4646):corridorSurface.kind==='accumulated'?new THREE.Color().setRGB((35+220*ratio)/255,(180-80*Math.abs(ratio-.5)*2)/255,(245-210*ratio)/255):new THREE.Color(0xff389f);values.push(p.x,p.y,p.z);surfaceColors.push(color.r,color.g,color.b)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(values,3));g.setAttribute('color',new THREE.Float32BufferAttribute(surfaceColors,3));const cloud=new THREE.Points(g,new THREE.PointsMaterial({vertexColors:true,size:Math.max(4,routeWidth*1.35),sizeAttenuation:false,transparent:true,opacity:corridorSurface.opacity??.78,depthWrite:false}));cloud.renderOrder=20;scene.add(cloud);objects.push(cloud);if(corridorSurface.kind==='accumulated')accumulatedSurfaceCloud.current=cloud;if(corridorSurface.kind==='viewshed'){cloud.name=visibleArea?'viewshed-visible':'viewshed-hidden';viewshedClouds.current.push({cloud,visibleArea})}}updateViewshed()}
  points.forEach((item,index)=>addMarker(item.lon,item.lat,Number(pointColor(index).replace('#','0x')),1,showPointLabels?item.name:undefined));pointsOfInterest.forEach(item=>addMarker(item.coordinate[0],item.coordinate[1],Number(CONSTRAINT_COLORS.poi.replace('#','0x')),.9,showPointLabels?item.name:undefined));if(showHighestPoint){const highest=highestTerrainPoint(mesh);if(highest)addMarker(highest.lon,highest.lat,0xffd54a,1.35,`${translateText('Cota máxima')} · ${highest.elevationM.toFixed(1)} m`)}
  const isochroneLabels=isochroneLabelCandidates(isochroneLines,mesh.widthM/(east-west),mesh.heightM/(north-south)).flatMap((group,index)=>{
   const anchors=group.anchors.map(([lon,lat])=>point(lon,lat,lift*1.7)).filter(anchor=>Number.isFinite(anchor.y));
   if(!anchors.length)return [];
   const color=lineGroups.get(`${group.level}:${group.color??""}`)?.color.getHex()??0xffffff;
   const label=addLabel(anchors[0],group.text,color);
   label.sprite.name=group.text;label.sprite.renderOrder=31;label.sprite.material.depthWrite=false;
   if(label.leader)(label.leader.material as THREE.LineBasicMaterial).depthWrite=false;
   return [{...label,anchors,preferred:index%anchors.length}];
  });
  const layoutIsochroneLabels=()=>{
   if(!isochroneLabels.length)return;
   const width=renderer.domElement.width/renderer.getPixelRatio(),height=renderer.domElement.height/renderer.getPixelRatio();
   if(width<=0||height<=0)return;
   camera.updateMatrixWorld();
   const occupied:LabelRect[]=[],isochroneSprites=new Set(isochroneLabels.map(label=>label.sprite));
   const project=(position:THREE.Vector3,spriteWidth:number,spriteHeight:number):LabelRect|null=>{
    const p=position.clone().project(camera);
    return Number.isFinite(p.z)&&p.z>=-1&&p.z<=1?{x:(p.x+1)*width/2,y:(1-p.y)*height/2,width:spriteWidth,height:spriteHeight}:null;
   };
   // Include existing point/constraint labels as obstacles, without moving them.
   for(const {sprite} of labelSprites){
    if(isochroneSprites.has(sprite)||!sprite.visible)continue;
    const depth=-sprite.position.clone().applyMatrix4(camera.matrixWorldInverse).z;
    const pixelsPerMetre=height/(2*depth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
    const rect=project(sprite.position,sprite.scale.x*sprite.userData.labelWidthRatio*pixelsPerMetre,sprite.scale.y*pixelsPerMetre);
    if(rect)occupied.push(rect);
   }
   for(const label of isochroneLabels){
    const spriteHeight=labelTextSizePx*96/30,spriteWidth=spriteHeight*512/96;
    const positions=label.anchors.map(anchor=>anchor.clone().add(new THREE.Vector3(0,label3dOffsetM,0)));
    const candidates=positions.map(position=>project(position,spriteWidth*label.sprite.userData.labelWidthRatio,spriteHeight));
    const selected=chooseIsochroneLabel(candidates,occupied,width,height,label.preferred);
    label.sprite.visible=selected>=0;if(label.leader)label.leader.visible=selected>=0;
    if(selected<0)continue;
    label.preferred=selected;label.sprite.position.copy(positions[selected]);occupied.push(candidates[selected]!);
    const depth=-label.sprite.position.clone().applyMatrix4(camera.matrixWorldInverse).z;
    const metresPerPixel=2*depth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/height;
    label.sprite.scale.set(spriteWidth*metresPerPixel,spriteHeight*metresPerPixel,1);
    if(label.leader){const attribute=label.leader.geometry.getAttribute('position') as THREE.BufferAttribute;
     attribute.setXYZ(0,...label.anchors[selected].toArray());attribute.setXYZ(1,...positions[selected].toArray());attribute.needsUpdate=true;label.leader.geometry.computeBoundingSphere();
    }
   }
  };
  const reset=()=>{camera.position.set(span*.82,Math.max(span*.55,range*exaggeration*2.1),span*.9);controls.target.set(0,range*exaggeration*.18,0);controls.update()};resetRef.current=reset;reset();const orbitDistance=camera.position.distanceTo(controls.target),setCamera=(inclination:number,orientation:number)=>{const radians=THREE.MathUtils.degToRad(inclination),angle=THREE.MathUtils.degToRad(orientation),horizontalRadius=Math.cos(radians)*orbitDistance,height=Math.sin(radians)*orbitDistance;camera.position.set(controls.target.x+Math.sin(angle)*horizontalRadius,controls.target.y+height,controls.target.z+Math.cos(angle)*horizontalRadius);camera.lookAt(controls.target)},restoreRoutes=()=>animatedRoutes.forEach(item=>{item.line.visible=true;item.head.visible=false;item.core.visible=false}),
 updateLabelScales=()=>{labelSprites.forEach(({sprite,ratio})=>{const distance=camera.position.distanceTo(sprite.position);sprite.scale.set(distance*.16*ratio,distance*.03*ratio,1)});const screenUp=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);for(const label of markerLabels){const offset=new THREE.Vector3(0,label3dOffsetM,0),gap=label.sprite.scale.y*.65+label.radius*2;offset.addScaledVector(screenUp,Math.max(0,gap-offset.dot(screenUp)));label.sprite.position.copy(label.anchor).add(offset);if(label.leader){const attribute=label.leader.geometry.getAttribute('position') as THREE.BufferAttribute;attribute.setXYZ(1,...label.sprite.position.toArray());attribute.needsUpdate=true;label.leader.geometry.computeBoundingSphere()}}layoutIsochroneLabels()},renderAt=(mode:AnimationMode,progress:number,inclination=orbitInclinationRef.current,orientation=cameraOrientationRef.current,routeIndex=0,zoom=15)=>{
 restoreRoutes();
 if(mode==='orbit')setCamera(inclination,orientation+progress*360);
 else {
  if(!animatedRoutes.length)throw new Error('No hay rutas visibles para exportar. Active una ruta calculada.');
  let routeProgress=progress;
  if(mode==='flyover'){
   const route=animatedRoutes[routeIndex];if(!route)throw new Error('La ruta de seguimiento ya no está disponible.');
   const pose=flyoverCamera(route.path,progress,inclination,Math.max(span*zoom/100,10));
   controls.target.fromArray(pose.target);camera.position.fromArray(pose.position);
   // Keep the camera above the terrain below it, including exaggerated relief.
   const [lon,lat]=toLonLat([mapCenterX+camera.position.x/mapScale,mapCenterY-camera.position.z/mapScale]);
   camera.position.y=Math.max(camera.position.y,elevationAt(lon,lat)+Math.max(span*.02,5));
   camera.lookAt(controls.target);routeProgress=pose.progress;
  }else setCamera(inclination,orientation);
  animatedRoutes.forEach((item,index)=>{if(mode==='flyover'&&index!==routeIndex)return;item.head.position.fromArray(sampleRoutePath(item.path,routeProgress));item.core.position.copy(item.head.position);const radius=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.distanceTo(item.head.position)*9/Math.max(renderer.domElement.height,1);item.head.scale.setScalar(radius/Math.max(span*.004,2));item.core.scale.setScalar(radius*.65);item.head.visible=true;item.core.visible=true});
 }
 const dir=camera.getWorldDirection(new THREE.Vector3()),heading=cameraHeading(dir.x,dir.z);
 if(compassNeedle.current)compassNeedle.current.style.transform=`rotate(${heading}deg)`;if(compassReading.current)compassReading.current.textContent=`${Math.round(heading)%360}°`;
 updateLabelScales();renderer.render(scene,camera);return heading;
 };
 controls.addEventListener('change',updateLabelScales);
 let exportingScene=false,alive=true;
 const beginExport=(width:number,height:number)=>{
  if(exportingScene)throw new Error('Ya hay una exportación en curso.');
  const position=camera.position.clone(),target=controls.target.clone(),ratio=renderer.getPixelRatio(),markers=animatedRoutes.map(item=>({visible:item.head.visible,position:item.head.position.clone(),scale:item.head.scale.clone(),coreScale:item.core.scale.clone()}));
  controls.enabled=false;controls.enableDamping=false;controls.update();exportingScene=true;
  renderer.setPixelRatio(1);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();lineMaterials.forEach(m=>m.resolution.set(width,height));
  return()=>{if(!alive)return;restoreRoutes();animatedRoutes.forEach((item,index)=>{const saved=markers[index];item.head.visible=saved.visible;item.core.visible=saved.visible;item.head.position.copy(saved.position);item.core.position.copy(saved.position);item.head.scale.copy(saved.scale);item.core.scale.copy(saved.coreScale)});camera.position.copy(position);controls.target.copy(target);controls.update();controls.enableDamping=true;controls.enabled=true;exportingScene=false;renderer.setPixelRatio(ratio);resize();renderer.render(scene,camera)};
 };
 animationRef.current={canvas:renderer.domElement,lineColor:(level,color)=>{const group=lineGroups.get(`${level}:${color??""}`);return group?.values.length?`#${group.color.getHexString()}`:undefined},renderAt,beginExport,isReady:()=>{if(textureError)throw new Error('No se pudo cargar la capa base 3D. Vuelva a seleccionarla antes de exportar.');return textureReady},preview:(mode,inclination,orientation,routeIndex,zoom)=>{if(exportingScene)return;controls.enableDamping=false;controls.update();renderAt(mode,0,inclination,orientation,routeIndex,zoom);controls.update();controls.enableDamping=true;rememberCamera()}};
 const resize=()=>{if(!host.current||exportingScene)return;const{clientWidth:w,clientHeight:h}=host.current;renderer.setSize(w, h, false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();lineMaterials.forEach(m=>m.resolution.set(w,h));layoutIsochroneLabels()};const observer=new ResizeObserver(resize);observer.observe(host.current);resize();const direction=new THREE.Vector3();let frame=0,last=performance.now();const animate=(now=performance.now())=>{const elapsed=Math.min(.1,(now-last)/1000);last=now;if(exportingScene){frame=requestAnimationFrame(animate);return}controls.update(elapsed);camera.getWorldDirection(direction);const horizontal=Math.hypot(direction.x,direction.z),heading=(THREE.MathUtils.radToDeg(Math.atan2(direction.x,-direction.z))+360)%360,tilt=THREE.MathUtils.radToDeg(Math.atan2(-direction.y,horizontal));if(compassNeedle.current)compassNeedle.current.style.transform=`rotate(${heading}deg)`;if(compassReading.current)compassReading.current.textContent=`${heading.toFixed(0).padStart(3,'0')}°`;if(tiltNeedle.current)tiltNeedle.current.textContent=`${tilt.toFixed(0)}°`;layoutIsochroneLabels();renderer.render(scene,camera);frame=requestAnimationFrame(animate)};animate();snapshotCallback.current(()=>{renderer.render(scene,camera);const canvas=renderer.domElement,output=document.createElement('canvas'),context=output.getContext('2d');if(!context)throw new Error('No se pudo preparar la captura 3D');output.width=canvas.width;output.height=canvas.height;context.drawImage(canvas,0,0);if(textureAttribution)drawVideoAttribution(context,output.width,output.height,textureAttribution);return output.toDataURL('image/png')});
  if(savedCameraRef.current){camera.position.fromArray(savedCameraRef.current.position);controls.target.fromArray(savedCameraRef.current.target);controls.update()}const rememberCamera=()=>{savedCameraRef.current={position:camera.position.toArray(),target:controls.target.toArray()}},reportCamera=()=>{rememberCamera();const delta=camera.position.clone().sub(controls.target),inclination=THREE.MathUtils.radToDeg(Math.atan2(delta.y,Math.hypot(delta.x,delta.z))),orientation=(THREE.MathUtils.radToDeg(Math.atan2(delta.x,delta.z))+360)%360;orbitInclinationRef.current=inclination;cameraOrientationRef.current=orientation;setOrbitInclination(inclination);setCameraOrientation(orientation);onCameraChange?.({inclination,orientation})};controls.addEventListener('change',rememberCamera);controls.addEventListener('end',reportCamera);
  return()=>{corridorMaterial.current=null;viewshedClouds.current=[];alive=false;cancelExportRef.current=true;if(!exportingScene)rememberCamera();cancelAnimationFrame(frame);observer.disconnect();controls.removeEventListener('change',updateLabelScales);controls.removeEventListener('change',rememberCamera);controls.removeEventListener('end',reportCamera);controls.dispose();geometry.dispose();terrainMaterial.dispose();texture?.dispose();objects.forEach(object=>{const item=object as THREE.Mesh;item.geometry?.dispose();const material=item.material;if(Array.isArray(material))material.forEach(m=>m.dispose());else material?.dispose();(object.userData.texture as THREE.Texture|undefined)?.dispose()});renderer.dispose();renderer.domElement.remove();resetRef.current=null;routeMaterialsRef.current=EMPTY;animationRef.current=null}
 },[language,mesh,exaggeration,palette,hillshade,points,routeCoordinates,routes,isochroneLines,corridorSurface,corridorRaster,showPointLabels,showHighestPoint,textureDataUrl,textureAttribution,barriers,corridors,crossings,pointsOfInterest,labelTextSizePx,label3dOffsetM,label3dLeaderLine]);
 useEffect(()=>{if(corridorMaterial.current)corridorMaterial.current.opacity=corridorOpacity},[corridorOpacity]);
 useEffect(()=>{if(accumulatedSurfaceCloud.current)accumulatedSurfaceCloud.current.material.opacity=accumulatedOpacity},[accumulatedOpacity]);
 useEffect(updateViewshed,[viewshedMode,viewshedOpacity]);
 useEffect(()=>{if(!savedCameraRef.current)animationRef.current?.renderAt('orbit',0,initialInclination,initialOrientation)},[mesh]);
 useEffect(()=>{onCameraChange?.({inclination:orbitInclination,orientation:cameraOrientation})},[orbitInclination,cameraOrientation,onCameraChange]);
 useEffect(()=>{if(!host.current||!showScale)return;const scale=document.createElement('div'),format=(value:number)=>value>=1000?`${(value/1000).toFixed(1)} km`:`${Math.round(value)} m`,width=format(mesh.widthM),length=format(mesh.heightM);scale.className='terrain-3d-scale';scale.setAttribute('aria-label',translateText(`Dimensiones del modelo: ${width} de ancho por ${length} de largo`,language));const widthLabel=translateText('Ancho',language),lengthLabel=translateText('Largo',language);scale.textContent=`${widthLabel} · ${width} / ${lengthLabel} · ${length}`;host.current.appendChild(scale);return()=>scale.remove()},[mesh.widthM,mesh.heightM,showScale,language]);
 const previewCamera=(mode=timeline.mode,inclination=orbitInclination,orientation=cameraOrientation,index=followRoute,zoom=followZoom)=>{
 if(exportingRef.current||hideAnimationPanel)return;
 if(mode!=='orbit'&&!routeMaterialsRef.current.length)return;
 try{animationRef.current?.preview(mode,inclination,orientation,index,zoom)}catch(error){reportExportError(error)}
 };
 const updateTimeline=(next:TimelineState)=>{timelineRef.current=next;setTimeline(next);if(next.mode!==timeline.mode)previewCamera(next.mode)};
 const exportAnimation=async(format:'avi'|'mp4'|'gif')=>{return trackProcess(async()=>{
  const animation=animationRef.current;if(!animation||exportingRef.current)return;if(textureLoading)throw new Error('Espere a que termine de prepararse la capa base.');
  if(timeline.mode!=='orbit'&&!routeMaterialsRef.current.length)throw new Error('No hay rutas visibles para exportar. Active una ruta calculada.');
  const duration=timeline.durationSeconds/timeline.speed;
  if(duration>300)throw new Error('La exportación supera 5 minutos. Reduzca duración o aumente velocidad.');
  const [requestedWidth,requestedHeight]=resolution;
  const plan=format!=='gif'?{width:requestedWidth,height:requestedHeight,...videoExportPlan(duration)}:gifExportPlan(requestedWidth,requestedHeight,duration);
  const {width,height,count}=plan,output=document.createElement('canvas'),context=output.getContext('2d');
  if(!context)throw new Error('No se pudo preparar la exportación.');
  output.width=width;output.height=height;cancelExportRef.current=false;exportingRef.current=true;setExporting(true);
  const profiles=videoProfileSeries(routes.map((route,index)=>({label:route.label??legendItems.filter(item=>item.visible)[index]?.label??`Ruta ${index+1}`,color:route.color,coordinates:route.coordinates,elevationsM:route.result?.elevationsM})));
  const routeLegend=exportRouteLegend?videoRouteLegendItems(legendItems):[];
  const contourLegend=exportContourLegend?videoContourLegendItems(legendItems,animation.lineColor):[];
  const video=format!=='gif'?new MjpegAviStream(width,height,30):null,gif=format==='gif'?new GifEncoder(width,height,duration*1000/count):null;
  let exportName:string|undefined;
  let restore:(()=>void)|undefined,videoFile:Awaited<ReturnType<typeof startVideoExport>>|undefined;
  try{
   const waitingSince=performance.now();
   while(!animation.isReady()){if(cancelExportRef.current||animationRef.current!==animation){setExportStatus('Exportación cancelada.');return}if(performance.now()-waitingSince>15000)throw new Error('La capa base tardó demasiado en cargar. Vuelva a seleccionarla.');setExportStatus('Cargando capa base…');await new Promise(resolve=>setTimeout(resolve,25))}
   if(cancelExportRef.current||animationRef.current!==animation)return;
   if(video){exportName=nextMediaFileName(projectName,'v',timeline.mode);videoFile=await startVideoExport(format==='mp4'?'mp4':'avi',exportName);if(!videoFile){setExportStatus('Guardado cancelado.');return}}
   restore=animation.beginExport(width,height);
   for(let index=0;index<count;index++){
    if(cancelExportRef.current||animationRef.current!==animation){setExportStatus('Exportación cancelada; recursos liberados.');return}
    const frameProgress=exportFrameProgress(index,count),heading=animation.renderAt(timeline.mode,frameProgress,orbitInclination, cameraOrientation,followRoute,followZoom);
    context.drawImage(animation.canvas,0,0,width,height);drawViaSpaniaWatermark(context,width,height);
    const attributionTop=textureAttribution?drawVideoAttribution(context,width,height,textureAttribution):height;
    const profileReserve=exportProfile&&timeline.mode!=='orbit'?Math.min(height*.27,230)+64:0;
    const legendBottom=attributionTop-12-profileReserve;
    const contourLayout=drawVideoContourLegend(context,width,height,contourLegend,legendBottom);
    if(routeLegend.length)drawVideoRouteLegend(context,width,height,routeLegend,legendBottom,contourLayout?contourLayout.y+contourLayout.height+12:undefined);
    if(exportCompass)drawVideoCompass(context,width,height,heading);
    if(exportProfile&&timeline.mode!=='orbit')drawAnimatedElevationProfile(context,width,height,timeline.mode==='flyover'?profiles.filter(profile=>profile.routeIndex===followRoute):profiles,animationRouteProgress(timeline.mode,frameProgress),height-attributionTop+12);
    if(video){
     const blob=await new Promise<Blob>((resolve,reject)=>output.toBlob(value=>value?resolve(value):reject(new Error('No se pudo codificar el fotograma.')),'image/jpeg',.85));
     await videoFile!.append(video.addFrame(new Uint8Array(await blob.arrayBuffer())));
    }else gif!.addFrame(context.getImageData(0,0,width,height));
    setExportStatus(`Creando ${format.toUpperCase()} · ${Math.round((index+1)/count*100)} %`);
    await new Promise(resolve=>setTimeout(resolve,0));
   }
   if(cancelExportRef.current)return;
   const avi=video?.finish();
   restore();restore=undefined;
   if(format==='mp4'){setConverting(true);setExportStatus('Convirtiendo a MP4…')}
   const path=avi?await videoFile!.finish(avi.header,avi.index,exportName??nextMediaFileName(projectName,'v',timeline.mode)):await saveMediaExport(gif!.finish(),nextMediaFileName(projectName,'gif',timeline.mode),'GIF animado','gif');
   setExportStatus(path?`Guardado · ${width} × ${height} px · ${duration.toFixed(1)} s · ${timeline.speed}× · ${format.toUpperCase()}`:'Guardado cancelado.');
   if(path)onVideoExported?.();
 }finally{restore?.();try{await videoFile?.cancel()}finally{video?.dispose();output.width=0;output.height=0;exportingRef.current=false;setExporting(false);setConverting(false)}}
 });};
 const exportPngFrame=async()=>{return trackProcess(async()=>{
  const animation=animationRef.current;if(!animation||exportingRef.current)return;if(textureLoading)throw new Error('Espere a que termine de prepararse la capa base.');
  if(!animation.isReady())throw new Error('La capa base todavía se está preparando. Inténtelo de nuevo en unos segundos.');
  if(timeline.mode!=='orbit'&&!routeMaterialsRef.current.length)throw new Error('No hay rutas visibles para exportar. Active una ruta calculada.');
  const [width,height]=resolution,output=document.createElement('canvas'),context=output.getContext('2d');if(!context)throw new Error('No se pudo preparar la exportación PNG.');
  output.width=width;output.height=height;exportingRef.current=true;setExporting(true);setExportStatus('Preparando fotograma PNG…');let restore:(()=>void)|undefined;
  try{
   restore=animation.beginExport(width,height);const heading=animation.renderAt(timeline.mode,0,orbitInclination,cameraOrientation,followRoute,followZoom);context.drawImage(animation.canvas,0,0,width,height);
   const attributionTop=textureAttribution?drawVideoAttribution(context,width,height,textureAttribution):height;if(exportCompass)drawVideoCompass(context,width,height,heading);
   const profiles=videoProfileSeries(routes.map((route,index)=>({label:route.label??legendItems.filter(item=>item.visible)[index]?.label??`Ruta ${index+1}`,color:route.color,coordinates:route.coordinates,elevationsM:route.result?.elevationsM})));
   if(exportProfile&&timeline.mode!=='orbit')drawAnimatedElevationProfile(context,width,height,timeline.mode==='flyover'?profiles.filter(profile=>profile.routeIndex===followRoute):profiles,0,height-attributionTop+12);
   restore();restore=undefined;const path=await savePngExport(output.toDataURL('image/png'),nextScreenshotFileName(projectName));setExportStatus(path?`Captura guardada · ${width} × ${height} px`:'Guardado cancelado.');
  }finally{restore?.();output.width=0;output.height=0;exportingRef.current=false;setExporting(false)}
 });};
 const reportExportError=(error:unknown)=>{const detail=error instanceof Error?error.message:String(error);setExportStatus(language==='en'?`Export failed: ${translateText(detail)}`:translateText(`No se pudo exportar: ${detail}`,language))};
 const hasProfiles=videoProfileSeries(routes.map(route=>({label:route.label??'',color:route.color,coordinates:route.coordinates,elevationsM:route.result?.elevationsM}))).length>0;
 return <div className="terrain-3d-canvas" ref={host}>
  {!hideAnimationPanel&&<Terrain3DLegend title={legendTitle} items={legendItems} onToggle={id=>onToggleLegendItem?.(id)}
   beforeItems={(corridorSurface?.kind==='viewshed'||legendItems.some(item=>item.id==='viewshed-surface'))&&<label className="terrain-viewshed-mode">Visibilidad topográfica <select aria-label="Áreas del viewshed 3D" value={viewshedMode} onChange={event=>setViewshedMode(event.target.value as typeof viewshedMode)}><option value="both">Visible / no visible</option><option value="visible">Solo áreas visibles</option><option value="hidden">Solo áreas no visibles</option></select></label>}
   afterItems={(corridorSurface?.kind==='viewshed'||legendItems.some(item=>item.id==='viewshed-surface'))?<label className="terrain-viewshed-opacity"><span>Opacidad</span><output>{Math.round(viewshedOpacity*100)} %</output><input aria-label="Opacidad del viewshed 3D" type="range" min="0" max="1" step="0.01" value={viewshedOpacity} onChange={event=>setViewshedOpacity(Number(event.target.value))}/></label>:corridorSurface?.kind==='accumulated'?<label className="terrain-viewshed-opacity"><span>Opacidad de superficie acumulada</span><output>{Math.round(accumulatedOpacity*100)} %</output><input aria-label="Opacidad de superficie acumulada 3D" type="range" min="0" max="1" step="0.01" value={accumulatedOpacity} onChange={event=>setAccumulatedOpacity(Number(event.target.value))}/></label>:(corridorRaster||legendItems.some(item=>item.id==='lcp-surface'))?<label className="terrain-viewshed-opacity"><span>Opacidad</span><output>{Math.round(corridorOpacity*100)} %</output><input aria-label="Opacidad del corredor 3D" type="range" min="0" max="1" step="0.01" value={corridorOpacity} onChange={event=>setCorridorOpacity(Number(event.target.value))}/></label>:null}/>}
  {videoDialogOpen&&<VideoExportDialog onClose={()=>setVideoDialogOpen(false)} onExport={format=>{setVideoDialogOpen(false);void exportAnimation(format).catch(reportExportError)}}/>}
  {!hideAnimationPanel&&<div className={`terrain-animation-panel ${animationCollapsed?'collapsed':''}`}>
   <div className="terrain-animation-header">
    <b>Exportación animada</b>
    <button aria-label={animationCollapsed?'Desplegar exportación':'Plegar exportación'} title={animationCollapsed?'Desplegar':'Plegar'} onClick={()=>setAnimationCollapsed(value=>!value)}>{animationCollapsed?'▾':'▴'}</button>
   </div>
   <fieldset disabled={exporting} className="terrain-export-settings">
    <label className="terrain-export-mode"><span>Modo de vídeo</span><select aria-label="Tipo de animación" value={timeline.mode} onChange={event=>updateTimeline({...timeline,mode:event.target.value as AnimationMode,progress:0,playing:false})}><option value="orbit">Órbita de cámara</option><option value="routes">Recorrido de rutas</option><option value="flyover">Seguimiento a vista de pájaro</option></select></label>
    <div className="terrain-export-row"><label>Velocidad <select value={timeline.speed} onChange={event=>updateTimeline({...timeline,speed:Number(event.target.value)})}>{[.25,.5,1,2,5,10,25,50].map(value=><option key={value} value={value}>{value}×</option>)}</select></label><label>Duración <input type="number" min="2" max="86400" value={timeline.durationSeconds} onChange={event=>updateTimeline({...timeline,durationSeconds:Math.min(86400,Math.max(2,Number(event.target.value)||2))})}/> s</label></div>
    <label className="terrain-slider-row">Inclinación <input type="range" min={timeline.mode==='flyover'?15:5} max="85" step="1" value={timeline.mode==='flyover'?Math.max(15,orbitInclination):orbitInclination} onChange={event=>{const value=Number(event.target.value);orbitInclinationRef.current=value;setOrbitInclination(value);previewCamera(timeline.mode,value)}}/><span>{formatDisplayedAngle(timeline.mode==='flyover'?Math.max(15,orbitInclination):orbitInclination)}°</span></label>
    <div className="terrain-export-row terrain-orientation-row">{timeline.mode!=='flyover'&&<label className="terrain-slider-row">Orientación <input type="range" min="0" max="359" step="1" value={cameraOrientation} onChange={event=>{const value=Number(event.target.value);cameraOrientationRef.current=value;setCameraOrientation(value);previewCamera(timeline.mode,orbitInclination,value)}}/><span>{formatDisplayedAngle(cameraOrientation)}°</span></label>}<label className="terrain-export-check"><input type="checkbox" checked={exportCompass} onChange={e=>setExportCompass(e.target.checked)}/>Brújula en el vídeo</label></div>
    {timeline.mode==='flyover'&&<div className="terrain-route-options"><label>Ruta a seguir<select value={followRoute} onChange={e=>{const value=Number(e.target.value);setFollowRoute(value);previewCamera(timeline.mode,orbitInclination,cameraOrientation,value)}}>{(routes.length?routes:routeCoordinates.length>1?[{color:routeColor||'#00f0ff'}]:[]).map((route,index)=><option key={index} value={index}>{legendItems.filter(item=>item.visible)[index]?.label??`Ruta ${index+1}`} · {route.color}</option>)}</select></label><label className="terrain-slider-row">Distancia de cámara <input type="range" min="3" max="40" value={followZoom} onChange={e=>{const value=Number(e.target.value);setFollowZoom(value);previewCamera(timeline.mode,orbitInclination,cameraOrientation,followRoute,value)}}/><span>{followZoom}%</span></label></div>}
    {timeline.mode!=='orbit'&&<label className="terrain-export-check" title={hasProfiles?'':'Las rutas visibles no contienen cotas de elevación'}><input type="checkbox" checked={exportProfile} disabled={!hasProfiles} onChange={e=>setExportProfile(e.target.checked)}/>Perfil altimétrico en el vídeo</label>}
    {videoRouteLegendItems(legendItems).length>0&&<label className="terrain-export-check"><input type="checkbox" checked={exportRouteLegend} onChange={e=>setExportRouteLegend(e.target.checked)}/>Leyenda de rutas en el vídeo</label>}
    {legendItems.some(isVisibleContourLegendItem)&&<label className="terrain-export-check"><input type="checkbox" checked={exportContourLegend} onChange={e=>setExportContourLegend(e.target.checked)}/>Leyenda de curvas de nivel en el vídeo</label>}
    <label className="terrain-resolution-row">Resolución <select value={resolution.join('x')} onChange={event=>setResolution(event.target.value.split('x').map(Number) as [number,number])}><option value="854x480">854 × 480</option><option value="1280x720">1280 × 720</option><option value="1920x1080">1920 × 1080</option></select></label>
   </fieldset>
   <div className="terrain-export-actions"><button disabled={exporting||textureLoading} title="Exportación fotograma a fotograma. AVI: 30 fps, hasta 90 s y 1,5 GB." onClick={()=>setVideoDialogOpen(true)}>Exportar vídeo</button><button disabled={exporting||textureLoading} onClick={()=>void exportAnimation('gif').catch(reportExportError)}>Exportar animación GIF</button><button disabled={exporting||textureLoading} onClick={()=>void exportPngFrame().catch(reportExportError)}>Exportar fotograma PNG</button></div>
   {(exportStatus||exporting)&&<div className="terrain-export-status"><small>{exportStatus}</small>{exporting&&!converting&&<button onClick={()=>{cancelExportRef.current=true}}>Cancelar</button>}</div>}
  </div>}
  <div className="terrain-orientation"><div className="terrain-compass" role="img" aria-label="Brújula y rumbo actual"><div className="compass-ring"><b className="north">N</b><span className="east">E</span><span className="south">S</span><span className="west">{language==='en'?'W':translateText('O',language)}</span><div className="compass-needle" ref={compassNeedle}><i/><em/></div><div className="compass-centre"/></div><span className="compass-reading" ref={compassReading}>000°</span></div><div className="terrain-tilt" role="img" aria-label="Inclinación actual de la cámara"><div className="tilt-gauge"><i ref={tiltNeedle}/><b/></div><span ref={tiltReading}>0°</span></div></div>{textureAttribution&&<span className="terrain-3d-attribution">{textureAttribution}</span>}
 </div>
}
