import {pointColor} from '../core/points';
import {CONSTRAINT_COLORS} from '../core/constraintColors';
import {barrierParts} from '../core/barriers';
import {resultCredit} from '../core/resultProvenance';
import { jsPDF } from 'jspdf';
import italianCatalog from '../core/i18n.it.json';
import {createCatalogTranslator} from '../core/italianCatalog';
import {locale,translateText} from '../core/i18n';
import type { Barrier, Connectivity, ContourResult, EnabledCrossing, GeoPoint, IsochroneResult, LcpCorridorResult, PointOfInterest, PreferredCorridor, RouteResult, ViewshedObserverResult } from '../types';
import type { StudyExtent } from '../components/MapPanel';
import { MODELS } from '../core/costModels';
import {elevationProfileSamples,profileExtent} from '../core/elevationProfile';
import {reportMapPoint} from '../core/reportContours';

export type ReportPageSize='a4'|'a3'|'a2';
export type ReportOrientation='landscape'|'portrait';
export interface ReportOptions { navigation:boolean; pnoaOverview:boolean; individualRoutePages:boolean; terrain3d:boolean; historical:boolean; pointList:boolean; barrierList:boolean; pageSize:ReportPageSize;pageOrientation?:ReportOrientation }
export interface ReportRoute { result:RouteResult; color:string }
export type ReportAnalysis=
  |{kind:'route-simple';title:string;includeTechnicalPage?:boolean}
  |{kind:'route-comparison';title:string;includeIndividualPages?:boolean;includeProfilePages?:boolean;individualMaps?:Record<string,string>;contourCaption?:string}
  |{kind:'multiroute';title:string;includeTechnicalPage?:boolean}
  |{kind:'multipoint';title:string;matrix:(number|null)[][];unit:string;includeMatrixPage?:boolean;includeTechnicalPage?:boolean}
  |{kind:'isochrones';title:string;result:IsochroneResult;surfaceImage?:string;includeTechnicalPage?:boolean}
  |{kind:'contours';title:string;result:ContourResult;includeTechnicalPage?:boolean}
  |{kind:'corridor';title:string;result:LcpCorridorResult;surfaceImage?:string;includeTechnicalPage?:boolean}
  |{kind:'viewshed';title:string;result:ViewshedObserverResult;surfaceImage?:string;limitation:string;includeTechnicalPage?:boolean};
export interface ReportMapLegendEntry {label:string;color:string;symbol?:'line'|'circle'|'triangle';dashed?:boolean}
export interface ReportMapPage {id:string;title:string;image:string;attribution?:string;legend?:ReportMapLegendEntry[];legendColumns?:1|2}
export interface ReportTextPage {id:string;title:string;lines:string[]}
/** Stable id from the shared layer catalog, or `terrain3d`. */
export type ReportMapBase=string;
export type ReportOverlayPosition='top-left'|'top-right'|'bottom-left'|'bottom-right';
export interface RouteSimpleReportSettings {
  base:ReportMapBase;includeOutbound:boolean;includeReturn:boolean;includeAlternatives:boolean;includeTechnicalPage:boolean;
  showContours?:boolean;showPoints:boolean;showPointLabels:boolean;showBarriers:boolean;showCorridors:boolean;showCrossings:boolean;showPointsOfInterest:boolean;showApproximationRoutes?:boolean;contourStyle?:ReportContourStyle;
  showNorthArrow:boolean;northPosition:ReportOverlayPosition;showScale:boolean;scalePosition:ReportOverlayPosition;scaleM:'auto'|number;
  inclination:number;orientation:number;
}
export interface RouteComparisonReportSettings {
  base:ReportMapBase;selectedModels:string[];includeCombinedMap:boolean;includeIndividualPages:boolean;includeProfilePages:boolean;
  showContours?:boolean;showPoints:boolean;showPointLabels:boolean;showBarriers:boolean;showCorridors:boolean;showCrossings:boolean;showPointsOfInterest:boolean;showApproximationRoutes?:boolean;contourStyle?:ReportContourStyle;
  showNorthArrow:boolean;northPosition:ReportOverlayPosition;showScale:boolean;scalePosition:ReportOverlayPosition;scaleM:'auto'|number;
  inclination:number;orientation:number;
}
export interface MultipointReportSettings {
  base:ReportMapBase;includeCombinedMap:boolean;includeMatrixPage:boolean;includeAlternatives:boolean;includeTechnicalPage:boolean;
  showContours?:boolean;showPoints:boolean;showPointLabels:boolean;showBarriers:boolean;showCorridors:boolean;showCrossings:boolean;showPointsOfInterest:boolean;showApproximationRoutes?:boolean;contourStyle?:ReportContourStyle;
  showNorthArrow:boolean;northPosition:ReportOverlayPosition;showScale:boolean;scalePosition:ReportOverlayPosition;scaleM:'auto'|number;
  inclination:number;orientation:number;
}
export interface ReportContourStyle {color:string;width:number;majorColor:string;majorWidth:number;majorInterval:0|3|5|10;mode?:'topographic'|'elevation';intervalM?:number;showElevationLabels?:boolean;labelEvery?:3|5|10;showPeaks?:boolean}
export const DEFAULT_REPORT_CONTOUR_STYLE:ReportContourStyle={color:'#111111',width:1.3,majorColor:'#d04a00',majorWidth:2.6,majorInterval:5,showElevationLabels:true,labelEvery:5,showPeaks:true};
export interface CorridorReportSettings {
  base:ReportMapBase;includeCombinedMap:boolean;includeTechnicalPage:boolean;surfaceOpacity:number;
  showContours?:boolean;showPoints:boolean;showPointLabels:boolean;showBarriers:boolean;showCorridors:boolean;showCrossings:boolean;showPointsOfInterest:boolean;showApproximationRoutes?:boolean;
  contourStyle?:ReportContourStyle;
  showNorthArrow:boolean;northPosition:ReportOverlayPosition;showScale:boolean;scalePosition:ReportOverlayPosition;scaleM:'auto'|number;
  inclination:number;orientation:number;
}
export interface ViewshedReportSettings extends CorridorReportSettings {observerId:string}
export interface ReportComposition {pageSize:ReportPageSize;items:{id:string;title:string;kind:'map'|'section'}[];routeSimple?:RouteSimpleReportSettings;routeComparison?:RouteComparisonReportSettings;multipoint?:MultipointReportSettings;multiroute?:MultipointReportSettings;corridor?:CorridorReportSettings;isochrones?:CorridorReportSettings;contours?:CorridorReportSettings;viewshed?:ViewshedReportSettings}
interface ReportInput {
  options:ReportOptions; points:GeoPoint[]; barriers:Barrier[]; routes:ReportRoute[]; extent:StudyExtent;
  corridors?:PreferredCorridor[]; crossings?:EnabledCrossing[]; pointsOfInterest?:PointOfInterest[];
  navigationImage?:string; pnoaImage?:string; terrain3dImage?:string; historicalImage?:string;
  navigationLabel:string; historicalLabel:string; resolution:number; paletteLabel:string; rasterSize?:[number,number];
  areaKm2:number; cells:number; mdtSource:string; connectivity:Connectivity; criticalSlopePercent:number;
  analysis?:ReportAnalysis; projectName?:string; generatedAt?:string; rasterCrs?:string;
  resultAttributions?:readonly string[];
  navigationAttribution?:string;
  historicalAttribution?:string;
  customMapPages?:ReportMapPage[];
  customTextPages?:ReportTextPage[];
  customOrder?:string[];
}

