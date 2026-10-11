import {exportWatermarkLayout} from './exportWatermark';
import {getLanguage,translateText} from './i18n';
/** Scene axes: +X east, -Z north. Returns a geographic bearing in degrees. */
export function cameraHeading(x:number,z:number){return(Math.atan2(x,-z)*180/Math.PI+360)%360}
/** Draws the 3D viewer's compass and camera inclination gauge onto a report image. */
export function drawReportTerrainIndicators(context:CanvasRenderingContext2D,width:number,height:number,orientation:number,inclination:number){
 const heading=(360-orientation)%360,scale=Math.max(.55,Math.min(2,width/700,height/425)),box=112*scale,pad=8*scale,gap=8*scale,ring=94*scale,x=width-18*scale-box*2-gap,y=18*scale;
 const panel=(left:number,top:number)=>{context.fillStyle='rgba(11,21,17,.87)';context.strokeStyle='#617168';context.lineWidth=scale;context.beginPath();context.roundRect(left,top,box,box+30*scale,14*scale);context.fill();context.stroke()};
 const gauge=(cx:number,cy:number)=>{context.fillStyle='#0a100e';context.beginPath();context.arc(cx,cy,ring/2,0,Math.PI*2);context.fill();context.strokeStyle='#a8b6ae';context.lineWidth=2*scale;context.stroke();context.strokeStyle='#26342d';context.lineWidth=4*scale;context.beginPath();context.arc(cx,cy,ring*.42,0,Math.PI*2);context.stroke()};
 const compassX=x+box/2,centerY=y+pad+ring/2;panel(x,y);gauge(compassX,centerY);
 context.save();context.translate(compassX,centerY);context.rotate(-heading*Math.PI/180);context.textAlign='center';context.textBaseline='middle';context.font=`bold ${10*scale}px ui-monospace,monospace`;
 for(const [label,angle] of [['N',0],['E',90],['S',180],['O',270]] as const){const a=angle*Math.PI/180;context.fillStyle=label==='N'?'#ff6960':'#dce7df';context.fillText(label==='O'&&getLanguage()==='en'?'W':label,Math.sin(a)*ring*.39,-Math.cos(a)*ring*.39)}
 context.rotate(heading*Math.PI/180);context.fillStyle='#ff4f47';context.beginPath();context.moveTo(0,-ring*.31);context.lineTo(-5*scale,ring*.16);context.lineTo(5*scale,ring*.16);context.closePath();context.fill();context.fillStyle='#d8ff55';context.beginPath();context.moveTo(0,ring*.31);context.lineTo(-5*scale,-ring*.16);context.lineTo(5*scale,-ring*.16);context.closePath();context.fill();context.fillStyle='#111';context.beginPath();context.arc(0,0,5*scale,0,Math.PI*2);context.fill();context.strokeStyle='#fff';context.stroke();context.restore();
 context.fillStyle='#d8ff55';context.font=`bold ${11*scale}px ui-monospace,monospace`;context.textAlign='center';context.textBaseline='middle';context.fillText(`${Math.round(heading)%360}°`,compassX,y+pad+ring+11*scale);
 const tx=x+box+gap,tiltY=y;panel(tx,tiltY);const tcx=tx+box/2,tcy=tiltY+pad+ring/2;gauge(tcx,tcy);context.fillStyle='#15221c';context.fillRect(tcx-ring*.47,tcy-ring*.48,ring*.94,ring*.46);context.fillStyle='#0a100e';context.fillRect(tcx-ring*.47,tcy+ring*.02,ring*.94,ring*.46);context.strokeStyle='#53675c';context.lineWidth=2*scale;context.beginPath();context.moveTo(tcx-ring*.46,tcy);context.lineTo(tcx+ring*.46,tcy);context.stroke();context.save();context.translate(tcx,tcy);context.rotate(inclination*Math.PI/180);context.strokeStyle='#ffcf4a';context.lineWidth=3*scale;context.shadowColor='#000';context.shadowBlur=4*scale;context.beginPath();context.moveTo(-ring*.35,0);context.lineTo(ring*.35,0);context.stroke();context.restore();context.fillStyle='#111';context.beginPath();context.arc(tcx,tcy,5*scale,0,Math.PI*2);context.fill();context.strokeStyle='#fff';context.stroke();context.fillStyle='#d8ff55';context.font=`bold ${11*scale}px ui-monospace,monospace`;context.textAlign='center';context.textBaseline='middle';context.fillText(`${Number(inclination.toFixed(2))}°`,tcx,tiltY+pad+ring+11*scale);
}
export function drawVideoCompass(context:CanvasRenderingContext2D,width:number,height:number,heading:number){
 const is4k=width>=3840&&height>=2160,radius=Math.max(28,Math.min(width,height)*.055*(is4k?.88:1)),x=width-radius-18,y=radius+18;
 context.save();context.translate(x,y);context.fillStyle='rgba(7,16,13,.85)';context.strokeStyle='#ffffff';context.lineWidth=2;
 context.beginPath();context.arc(0,0,radius,0,Math.PI*2);context.fill();context.stroke();
 context.font=`bold ${Math.round(radius*.32)}px sans-serif`;context.textAlign='center';context.textBaseline='middle';
 context.save();context.rotate(-heading*Math.PI/180);
 for(const [label,angle] of [['N',0],['E',90],['S',180],['O',270]] as const){const a=angle*Math.PI/180;context.fillStyle=label==='N'?'#ff6960':'#ffffff';context.fillText(label==='O'&&getLanguage()==='en'?'W':label,Math.sin(a)*radius*.7,-Math.cos(a)*radius*.7)}
 context.restore();context.fillStyle='#d8ff55';context.beginPath();context.moveTo(0,-radius*.35);context.lineTo(-radius*.16,radius*.15);context.lineTo(radius*.16,radius*.15);context.closePath();context.fill();
 context.fillStyle='#ffffff';context.font=`${Math.round(radius*.25)}px sans-serif`;context.fillText(`${Math.round(heading)%360}°`,0,radius*.48);context.restore();
}
export function drawVideoAttribution(context:CanvasRenderingContext2D,width:number,height:number,text:string,watermarkScale=1){
 context.save();context.font=`${Math.max(10,Math.round(height/70))}px sans-serif`;context.textAlign='left';context.textBaseline='bottom';
 const maxWidth=exportWatermarkLayout(width,height,watermarkScale).x-24,lineHeight=Math.max(14,Math.round(height/70)+4),lines:string[]=[];let line='';
 if(maxWidth<40){context.restore();throw new Error('La imagen es demasiado pequeña para conservar las atribuciones. Aumente la resolución.')}
 for(const character of translateText(text)){if(character==='\n'||(line&&context.measureText(line+character).width>maxWidth)){lines.push(line);line=''}if(character!=='\n')line+=character}if(line)lines.push(line);
 if(lines.length*lineHeight>height-20){context.restore();throw new Error('Las atribuciones no caben en la imagen. Aumente la resolución o reduzca las capas.')}
 context.fillStyle='rgba(7,16,13,.8)';context.fillRect(8,height-10-lines.length*lineHeight,maxWidth+12,lines.length*lineHeight+4);context.fillStyle='#ffffff';lines.forEach((value,index)=>context.fillText(value,14,height-10-(lines.length-1-index)*lineHeight));context.restore();return height-10-lines.length*lineHeight;
}
