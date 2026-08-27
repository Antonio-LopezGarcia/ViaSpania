import { describe,expect,it } from 'vitest';
import { shouldStartTutorial } from './tutorial';

describe('tutorial inicial',()=>{
  it('se abre solo si está activado y aún no se ha completado',()=>{
    expect(shouldStartTutorial(true,null)).toBe(true);
    expect(shouldStartTutorial(true,'true')).toBe(false);
    expect(shouldStartTutorial(false,null)).toBe(false);
  });
});
