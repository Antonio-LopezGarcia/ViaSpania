import {describe,it,expect} from 'vitest';
import {MjpegAviEncoder,MjpegAviStream} from './mjpegAvi';
describe('AVI determinista',()=>{
 it('escribe más de 100 MB sin retener los JPEG y finaliza una cabecera de 224 bytes',()=>{
  const encoder=new MjpegAviStream(1920,1080),jpeg=new Uint8Array(1_000_000);jpeg.set([255,216]);
  for(let i=0;i<110;i++)expect(encoder.addFrame(jpeg).length).toBe(1_000_008);
  const {header,index}=encoder.finish();expect(header.length).toBe(224);expect(index.length).toBe(8+110*16);
  expect(new DataView(header.buffer).getUint32(4,true)+8).toBe(224+110*1_000_008+index.length);
 });
 it('conserva cada JPEG y genera índice y duración a 30 fps',()=>{
  const encoder=new MjpegAviEncoder(1280,720,30),first=new Uint8Array([255,216,1,255,217]),second=new Uint8Array([255,216,2,3,255,217]);
  encoder.addFrame(first);encoder.addFrame(second);const bytes=encoder.finish(),text=new TextDecoder('latin1').decode(bytes),view=new DataView(bytes.buffer);
  expect(text.slice(0,4)).toBe('RIFF');expect(view.getUint32(4,true)).toBe(bytes.length-8);expect(text.slice(8,12)).toBe('AVI ');
  const header=text.indexOf('avih')+8;expect(view.getUint32(header+16,true)).toBe(2);expect(view.getUint32(header+32,true)).toBe(1280);
  const stream=text.indexOf('strh')+8;expect(view.getUint32(stream+20,true)).toBe(1);expect(view.getUint32(stream+24,true)).toBe(30);expect(view.getUint32(stream+32,true)).toBe(2);
  const movi=text.indexOf('movi'),index=text.indexOf('idx1')+8;
  [first,second].forEach((frame,i)=>{const entry=index+i*16,offset=view.getUint32(entry+8,true),size=view.getUint32(entry+12,true);expect(size).toBe(frame.length);expect(bytes.slice(movi+offset+8,movi+offset+8+size)).toEqual(frame)});
  expect(()=>encoder.finish()).toThrow('No hay fotogramas');
 });
 it('rechaza dimensiones, JPEG inválido y exceso de memoria',()=>{expect(()=>new MjpegAviEncoder(0,720)).toThrow();const encoder=new MjpegAviEncoder(2,2,30,28);expect(()=>encoder.addFrame(new Uint8Array([1]))).toThrow('JPEG');encoder.addFrame(new Uint8Array([255,216,255,217]));expect(()=>encoder.addFrame(new Uint8Array([255,216]))).toThrow('límite');encoder.dispose();expect(()=>encoder.finish()).toThrow()});
});
