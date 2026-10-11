import type {ContourResult} from '../types';
import {levelColor} from './comparisonColors';
import {locale} from './i18n';

/** Styles the calculated contour geometry for report maps without inventing new elevations. */
export function reportContourOverlay(result:ContourResult|null,style?:{color?:string;majorColor?:string;width?:number;majorWidth?:number;majorInterval?:0|3|5|10;mode?:'topographic'|'elevation';intervalM?:number}){
 if(!result?.lines.length)return {lines:[],legend:[],caption:''};
 const levels=[...new Set(result.lines.map(line=>line.level))].sort((a,b)=>a-b),intervalM=style?.intervalM??result.intervalM,step=Math.max(1,Math.round(intervalM/result.intervalM)),mode=style?.mode??(style?'topographic':'elevation'),majorEvery=style?.majorInterval??0;
 const visible=result.lines.filter(line=>levels.indexOf(line.level)%step===0),color=(level:number)=>mode==='elevation'?levelColor(levels.indexOf(level),levels.length):style?.color??'#111111',isMajor=(level:number)=>{const index=levels.indexOf(level)/step;return majorEvery!==0&&((index%majorEvery)+majorEvery)%majorEvery===0};
 const styledLines=visible.map(line=>({...line,color:isMajor(line.level)?style?.majorColor??'#d04a00':color(line.level),width:isMajor(line.level)?style?.majorWidth??2.6:style?.width??1.3}));
 // Five reference heights keep the elevation legend readable even for dense contour sets.
 const referenceLevels=visible.map(line=>line.level).filter((level,index,items)=>items.indexOf(level)===index).sort((a,b)=>a-b),references=referenceLevels.filter((_,index)=>referenceLevels.length<=5||Array.from({length:5},(_,i)=>Math.round(i*(referenceLevels.length-1)/4)).includes(index));
 const legend=mode==='elevation'?references.map(level=>({label:`Altitud · ${level} m`,color:color(level)})):[{label:'Curvas de nivel',color:style?.color??'#111111'},...(majorEvery?[{label:'Curva maestra',color:style?.majorColor??'#d04a00'}]:[])];
 const language=locale(),sourceCaption=result.source==='GeoTIFF/MDT cargado · marching squares'?language==='en-GB'?'loaded GeoTIFF digital elevation model (DEM) · marching squares':language==='it-IT'?'modello digitale del terreno (MDT) caricato da GeoTIFF · algoritmo marching squares':result.source:result.source,caption=language==='en-GB'?`Contour lines: ${levels[0]}–${levels.at(-1)} m · contour interval ${intervalM} m · DTM ${result.resolutionM} m · ${sourceCaption}`:language==='it-IT'?`Curve di livello: ${levels[0]}–${levels.at(-1)} m · equidistanza ${intervalM} m · MDT ${result.resolutionM} m · ${sourceCaption}`:`Curvas de nivel: ${levels[0]}–${levels.at(-1)} m · equidistancia ${intervalM} m · MDT ${result.resolutionM} m · ${sourceCaption}`;
 return {lines:styledLines,legend,caption};
}

/** Same fitted EPSG:3857 transform as the report basemap and project overlays. */
export function reportContourPoint([lon,lat]:readonly [number,number],[west,south,east,north]:readonly [number,number,number,number],width:number,height:number):[number,number]{
 return reportMapPoint([lon,lat],[west,south,east,north],width,height);
}

/** Extent shown by an EPSG:3857 report map after fitting it to a canvas without stretching. */
export function reportMapExtent(extent:readonly [number,number,number,number],width:number,height:number):[number,number,number,number]{
 const [west,south,east,north]=extent,toY=(lat:number)=>Math.log(Math.tan(Math.PI/4+Math.max(-85.05112878,Math.min(85.05112878,lat))*Math.PI/360));
 let x1=west*Math.PI/180,x2=east*Math.PI/180,y1=toY(south),y2=toY(north),mapW=x2-x1,mapH=y2-y1;
 const target=width/height,centerX=(x1+x2)/2,centerY=(y1+y2)/2;
 if(mapW/mapH<target)mapW=mapH*target;else mapH=mapW/target;
 x1=centerX-mapW/2;x2=centerX+mapW/2;y1=centerY-mapH/2;y2=centerY+mapH/2;
 const fromY=(y:number)=>Math.atan(Math.sinh(y))*180/Math.PI;
 return [x1*180/Math.PI,fromY(y1),x2*180/Math.PI,fromY(y2)];
}

/** Raster dimensions that preserve the projected shape of the study extent. */
export function reportMapRasterSize(extent:readonly [number,number,number,number],longSide=1600):[number,number]{
 const [west,south,east,north]=extent,mercY=(lat:number)=>Math.log(Math.tan(Math.PI/4+Math.max(-85.05112878,Math.min(85.05112878,lat))*Math.PI/360));
 const aspect=Math.abs((east-west)*Math.PI/180)/Math.abs(mercY(north)-mercY(south));
 if(!Number.isFinite(aspect)||aspect<=0)return [longSide,longSide];
 return aspect>=1?[longSide,Math.max(1,Math.round(longSide/aspect))]:[Math.max(1,Math.round(longSide*aspect)),longSide];
}

/** WGS84 coordinate projected into the same fitted Mercator canvas as reportMapRenderer. */
export function reportMapPoint([lon,lat]:readonly [number,number],extent:readonly [number,number,number,number],width:number,height:number):[number,number]{
 const [west,south,east,north]=reportMapExtent(extent,width,height),mercY=(value:number)=>Math.log(Math.tan(Math.PI/4+Math.max(-85.05112878,Math.min(85.05112878,value))*Math.PI/360));
 return [(lon-west)/(east-west)*width,(mercY(north)-mercY(lat))/(mercY(north)-mercY(south))*height];
}
