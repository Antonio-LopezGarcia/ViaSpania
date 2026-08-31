import {describe,expect,it} from 'vitest';
import {BUILD_INFO,buildDateLabel} from './buildInfo';
describe('identificación de compilación',()=>{it('expone un build trazable',()=>{expect(BUILD_INFO.version).toMatch(/^\d+\.\d+\.\d+/);expect(BUILD_INFO.id).toContain(BUILD_INFO.version);expect(BUILD_INFO.commit.length).toBeGreaterThan(6);expect(BUILD_INFO.platform).toBeTruthy()});it('presenta la fecha en UTC',()=>expect(buildDateLabel('2026-08-27T12:34:56.000Z')).toBe('2026-08-27 12:34:56 UTC'))});
