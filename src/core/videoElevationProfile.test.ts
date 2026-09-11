import {describe,it,expect,vi} from 'vitest';
import {drawAnimatedElevationProfile,videoProfileSeries} from './videoElevationProfile';
describe('perfil altimétrico animado',()=>{
 const routes=[{label:'Ida',color:'#f00',coordinates:[[0,0],[.01,0]] as [number,number][],elevationsM:[100,200]},{label:'Sin cotas',color:'#0f0',coordinates:[[0,0],[.01,0]] as [number,number][]},{label:'Vuelta',color:'#00f',coordinates:[[0,0],[0,.02]] as [number,number][],elevationsM:[150,125]}];
 it('reutiliza cotas de las rutas, descarta series incompletas y conserva su índice',()=>{const series=videoProfileSeries(routes);expect(series.map(item=>[item.routeIndex,item.label,item.samples.map(s=>s.elevationM)])).toEqual([[0,'Ida',[100,200]],[2,'Vuelta',[150,125]]]);expect(series[0].samples[1].distanceM).toBeGreaterThan(1100)});
 it('mueve los indicadores desde el inicio al final y mantiene las dos líneas',()=>{const arcs:number[][]=[],moves:number[][]=[],context=new Proxy({arc:vi.fn((...args:number[])=>arcs.push(args)),moveTo:vi.fn((...args:number[])=>moves.push(args))},{get:(target,key)=>key in target?target[key as keyof typeof target]:vi.fn(),set:()=>true}) as unknown as CanvasRenderingContext2D,series=videoProfileSeries(routes);drawAnimatedElevationProfile(context,1280,720,series,0);const starts=arcs.filter(a=>a[2]===6).map(a=>a.slice(0,2));arcs.length=0;drawAnimatedElevationProfile(context,1280,720,series,1);const ends=arcs.filter(a=>a[2]===6).map(a=>a.slice(0,2));expect(starts).toHaveLength(2);expect(ends).toHaveLength(2);expect(ends[0][0]).toBeGreaterThan(starts[0][0]);expect(moves.length).toBeGreaterThan(2)});
 it('no dibuja cuando no hay perfiles válidos',()=>{const save=vi.fn(),context=new Proxy({save},{get:(target,key)=>key in target?target[key as keyof typeof target]:vi.fn(),set:()=>true}) as unknown as CanvasRenderingContext2D;drawAnimatedElevationProfile(context,800,480,[],.5);expect(save).not.toHaveBeenCalled()});
});

it('traduce los títulos dibujados directamente en el vídeo',async()=>{
 const {setLanguage}=await import('./i18n');setLanguage('en');
 const fillText=vi.fn(),context=new Proxy({fillText},{get:(target,key)=>key==='fillText'?target.fillText:vi.fn(),set:()=>true}) as unknown as CanvasRenderingContext2D;
 drawAnimatedElevationProfile(context,1280,720,videoProfileSeries([{label:'A',color:'#fff',coordinates:[[0,0],[.01,0]],elevationsM:[10,20]}]),.5);
 expect(fillText).toHaveBeenCalledWith('Elevation profile',expect.any(Number),expect.any(Number));expect(fillText.mock.calls.some(call=>String(call[0]).startsWith('Distance ·'))).toBe(true);setLanguage('es');
});

it('reserva espacio bajo el perfil para créditos de varias líneas',()=>{
 const roundRect=vi.fn(),context=new Proxy({roundRect},{get:(target,key)=>key==='roundRect'?target.roundRect:vi.fn(),set:()=>true}) as unknown as CanvasRenderingContext2D;
 const series=videoProfileSeries([{label:'A',color:'#fff',coordinates:[[0,0],[.01,0]],elevationsM:[10,20]}]);
 drawAnimatedElevationProfile(context,1280,720,series,.5,110);
 const [,top,,height]=roundRect.mock.calls[0];
 expect(top+height).toBeLessThanOrEqual(720-110);
});
