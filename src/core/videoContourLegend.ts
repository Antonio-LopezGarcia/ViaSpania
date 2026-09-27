import {drawVideoLegend,videoLegendLayout} from './videoLegend';

interface ViewerLegendItem {id:string;label:string;color:string;visible:boolean}
export interface VideoContourLegendItem {label:string;color:string}
export const isVisibleContourLegendItem=(item:ViewerLegendItem)=>item.visible&&/^(?:global-)?contour-/.test(item.id);

/** Reuse viewer labels and rendered colours, including the renderer's fallback
 * palette when a contour has no explicit colour. Never include isochrones/routes.
 */
export function videoContourLegendItems(items:readonly ViewerLegendItem[],lineColor:(level:number,color?:string)=>string|undefined):VideoContourLegendItem[]{
 return items.filter(isVisibleContourLegendItem).flatMap(item=>{
  const level=Number(item.id.replace(/^(?:global-)?contour-/,''));
  if(!Number.isFinite(level))return [];
  const color=lineColor(level,item.color)??lineColor(level);
  return color?[{label:item.label,color}]:[];
 });
}

const options={title:'Curvas de nivel',errorMessage:'La leyenda de curvas de nivel no cabe de forma legible en el vídeo. Reduzca las curvas visibles o aumente la resolución.'};
export function videoContourLegendLayout(width:number,height:number,labelWidths:readonly number[],titleWidth:number,bottom?:number){
 return videoLegendLayout(width,height,labelWidths,titleWidth,bottom,options);
}
export function drawVideoContourLegend(context:CanvasRenderingContext2D,width:number,height:number,items:readonly VideoContourLegendItem[],bottom?:number){
 return drawVideoLegend(context,width,height,items,bottom,options);
}
