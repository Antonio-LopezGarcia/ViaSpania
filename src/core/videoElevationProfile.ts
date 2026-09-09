import {translateText} from './i18n';
import {elevationProfileSamples,profileExtent,type ElevationProfileSample} from './elevationProfile';

export interface VideoProfileRoute{label:string;color:string;coordinates?:[number,number][];elevationsM?:number[]}
export interface VideoProfileSeries{routeIndex:number;label:string;color:string;samples:ElevationProfileSample[]}
export function videoProfileSeries(routes:readonly VideoProfileRoute[]):VideoProfileSeries[]{return routes.map((route,index)=>({routeIndex:index,label:route.label||`Ruta ${index+1}`,color:route.color,samples:elevationProfileSamples(route)})).filter(item=>item.samples.length>1)}

export function drawAnimatedElevationProfile(context:CanvasRenderingContext2D,width:number,height:number,series:readonly VideoProfileSeries[],progress:number){
 const extent=profileExtent(series.map(item=>item.samples));if(!extent)return;
 const boxW=Math.min(width*.58,680),boxH=Math.min(height*.27,230),x0=18,y0=height-boxH-42,padL=52,padR=14,padT=28,padB=31,plotW=boxW-padL-padR,plotH=boxH-padT-padB,p=Math.max(0,Math.min(1,progress));
 const x=(distance:number)=>x0+padL+distance/Math.max(1,extent.maxDistanceM)*plotW,y=(elevation:number)=>y0+padT+(extent.maxElevationM-elevation)/(extent.maxElevationM-extent.minElevationM)*plotH;
 context.save();context.fillStyle='rgba(7,16,13,.88)';context.strokeStyle='rgba(255,255,255,.55)';context.lineWidth=1;context.beginPath();context.roundRect(x0,y0,boxW,boxH,9);context.fill();context.stroke();
 context.font=`600 ${Math.max(10,Math.round(height/65))}px sans-serif`;context.fillStyle='#fff';context.textAlign='left';context.fillText(translateText('Perfil altimétrico'),x0+12,y0+18);
 context.font=`${Math.max(9,Math.round(height/78))}px sans-serif`;context.strokeStyle='rgba(255,255,255,.18)';context.fillStyle='rgba(255,255,255,.8)';
 for(const ratio of [0,.5,1]){const elevation=extent.maxElevationM-(extent.maxElevationM-extent.minElevationM)*ratio,py=y(elevation);context.beginPath();context.moveTo(x0+padL,py);context.lineTo(x0+boxW-padR,py);context.stroke();context.textAlign='right';context.fillText(`${elevation.toFixed(0)} m`,x0+padL-6,py+3)}
 for(const item of series){context.strokeStyle=item.color;context.lineWidth=Math.max(2,height/360);context.beginPath();item.samples.forEach((sample,index)=>{const px=x(sample.distanceM),py=y(sample.elevationM);if(index)context.lineTo(px,py);else context.moveTo(px,py)});context.stroke();const target=p*(item.samples.at(-1)?.distanceM??0);let index=item.samples.findIndex(sample=>sample.distanceM>=target);if(index<0)index=item.samples.length-1;const b=item.samples[index],a=item.samples[Math.max(0,index-1)],span=b.distanceM-a.distanceM,t=span?(target-a.distanceM)/span:0,px=x(a.distanceM+(b.distanceM-a.distanceM)*t),py=y(a.elevationM+(b.elevationM-a.elevationM)*t);context.fillStyle='#fff';context.beginPath();context.arc(px,py,6,0,Math.PI*2);context.fill();context.fillStyle=item.color;context.beginPath();context.arc(px,py,3.5,0,Math.PI*2);context.fill()}
 const km=extent.maxDistanceM>=1000;context.fillStyle='#fff';context.textAlign='right';context.fillText(`${translateText('Distancia')} · ${(extent.maxDistanceM*(km?0.001:1)).toFixed(1)} ${km?'km':'m'}`,x0+boxW-padR,y0+boxH-9);context.restore();
}
