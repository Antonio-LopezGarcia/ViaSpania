import {translateText} from './i18n';
import {elevationProfileSamples,profileExtent,type ElevationProfileSample} from './elevationProfile';

export interface VideoProfileRoute{label:string;color:string;coordinates?:[number,number][];elevationsM?:number[]}
export interface VideoProfileSeries{routeIndex:number;label:string;color:string;samples:ElevationProfileSample[]}
export function videoProfileSeries(routes:readonly VideoProfileRoute[]):VideoProfileSeries[]{return routes.map((route,index)=>({routeIndex:index,label:route.label||`Ruta ${index+1}`,color:route.color,samples:elevationProfileSamples(route)})).filter(item=>item.samples.length>1)}

export function drawAnimatedElevationProfile(context:CanvasRenderingContext2D,width:number,height:number,series:readonly VideoProfileSeries[],progress:number,bottomInset=64){
 const extent=profileExtent(series.map(item=>item.samples));if(!extent)return;
 // Keep the profile close to its 560 × 195 px viewer size at 1080p, and
 // scale its whole panel with the output so it remains legible at 4K.
 const scale=Math.max(1,Math.min(2,width/1920)),boxW=Math.min(width*.62,600*scale),boxH=Math.min(height*.27,195*scale),x0=18*scale,y0=height-boxH-Math.max(64*scale,bottomInset),padL=48*scale,padR=14*scale,padT=56*scale,padB=34*scale,plotW=boxW-padL-padR,plotH=boxH-padT-padB,p=Math.max(0,Math.min(1,progress));
 const x=(distance:number)=>x0+padL+distance/Math.max(1,extent.maxDistanceM)*plotW,y=(elevation:number)=>y0+padT+(extent.maxElevationM-elevation)/(extent.maxElevationM-extent.minElevationM)*plotH,km=extent.maxDistanceM>=1000,gridStep=km?5000:5,gridCount=Math.floor(extent.maxDistanceM/gridStep),drawDistanceGrid=plotW*gridStep/Math.max(1,extent.maxDistanceM)>=18,axisFontSize=Math.max(9,Math.round(height/78))
 context.save();context.fillStyle='rgba(12,18,16,.93)';context.strokeStyle='#607068';context.lineWidth=scale;context.beginPath();context.roundRect(x0,y0,boxW,boxH,9*scale);context.fill();context.stroke();
 context.fillStyle='#17201c';context.fillRect(x0+scale,y0+scale,boxW-2*scale,33*scale);context.font=`600 ${Math.max(10,Math.round(height/65))}px Inter,ui-sans-serif,system-ui,sans-serif`;context.fillStyle='#d8ff55';context.textAlign='left';context.fillText(translateText('Perfil altimétrico'),x0+12*scale,y0+21*scale);
 context.font=`${Math.max(9,Math.round(height/78))}px Inter,ui-sans-serif,system-ui,sans-serif`;context.strokeStyle='#506058';context.fillStyle='#aebbb3';
 for(const ratio of [0,.5,1]){const elevation=extent.maxElevationM-(extent.maxElevationM-extent.minElevationM)*ratio,py=y(elevation);context.beginPath();context.moveTo(x0+padL,py);context.lineTo(x0+boxW-padR,py);context.stroke();context.textAlign='right';context.fillText(elevation.toFixed(0),x0+padL-7*scale,py+3*scale)}
 context.strokeStyle='rgba(174,187,179,.10)';context.lineWidth=.5*scale;
 if(drawDistanceGrid)for(let index=1;index<=gridCount;index++){const px=x(index*gridStep);context.beginPath();context.moveTo(px,y0+padT);context.lineTo(px,y0+boxH-padB);context.stroke()}
 context.strokeStyle='#506058';context.lineWidth=.6*scale;for(const ratio of [0,.5,1]){const px=x(extent.maxDistanceM*ratio);context.beginPath();context.moveTo(px,y0+padT);context.lineTo(px,y0+boxH-padB);context.stroke();context.fillStyle='#aebbb3';context.textAlign='center';context.fillText((extent.maxDistanceM*ratio/(km?1000:1)).toFixed(ratio===0?0:1),px,y0+boxH-12*scale)}
 context.fillStyle='#e1e8e3';context.font=`700 ${axisFontSize}px Inter,ui-sans-serif,system-ui,sans-serif`;context.textAlign='left';context.fillText(translateText('Cota (m)'),x0+8*scale+5*axisFontSize*.6,y0+49*scale);context.textAlign='right';context.fillText(`${translateText('Distancia')} (${km?'km':'m'})`,x0+boxW-padR-18*scale-7*axisFontSize*.6,y0+boxH-12*scale);
 for(const item of series){context.strokeStyle=item.color;context.lineWidth=Math.max(2*scale,height/360);context.beginPath();item.samples.forEach((sample,index)=>{const px=x(sample.distanceM),py=y(sample.elevationM);if(index)context.lineTo(px,py);else context.moveTo(px,py)});context.stroke();const target=p*(item.samples.at(-1)?.distanceM??0);let index=item.samples.findIndex(sample=>sample.distanceM>=target);if(index<0)index=item.samples.length-1;const b=item.samples[index],a=item.samples[Math.max(0,index-1)],span=b.distanceM-a.distanceM,t=span?(target-a.distanceM)/span:0,px=x(a.distanceM+(b.distanceM-a.distanceM)*t),py=y(a.elevationM+(b.elevationM-a.elevationM)*t);context.fillStyle='#fff';context.beginPath();context.arc(px,py,6*scale,0,Math.PI*2);context.fill();context.fillStyle=item.color;context.beginPath();context.arc(px,py,3.5*scale,0,Math.PI*2);context.fill()}
 context.restore();
}
