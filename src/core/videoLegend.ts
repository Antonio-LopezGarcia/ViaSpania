import {translateText} from './i18n';

export interface VideoLegendItem {label:string;color:string}
export interface VideoLegendOptions {title:string;errorMessage:string;top?:number;maxHeightRatio?:number;maxWidthRatio?:number}

/** Layout dimensions are output pixels. Keep readable type and every value;
 * report overcrowding rather than silently dropping or clipping legend entries.
 */
export function videoLegendLayout(width:number,height:number,labelWidths:readonly number[],titleWidth:number,bottom=height*.45,options:VideoLegendOptions){
 if(!labelWidths.length)return null;
 const fontSize=Math.max(12,Math.round(height/55)),margin=Math.max(12,Math.round(height*.02)),padding=fontSize,rowHeight=fontSize*1.65,headerHeight=fontSize*2,swatchWidth=fontSize*1.8,gap=fontSize*.7;
 const top=options.top??margin,maxHeight=Math.min(height*(options.maxHeightRatio??.45),bottom-margin)-top,maxWidth=width*(options.maxWidthRatio??.7)-2*margin;
 const maxRows=Math.floor((maxHeight-2*padding-headerHeight)/rowHeight);
 const columnWidth=Math.max(...labelWidths)+swatchWidth+gap+padding;
 const rows=Math.min(labelWidths.length,maxRows),columns=rows>0?Math.ceil(labelWidths.length/rows):0;
 const boxWidth=Math.max(titleWidth+2*padding,columns*columnWidth+padding),boxHeight=2*padding+headerHeight+rows*rowHeight;
 if(rows<1||boxWidth>maxWidth)throw new Error(options.errorMessage);
 return {x:margin,y:top,width:boxWidth,height:boxHeight,fontSize,padding,rowHeight,headerHeight,swatchWidth,gap,columnWidth,rows};
}

export function drawVideoLegend(context:CanvasRenderingContext2D,width:number,height:number,items:readonly VideoLegendItem[],bottom:number|undefined,options:VideoLegendOptions){
 if(!items.length)return;
 context.save();
 try{
  const fontSize=Math.max(12,Math.round(height/55)),title=translateText(options.title);
  context.font=`600 ${fontSize}px sans-serif`;const titleWidth=context.measureText(title).width;
  context.font=`${fontSize}px sans-serif`;
  const labels=items.map(item=>translateText(item.label)),layout=videoLegendLayout(width,height,labels.map(label=>context.measureText(label).width),titleWidth,bottom,options)!;
  const {x,y,padding,rowHeight,headerHeight,swatchWidth,gap,columnWidth,rows}=layout;
  context.fillStyle='rgba(7,16,13,.88)';context.fillRect(x,y,layout.width,layout.height);
  context.fillStyle='#fff';context.textAlign='left';context.textBaseline='middle';context.font=`600 ${fontSize}px sans-serif`;
  context.fillText(title,x+padding,y+padding+headerHeight/2);context.font=`${fontSize}px sans-serif`;
  items.forEach((item,index)=>{
   const left=x+padding+Math.floor(index/rows)*columnWidth,centre=y+padding+headerHeight+(index%rows+.5)*rowHeight;
   // Reuse the solid line symbol and the colour supplied by the viewer.
   context.fillStyle=item.color;context.fillRect(left,centre-fontSize*.1,swatchWidth,fontSize*.2);
   context.fillStyle='#fff';context.fillText(labels[index],left+swatchWidth+gap,centre);
  });
  return layout;
 }finally{context.restore()}
}