/** Shared typographic scale for every PDF report, expressed in points. */
export const REPORT_TYPOGRAPHY={brand:17,pageTitle:13,pageSubtitle:8.5,sectionTitle:10.5,body:9,table:8,caption:7.5,legend:7.5} as const;
/** Measurements are millimetres, except lineHeightFactor which is relative to the font size. */
export const REPORT_LAYOUT={margin:14,headerHeight:22,contentTop:30,footerBaseline:6,lineHeightFactor:1.3,bodyLeading:4.2,tableLeading:3.7,captionLeading:3.45,sectionGap:7,rowGap:5.8,bottomReserve:17} as const;
const MARGIN=REPORT_LAYOUT.margin;
const translateItalianReport=createCatalogTranslator(italianCatalog);
const translateReportText=(value:string)=>{
  const language=locale();
  let output=language==='it-IT'?translateItalianReport(value):translateText(value);
  if(language==='en-GB')output=output.replace(/\bPunto (\d+)\b/g,'Point $1').replace(/^Leyenda cartográfica$/,'Map legend').replace(/Continuación ·/g,'Continued ·').replace(/\b(?:Routes|Rutas) Multipunto\b/g,'Multipoint routes').replace(/\b(?:Routes|Rutas) Multirruta\b/g,'Multi-route itineraries').replace(/^Digital Model:/,'Elevation model and source:').replace(/GeoTIFF real · cálculo acumulado multi-origen/g,'Actual GeoTIFF · multi-origin cumulative cost calculation').replace(/GeoTIFF\/MDT (?:cargado|caricato)(?: · marching squares)?/gi,'loaded GeoTIFF digital elevation model (DEM)').replace(/\bequidistancia\b/gi,'contour interval').replace(/\b(?:Altitud|Cota)\b/gi,'Elevation').replace(/\borigen\b/g,'origin');
  if(language==='it-IT')output=output.replace(/GeoTIFF\/MDT (?:cargado|caricato)(?: · marching squares)?/gi,'modello digitale del terreno (MDT) caricato da GeoTIFF').replace(/\b(?:Altitud|Cota)\b/gi,'Quota altimetrica').replace(/(?<!algoritmo )marching squares/gi,'algoritmo marching squares');
  if(language==='it-IT')output=output.replace(/\b(?:Rutas|Routes) Multipunto\b/g,'Percorsi multipunto').replace(/\b(?:Rutas|Routes) Multirruta\b/g,'Itinerari multipercorso');
  return output;
};
function imageFormat(data:string){return data.startsWith('data:image/jpeg')?'JPEG':'PNG'}
function fitSingleLine(pdf:jsPDF,text:string,maxWidth:number){if(pdf.getTextWidth(text)<=maxWidth)return text;const ellipsis='…';let end=text.length;while(end&&pdf.getTextWidth(`${text.slice(0,end)}${ellipsis}`)>maxWidth)end--;return `${text.slice(0,end).trimEnd()}${ellipsis}`}
function drawReportLogo(pdf:jsPDF,x:number,y:number,size:number){
  const s=size/200,point=(px:number,py:number)=>[x+px*s,y+py*s];
  pdf.setFillColor(16,24,20);pdf.roundedRect(x,y,size,size,size*.25,size*.25,'F');
  pdf.setFillColor(49,71,61);
  pdf.path([
    {op:'m',c:point(27,165)},{op:'l',c:point(27,132)},
    {op:'c',c:[...point(42,127),...point(50,127),...point(60,116)]},
    {op:'c',c:[...point(70,105),...point(77,102),...point(87,107)]},
    {op:'c',c:[...point(97,112),...point(102,122),...point(113,112)]},
    {op:'c',c:[...point(124,102),...point(128,83),...point(141,82)]},
    {op:'c',c:[...point(155,81),...point(162,90),...point(173,67)]},
    {op:'l',c:point(173,174)},{op:'l',c:point(27,174)},{op:'h'}
  ]).fill();
  pdf.setDrawColor(215,255,85);pdf.setLineWidth(size*9.5/200);pdf.setLineCap('round');pdf.setLineJoin('round');
  pdf.path([
    {op:'m',c:point(43,91)},{op:'c',c:[...point(55,103),...point(67,114),...point(79,125)]},
    {op:'c',c:[...point(94,119),...point(98,101),...point(112,97)]},
    {op:'c',c:[...point(126,93),...point(130,76),...point(142,69)]},
    {op:'c',c:[...point(149,63),...point(151,59),...point(155,55)]}
  ]).stroke();
  for(const [cx,cy,color] of [[43,91,[85,201,246]],[79,125,[244,185,66]],[155,55,[249,119,112]]] as const){
    pdf.setFillColor(color[0],color[1],color[2]);const [px,py]=point(cx,cy);pdf.circle(px,py,size*12/200,'F');
  }
}
function addReportBrandName(pdf:jsPDF,x:number,baseline:number){
  if(typeof document!=='undefined'){
    const canvas=document.createElement('canvas'),scale=4,cssHeight=35;
    let context=canvas.getContext('2d');
    if(context){
      context.font='700 19px Inter, ui-sans-serif, system-ui, sans-serif';
      if('letterSpacing' in context)context.letterSpacing='0.3px';
      const cssWidth=Math.ceil(context.measureText('ViaSpania').width+2);
      canvas.width=cssWidth*scale;canvas.height=cssHeight*scale;
      context=canvas.getContext('2d');
      if(context){
        context.scale(scale,scale);context.font='700 19px Inter, ui-sans-serif, system-ui, sans-serif';context.fillStyle='#ebf1ed';context.textBaseline='alphabetic';
        if('letterSpacing' in context)context.letterSpacing='0.3px';
        context.fillText('ViaSpania',0,27);
        pdf.addImage(canvas.toDataURL('image/png'),'PNG',x,baseline-27*25.4/96,cssWidth*25.4/96,cssHeight*25.4/96,'viaspania-report-brand','FAST');
        return cssWidth*25.4/96;
      }
    }
  }
  pdf.setFont('helvetica','bold');pdf.setFontSize(14.25);pdf.setCharSpace(.225);pdf.setTextColor(235,241,237);pdf.text('ViaSpania',x,baseline);const width=pdf.getTextWidth('ViaSpania')+.225*8;pdf.setCharSpace(0);return width;
}
function pageHeader(pdf:jsPDF,title:string,subtitle?:string){const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),portrait=pageH>pageW,baseline=13,logoSize=14,brandX=MARGIN+logoSize+4,frameX=MARGIN-2,frameY=2,framePadding=2;pdf.setFillColor(10,23,17);pdf.rect(0,0,pageW,portrait?30:REPORT_LAYOUT.headerHeight,'F');drawReportLogo(pdf,MARGIN,4,logoSize);const brandWidth=addReportBrandName(pdf,brandX,baseline);pdf.setDrawColor(49,71,61);pdf.setLineWidth(.75);pdf.roundedRect(frameX,frameY,brandX+brandWidth+framePadding-frameX,18,2.5,2.5,'S');pdf.setFont('helvetica','normal');pdf.setTextColor(235,241,237);pdf.setFontSize(REPORT_TYPOGRAPHY.pageTitle);const subtitleWidth=subtitle?58:0,titleX=portrait?MARGIN:MARGIN+48,titleWidth=portrait?pageW-MARGIN*2:pageW-titleX-MARGIN-subtitleWidth-5;pdf.text(fitSingleLine(pdf,title,titleWidth),titleX,portrait?26:baseline);if(subtitle){pdf.setTextColor(155,169,160);pdf.setFontSize(REPORT_TYPOGRAPHY.pageSubtitle);pdf.text(fitSingleLine(pdf,subtitle,subtitleWidth),pageW-MARGIN,baseline,{align:'right'})}pdf.setFont('helvetica','normal');pdf.setTextColor(25,35,30)}
export function imageContainRect(imageWidth:number,imageHeight:number,x:number,y:number,width:number,height:number){const ratio=Math.min(width/imageWidth,height/imageHeight),drawWidth=imageWidth*ratio,drawHeight=imageHeight*ratio;return{x:x+(width-drawWidth)/2,y:y+(height-drawHeight)/2,width:drawWidth,height:drawHeight}}
function addImageContained(pdf:jsPDF,data:string,x:number,y:number,width:number,height:number){const properties=pdf.getImageProperties(data),rect=imageContainRect(properties.width,properties.height,x,y,width,height);pdf.setFillColor(242,244,242);pdf.rect(x,y,width,height,'F');pdf.addImage(data,imageFormat(data),rect.x,rect.y,rect.width,rect.height,undefined,'FAST')}
function project(coordinate:[number,number],extent:StudyExtent,x:number,y:number,w:number,h:number){const [px,py]=reportMapPoint(coordinate,extent,w,h);return [x+px,y+py] as const}
function drawRoutes(pdf:jsPDF,routes:ReportRoute[],extent:StudyExtent,x:number,y:number,w:number,h:number){pdf.setLineCap('round');pdf.setLineJoin('round');for(const route of routes){const coordinates=route.result.coordinates??[];if(coordinates.length<2)continue;const points=coordinates.map(point=>project(point,extent,x,y,w,h));pdf.setDrawColor(8,20,23);pdf.setLineWidth(2.7);for(let i=1;i<points.length;i++)pdf.line(...points[i-1],...points[i]);pdf.setDrawColor(route.color);pdf.setLineWidth(1.25);for(let i=1;i<points.length;i++)pdf.line(...points[i-1],...points[i])}}
function drawPointsAndBarriers(pdf:jsPDF,input:ReportInput,x:number,y:number,w:number,h:number){for(const barrier of input.barriers){pdf.setDrawColor(barrier.generatedBy==='magic-ocean'?CONSTRAINT_COLORS.oceanBarrier:barrier.kind==='absolute'?'#ff3030':'#ffb340');pdf.setLineWidth(1);for(const part of barrierParts(barrier)){const points=part.map(point=>project(point,input.extent,x,y,w,h));for(let i=1;i<points.length;i++)pdf.line(...points[i-1],...points[i])}}for(const point of input.points){const [px,py]=project([point.lon,point.lat],input.extent,x,y,w,h);pdf.setFillColor(pointColor(input.points.indexOf(point)));pdf.setDrawColor('#ffffff');pdf.circle(px,py,2,'FD')}}
function routeConfiguration(route:RouteResult,input:ReportInput){const settings=route.settings;const connectivity=settings?.connectivity??input.connectivity;const parts=[`${connectivity} vecinos`];if(route.requiredWaypoints?.length)parts.push(`Paso obligatorio: ${[...new Set(route.requiredWaypoints.map(point=>point.name))].join(", ")}`);if(route.rank)parts.unshift(`ruta subóptima · rango ${route.rank}${route.rank>1&&route.costIncreasePercent!=null?` · +${route.costIncreasePercent.toFixed(1)} % · ${route.sharedCellsPercent?.toFixed(0)??'—'} % compartido`:''}`);if(route.model==='wheeled')parts.push(`pendiente crítica ${settings?.criticalSlopePercent??input.criticalSlopePercent}%`);if(route.model==='ardigo'&&settings?.ardigoSpeedMs)parts.push(`velocidad ${settings.ardigoSpeedMs.toFixed(1)} m/s`);if(route.model==='irmischer-clarke')parts.push(`Irmischer–Clarke · ${settings?.irmischerSex==='female'?'femenino':'masculino'} · ${settings?.irmischerContext==='off-path'?'campo a través':'por caminos'}`);return parts.join(' · ')}
function connectivityDetail(value:Connectivity){return value===4?'movimientos cardinales, sin diagonales':value===8?'movimientos cardinales y diagonales inmediatas':'incluye conexiones extendidas para aumentar las direcciones posibles'}
function reportNumber(value:number,digits:number){return value.toLocaleString(locale(),{minimumFractionDigits:digits,maximumFractionDigits:digits,useGrouping:false})}
export function translateInventoryText(value:string){
  const language=locale(),translated=translateReportText(value);
  const replacements:readonly (readonly [RegExp,string])[]=language==='it-IT'?[ [/Área de estudio/g,'Area di studio'],[/Elementos espaciales y configuración del análisis/g,'Elementi spaziali e configurazione dell’analisi'],[/Máscara marítima \(sí\)/g,'Maschera marina (sì)'],[/Máscara marítima \(no\)/g,'Maschera marina (no)'],[/Puntos seleccionados/g,'Punti selezionati'],[/Barreras terrestres/g,'Barriere terrestri'],[/Facilitadores/g,'Facilitatori'],[/Punto de interés/g,'Punto di interesse'],[/Punto (\d+)/g,'Punto $1'],[/función/g,'ruolo'],[/multiplicador/g,'moltiplicatore'],[/multipunto/g,'multipunto'],[/inicio/g,'inizio'],[/final/g,'fine'],[/cota/g,'quota altimetrica'],[/CRS de coordenadas/g,'CRS delle coordinate'],[/Orden/g,'Ordine'],[/longitud(?![a-z])/g,'longitudine'],[/latitud(?![a-z])/g,'latitudine'],[/grados decimales/g,'gradi decimali'],[/Precisión exportada/g,'Precisione esportata'],[/decimales/g,'decimali'],[/Cotas/g,'Quote altimetriche'],[/no disponibles para los elementos de entrada/g,'non disponibili per gli elementi di input'],[/no registrada/g,'non registrata'],[/Ninguno/g,'Nessuno'],[/Ninguna/g,'Nessuna'],[/Barrera/g,'Barriera'],[/Corredor/g,'Corridoio'],[/Cruce/g,'Attraversamento'],[/absoluta/g,'assoluta'],[/penalización/g,'penalità'],[/ancho/g,'larghezza'],[/coste/g,'costo'],[/tipo/g,'tipo'],[/obligatorio/g,'obbligatorio'],[/barrera asociada/g,'barriera associata'],[/categoría/g,'categoria'],[/modo/g,'modalità'],[/radio/g,'raggio'],[/atracción/g,'attrazione'],[/vértices/g,'vertici'],[/ninguna/g,'nessuna'],[/permeable/g,'permeabile'],[/origen/g,'origine'],[/destino/g,'destinazione'],[/bridge/g,'ponte'],[/ford/g,'guado'],[/tunnel/g,'galleria'],[/discount/g,'sconto'],[/attraction/g,'attrazione'],[/penalty/g,'penalità'] ]:[ [/Área de estudio/g,'Study area'],[/Elementos espaciales y configuración del análisis/g,'Spatial elements and analysis configuration'],[/Máscara marítima \(sí\)/g,'Marine mask (yes)'],[/Máscara marítima \(no\)/g,'Marine mask (no)'],[/Puntos seleccionados/g,'Selected points'],[/Barreras terrestres/g,'Land barriers'],[/Facilitadores/g,'Facilitators'],[/Punto de interés/g,'Point of interest'],[/Punto (\d+)/g,'Point $1'],[/función/g,'role'],[/multiplicador/g,'multiplier'],[/multipunto/g,'multipoint'],[/inicio/g,'start'],[/final/g,'end'],[/cota/g,'elevation'],[/CRS de coordenadas/g,'Coordinate CRS'],[/Orden/g,'Order'],[/longitud(?![a-z])/g,'longitude'],[/latitud(?![a-z])/g,'latitude'],[/grados decimales/g,'decimal degrees'],[/Precisión exportada/g,'Export precision'],[/decimales/g,'decimal places'],[/Cotas/g,'Elevations'],[/no disponibles para los elementos de entrada/g,'unavailable for input elements'],[/no registrada/g,'not recorded'],[/Ninguno/g,'None'],[/Ninguna/g,'None'],[/Barrera/g,'Barrier'],[/Corredor/g,'Corridor'],[/Cruce/g,'Crossing'],[/absoluta/g,'absolute'],[/penalización/g,'penalty'],[/ancho/g,'width'],[/coste/g,'cost'],[/tipo/g,'type'],[/obligatorio/g,'required'],[/barrera asociada/g,'associated barrier'],[/categoría/g,'category'],[/modo/g,'mode'],[/radio/g,'radius'],[/atracción/g,'attraction'],[/vértices/g,'vertices'],[/ninguna/g,'none'],[/permeable/g,'permeable'],[/origen/g,'origin'],[/destino/g,'destination'],[/bridge/g,'bridge'],[/ford/g,'ford'],[/tunnel/g,'tunnel'],[/discount/g,'discount'],[/attraction/g,'attraction'],[/penalty/g,'penalty']];
  let output=replacements.reduce((text,[pattern,replacement])=>text.replace(pattern,replacement),translated);
  if(language==='en-GB')output=output.replace(/Referencia de (?:coordenadas|coordinates)/g,'Coordinate reference');
  if(language==='it-IT')output=output.replace(/Referencia de (?:coordenadas|coordinates)/g,'Riferimento delle coordinate');
  if(language==='en-GB')output=output.replace(/\brole:\s*(?:multipoint|multypeint|multipunto)\b/gi,'role: multipoint');
  if(language==='it-IT')output=output.replace(/\bruolo:\s*(?:multipoint|multypeint|multipunto)\b/gi,'ruolo: multipunto');
  if(language==='en-GB'||language==='it-IT')return output.replaceAll('«','“').replaceAll('»','”').replace(/Máscara marítima/g,language==='it-IT'?'Maschera marina':'Marine mask');
  return output;
}
function inventoryCoordinate([lon,lat]:readonly [number,number]){return `${lon.toFixed(8)}, ${lat.toFixed(8)} (EPSG:4326)`}
interface ReportInventorySection {title:string;rows:string[]}
function spatialInventory(input:ReportInput):ReportInventorySection[]{
  const points=input.points.map(point=>`Punto ${point.id} «${point.name}» · función: ${point.role} · ${inventoryCoordinate([point.lon,point.lat])} · cota: no registrada`);
  const terrestrial=input.barriers.filter(item=>item.generatedBy!=='magic-ocean'),marine=input.barriers.filter(item=>item.generatedBy==='magic-ocean');
  const barrierRows=(items:Barrier[])=>items.flatMap((barrier,index)=>barrierParts(barrier).map((part,partIndex)=>`${index+1}.${partIndex+1} «${barrier.name?.trim()||'Barrera'}» · ${barrier.kind==='absolute'?'absoluta':`penalización ×${reportNumber(barrier.value,4)}`} · vértices ${part.map(inventoryCoordinate).join(' ; ')}`));
  const facilitators=[...(input.corridors??[]).map(item=>`Corredor ${item.id} «${item.name}» · ancho ${reportNumber(item.widthM,3)} m · multiplicador ${reportNumber(item.costMultiplier,6)} · vértices ${item.coordinates.map(inventoryCoordinate).join(' ; ')}`),...(input.crossings??[]).map(item=>`Cruce ${item.id} «${item.name}» · tipo ${item.kind} · multiplicador ${reportNumber(item.crossingCostMultiplier,6)} · obligatorio ${item.required?'sí':'no'} · barrera asociada ${item.barrierId??'ninguna'} · vértices ${item.coordinates.map(inventoryCoordinate).join(' ; ')}`),...(input.pointsOfInterest??[]).map(item=>`Punto de interés ${item.id} «${item.name}» · categoría ${item.category} · modo ${item.mode} · radio ${reportNumber(item.influenceRadiusM,3)} m · atracción ${reportNumber(item.attraction,6)} · ${inventoryCoordinate(item.coordinate)}`)];
  return [
    {title:'Referencia de coordenadas',rows:['CRS: EPSG:4326 (WGS 84) · Orden: longitud, latitud; grados decimales · Precisión exportada: 8 decimales · Cotas: no disponibles para los elementos de entrada.']},
    {title:'Área de estudio',rows:[`BBOX (W, S, E, N) · EPSG:4326 (WGS 84): ${input.extent.map(value=>value.toFixed(8)).join(', ')}`]},
    {title:`Puntos seleccionados (${points.length})`,rows:points.length?points:['Ninguno']},
    {title:`Facilitadores (${facilitators.length})`,rows:facilitators.length?facilitators:['Ninguno']},
    {title:`Barreras terrestres (${terrestrial.length})`,rows:terrestrial.length?barrierRows(terrestrial):['Ninguna']},
    {title:`Máscara marítima (${marine.length?'sí':'no'})`,rows:[]}
  ];
}
function calculationParameterRows(route:RouteResult,input:ReportInput){const settings=route.settings,connectivity=settings?.connectivity??input.connectivity,critical=route.model==='wheeled'?settings?.criticalSlopePercent??input.criticalSlopePercent:null,speed=route.model==='ardigo'?settings?.ardigoSpeedMs:null;return[
  `Conectividad: ${connectivity} vecinos (${connectivityDetail(connectivity)})`,
  critical==null?'Pendiente crítica: no utilizada':`Pendiente crítica: ${reportNumber(critical,1)} %`,
  route.model!=='ardigo'?'Velocidad configurable: no aplicable':speed==null?'Velocidad configurable: no registrada':`Velocidad configurable: ${reportNumber(speed,2)} m/s`,
  ...(route.model==='irmischer-clarke'?[`Variante Irmischer–Clarke: ${settings?.irmischerSex==='female'?'femenino':'masculino'} · ${settings?.irmischerContext==='off-path'?'campo a través':'por caminos'}`]:[]),
  `Modelo Digital: ${resultCredit(route)}`
]}
export function routeTechnicalSections(route:RouteResult,input:ReportInput){
  const profile=MODELS[route.model];
  return [
    {title:`Perfil de desplazamiento · ${profile.name}`,rows:[`Familia: ${profile.family} · Magnitud de coste: ${profile.unit} · Direccional: ${profile.directional?'sí (ida y vuelta pueden diferir)':'no'}`,`Descripción: ${profile.description}`,`Referencia: ${profile.citation}`]},
    {title:'Configuración del cálculo',rows:[`Dirección: ${route.direction}`,...calculationParameterRows(route,input)]},
    {title:'Resultado',rows:[`Dirección: ${route.direction}`,`Distancia: ${reportNumber(route.distanceM,1)} m`,`Coste acumulado: ${reportNumber(route.cost,2)} ${route.unit}`,`Ascenso: ${reportNumber(route.ascentM,1)} m`,`Descenso: ${reportNumber(route.descentM,1)} m`,`Vértices: ${route.coordinates?.length??0}`]}
  ];
}
const TECHNICAL_TEXT_SIZE=REPORT_TYPOGRAPHY.body;
function writeLines(pdf:jsPDF,lines:string[],x:number,y:number,leading:number){pdf.text(lines,x,y,{lineHeightFactor:REPORT_LAYOUT.lineHeightFactor});return Math.max(leading,lines.length*leading)}
function drawTechnicalTitle(pdf:jsPDF,title:string,x:number,y:number){pdf.setFont('helvetica','bold');pdf.setFontSize(REPORT_TYPOGRAPHY.sectionTitle);pdf.setTextColor(25,35,30);pdf.text(fitSingleLine(pdf,title,pdf.internal.pageSize.getWidth()-x-MARGIN),x,y);pdf.setFont('helvetica','normal')}
function drawInventorySectionHeader(pdf:jsPDF,title:string,x:number,y:number,width:number){pdf.setFillColor(241,244,241);pdf.roundedRect(x,y-4.5,width,8,1,1,'F');pdf.setFillColor(216,255,85);pdf.rect(x,y-4.5,1.4,8,'F');pdf.setFont('helvetica','bold');pdf.setFontSize(REPORT_TYPOGRAPHY.sectionTitle);pdf.setTextColor(25,35,30);pdf.text(fitSingleLine(pdf,title,width-8),x+4,y+0.8);pdf.setFont('helvetica','normal');return y+10}
function drawTechnicalRows(pdf:jsPDF,rows:string[],x:number,startY:number,maxWidth:number,_legacyRowGap?:number){
  let y=startY;
  pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.setTextColor(25,35,30);
  for(const row of rows){
    let cursor=x;
    for(const [index,part] of row.split(' · ').entries()){
      const separator=part.indexOf(':');
      const runs=[{text:translateReportText(part),bold:false}];
      if(index)runs.unshift({text:' · ',bold:false});
      for(const run of runs){
        pdf.setFont('helvetica',run.bold?'bold':'normal');
        let buffer='',bufferX=cursor;
        const flush=()=>{if(buffer)pdf.text(buffer,bufferX,y);buffer='';bufferX=cursor};
        for(const word of run.text.match(/\s+|\S+/g)??[]){
          if(!word.trim()&&cursor===x)continue;
          const width=pdf.getTextWidth(word);
          if(cursor+width>x+maxWidth&&cursor>x){flush();y+=REPORT_LAYOUT.bodyLeading;cursor=x;bufferX=x;if(!word.trim())continue}
          const chunks=width>maxWidth?pdf.splitTextToSize(word,maxWidth) as string[]:[word];
          for(const [chunkIndex,chunk] of chunks.entries()){
            if(chunkIndex){flush();y+=REPORT_LAYOUT.bodyLeading;cursor=x;bufferX=x}
            buffer+=chunk;cursor+=pdf.getTextWidth(chunk);
          }
        }
        flush();
      }
    }
    y+=REPORT_LAYOUT.rowGap;
  }
  pdf.setFont('helvetica','normal');return y;
}
function drawLegend(pdf:jsPDF,input:ReportInput,startY:number,maxRows=12){pdf.setFont('helvetica','bold');pdf.setFontSize(REPORT_TYPOGRAPHY.sectionTitle);pdf.text('Resultados y configuración',MARGIN,startY);pdf.setFont('helvetica','normal');let y=startY+REPORT_LAYOUT.sectionGap;for(const route of input.routes.slice(0,maxRows)){pdf.setDrawColor(route.color);pdf.setLineWidth(2);pdf.line(MARGIN,y-1,MARGIN+10,y-1);pdf.setTextColor(25,35,30);pdf.setFontSize(REPORT_TYPOGRAPHY.table);const result=route.result,lines=pdf.splitTextToSize(`${MODELS[result.model].name} · coste ${result.cost.toFixed(2)} ${result.unit} · distancia ${result.distanceM.toFixed(1)} m · ${routeConfiguration(result,input)}`,pdf.internal.pageSize.getWidth()-MARGIN*2-14) as string[];y+=Math.max(REPORT_LAYOUT.rowGap,writeLines(pdf,lines,MARGIN+14,y,REPORT_LAYOUT.tableLeading))}return y}
function addNewPage(pdf:jsPDF,title:string,subtitle:string|undefined,format:ReportPageSize,orientation:ReportOrientation){pdf.addPage(format,orientation);pageHeader(pdf,title,subtitle)}
export function translateMapLegendLabel(label:string){
 const language=locale(),translated=translateReportText(label);
 const replacements:readonly (readonly [RegExp,string])[]=language==='it-IT'?[
  [/^(?:Corredor|Corridor) preferente\b/i,'Corridoio preferenziale'],[/^(?:Barrera absoluta|Barrier absolute)\b/i,'Barriera assoluta'],[/^(?:Ruta|Route|Approach) de aproximación\b/i,'Percorso di avvicinamento'],[/^Ruta calculada\b/i,'Percorso calcolato'],[/^Barrera penalizada\b/i,'Barriera con penalità'],[/^Máscara marítima\b/i,'Maschera marina'],[/^Facilitador · puente o paso\b/i,'Facilitatore · ponte o guado'],[/^Punto de interés\b/i,'Punto di interesse'],[/^Punto ·/i,'Punto ·']
 ]:[
  [/^(?:Corredor|Corridor) preferente\b/i,language==='en-GB'?'Preferred corridor':'Corredor preferente'],[/^(?:Barrera absoluta|Barrier absolute)\b/i,language==='en-GB'?'Absolute barrier':'Barrera absoluta'],[/^(?:Ruta|Route) de aproximación\b/i,language==='en-GB'?'Approach route':'Ruta de aproximación'],[/^Ruta calculada\b/i,language==='en-GB'?'Calculated route':'Ruta calculada'],[/^Barrera penalizada\b/i,language==='en-GB'?'Penalized barrier':'Barrera penalizada'],[/^Máscara marítima\b/i,language==='en-GB'?'Marine mask':'Máscara marítima'],[/^Facilitador · puente o paso\b/i,language==='en-GB'?'Facilitator · bridge or ford':'Facilitador · puente o paso'],[/^Punto de interés\b/i,language==='en-GB'?'Point of interest':'Punto de interés'],[/^Punto ·/i,language==='en-GB'?'Point ·':'Punto ·']
 ];
 let output=replacements.reduce((text,[pattern,replacement])=>text.replace(pattern,replacement),translated);
 if(language==='it-IT')return output.replace(/\borigen\b/g,'origine').replace(/\((\d+) (?:ruta\(s\)|route\(s\)|routes?)\)/g,(_match,count:string)=>`(${count} ${count==='1'?'percorso':'percorsi'})`).replace(/^Percorso di avvicinamento · Percorso di avvicinamento\s*(\d+)$/i,'Percorso di avvicinamento $1');
 if(language==='en-GB')return output.replace(/\((\d+) route\(s\)\)/g,(_match,count:string)=>`(${count} ${count==='1'?'route':'routes'})`).replace(/^Approach route · (?:Approach route|Approximation route)\s*(\d+)$/i,'Approach route $1');
 return output.replace(/\((\d+) ruta\(s\)\)/g,(_match,count:string)=>`(${count} ${count==='1'?'ruta':'rutas'})`).replace(/^Ruta de aproximación · Ruta de aproximación\s*(\d+)$/i,'Ruta de aproximación $1');
}
function drawMapLegendPage(pdf:jsPDF,entries:ReportMapLegendEntry[],pageW:number,pageH:number,title:string,format:ReportPageSize,orientation:ReportOrientation){
 if(!entries.length)return;
 const leftX=MARGIN+5,columnGap=12,columnWidth=(pageW-2*MARGIN-10-columnGap)/2,textInset=13,textWidth=columnWidth-textInset,maxY=pageH-18,startY=orientation==='portrait'?39:32;
 const prepared=entries.map(entry=>{const lines=pdf.splitTextToSize(translateMapLegendLabel(entry.label),textWidth) as string[];return{entry,lines,height:Math.max(8,lines.length*4.2)+2}});
 const capacity=maxY-startY;let page=0,index=0;
 while(index<prepared.length){
  addNewPage(pdf,translateReportText('Leyenda cartográfica'),translateReportText(page?'Continuación · '+title:title),format,orientation);page++;
  pdf.setFont('helvetica','normal');pdf.setFontSize(REPORT_TYPOGRAPHY.legend);pdf.setTextColor(25,35,30);
  const remainingHeight=prepared.slice(index).reduce((total,item)=>total+item.height,0),leftBudget=remainingHeight<=capacity*2?Math.max(prepared[index].height,remainingHeight/2):capacity;
  const columns:[typeof prepared,typeof prepared]=[[],[]];let used=0;
  while(index<prepared.length&&(columns[0].length===0||used+prepared[index].height<=leftBudget)){const item=prepared[index++];columns[0].push(item);used+=item.height}
  used=0;
  while(index<prepared.length&&(columns[1].length===0||used+prepared[index].height<=capacity)){const item=prepared[index++];columns[1].push(item);used+=item.height}
  columns.forEach((columnItems,columnIndex)=>{let y=startY;const x=leftX+columnIndex*(columnWidth+columnGap);for(const {entry,lines,height} of columnItems){pdf.setDrawColor(entry.color);pdf.setFillColor(entry.color);pdf.setLineWidth(1.8);if(entry.symbol==='circle')pdf.circle(x+4.5,y+2,2,'FD');else if(entry.symbol==='triangle')pdf.triangle(x+4.5,y-0.5,x+7,y+4.5,x+2,y+4.5,'FD');else{if(entry.dashed)pdf.setLineDashPattern([1.5,1.1],0);pdf.line(x,y+2,x+9,y+2);if(entry.dashed)pdf.setLineDashPattern([],0)}pdf.text(lines,x+textInset,y+3,{lineHeightFactor:1.2});y+=height}});
 }
}

