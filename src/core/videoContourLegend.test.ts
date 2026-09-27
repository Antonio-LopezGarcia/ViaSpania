import {describe,expect,it,vi} from 'vitest';
import {drawVideoContourLegend,videoContourLegendItems,videoContourLegendLayout} from './videoContourLegend';

describe('leyenda de curvas del vídeo',()=>{
 it('reutiliza valores del visor y colores renderizados; excluye capas ocultas y otros resultados',()=>{
  const color=vi.fn((level:number,explicit?:string)=>level===-12.5&&!explicit?'#12abcd':level===50&&explicit==='#abcdef'?'#abcdef':undefined);
  const items=[
   {id:'contour--12.5',label:'−12,5 m',color:'#000000',visible:true},
   {id:'global-contour-50',label:'Curva · 50 m',color:'#abcdef',visible:true},
   {id:'contour-100',label:'100 m',color:'#123456',visible:false},
   {id:'isochrone-50',label:'1 min',color:'#abcdef',visible:true},
   {id:'simple-0',label:'Ida',color:'#abcdef',visible:true},
   {id:'contour-200',label:'200 m',color:'#abcdef',visible:true},
  ];
  expect(videoContourLegendItems(items,color)).toEqual([{label:'−12,5 m',color:'#12abcd'},{label:'Curva · 50 m',color:'#abcdef'}]);
 });
 it.each([[854,480],[1280,720],[1920,1080]])('ajusta 24 valores a %s × %s sin recortes ni solapamientos', (width,height)=>{
  const fontSize=Math.max(12,Math.round(height/55)),textWidth=fontSize*7,layout=videoContourLegendLayout(width,height,Array(24).fill(textWidth),fontSize*10)!;
  expect(layout.fontSize).toBeGreaterThanOrEqual(12);
  expect(layout.x+layout.width).toBeLessThan(width*.7);
  expect(layout.y+layout.height).toBeLessThanOrEqual(height*.45);
  for(let index=0;index<24;index++){
   const x=layout.x+layout.padding+Math.floor(index/layout.rows)*layout.columnWidth+layout.swatchWidth+layout.gap;
   const y=layout.y+layout.padding+layout.headerHeight+(index%layout.rows+.5)*layout.rowHeight;
   expect(x+textWidth).toBeLessThanOrEqual(layout.x+layout.width-layout.padding);
   expect(y+fontSize/2).toBeLessThan(layout.y+layout.height);
  }
 });
 it('respeta el espacio reservado a atribuciones y perfil y avisa si no cabe',()=>{
  const layout=videoContourLegendLayout(1280,720,[60,60,60],120,180)!;
  expect(layout.y+layout.height).toBeLessThan(180);
  expect(()=>videoContourLegendLayout(854,480,Array(1000).fill(70),120)).toThrow('no cabe de forma legible');
  expect(()=>videoContourLegendLayout(854,480,[70],120,40)).toThrow('no cabe de forma legible');
 });
 it('dibuja todos los valores y símbolos sólidos sin cambiar el estado del contexto',()=>{
  const symbols:{color:unknown;width:number;height:number}[]=[],context={fillStyle:'',save:vi.fn(),restore:vi.fn(),measureText:(s:string)=>({width:s.length*8}),fillText:vi.fn(),fillRect(_x:number,_y:number,width:number,height:number){symbols.push({color:this.fillStyle,width,height})}};
  drawVideoContourLegend(context as unknown as CanvasRenderingContext2D,1280,720,[{label:'100 m',color:'#12abcd'},{label:'200 m',color:'#abcdef'}]);
  expect(context.fillText.mock.calls.map(call=>call[0])).toEqual(['Curvas de nivel','100 m','200 m']);
  expect(symbols.slice(1).map(symbol=>symbol.color)).toEqual(['#12abcd','#abcdef']);
  expect(symbols.slice(1).every(symbol=>symbol.width>symbol.height)).toBe(true);
  expect(context.restore).toHaveBeenCalledOnce();
 });
 it('no dibuja nada sin curvas visibles',()=>{
  const save=vi.fn();drawVideoContourLegend({save} as unknown as CanvasRenderingContext2D,854,480,[]);expect(save).not.toHaveBeenCalled();
 });
});
