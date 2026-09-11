import {describe,it,expect,vi} from 'vitest';
import {cameraHeading,drawVideoCompass} from './videoOverlays';
describe('brújula del vídeo',()=>{
 it('calcula el rumbo con los ejes del terreno',()=>{expect(cameraHeading(0,-1)).toBe(0);expect(cameraHeading(1,0)).toBe(90);expect(cameraHeading(0,1)).toBe(180);expect(cameraHeading(-1,0)).toBe(270)});
 it('dibuja la brújula arriba a la derecha y gira los puntos cardinales',()=>{
  const c={save:vi.fn(),restore:vi.fn(),translate:vi.fn(),rotate:vi.fn(),beginPath:vi.fn(),arc:vi.fn(),fill:vi.fn(),stroke:vi.fn(),fillText:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),closePath:vi.fn()};
  drawVideoCompass(c as unknown as CanvasRenderingContext2D,1280,720,90);const [x,y]=c.translate.mock.calls[0];expect(x).toBeGreaterThan(1100);expect(y).toBeLessThan(100);expect(c.rotate).toHaveBeenCalledWith(-Math.PI/2);expect(c.fillText).toHaveBeenCalledWith('90°',0,expect.any(Number));expect(c.restore).toHaveBeenCalledTimes(2);
 });
});

it('usa W para el oeste en la exportación inglesa',async()=>{
 const {setLanguage}=await import('./i18n');setLanguage('en');
 const fillText=vi.fn(),context=new Proxy({fillText},{get:(target,key)=>key==='fillText'?target.fillText:vi.fn(),set:()=>true}) as unknown as CanvasRenderingContext2D;
 drawVideoCompass(context,1280,720,90);expect(fillText).toHaveBeenCalledWith('W',expect.any(Number),expect.any(Number));expect(fillText).not.toHaveBeenCalledWith('O',expect.any(Number),expect.any(Number));setLanguage('es');
});

it('conserva todos los caracteres de una atribución larga sin comprimirla en una línea',async()=>{
 const {drawVideoAttribution}=await import('./videoOverlays');const fillText=vi.fn(),context={save:vi.fn(),restore:vi.fn(),fillRect:vi.fn(),measureText:(text:string)=>({width:text.length*8}),fillText} as unknown as CanvasRenderingContext2D;
 const credit='© Fuente cartográfica https://example.org/licencia '.repeat(3);drawVideoAttribution(context,320,240,credit);
 expect(fillText.mock.calls.length).toBeGreaterThan(1);expect(fillText.mock.calls.map(call=>call[0]).join('')).toBe(credit);expect(fillText.mock.calls.every(call=>call.length===3)).toBe(true);
});

it('rechaza una salida que recortaría el crédito en lugar de guardarla incompleta',async()=>{
 const {drawVideoAttribution}=await import('./videoOverlays');const context={save:vi.fn(),restore:vi.fn(),measureText:(s:string)=>({width:s.length*8})} as unknown as CanvasRenderingContext2D;
 expect(()=>drawVideoAttribution(context,120,80,'© Fuente')).toThrow('demasiado pequeña');
});
