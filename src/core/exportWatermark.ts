export interface WatermarkLayout {x:number;y:number;width:number;height:number;padding:number;logoSize:number;fontSize:number}

export function exportWatermarkLayout(width:number,height:number):WatermarkLayout{
  const shortest=Math.max(1,Math.min(width,height)),scale=Math.max(.55,Math.min(1.5,shortest/720)),padding=Math.round(8*scale),logoSize=Math.round(28*scale),fontSize=Math.round(15*scale),watermarkWidth=Math.round(128*scale),watermarkHeight=logoSize+padding*2,margin=Math.round(12*scale);
  return{x:Math.max(0,width-watermarkWidth-margin),y:Math.max(0,height-watermarkHeight-margin),width:Math.min(width,watermarkWidth),height:Math.min(height,watermarkHeight),padding,logoSize,fontSize};
}

export function drawViaSpaniaWatermark(context:CanvasRenderingContext2D,width:number,height:number){
  const layout=exportWatermarkLayout(width,height),radius=Math.max(4,Math.round(layout.height*.18));
  context.save();
  context.globalAlpha=.88;
  context.fillStyle='#101713';
  context.beginPath();
  context.roundRect(layout.x,layout.y,layout.width,layout.height,radius);
  context.fill();
  context.globalAlpha=1;
  const logoX=layout.x+layout.padding,logoY=layout.y+layout.padding;
  context.fillStyle='#d8ff55';
  context.beginPath();
  context.roundRect(logoX,logoY,layout.logoSize,layout.logoSize,Math.max(3,Math.round(layout.logoSize*.22)));
  context.fill();
  context.fillStyle='#111';
  context.font=`900 ${Math.max(8,Math.round(layout.logoSize*.42))}px sans-serif`;
  context.textAlign='center';
  context.textBaseline='middle';
  context.fillText('VS',logoX+layout.logoSize/2,logoY+layout.logoSize/2+.5);
  context.fillStyle='#f3f7f4';
  context.font=`700 ${layout.fontSize}px sans-serif`;
  context.textAlign='left';
  context.fillText('ViaSpania',logoX+layout.logoSize+layout.padding,layout.y+layout.height/2);
  context.restore();
}

