import {describe,expect,it} from 'vitest';
import {NOTIFICATION_PATTERNS,NOTIFICATION_SOUNDS} from './notificationSounds';

describe('sonidos de aviso',()=>{
  it('ofrece patrones reproducibles y seguros para todas las opciones',()=>{
    expect(Object.keys(NOTIFICATION_SOUNDS)).toEqual(Object.keys(NOTIFICATION_PATTERNS));
    for(const notes of Object.values(NOTIFICATION_PATTERNS)){
      expect(notes.length).toBeGreaterThan(0);
      expect(notes.every(note=>note.frequency>0&&note.delay>=0&&note.duration>0&&note.gain>0&&note.gain<=1)).toBe(true);
    }
  });
});
