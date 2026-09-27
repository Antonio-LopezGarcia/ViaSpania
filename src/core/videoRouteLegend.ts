import {drawVideoLegend,type VideoLegendItem} from './videoLegend';

interface ViewerLegendItem extends VideoLegendItem {id:string;visible:boolean}
/** The viewer already supplies calculated routes with their original colour order.
 * Filtering here must never reassign colours or add models from the catalogue.
 */
export function videoRouteLegendItems(items:readonly ViewerLegendItem[]):VideoLegendItem[]{
 return items.filter(item=>item.visible&&/^(?:comparison-|simple-)/.test(item.id)).map(({label,color})=>({label,color}));
}
export function drawVideoRouteLegend(context:CanvasRenderingContext2D,width:number,height:number,items:readonly VideoLegendItem[],bottom:number,top?:number){
 return drawVideoLegend(context,width,height,items,bottom,{
  title:'Rutas',top,maxHeightRatio:.6,maxWidthRatio:.8,
  errorMessage:'La leyenda de rutas no cabe de forma legible en el vídeo. Aumente la resolución o desactive alguna leyenda.',
 });
}
