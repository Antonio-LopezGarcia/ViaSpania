import {afterEach,expect,it,vi} from 'vitest';
import {nextMediaFileName} from './mediaFileName';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals()});
it('reserves distinct names and resumes persisted counters',()=>{
 const storage=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)});
 vi.useFakeTimers();vi.setSystemTime(new Date(2026,8,15,11,33));
 localStorage.setItem('viaspania.media-name.Guadix_v_orbit_151133.avi','3');
 expect(nextMediaFileName('Guadix','v','orbit')).toBe('Guadix_v_orbit_151133_4.avi');
 expect(nextMediaFileName('Guadix','v','orbit')).toBe('Guadix_v_orbit_151133_5.avi');
 expect(nextMediaFileName('Guadix','gif','routes')).toBe('Guadix_gif_rts_151133.gif');
});
