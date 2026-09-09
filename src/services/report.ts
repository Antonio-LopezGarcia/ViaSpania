import { jsPDF } from 'jspdf';
import {locale,translateText} from '../core/i18n';
import type { Barrier, Connectivity, ContourResult, GeoPoint, IsochroneResult, LcpCorridorResult, RouteResult, ViewshedObserverResult } from '../types';
import type { StudyExtent } from '../components/MapPanel';
import { MODELS } from '../core/costModels';
import {elevationProfileSamples,profileExtent} from '../core/elevationProfile';

export type ReportPageSize='a4'|'a3'|'a2';
export interface ReportOptions { navigation:boolean; pnoaOverview:boolean; individualRoutePages:boolean; terrain3d:boolean; historical:boolean; pointList:boolean; barrierList:boolean; pageSize:ReportPageSize }
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
export interface ReportMapPage {id:string;title:string;image:string;attribution?:string;legend?:{label:string;color:string}[];legendColumns?:1|2}
export interface ReportTextPage {id:string;title:string;lines:string[]}
/** Stable id from the shared layer catalog, or `terrain3d`. */
export type ReportMapBase=string;
export type ReportOverlayPosition='top-left'|'top-right'|'bottom-left'|'bottom-right';
export interface RouteSimpleReportSettings {
  base:ReportMapBase;includeOutbound:boolean;includeReturn:boolean;includeAlternatives:boolean;includeTechnicalPage:boolean;
  showContours?:boolean;showPoints:boolean;showPointLabels:boolean;showBarriers:boolean;showCorridors:boolean;showCrossings:boolean;showPointsOfInterest:boolean;
  showNorthArrow:boolean;northPosition:ReportOverlayPosition;showScale:boolean;scalePosition:ReportOverlayPosition;scaleM:'auto'|number;
  inclination:number;orientation:number;
}
export interface RouteComparisonReportSettings {
  base:ReportMapBase;selectedModels:string[];includeCombinedMap:boolean;includeIndividualPages:boolean;includeProfilePages:boolean;
  showContours?:boolean;showPoints:boolean;showPointLabels:boolean;showBarriers:boolean;showCorridors:boolean;showCrossings:boolean;showPointsOfInterest:boolean;
  showNorthArrow:boolean;northPosition:ReportOverlayPosition;showScale:boolean;scalePosition:ReportOverlayPosition;scaleM:'auto'|number;
  inclination:number;orientation:number;
}
export interface MultipointReportSettings {
  base:ReportMapBase;includeCombinedMap:boolean;includeMatrixPage:boolean;includeAlternatives:boolean;includeTechnicalPage:boolean;
  showContours?:boolean;showPoints:boolean;showPointLabels:boolean;showBarriers:boolean;showCorridors:boolean;showCrossings:boolean;showPointsOfInterest:boolean;
  showNorthArrow:boolean;northPosition:ReportOverlayPosition;showScale:boolean;scalePosition:ReportOverlayPosition;scaleM:'auto'|number;
  inclination:number;orientation:number;
}
export interface CorridorReportSettings {
  base:ReportMapBase;includeCombinedMap:boolean;includeTechnicalPage:boolean;surfaceOpacity:number;
  showContours?:boolean;showPoints:boolean;showPointLabels:boolean;showBarriers:boolean;showCorridors:boolean;showCrossings:boolean;showPointsOfInterest:boolean;
  showNorthArrow:boolean;northPosition:ReportOverlayPosition;showScale:boolean;scalePosition:ReportOverlayPosition;scaleM:'auto'|number;
  inclination:number;orientation:number;
}
export interface ViewshedReportSettings extends CorridorReportSettings {observerId:string}
export interface ReportComposition {pageSize:ReportPageSize;items:{id:string;title:string;kind:'map'|'section'}[];routeSimple?:RouteSimpleReportSettings;routeComparison?:RouteComparisonReportSettings;multipoint?:MultipointReportSettings;multiroute?:MultipointReportSettings;corridor?:CorridorReportSettings;isochrones?:CorridorReportSettings;contours?:CorridorReportSettings;viewshed?:ViewshedReportSettings}
interface ReportInput {
  options:ReportOptions; points:GeoPoint[]; barriers:Barrier[]; routes:ReportRoute[]; extent:StudyExtent;
  navigationImage?:string; pnoaImage?:string; terrain3dImage?:string; historicalImage?:string;
  navigationLabel:string; historicalLabel:string; resolution:number; paletteLabel:string; rasterSize?:[number,number];
  areaKm2:number; cells:number; mdtSource:string; connectivity:Connectivity; criticalSlopePercent:number;
  analysis?:ReportAnalysis; projectName?:string; generatedAt?:string; rasterCrs?:string;
  customMapPages?:ReportMapPage[];
  customTextPages?:ReportTextPage[];
  customOrder?:string[];
}

