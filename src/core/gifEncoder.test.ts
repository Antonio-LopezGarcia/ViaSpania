import { describe,expect,it } from 'vitest';
import { encodeGif } from './gifEncoder';
describe('exportación GIF',()=>{it('genera una animación GIF89a con sus dimensiones',()=>{const frame={width:2,height:1,data:new Uint8ClampedArray([255,0,0,255,0,255,0,255]),colorSpace:'srgb'} as ImageData,bytes=encodeGif([frame,frame],100);expect(new TextDecoder().decode(bytes.slice(0,6))).toBe('GIF89a');expect([...bytes.slice(6,10)]).toEqual([2,0,1,0]);expect(bytes.at(-1)).toBe(59)})});
