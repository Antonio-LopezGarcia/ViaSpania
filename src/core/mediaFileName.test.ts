import {describe,it,expect} from 'vitest';
import {mediaFileName} from './mediaFileName';
describe('media export names',()=>{
 const date=new Date(2026,8,15,11,33);
 it.each([['orbit','orbit'],['routes','rts'],['flyover','fly']] as const)('names %s videos and GIFs', (mode,code)=>{
  expect(mediaFileName('Guadix','v',mode,date)).toBe(`Guadix_v_${code}_151133.avi`);
  expect(mediaFileName('Guadix','gif',mode,date)).toBe(`Guadix_gif_${code}_151133.gif`);
 });
 it('pads local date fields and omits the frame mode',()=>{expect(mediaFileName('Guadix','frame','routes',new Date(2026,8,2,12,37))).toBe('Guadix_frame_021237.png')});
 it('sanitizes projects and distinguishes repeated exports',()=>{
  expect(mediaFileName(' Sierra / Nevada ','v','orbit',date,2)).toBe('Sierra___Nevada_v_orbit_151133_2.avi');
  expect(mediaFileName('','frame','orbit',date)).toBe('Proyecto_frame_151133.png');
 });
});
