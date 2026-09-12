import {exportWatermarkLayout} from './exportWatermark';
import {getLanguage,translateText} from './i18n';
/** Scene axes: +X east, -Z north. Returns a geographic bearing in degrees. */
export function cameraHeading(x:number,z:number){return(Math.atan2(x,-z)*180/Math.PI+360)%360}
export function drawVideoCompass(context:CanvasRenderingContext2D,width:number,height:number,heading:number){
 const radius=Math.max(28,Math.min(width,height)*.055),x=width-radius-18,y=radius+18;
 context.save();context.translate(x,y);context.fillStyle='rgba(7,16,13,.85)';context.strokeStyle='#ffffff';context.lineWidth=2;
 context.beginPath();context.arc(0,0,radius,0,Math.PI*2);context.fill();context.stroke();
 context.font=`bold ${Math.round(radius*.32)}px sans-serif`;context.textAlign='center';context.textBaseline='middle';
 context.save();context.rotate(-heading*Math.PI/180);
 for(const [label,angle] of [['N',0],['E',90],['S',180],['O',270]] as const){const a=angle*Math.PI/180;context.fillStyle=label==='N'?'#ff6960':'#ffffff';context.fillText(label==='O'&&getLanguage()==='en'?'W':label,Math.sin(a)*radius*.7,-Math.cos(a)*radius*.7)}
 context.restore();context.fillStyle='#d8ff55';context.beginPath();context.moveTo(0,-radius*.35);context.lineTo(-radius*.16,radius*.15);context.lineTo(radius*.16,radius*.15);context.closePath();context.fill();
 context.fillStyle='#ffffff';context.font=`${Math.round(radius*.25)}px sans-serif`;context.fillText(`${Math.round(heading)%360}°`,0,radius*.48);context.restore();
}
export function drawVideoAttribution(context:CanvasRenderingContext2D,width:number,height:number,text:string){
 context.save();context.font=`${Math.max(10,Math.round(height/70))}px sans-serif`;context.textAlign='left';context.textBaseline='bottom';
 const maxWidth=exportWatermarkLayout(width,height).x-24,lineHeight=Math.max(14,Math.round(height/70)+4),lines:string[]=[];let line='';
 if(maxWidth<40){context.restore();throw new Error('La imagen es demasiado pequeña para conservar las atribuciones. Aumente la resolución.')}
 for(const character of translateText(text)){if(character==='\n'||(line&&context.measureText(line+character).width>maxWidth)){lines.push(line);line=''}if(character!=='\n')line+=character}if(line)lines.push(line);
 if(lines.length*lineHeight>height-20){context.restore();throw new Error('Las atribuciones no caben en la imagen. Aumente la resolución o reduzca las capas.')}
 context.fillStyle='rgba(7,16,13,.8)';context.fillRect(8,height-10-lines.length*lineHeight,maxWidth+12,lines.length*lineHeight+4);context.fillStyle='#ffffff';lines.forEach((value,index)=>context.fillText(value,14,height-10-(lines.length-1-index)*lineHeight));context.restore();return height-10-lines.length*lineHeight;
}
