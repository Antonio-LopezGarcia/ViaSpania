import {BUILD_INFO} from './buildInfo';

export interface WatermarkLayout {x:number;y:number;width:number;height:number;padding:number;logoSize:number;fontSize:number}

export function exportWatermarkLayout(width:number,height:number,sizeMultiplier=1):WatermarkLayout{
  const shortest=Math.max(1,Math.min(width,height)),scale=Math.max(.55,Math.min(1.5,shortest/720))*sizeMultiplier,padding=Math.round(8*scale),logoSize=Math.round(28*scale),fontSize=Math.round(15*scale),watermarkWidth=Math.round(190*scale),watermarkHeight=logoSize+padding*2,margin=Math.round(12*scale);
  return{x:Math.max(0,width-watermarkWidth-margin),y:Math.max(0,height-watermarkHeight-margin),width:Math.min(width,watermarkWidth),height:watermarkHeight,padding,logoSize,fontSize};
}

export function drawViaSpaniaWatermark(context:CanvasRenderingContext2D,width:number,height:number,sizeMultiplier=1,outlineColor?:string){
  const layout=exportWatermarkLayout(width,height,sizeMultiplier),radius=Math.max(4,Math.round(layout.height*.18));
  context.save();
  context.globalAlpha=.88;
  context.fillStyle='#101814';
  context.beginPath();
  context.roundRect(layout.x,layout.y,layout.width,layout.height,radius);
  context.fill();
  if(outlineColor){context.strokeStyle=outlineColor;context.lineWidth=Math.max(1,layout.logoSize/28);context.lineJoin='round';context.stroke()}
  const logoX=layout.x+layout.padding,logoY=layout.y+layout.padding,unit=layout.logoSize/200;
  context.save();
  context.translate(logoX,logoY);
  context.scale(unit,unit);
  context.beginPath();
  context.moveTo(27,165);context.lineTo(27,132);context.bezierCurveTo(42,127,50,127,60,116);context.bezierCurveTo(70,105,77,102,87,107);context.bezierCurveTo(97,112,102,122,113,112);context.bezierCurveTo(124,102,128,83,141,82);context.bezierCurveTo(155,81,162,90,173,67);context.lineTo(173,174);context.lineTo(27,174);context.closePath();
  context.fillStyle='#31473d';context.fill();
  context.beginPath();
  context.moveTo(43,91);context.quadraticCurveTo(61,109,79,125);context.bezierCurveTo(94,119,98,101,112,97);context.bezierCurveTo(126,93,130,76,142,69);context.quadraticCurveTo(149,63,155,55);
  context.strokeStyle='#d7ff55';context.lineWidth=9.5;context.lineCap='round';context.stroke();
  for(const point of [{x:43,y:91,color:'#55c9f6'},{x:79,y:125,color:'#f4b942'},{x:155,y:55,color:'#f97770'}]){
    context.beginPath();context.arc(point.x,point.y,12,0,Math.PI*2);context.fillStyle=point.color;context.fill();
  }
  context.restore();
  context.fillStyle='#f3f7f4';
  context.font=`700 ${layout.fontSize}px sans-serif`;
  context.textAlign='left';
  context.textBaseline='middle';
  context.fillText(`ViaSpania (${BUILD_INFO.version})`,logoX+layout.logoSize+layout.padding,layout.y+layout.height/2);
  context.restore();
}
