import {describe,it,expect} from 'vitest';
import {MAX_ELEVATION_CELLS,elevationSizeAllowed} from './elevationLimits';
import {ELEVATION_SOURCES} from './elevationSources';
describe('límite común de modelos de elevación',()=>{
 it.each(Object.keys(ELEVATION_SOURCES))('permite el máximo para %s sin distinguir proveedor',()=>{
  expect(elevationSizeAllowed(5000,6000)).toBe(true);
  expect(elevationSizeAllowed(8192,8292)).toBe(true);
  expect(elevationSizeAllowed(8292,8192)).toBe(true);
 });
 it('limita el total, no la forma de la rejilla',()=>{
  expect(MAX_ELEVATION_CELLS).toBe(8192*8292);
  expect(elevationSizeAllowed(16000,4000)).toBe(true);
  for(const [columns,rows] of [[8192,8293],[8293,8192],[0,5000],[NaN,5000],[5000,Infinity],[2.5,4000],[Number.MAX_SAFE_INTEGER,2]])expect(elevationSizeAllowed(columns,rows)).toBe(false);
 });
});