/** Shared typographic scale for every PDF report, expressed in points. */
export const REPORT_TYPOGRAPHY={brand:17,pageTitle:13,pageSubtitle:8.5,sectionTitle:10.5,body:9,table:8,caption:7.5,legend:7.5} as const;
/** Measurements are millimetres, except lineHeightFactor which is relative to the font size. */
export const REPORT_LAYOUT={margin:14,headerHeight:22,contentTop:30,footerBaseline:6,lineHeightFactor:1.3,bodyLeading:4.2,tableLeading:3.7,captionLeading:3.45,sectionGap:7,rowGap:5.8,bottomReserve:17} as const;
const MARGIN=REPORT_LAYOUT.margin;
function imageFormat(data:string){return data.startsWith('data:image/jpeg')?'JPEG':'PNG'}
function fitSingleLine(pdf:jsPDF,text:string,maxWidth:number){if(pdf.getTextWidth(text)<=maxWidth)return text;const ellipsis='…';let end=text.length;while(end&&pdf.getTextWidth(`${text.slice(0,end)}${ellipsis}`)>maxWidth)end--;return `${text.slice(0,end).trimEnd()}${ellipsis}`}
function pageHeader(pdf:jsPDF,title:string,subtitle?:string){const pageW=pdf.internal.pageSize.getWidth(),baseline=13;pdf.setFillColor(10,23,17);pdf.rect(0,0,pageW,REPORT_LAYOUT.headerHeight,'F');pdf.setTextColor(216,255,85);pdf.setFontSize(REPORT_TYPOGRAPHY.brand);pdf.setFont('helvetica','bold');pdf.text('VS',MARGIN,baseline);pdf.setFont('helvetica','normal');pdf.setTextColor(235,241,237);pdf.setFontSize(REPORT_TYPOGRAPHY.pageTitle);pdf.text('ViaSpania',MARGIN+14,baseline);const subtitleWidth=subtitle?58:0,titleX=MARGIN+48,titleWidth=pageW-titleX-MARGIN-subtitleWidth-5;pdf.text(fitSingleLine(pdf,title,titleWidth),titleX,baseline);if(subtitle){pdf.setTextColor(155,169,160);pdf.setFontSize(REPORT_TYPOGRAPHY.pageSubtitle);pdf.text(fitSingleLine(pdf,subtitle,subtitleWidth),pageW-MARGIN,baseline,{align:'right'})}pdf.setFont('helvetica','normal');pdf.setTextColor(25,35,30)}
export function imageContainRect(imageWidth:number,imageHeight:number,x:number,y:number,width:number,height:number){const ratio=Math.min(width/imageWidth,height/imageHeight),drawWidth=imageWidth*ratio,drawHeight=imageHeight*ratio;return{x:x+(width-drawWidth)/2,y:y+(height-drawHeight)/2,width:drawWidth,height:drawHeight}}
function addImageContained(pdf:jsPDF,data:string,x:number,y:number,width:number,height:number){const properties=pdf.getImageProperties(data),rect=imageContainRect(properties.width,properties.height,x,y,width,height);pdf.setFillColor(242,244,242);pdf.rect(x,y,width,height,'F');pdf.addImage(data,imageFormat(data),rect.x,rect.y,rect.width,rect.height,undefined,'FAST')}
function project([lon,lat]:[number,number],[west,south,east,north]:StudyExtent,x:number,y:number,w:number,h:number){return [x+(lon-west)/(east-west)*w,y+(north-lat)/(north-south)*h] as const}
function drawRoutes(pdf:jsPDF,routes:ReportRoute[],extent:StudyExtent,x:number,y:number,w:number,h:number){pdf.setLineCap('round');pdf.setLineJoin('round');for(const route of routes){const coordinates=route.result.coordinates??[];if(coordinates.length<2)continue;const points=coordinates.map(point=>project(point,extent,x,y,w,h));pdf.setDrawColor(8,20,23);pdf.setLineWidth(2.7);for(let i=1;i<points.length;i++)pdf.line(...points[i-1],...points[i]);pdf.setDrawColor(route.color);pdf.setLineWidth(1.25);for(let i=1;i<points.length;i++)pdf.line(...points[i-1],...points[i])}}
function drawPointsAndBarriers(pdf:jsPDF,input:ReportInput,x:number,y:number,w:number,h:number){for(const barrier of input.barriers){const points=barrier.coordinates.map(point=>project(point,input.extent,x,y,w,h));pdf.setDrawColor(barrier.kind==='absolute'?'#ff3030':'#ffb340');pdf.setLineWidth(1);for(let i=1;i<points.length;i++)pdf.line(...points[i-1],...points[i])}for(const point of input.points){const [px,py]=project([point.lon,point.lat],input.extent,x,y,w,h);pdf.setFillColor(point.role==='inicio'?'#59d2ff':point.role==='final'?'#ff796f':'#d8ff55');pdf.setDrawColor('#ffffff');pdf.circle(px,py,2,'FD')}}
function routeConfiguration(route:RouteResult,input:ReportInput){const settings=route.settings;const connectivity=settings?.connectivity??input.connectivity;const parts=[`${connectivity} vecinos`];if(route.requiredWaypoints?.length)parts.push(`Paso obligatorio: ${[...new Set(route.requiredWaypoints.map(point=>point.name))].join(", ")}`);if(route.rank)parts.unshift(`ruta subóptima · rango ${route.rank}${route.rank>1&&route.costIncreasePercent!=null?` · +${route.costIncreasePercent.toFixed(1)} % · ${route.sharedCellsPercent?.toFixed(0)??'—'} % compartido`:''}`);if(route.model==='wheeled')parts.push(`pendiente crítica ${settings?.criticalSlopePercent??input.criticalSlopePercent}%`);if(route.model==='ardigo'&&settings?.ardigoSpeedMs)parts.push(`velocidad ${settings.ardigoSpeedMs.toFixed(1)} m/s`);return parts.join(' · ')}
function connectivityDetail(value:Connectivity){return value===4?'movimientos cardinales, sin diagonales':value===8?'movimientos cardinales y diagonales inmediatas':'incluye conexiones extendidas para aumentar las direcciones posibles'}
function reportNumber(value:number,digits:number){return value.toLocaleString(locale(),{minimumFractionDigits:digits,maximumFractionDigits:digits,useGrouping:false})}
function digitalModelSummary(input:ReportInput){
  const parts=input.mdtSource.split(' · ').filter(Boolean);
  const resolution=`resolución ${input.resolution.toLocaleString(locale(),{maximumFractionDigits:3,useGrouping:false})} m`;
  return [parts[0],resolution,...parts.slice(1)].filter(Boolean).join(' · ');
}
function calculationParameterRows(route:RouteResult,input:ReportInput){const settings=route.settings,connectivity=settings?.connectivity??input.connectivity,critical=route.model==='wheeled'?settings?.criticalSlopePercent??input.criticalSlopePercent:null,speed=route.model==='ardigo'?settings?.ardigoSpeedMs:null;return[
  `Conectividad: ${connectivity} vecinos (${connectivityDetail(connectivity)})`,
  critical==null?'Pendiente crítica: no utilizada':`Pendiente crítica: ${reportNumber(critical,1)} %`,
  route.model!=='ardigo'?'Velocidad configurable: no aplicable':speed==null?'Velocidad configurable: no registrada':`Velocidad configurable: ${reportNumber(speed,2)} m/s`,
  `Modelo Digital: ${digitalModelSummary(input)}`
]}
export function routeTechnicalSections(route:RouteResult,input:ReportInput){
  const profile=MODELS[route.model];
  return [
    {title:'Perfil de desplazamiento',rows:[`Perfil de desplazamiento: ${profile.name}`,`Familia: ${profile.family} · Magnitud de coste: ${profile.unit} · Direccional: ${profile.directional?'sí (ida y vuelta pueden diferir)':'no'}`,`Descripción: ${profile.description}`,`Referencia: ${profile.citation}`]},
    {title:'Configuración del cálculo',rows:[`Dirección: ${route.direction}`,...calculationParameterRows(route,input)]},
    {title:'Resultado',rows:[route.direction,`Distancia: ${reportNumber(route.distanceM,1)} m · Coste acumulado: ${reportNumber(route.cost,2)} ${route.unit}`,`Ascenso: ${reportNumber(route.ascentM,1)} m · Descenso: ${reportNumber(route.descentM,1)} m · Vértices: ${route.coordinates?.length??0}`]}
  ];
}
const TECHNICAL_TEXT_SIZE=REPORT_TYPOGRAPHY.body;
function writeLines(pdf:jsPDF,lines:string[],x:number,y:number,leading:number){pdf.text(lines,x,y,{lineHeightFactor:REPORT_LAYOUT.lineHeightFactor});return Math.max(leading,lines.length*leading)}
function drawTechnicalTitle(pdf:jsPDF,title:string,x:number,y:number){pdf.setFont('helvetica','bold');pdf.setFontSize(REPORT_TYPOGRAPHY.sectionTitle);pdf.setTextColor(25,35,30);pdf.text(fitSingleLine(pdf,title,pdf.internal.pageSize.getWidth()-x-MARGIN),x,y);pdf.setFont('helvetica','normal')}
function drawTechnicalRows(pdf:jsPDF,rows:string[],x:number,startY:number,maxWidth:number,_legacyRowGap?:number){
  let y=startY;
  pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.setTextColor(25,35,30);
  for(const row of rows){
    let cursor=x;
    for(const [index,part] of row.split(' · ').entries()){
      const separator=part.indexOf(':');
      const runs=separator<0?[{text:translateText(part),bold:false}]:[{text:translateText(part.slice(0,separator+1)),bold:true},{text:' '+translateText(part.slice(separator+1).trim()),bold:false}];
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
function addNewPage(pdf:jsPDF,title:string,subtitle:string|undefined,format:ReportPageSize){pdf.addPage(format,'landscape');pageHeader(pdf,title,subtitle)}
function drawMapLegend(pdf:jsPDF,entries:{label:string;color:string}[],pageW:number,pageH:number,columns:1|2=1){if(!entries.length)return;const columnCount=Math.min(columns,entries.length),rows=Math.ceil(entries.length/columnCount),rowH=5.5,columnW=Math.min(86,Math.max(52,...entries.map(entry=>entry.label.length*1.55+19))),width=columnW*columnCount+8,height=12+rows*rowH,x=pageW-MARGIN-width-5,y=pageH-31-height;pdf.setFillColor(255,255,255);pdf.setDrawColor(50,65,57);pdf.roundedRect(x,y,width,height,2,2,'FD');pdf.setTextColor(25,35,30);pdf.setFont('helvetica','bold');pdf.setFontSize(REPORT_TYPOGRAPHY.table);pdf.text('Leyenda cartográfica',x+4,y+7);pdf.setFont('helvetica','normal');entries.forEach((entry,index)=>{const column=Math.floor(index/rows),row=index%rows,itemX=x+4+column*columnW,rowY=y+12+row*rowH;pdf.setDrawColor(entry.color);pdf.setLineWidth(1.7);pdf.line(itemX,rowY-1,itemX+9,rowY-1);pdf.setFontSize(REPORT_TYPOGRAPHY.legend);pdf.setTextColor(25,35,30);pdf.text(fitSingleLine(pdf,entry.label,columnW-14),itemX+12,rowY)})}

export function createProjectReport(input:ReportInput):Uint8Array{
  const format=input.options.pageSize??'a4',pdf=new jsPDF({unit:'mm',format,orientation:'landscape',compress:true}),pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),contentW=pageW-MARGIN*2;pdf.setFont('helvetica','normal');pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.setLineHeightFactor(REPORT_LAYOUT.lineHeightFactor);let hasPage=false;
  const normalPdfText=(value:string)=>translateText(value).replaceAll('→',' -> ').replaceAll('—',' - ').replaceAll('…','...');
  const originalSplit=pdf.splitTextToSize.bind(pdf),originalWidth=pdf.getTextWidth.bind(pdf),originalText=pdf.text.bind(pdf);
  pdf.splitTextToSize=((text:string|string[],...args:Parameters<typeof originalSplit> extends [unknown,...infer R]?R:never)=>originalSplit(Array.isArray(text)?text.map(normalPdfText).join("\n"):normalPdfText(text),...args)) as typeof pdf.splitTextToSize;
  pdf.getTextWidth=(text:string)=>originalWidth(normalPdfText(text));
  pdf.text=((text:string|string[],...args:unknown[])=>originalText(Array.isArray(text)?text.map(normalPdfText):normalPdfText(text),...(args as Parameters<typeof originalText> extends [unknown,...infer R]?R:never))) as typeof pdf.text;
  const begin=(title:string,subtitle?:string)=>{if(hasPage)addNewPage(pdf,title,subtitle,format);else{pageHeader(pdf,title,subtitle);hasPage=true}};
  const [west,south,east,north]=input.extent;
  const generatedAt=input.generatedAt??new Date().toISOString(),reportLocale=locale();
  if(input.options.navigation&&input.navigationImage){begin('Mapa de navegación',input.navigationLabel);const mapW=contentW*.66,mapH=pageH-58,sideX=MARGIN+mapW+8,sideW=pageW-sideX-MARGIN;addImageContained(pdf,input.navigationImage,MARGIN,26,mapW,mapH);drawTechnicalTitle(pdf,'Área de estudio y datos de entrada',sideX,31);const rows=[`Extensión: ${input.areaKm2.toLocaleString(reportLocale,{maximumFractionDigits:3})} km²`,`Límites: ${west.toFixed(6)}, ${south.toFixed(6)} — ${east.toFixed(6)}, ${north.toFixed(6)}`,`Malla: ${input.cells.toLocaleString(reportLocale)} celdas${input.rasterSize?` · ${input.rasterSize[0]} × ${input.rasterSize[1]}`:''}`,`MDT utilizado: MDT${String(input.resolution).padStart(2,'0')} · ${input.resolution} m`,`Fuente del MDT: ${input.mdtSource}`,`Puntos seleccionados: ${input.points.length}`,`Barreras: ${input.barriers.length}`];let sideY=drawTechnicalRows(pdf,rows,sideX,41,sideW);if(input.options.pointList){sideY+=REPORT_LAYOUT.sectionGap;drawTechnicalTitle(pdf,'Puntos',sideX,sideY);sideY+=REPORT_LAYOUT.sectionGap;pdf.setFontSize(REPORT_TYPOGRAPHY.caption);for(const point of input.points.slice(0,13)){const lines=pdf.splitTextToSize(`${point.name} · ${point.role} · ${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}`,sideW) as string[];pdf.text(lines,sideX,sideY);sideY+=Math.max(5,lines.length*4.2)}}if(input.options.barrierList&&input.barriers.length&&sideY<pageH-28){sideY+=REPORT_LAYOUT.sectionGap;drawTechnicalTitle(pdf,'Barreras',sideX,sideY);sideY+=REPORT_LAYOUT.sectionGap;pdf.setFontSize(REPORT_TYPOGRAPHY.caption);for(const [index,barrier] of input.barriers.slice(0,5).entries()){const lines=pdf.splitTextToSize(`${index+1}. ${barrier.name?.trim()||`Barrera ${index+1}`} · ${barrier.kind==='absolute'?'Absoluta':`Penalización ×${barrier.value}`} · ${barrier.coordinates.length} vértices`,sideW) as string[];pdf.text(lines,sideX,sideY);sideY+=Math.max(5,lines.length*4.2)}}}
  if(input.options.pnoaOverview&&input.pnoaImage){begin('Ortofotografía PNOA y rutas',`${input.routes.length} perfil(es) calculado(s)`);const mapX=MARGIN,mapY=REPORT_LAYOUT.contentTop,mapW=contentW,mapH=pageH*.57;addImageContained(pdf,input.pnoaImage,mapX,mapY,mapW,mapH);drawRoutes(pdf,input.routes,input.extent,mapX,mapY,mapW,mapH);drawPointsAndBarriers(pdf,input,mapX,mapY,mapW,mapH);drawLegend(pdf,input,mapY+mapH+11,10);pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.setTextColor(95,105,98);pdf.text('Ortofotografía: IGN/CNIG. Las rutas se calculan exclusivamente sobre el modelo de elevaciones y las barreras definidas.',MARGIN,pageH-11,{maxWidth:contentW});if(input.routes.length>10){addNewPage(pdf,'Leyenda completa de modelos',undefined,format);drawLegend(pdf,input,32,30)}}
  if(input.options.individualRoutePages&&input.pnoaImage)for(const route of input.routes){begin(`Perfil: ${MODELS[route.result.model].name}`,routeConfiguration(route.result,input));const x=MARGIN,y=REPORT_LAYOUT.contentTop,w=205,h=137;addImageContained(pdf,input.pnoaImage,x,y,w,h);drawRoutes(pdf,[route],input.extent,x,y,w,h);drawPointsAndBarriers(pdf,input,x,y,w,h);pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.text(`Coste: ${route.result.cost.toFixed(2)} ${route.result.unit}`,224,38);pdf.text(`Distancia: ${route.result.distanceM.toFixed(1)} m`,224,47);pdf.text(`Ascenso: ${route.result.ascentM.toFixed(1)} m`,224,56);pdf.text(`Descenso: ${route.result.descentM.toFixed(1)} m`,224,65);pdf.text(`Conectividad: ${route.result.settings?.connectivity??input.connectivity}`,224,74);if(route.result.model==='wheeled')pdf.text(`Pendiente crítica: ${route.result.settings?.criticalSlopePercent??input.criticalSlopePercent}%`,224,83);pdf.setDrawColor(route.color);pdf.setLineWidth(3);pdf.line(224,95,270,95)}
  if(input.options.terrain3d&&input.terrain3dImage){begin('Visor 3D del terreno y las rutas',`Paleta ${input.paletteLabel}`);addImageContained(pdf,input.terrain3dImage,MARGIN,REPORT_LAYOUT.contentTop,contentW,pageH-55);pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.text(`Rutas representadas: ${input.routes.length}. Los colores corresponden a la leyenda de resultados de la ortofotografía.`,MARGIN,pageH-12,{maxWidth:contentW})}
  if(input.options.historical&&input.historicalImage){begin('Cartografía histórica',input.historicalLabel);addImageContained(pdf,input.historicalImage,MARGIN,REPORT_LAYOUT.contentTop,contentW,pageH-55);pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.setTextColor(90,100,94);pdf.text('Fuente: Instituto Geográfico Nacional de España / Centro Nacional de Información Geográfica.',MARGIN,pageH-12,{maxWidth:contentW})}
  const maps=input.customMapPages??[],texts=input.customTextPages??[],order=input.customOrder??[...maps.map(page=>page.id),...texts.map(page=>page.id)];for(const id of order){const map=maps.find(page=>page.id===id),text=texts.find(page=>page.id===id);if(map){begin(map.title,map.attribution);addImageContained(pdf,map.image,MARGIN,REPORT_LAYOUT.contentTop,contentW,pageH-55);if(map.legend)drawMapLegend(pdf,map.legend,pageW,pageH,map.legendColumns);if(map.attribution){pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.setTextColor(90,100,94);pdf.text(map.attribution,MARGIN,pageH-12,{maxWidth:contentW})}}else if(text){begin(text.title,'Contenido seleccionado en el compositor');pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.setTextColor(25,35,30);let y=32;for(const line of text.lines){const wrapped=pdf.splitTextToSize(line,contentW) as string[],height=Math.max(REPORT_LAYOUT.rowGap,wrapped.length*REPORT_LAYOUT.bodyLeading);if(y+height>pageH-16)break;pdf.text(wrapped,MARGIN,y);y+=height}}}
  const analysis=input.analysis;
  const technicalPage=(route:ReportRoute,title:string)=>{
    begin(title);
    let y=34;
    for(const [index,section] of routeTechnicalSections(route.result,input).entries()){
      if(index){y+=REPORT_LAYOUT.sectionGap;drawTechnicalTitle(pdf,section.title,MARGIN,y);y+=REPORT_LAYOUT.sectionGap}
      for(const row of section.rows){
        const height=(pdf.splitTextToSize(translateText(row),contentW-5) as string[]).length*REPORT_LAYOUT.bodyLeading+REPORT_LAYOUT.rowGap;
        if(y+height>pageH-REPORT_LAYOUT.bottomReserve){begin(title);y=34}
        y=drawTechnicalRows(pdf,[row],MARGIN,y,contentW);
      }
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
      const map=analysis.individualMaps?.[result.model],resultX=map?MARGIN+contentW*.68:MARGIN,resultW=map?pageW-resultX-MARGIN:contentW*.47,configurationX=map?resultX:MARGIN+contentW*.53,configurationW=map?resultW:contentW*.47;
      if(map)addImageContained(pdf,map,MARGIN,32,contentW*.63,pageH-62);if(map&&analysis.contourCaption){pdf.setFontSize(7);pdf.text(pdf.splitTextToSize(analysis.contourCaption,contentW*.63),MARGIN,pageH-24);}
      pdf.setDrawColor(route.color);pdf.setLineWidth(4);pdf.line(resultX,34,resultX+34,34);
      drawTechnicalTitle(pdf,'Resultado calculado',resultX,48);
      drawTechnicalRows(pdf,[`Coste acumulado: ${result.cost.toFixed(2)} ${result.unit}`,`Distancia: ${result.distanceM.toFixed(1)} m`,`Ascenso acumulado: ${result.ascentM.toFixed(1)} m`,`Descenso acumulado: ${result.descentM.toFixed(1)} m`,`Vértices del trazado: ${result.coordinates?.length??0}`,`Dirección: ${result.direction}`],resultX,60,resultW);
      if(!analysis.includeProfilePages){drawTechnicalTitle(pdf,'Configuración del cálculo',configurationX,map?116:48);drawTechnicalRows(pdf,calculationParameterRows(result,input),configurationX,map?127:60,configurationW)}
    }
    if(analysis.includeProfilePages)technicalPage(route,'Perfil y parámetros · Ruta comparativa');
  }
  if(analysis?.kind==='multipoint'&&analysis.includeMatrixPage!==false){begin(analysis.title,'Matriz dirigida de costes');pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.text(`Fecha: ${generatedAt} · Conectividad: ${input.connectivity} vecinos · MDT${String(input.resolution).padStart(2,'0')}`,MARGIN,30,{maxWidth:contentW});const matrix=analysis.matrix,cellW=Math.min(28,(pageW-MARGIN*2-36)/Math.max(1,matrix.length)),rowH=Math.max(5.5,REPORT_LAYOUT.bodyLeading);pdf.setFontSize(REPORT_TYPOGRAPHY.table);matrix.forEach((row,r)=>row.forEach((value,c)=>pdf.text(value==null?'—':value.toFixed(1),MARGIN+36+c*cellW,42+r*rowH,{align:'right',maxWidth:Math.max(4,cellW-2)})));input.points.slice(0,matrix.length).forEach((point,index)=>pdf.text(point.name,MARGIN,42+index*rowH,{maxWidth:32}));}
  if((analysis?.kind==='multipoint'||analysis?.kind==='multiroute')&&analysis.includeTechnicalPage)
    for(const route of input.routes)technicalPage(route,`Perfil y parámetros · ${analysis.kind==='multipoint'?'Multipunto':'Multirruta'}`);
  if(analysis?.kind==='isochrones'&&analysis.includeTechnicalPage!==false){const result=analysis.result;begin(analysis.title);if(analysis.surfaceImage)addImageContained(pdf,analysis.surfaceImage,MARGIN,27,contentW*.68,pageH-53);const x=analysis.surfaceImage?MARGIN+contentW*.71:MARGIN;drawTechnicalRows(pdf,[`Niveles: ${new Set(result.lines.map(line=>line.level)).size}`,`Celdas accesibles: ${result.reachableCells.toLocaleString(reportLocale)}`,`Coste máximo: ${result.maxCost.toFixed(2)} ${result.unit}`,`Intervalo: ${result.interval} ${result.unit}`,`Modelo: ${MODELS[result.model].name}`,`Conectividad: ${input.connectivity} vecinos`,`Fuente: ${result.source}`],x,34,pageW-x-MARGIN,8)}
  if(analysis?.kind==='contours'&&analysis.includeTechnicalPage!==false){const result=analysis.result;begin(analysis.title);drawTechnicalRows(pdf,[`Intervalo entre curvas: ${result.intervalM.toFixed(1)} m`,`Altitud mínima: ${result.minElevationM.toFixed(1)} m`,`Altitud máxima: ${result.maxElevationM.toFixed(1)} m`,`Segmentos vectoriales: ${result.lines.length.toLocaleString(reportLocale)}`,`Niveles representados: ${new Set(result.lines.map(line=>line.level)).size}`,`Resolución del MDT: ${result.resolutionM.toFixed(1)} m`,`Celdas nodata: ${result.nodataCells.toLocaleString(reportLocale)}`,`Fuente: ${result.source}`],MARGIN,38,contentW,9)}
  if(analysis?.kind==='corridor'&&analysis.includeTechnicalPage!==false){const result=analysis.result;begin(analysis.title);if(analysis.surfaceImage)addImageContained(pdf,analysis.surfaceImage,MARGIN,27,contentW*.68,pageH-53);const x=analysis.surfaceImage?MARGIN+contentW*.71:MARGIN;drawTechnicalRows(pdf,[`Coste óptimo: ${result.optimalCost.toFixed(2)} ${result.unit}`,`Umbral: +${result.thresholdPercent}%`,`Celdas del pasillo: ${result.corridorCells.toLocaleString(reportLocale)}`,`Modelo: ${MODELS[result.model].name}`,`Conectividad: ${input.connectivity} vecinos`,`Fuente: ${result.source}`],x,34,pageW-x-MARGIN,8)}
  if(analysis?.kind==='viewshed'&&analysis.includeTechnicalPage!==false){const result=analysis.result;begin(analysis.title,`Observador: ${result.observerName}`);if(analysis.surfaceImage)addImageContained(pdf,analysis.surfaceImage,MARGIN,27,contentW*.68,pageH-62);const x=analysis.surfaceImage?MARGIN+contentW*.71:MARGIN,percentage=result.validCells?result.visibleCells/result.validCells*100:0;drawTechnicalRows(pdf,[`Coordenada: ${result.coordinate[1].toFixed(6)}, ${result.coordinate[0].toFixed(6)}`,`Elevación del terreno: ${result.groundElevationM.toFixed(1)} m`,`Altura usada en el cálculo: ${result.observerHeightM.toFixed(1)} m sobre el terreno`,`Altura total del punto de vista: ${(result.groundElevationM+result.observerHeightM).toFixed(1)} m`,`Celdas visibles: ${result.visibleCells.toLocaleString(reportLocale)} (${percentage.toFixed(1)}%)`,`Celdas válidas: ${result.validCells.toLocaleString(reportLocale)}`,`Resolución del MDT: ${input.resolution} m`],x,34,pageW-x-MARGIN,8);pdf.setFont('helvetica','normal');pdf.setFontSize(TECHNICAL_TEXT_SIZE);pdf.setTextColor(115,78,38);pdf.text(analysis.limitation,MARGIN,pageH-19,{maxWidth:contentW});}
  for(const [index,route] of input.routes.entries()){
    const samples=elevationProfileSamples(route.result),extent=profileExtent([samples]);
    begin(`Perfil altimétrico · ${index+1}`);
    pdf.setFont('helvetica','bold');pdf.setFontSize(REPORT_TYPOGRAPHY.sectionTitle);pdf.setTextColor(25,35,30);
    pdf.text(`${MODELS[route.result.model].name} · ${route.result.direction}${route.result.rank?` · rango ${route.result.rank}`:''}`,MARGIN,32,{maxWidth:contentW});
    pdf.setFont('helvetica','normal');if(!extent||samples.length<2){pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.text('Este resultado no conserva cotas válidas. Recalcule el trazado con el MDT para obtener su perfil altimétrico.',MARGIN,52,{maxWidth:contentW});continue;}
    const left=MARGIN+22,top=52,width=contentW-32,height=pageH-100;
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
    pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.text(`Ascenso: ${route.result.ascentM.toFixed(1)} m · Descenso: ${route.result.descentM.toFixed(1)} m · Fuente: ${input.mdtSource}`,MARGIN,pageH-19,{maxWidth:contentW});
  }
  if(!hasPage){pageHeader(pdf,'Informe sin secciones cartográficas');hasPage=true;pdf.setFontSize(REPORT_TYPOGRAPHY.body);pdf.text('No se seleccionó ninguna sección disponible para exportar.',MARGIN,40)}
  const count=pdf.getNumberOfPages();for(let page=1;page<=count;page++){pdf.setPage(page);pdf.setFont('helvetica','normal');pdf.setTextColor(90,100,94);pdf.setFontSize(REPORT_TYPOGRAPHY.caption);pdf.text(`ViaSpania · ${new Date().toLocaleString(reportLocale)} · Página ${page} de ${count}`,pageW-MARGIN,pageH-REPORT_LAYOUT.footerBaseline,{align:'right'})}
  return new Uint8Array(pdf.output('arraybuffer'));
}
