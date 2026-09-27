import {describe,expect,it,vi} from 'vitest';
import {MODELS} from './costModels';
import {comparisonRouteColor} from './comparisonColors';
import {drawVideoRouteLegend,videoRouteLegendItems} from './videoRouteLegend';
import {drawVideoContourLegend} from './videoContourLegend';

function canvas(){
 return {font:'',save:vi.fn(),restore:vi.fn(),measureText(text:string){return {width:text.length*parseFloat(this.font.replace(/^600 /,''))*.65}},fillText:vi.fn(),fillRect:vi.fn()};
}
const models=Object.values(MODELS),order=models.map(model=>model.id);
const calculated=models.map(model=>({id:`comparison-${model.id}`,label:model.name,color:comparisonRouteColor(model.id,order),visible:true}));

describe('leyendas de rutas en vídeo',()=>{
 it('conserva orden, nombres y colores del cálculo sin incluir capas ocultas ni otros modos',()=>{
  const items=[calculated[7],{...calculated[2],visible:false},calculated[4],{id:'global-contour-100',label:'Curva',color:'#abcdef',visible:true},{id:'multiroute-0',label:'Otra',color:'#abcdef',visible:true}];
  expect(videoRouteLegendItems(items)).toEqual([calculated[7],calculated[4]].map(({label,color})=>({label,color})));
  expect(videoRouteLegendItems([{id:'simple-1',label:'Vuelta',color:'#123456',visible:true}])).toEqual([{label:'Vuelta',color:'#123456'}]);
 });
 it.each([2,7,15].flatMap(count=>[[854,480],[1280,720],[1920,1080]].map(([width,height])=>({count,width,height}))))('encaja $count modelos a $width × $height sin recortar etiquetas ni invadir brújula, perfil o atribuciones',({count,width,height})=>{
  const context=canvas(),items=videoRouteLegendItems(calculated.slice(0,count));
  const bottom=height-Math.min(height*.27,230)-64-40;
  const layout=drawVideoRouteLegend(context as unknown as CanvasRenderingContext2D,width,height,items,bottom)!;
  expect(context.fillText.mock.calls.map(call=>call[0])).toEqual(['Rutas',...items.map(item=>item.label)]);
  expect(layout.fontSize).toBeGreaterThanOrEqual(12);
  expect(layout.y+layout.height).toBeLessThan(bottom);
  expect(layout.x+layout.width).toBeLessThan(width-2*Math.max(28,height*.055)-18);
  for(const [label,x,y] of context.fillText.mock.calls){
   expect(x+context.measureText(label).width).toBeLessThanOrEqual(layout.x+layout.width-layout.padding);
   expect(y+layout.fontSize/2).toBeLessThan(layout.y+layout.height);
  }
 });
 it('apila las leyendas para que no se tapen entre sí',()=>{
  const context=canvas(),ctx=context as unknown as CanvasRenderingContext2D;
  const contours=drawVideoContourLegend(ctx,1920,1080,[{label:'100 m',color:'#abcdef'}],740)!;
  const routes=drawVideoRouteLegend(ctx,1920,1080,videoRouteLegendItems(calculated),740,contours.y+contours.height+12)!;
  expect(routes.y).toBeGreaterThan(contours.y+contours.height);
  expect(routes.y+routes.height).toBeLessThan(740);
 });
 it('no dibuja una leyenda vacía y avisa en español si no hay espacio legible',()=>{
  const context=canvas(),ctx=context as unknown as CanvasRenderingContext2D;
  drawVideoRouteLegend(ctx,854,480,[],400);expect(context.save).not.toHaveBeenCalled();
  expect(()=>drawVideoRouteLegend(ctx,854,480,calculated,40)).toThrow('La leyenda de rutas no cabe de forma legible');
  expect(context.restore).toHaveBeenCalledOnce();
 });
});