export function createProjectReport(input:ReportInput):Uint8Array{
  const format=input.options.pageSize??'a4',orientation=input.options.pageOrientation??'landscape',pdf=new jsPDF({unit:'mm',format,orientation,compress:true}),pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),contentW=pageW-MARGIN*2,portrait=orientation==='portrait';pdf.setFont('helvetica','normal');pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.setLineHeightFactor(REPORT_LAYOUT.lineHeightFactor);let hasPage=false;
  const normalPdfText=(value:string)=>translateReportText(value)
    .replaceAll('→',' -> ')
    .replace(/[\u00a0\u2007\u2009\u202f]/g,' ')
    .replace(/[−‐‑‒–—]/g,'-')
    .replaceAll('…','...');
  const originalSplit=pdf.splitTextToSize.bind(pdf),originalWidth=pdf.getTextWidth.bind(pdf),originalText=pdf.text.bind(pdf);
  pdf.splitTextToSize=((text:string|string[],...args:Parameters<typeof originalSplit> extends [unknown,...infer R]?R:never)=>originalSplit(Array.isArray(text)?text.map(normalPdfText).join("\n"):normalPdfText(text),...args)) as typeof pdf.splitTextToSize;
  pdf.getTextWidth=(text:string)=>originalWidth(normalPdfText(text));
  pdf.text=((text:string|string[],...args:unknown[])=>originalText(Array.isArray(text)?text.map(normalPdfText):normalPdfText(text),...(args as Parameters<typeof originalText> extends [unknown,...infer R]?R:never))) as typeof pdf.text;
  const begin=(title:string,subtitle?:string)=>{if(hasPage)addNewPage(pdf,title,subtitle,format,orientation);else{pageHeader(pdf,title,subtitle);hasPage=true}};
  const [west,south,east,north]=input.extent;
  const generatedAt=input.generatedAt??new Date().toISOString(),reportLocale=locale();
  if(input.options.navigation&&input.navigationImage){begin('Mapa de navegación',input.navigationLabel);const mapW=portrait?contentW:contentW*.66,mapY=portrait?34:26,mapH=portrait?pageH*.42:pageH-58,sideX=portrait?MARGIN:MARGIN+mapW+8,sideW=pageW-sideX-MARGIN,sideY0=portrait?mapY+mapH+8:31;addImageContained(pdf,input.navigationImage,MARGIN,mapY,mapW,mapH);drawTechnicalTitle(pdf,'Área de estudio y datos de entrada',sideX,sideY0);const rows=[`Extensión: ${input.areaKm2.toLocaleString(reportLocale,{maximumFractionDigits:3})} km²`,`Límites: ${west.toFixed(6)}, ${south.toFixed(6)} — ${east.toFixed(6)}, ${north.toFixed(6)}`,`Malla: ${input.cells.toLocaleString(reportLocale)} celdas${input.rasterSize?` · ${input.rasterSize[0]} × ${input.rasterSize[1]}`:''}`,`Resolución del raster actual del visor: ${input.resolution} m`,`Raster actual del visor: ${input.mdtSource}`,`Puntos seleccionados: ${input.points.length}`,`Barreras: ${input.barriers.length}`];let sideY=drawTechnicalRows(pdf,rows,sideX,sideY0+10,sideW);if(input.options.pointList){sideY+=REPORT_LAYOUT.sectionGap;drawTechnicalTitle(pdf,'Puntos',sideX,sideY);sideY+=REPORT_LAYOUT.sectionGap;pdf.setFontSize(REPORT_TYPOGRAPHY.caption);for(const point of input.points.slice(0,13)){const lines=pdf.splitTextToSize(`${input.points.indexOf(point)+1}. ${point.name} · ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}`,sideW) as string[];pdf.text(lines,sideX,sideY);sideY+=Math.max(5,lines.length*4.2)}}if(input.options.barrierList&&input.barriers.length&&sideY<pageH-28){sideY+=REPORT_LAYOUT.sectionGap;drawTechnicalTitle(pdf,'Barreras',sideX,sideY);sideY+=REPORT_LAYOUT.sectionGap;pdf.setFontSize(REPORT_TYPOGRAPHY.caption);for(const [index,barrier] of input.barriers.slice(0,5).entries()){const lines=pdf.splitTextToSize(`${index+1}. ${barrier.name?.trim()||`Barrera ${index+1}`} · ${barrier.kind==='absolute'?'Absoluta':`Penalización ×${barrier.value}`} · ${barrier.coordinates.length} vértices`,sideW) as string[];pdf.text(lines,sideX,sideY);sideY+=Math.max(5,lines.length*4.2)}}}
  if(input.options.pnoaOverview&&input.pnoaImage){begin('Ortofotografía PNOA y rutas',`${input.routes.length} perfil(es) calculado(s)`);const mapX=MARGIN,mapY=REPORT_LAYOUT.contentTop,mapW=contentW,mapH=pageH*.57,image=pdf.getImageProperties(input.pnoaImage),map=imageContainRect(image.width,image.height,mapX,mapY,mapW,mapH);addImageContained(pdf,input.pnoaImage,mapX,mapY,mapW,mapH);drawRoutes(pdf,input.routes,input.extent,map.x,map.y,map.width,map.height);drawPointsAndBarriers(pdf,input,map.x,map.y,map.width,map.height);drawLegend(pdf,input,mapY+mapH+11,10);pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.setTextColor(95,105,98);pdf.text('Ortofotografía: IGN/CNIG. Las rutas se calculan exclusivamente sobre el modelo de elevaciones y las barreras definidas.',MARGIN,pageH-11,{maxWidth:contentW});if(input.routes.length>10){addNewPage(pdf,'Leyenda completa de modelos',undefined,format,orientation);drawLegend(pdf,input,32,30)}}
  if(input.options.individualRoutePages&&input.pnoaImage)for(const route of input.routes){begin(`Perfil: ${MODELS[route.result.model].name}`,routeConfiguration(route.result,input));const x=MARGIN,y=REPORT_LAYOUT.contentTop,w=portrait?contentW:205,h=portrait?pageH*.38:137,image=pdf.getImageProperties(input.pnoaImage),map=imageContainRect(image.width,image.height,x,y,w,h);addImageContained(pdf,input.pnoaImage,x,y,w,h);drawRoutes(pdf,[route],input.extent,map.x,map.y,map.width,map.height);drawPointsAndBarriers(pdf,input,map.x,map.y,map.width,map.height);pdf.setFontSize(REPORT_TYPOGRAPHY.body);const detailsX=portrait?MARGIN:224,detailsTop=portrait?y+h+12:38,detailRows=[`Coste: ${route.result.cost.toFixed(2)} ${route.result.unit}`,`Distancia: ${route.result.distanceM.toFixed(1)} m`,`Ascenso: ${route.result.ascentM.toFixed(1)} m`,`Descenso: ${route.result.descentM.toFixed(1)} m`,`Conectividad: ${route.result.settings?.connectivity??input.connectivity}`,...(route.result.model==='wheeled'?[`Pendiente crítica: ${route.result.settings?.criticalSlopePercent??input.criticalSlopePercent}%`]:[])];detailRows.forEach((line,index)=>pdf.text(line,detailsX,detailsTop+index*8,{maxWidth:portrait?contentW:pageW-detailsX-MARGIN}));pdf.setDrawColor(route.color);pdf.setLineWidth(3);pdf.line(detailsX,detailsTop+detailRows.length*8+2,detailsX+Math.min(46,contentW),detailsTop+detailRows.length*8+2)}
  if(input.options.terrain3d&&input.terrain3dImage){begin('Visor 3D del terreno y las rutas',`Paleta ${input.paletteLabel}`);addImageContained(pdf,input.terrain3dImage,MARGIN,REPORT_LAYOUT.contentTop,contentW,pageH-55);pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.text(`Rutas representadas: ${input.routes.length}. Los colores corresponden a la leyenda de resultados de la ortofotografía.`,MARGIN,pageH-12,{maxWidth:contentW})}
  if(input.options.historical&&input.historicalImage){begin('Cartografía histórica',input.historicalLabel);addImageContained(pdf,input.historicalImage,MARGIN,REPORT_LAYOUT.contentTop,contentW,pageH-55);pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.setTextColor(90,100,94);pdf.text('Fuente: Instituto Geográfico Nacional de España / Centro Nacional de Información Geográfica.',MARGIN,pageH-12,{maxWidth:contentW})}
  const maps=input.customMapPages??[],texts=input.customTextPages??[],order=input.customOrder??[...maps.map(page=>page.id),...texts.map(page=>page.id)];for(const id of order){const map=maps.find(page=>page.id===id),text=texts.find(page=>page.id===id);if(map){begin(map.title);pdf.setFontSize(REPORT_TYPOGRAPHY.caption);const creditLines=map.attribution?pdf.splitTextToSize(map.attribution,contentW) as string[]:[],creditHeight=creditLines.length*3.5;if(creditHeight>pageH*.4)throw new Error('La atribución cartográfica es demasiado larga para esta página. Aumente el tamaño de papel.');addImageContained(pdf,map.image,MARGIN,REPORT_LAYOUT.contentTop,contentW,pageH-55-creditHeight);if(creditLines.length){pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.setTextColor(90,100,94);creditLines.forEach((line,index)=>pdf.text(line,MARGIN,pageH-14-creditHeight+index*3.5))}if(map.legend?.length)drawMapLegendPage(pdf,map.legend,pageW,pageH,map.title,format,orientation)}else if(text){begin(text.title,'Contenido seleccionado en el compositor');pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.setTextColor(25,35,30);let y=32;for(const line of text.lines){const wrapped=pdf.splitTextToSize(line,contentW) as string[],height=Math.max(REPORT_LAYOUT.rowGap,wrapped.length*REPORT_LAYOUT.bodyLeading);if(y+height>pageH-16)break;pdf.text(wrapped,MARGIN,y);y+=height}}}
  const analysis=input.analysis;
  const technicalPage=(route:ReportRoute,title:string)=>{
    begin(title);
    let y=34;
    for(const section of routeTechnicalSections(route.result,input)){
      const sectionTitle=translateReportText(section.title);
      if(y+10>pageH-REPORT_LAYOUT.bottomReserve){begin(title);y=34}
      y=drawInventorySectionHeader(pdf,sectionTitle,MARGIN,y,contentW);
      for(const row of section.rows){
        const translatedRow=translateReportText(row),rowWidth=contentW-4,height=(pdf.splitTextToSize(translatedRow,rowWidth) as string[]).length*REPORT_LAYOUT.bodyLeading+REPORT_LAYOUT.rowGap;
        if(y+height>pageH-REPORT_LAYOUT.bottomReserve){begin(title);y=34;y=drawInventorySectionHeader(pdf,translateReportText(`${section.title} (continuación)`),MARGIN,y,contentW)}
        y=drawTechnicalRows(pdf,[translatedRow],MARGIN+4,y,rowWidth)+1;
      }
      y+=2;
    }
  };
  if(analysis?.kind==='route-simple')for(const route of input.routes){
    if(analysis.includeTechnicalPage)technicalPage(route,'Perfil y parámetros · Ruta simple');
    else {begin('Resultado individual');drawTechnicalTitle(pdf,'Resultado',MARGIN,34);drawTechnicalRows(pdf,routeTechnicalSections(route.result,input)[2].rows,MARGIN,44,contentW)}
  }
  if(analysis?.kind==='route-comparison')for(const route of input.routes){
    const result=route.result,profile=MODELS[result.model];
    if(analysis.includeIndividualPages){
      begin(`Resultado individual · ${profile.name}`,result.direction);
      const map=analysis.individualMaps?.[result.model],mapY=32,mapW=portrait?contentW:contentW*.63,mapH=portrait?pageH*.36:pageH-62,resultX=portrait?MARGIN:map?MARGIN+contentW*.68:MARGIN,resultW=portrait?contentW:map?pageW-resultX-MARGIN:contentW*.47,configurationX=portrait?MARGIN:map?resultX:MARGIN+contentW*.53,configurationW=portrait?contentW:map?resultW:contentW*.47;
      if(map)addImageContained(pdf,map,MARGIN,mapY,mapW,mapH);if(map&&analysis.contourCaption){pdf.setFontSize(7);pdf.text(pdf.splitTextToSize(analysis.contourCaption,mapW),MARGIN,portrait?mapY+mapH+4:pageH-24);}
      const resultY=portrait?(map?mapY+mapH+14:38):34;pdf.setDrawColor(route.color);pdf.setLineWidth(4);pdf.line(resultX,resultY,resultX+34,resultY);
      drawTechnicalTitle(pdf,'Resultado calculado',resultX,resultY+14);
      const resultEnd=drawTechnicalRows(pdf,[`Coste acumulado: ${result.cost.toFixed(2)} ${result.unit}`,`Distancia: ${result.distanceM.toFixed(1)} m`,`Ascenso acumulado: ${result.ascentM.toFixed(1)} m`,`Descenso acumulado: ${result.descentM.toFixed(1)} m`,`Vértices del trazado: ${result.coordinates?.length??0}`,`Dirección: ${result.direction}`],resultX,resultY+26,resultW);
      if(!analysis.includeProfilePages){const configY=portrait?resultEnd+7:map?116:48;drawTechnicalTitle(pdf,'Configuración del cálculo',configurationX,configY);drawTechnicalRows(pdf,calculationParameterRows(result,input),configurationX,configY+11,configurationW)}
    }
    if(analysis.includeProfilePages)technicalPage(route,'Perfil y parámetros · Ruta comparativa');
  }
  if(analysis?.kind==='multipoint'&&analysis.includeMatrixPage!==false){begin(analysis.title,'Matriz dirigida de costes');pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.text(`Fecha: ${generatedAt} · Conectividad: ${input.connectivity} vecinos · MDT${String(input.resolution).padStart(2,'0')}`,MARGIN,30,{maxWidth:contentW});const matrix=analysis.matrix,cellW=Math.min(28,(pageW-MARGIN*2-36)/Math.max(1,matrix.length)),rowH=Math.max(5.5,REPORT_LAYOUT.bodyLeading);pdf.setFontSize(REPORT_TYPOGRAPHY.table);matrix.forEach((row,r)=>row.forEach((value,c)=>pdf.text(value==null?'—':value.toFixed(1),MARGIN+36+c*cellW,42+r*rowH,{align:'right',maxWidth:Math.max(4,cellW-2)})));input.points.slice(0,matrix.length).forEach((point,index)=>pdf.text(point.name,MARGIN,42+index*rowH,{maxWidth:32}));}
  if((analysis?.kind==='multipoint'||analysis?.kind==='multiroute')&&analysis.includeTechnicalPage)
    for(const route of input.routes)technicalPage(route,`Perfil y parámetros · ${analysis.kind==='multipoint'?'Multipunto':'Multirruta'}`);
  if(analysis?.kind==='isochrones'&&analysis.includeTechnicalPage!==false){const result=analysis.result;begin(analysis.title);const surfaceY=portrait?34:27,surfaceW=portrait?contentW:contentW*.68,surfaceH=portrait?pageH*.43:pageH-53;if(analysis.surfaceImage)addImageContained(pdf,analysis.surfaceImage,MARGIN,surfaceY,surfaceW,surfaceH);const x=portrait?MARGIN:analysis.surfaceImage?MARGIN+contentW*.71:MARGIN,detailsY=portrait&&analysis.surfaceImage?surfaceY+surfaceH+10:34;drawTechnicalRows(pdf,[`Niveles: ${new Set(result.lines.map(line=>line.level)).size}`,`Celdas accesibles: ${result.reachableCells.toLocaleString(reportLocale)}`,`Coste máximo: ${result.maxCost.toFixed(2)} ${result.unit}`,`Intervalo: ${result.interval} ${result.unit}`,`Modelo: ${MODELS[result.model].name}`,`Conectividad: ${input.connectivity} vecinos`,`Fuente: ${result.source}`],x,detailsY,pageW-x-MARGIN,8)}
  if(analysis?.kind==='contours'&&analysis.includeTechnicalPage!==false){const result=analysis.result;begin(analysis.title);drawTechnicalRows(pdf,[`Intervalo entre curvas: ${result.intervalM.toFixed(1)} m`,`Altitud mínima: ${result.minElevationM.toFixed(1)} m`,`Altitud máxima: ${result.maxElevationM.toFixed(1)} m`,`Segmentos vectoriales: ${result.lines.length.toLocaleString(reportLocale)}`,`Niveles representados: ${new Set(result.lines.map(line=>line.level)).size}`,`Resolución del MDT: ${result.resolutionM.toFixed(1)} m`,`Celdas nodata: ${result.nodataCells.toLocaleString(reportLocale)}`,`Fuente: ${result.source}`],MARGIN,38,contentW,9)}
  if(analysis?.kind==='corridor'&&analysis.includeTechnicalPage!==false){const result=analysis.result;begin(analysis.title);const surfaceY=portrait?34:27,surfaceW=portrait?contentW:contentW*.68,surfaceH=portrait?pageH*.43:pageH-53;if(analysis.surfaceImage)addImageContained(pdf,analysis.surfaceImage,MARGIN,surfaceY,surfaceW,surfaceH);const x=portrait?MARGIN:analysis.surfaceImage?MARGIN+contentW*.71:MARGIN,detailsY=portrait&&analysis.surfaceImage?surfaceY+surfaceH+10:34;drawTechnicalRows(pdf,[`Coste óptimo: ${result.optimalCost.toFixed(2)} ${result.unit}`,`Umbral: +${result.thresholdPercent}%`,`Celdas del pasillo: ${result.corridorCells.toLocaleString(reportLocale)}`,`Modelo: ${MODELS[result.model].name}`,`Conectividad: ${input.connectivity} vecinos`,`Fuente: ${result.source}`],x,detailsY,pageW-x-MARGIN,8)}
  if(analysis?.kind==='viewshed'&&analysis.includeTechnicalPage!==false){const result=analysis.result;begin(analysis.title,`Observador: ${result.observerName}`);const surfaceY=portrait?34:27,surfaceW=portrait?contentW:contentW*.68,surfaceH=portrait?pageH*.40:pageH-62;if(analysis.surfaceImage)addImageContained(pdf,analysis.surfaceImage,MARGIN,surfaceY,surfaceW,surfaceH);const x=portrait?MARGIN:analysis.surfaceImage?MARGIN+contentW*.71:MARGIN,detailsY=portrait&&analysis.surfaceImage?surfaceY+surfaceH+10:34,percentage=result.validCells?result.visibleCells/result.validCells*100:0;drawTechnicalRows(pdf,[`Coordenada: ${result.coordinate[1].toFixed(6)}, ${result.coordinate[0].toFixed(6)}`,`Elevación del terreno: ${result.groundElevationM.toFixed(1)} m`,`Altura usada en el cálculo: ${result.observerHeightM.toFixed(1)} m sobre el terreno`,`Altura total del punto de vista: ${(result.groundElevationM+result.observerHeightM).toFixed(1)} m`,`Celdas visibles: ${result.visibleCells.toLocaleString(reportLocale)} (${percentage.toFixed(1)}%)`,`Celdas válidas: ${result.validCells.toLocaleString(reportLocale)}`,`Resolución del MDT: ${input.resolution} m`],x,detailsY,pageW-x-MARGIN,8);pdf.setFont('helvetica','normal');pdf.setFontSize(TECHNICAL_TEXT_SIZE);pdf.setTextColor(115,78,38);pdf.text(analysis.limitation,MARGIN,pageH-19,{maxWidth:contentW});}
  for(const [index,route] of input.routes.entries()){
    const samples=elevationProfileSamples(route.result),extent=profileExtent([samples]);
    begin(`Perfil altimétrico · ${index+1}`);
    pdf.setFont('helvetica','bold');pdf.setFontSize(REPORT_TYPOGRAPHY.sectionTitle);pdf.setTextColor(25,35,30);
    pdf.text(`${MODELS[route.result.model].name} · ${route.result.direction}${route.result.rank?` · rango ${route.result.rank}`:''}`,MARGIN,portrait?39:32,{maxWidth:contentW});
    pdf.setFont('helvetica','normal');if(!extent||samples.length<2){pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.text('Este resultado no conserva cotas válidas. Recalcule el trazado con el MDT para obtener su perfil altimétrico.',MARGIN,portrait?58:52,{maxWidth:contentW});continue;}
    const left=MARGIN+22,top=portrait?62:52,width=contentW-32,height=pageH-top-48;
    const x=(distance:number)=>left+distance/Math.max(1,extent.maxDistanceM)*width;
    const y=(elevation:number)=>top+(extent.maxElevationM-elevation)/(extent.maxElevationM-extent.minElevationM)*height;
    pdf.setFillColor(247,249,247);pdf.rect(left,top,width,height,'F');
    pdf.setFontSize(REPORT_TYPOGRAPHY.table);pdf.setTextColor(50,65,57);pdf.text('Cota (m)',MARGIN,top-6);
    for(let tick=0;tick<=4;tick++){
      const fraction=tick/4,elevation=extent.minElevationM+(extent.maxElevationM-extent.minElevationM)*fraction,distance=extent.maxDistanceM*fraction;
      pdf.setDrawColor(205,215,208);pdf.setLineWidth(.2);pdf.line(left,y(elevation),left+width,y(elevation));pdf.line(x(distance),top,x(distance),top+height);
      pdf.text(elevation.toFixed(0),left-3,y(elevation)+1,{align:'right'});
      pdf.text((distance/1000).toFixed(2),x(distance),top+height+6,{align:'center'});
    }
    pdf.text('Distancia acumulada (km)',left+width/2,top+height+13,{align:'center'});
    pdf.setDrawColor(route.color);pdf.setLineWidth(.65);
    for(let i=1;i<samples.length;i++)pdf.line(x(samples[i-1].distanceM),y(samples[i-1].elevationM),x(samples[i].distanceM),y(samples[i].elevationM));
    pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.text(`Ascenso: ${route.result.ascentM.toFixed(1)} m · Descenso: ${route.result.descentM.toFixed(1)} m · Fuente del perfil: véase Fuentes y atribuciones`,MARGIN,pageH-19,{maxWidth:contentW});
  }
  if(!hasPage){pageHeader(pdf,'Informe sin secciones cartográficas');hasPage=true;pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.text('No se seleccionó ninguna sección disponible para exportar.',MARGIN,40)}

  const credits=[...new Set([input.mdtSource,...(input.resultAttributions??[]),...input.routes.map((route,index)=>`Ruta ${index+1} (${route.result.direction}): ${resultCredit(route.result)}`),...(input.points.some(point=>point.provenance?.source==='geonames')?['GeoNames · CC BY 4.0 · https://www.geonames.org/ · https://creativecommons.org/licenses/by/4.0/']:[]),...(input.navigationImage?[input.navigationAttribution??(input.navigationLabel==='OpenStreetMap'?'© OpenStreetMap contributors · ODbL 1.0 · https://www.openstreetmap.org/copyright':'REQUIERE REVISIÓN: fuente cartográfica no registrada')]:[]),...(input.pnoaImage?['PNOA · IGN/CNIG · https://www.ign.es/web/politica-datos']:[]),...(input.historicalImage?[input.historicalAttribution??'REQUIERE REVISIÓN: fuente histórica no registrada']:[]),...(input.customMapPages??[]).map(page=>page.attribution)].filter((value):value is string=>Boolean(value)))];
  const inventoryTitle=translateInventoryText('Elementos espaciales y configuración del análisis');begin(inventoryTitle);let inventoryY=34;
  for(const section of spatialInventory(input)){
    const sectionTitle=translateInventoryText(section.title),headerHeight=10;
    if(inventoryY+headerHeight>pageH-REPORT_LAYOUT.bottomReserve){begin(translateInventoryText('Elementos espaciales y configuración del análisis (continuación)'));inventoryY=34}
    inventoryY=drawInventorySectionHeader(pdf,sectionTitle,MARGIN,inventoryY,contentW);
    for(const row of section.rows){
      const translatedRow=translateInventoryText(row),rowWidth=contentW-4,estimatedHeight=(pdf.splitTextToSize(translatedRow,rowWidth) as string[]).length*REPORT_LAYOUT.bodyLeading+REPORT_LAYOUT.rowGap;
      if(inventoryY+estimatedHeight>pageH-REPORT_LAYOUT.bottomReserve){begin(translateInventoryText('Elementos espaciales y configuración del análisis (continuación)'));inventoryY=34;inventoryY=drawInventorySectionHeader(pdf,translateInventoryText(`${section.title} (continuación)`),MARGIN,inventoryY,contentW)}
      inventoryY=drawTechnicalRows(pdf,[translatedRow],MARGIN+4,inventoryY,rowWidth)+1;
    }
    inventoryY+=2;
  }
  if(credits.length){
    const sourceTitle=translateInventoryText('Fuentes y atribuciones');
    if(inventoryY+10>pageH-REPORT_LAYOUT.bottomReserve){begin(sourceTitle);inventoryY=34}
    inventoryY=drawInventorySectionHeader(pdf,sourceTitle,MARGIN,inventoryY,contentW);
    pdf.setFont('helvetica','normal');pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.setTextColor(25,35,30);
    for(const credit of credits){
      const lines=pdf.splitTextToSize(credit,contentW-8) as string[],creditHeight=lines.length*REPORT_LAYOUT.bodyLeading+2;
      if(inventoryY+creditHeight>pageH-REPORT_LAYOUT.bottomReserve){begin(translateInventoryText('Fuentes y atribuciones (continuación)'));inventoryY=34;inventoryY=drawInventorySectionHeader(pdf,translateInventoryText('Fuentes y atribuciones (continuación)'),MARGIN,inventoryY,contentW);pdf.setFont('helvetica','normal');pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.setTextColor(25,35,30)}
      pdf.setFillColor(112,137,119);pdf.circle(MARGIN+2,inventoryY-1,0.65,'F');pdf.text(lines,MARGIN+6,inventoryY,{lineHeightFactor:REPORT_LAYOUT.lineHeightFactor});inventoryY+=creditHeight;
    }
  }
  const count=pdf.getNumberOfPages();for(let page=1;page<=count;page++){pdf.setPage(page);pdf.setFont('helvetica','normal');pdf.setTextColor(90,100,94);pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.text(`ViaSpania · ${new Date().toLocaleString(reportLocale)} · Página ${page} de ${count}`,pageW-MARGIN,pageH-REPORT_LAYOUT.footerBaseline,{align:'right'})}
  return new Uint8Array(pdf.output('arraybuffer'));
}
