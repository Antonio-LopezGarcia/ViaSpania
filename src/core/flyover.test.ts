import {describe,it,expect} from 'vitest';
import {prepareRoutePath,sampleRoutePath,flyoverCamera,videoExportPlan} from './animationTimeline';
describe('seguimiento a vista de pájaro',()=>{
 const path=prepareRoutePath([[0,0,0],[0,0,10],[0,0,100]]);
 it('recorre distancias y no índices de vértices',()=>{expect(sampleRoutePath(path,.5)).toEqual([0,0,50]);expect(sampleRoutePath(path,1)).toEqual([0,0,100])});
 it('acerca la cámara al inicio mirando al final y completa el recorrido',()=>{const start=flyoverCamera(path,0,45,10),zoom=flyoverCamera(path,.15,45,10),end=flyoverCamera(path,1,45,10);expect(start.target).toEqual([0,0,0]);expect(start.position[2]).toBeLessThan(0);expect(zoom.position[1]).toBeLessThan(start.position[1]);expect(end.target).toEqual([0,0,100]);expect(end.progress).toBe(1)});
 it('no salta al terminar el acercamiento',()=>{const bent=prepareRoutePath([[0,0,0],[100,0,0],[100,0,100]]);const a=flyoverCamera(bent,.15,45,20),b=flyoverCamera(bent,.150001,45,20);expect(Math.hypot(...a.position.map((v,i)=>v-b.position[i]))).toBeLessThan(.001)});
 it('admite puntos repetidos y rutas degeneradas sin NaN',()=>{const repeated=prepareRoutePath([[1,2,3],[1,2,3]]);expect(sampleRoutePath(repeated,.5)).toEqual([1,2,3]);expect(flyoverCamera(repeated,.5,45,10).position.every(Number.isFinite)).toBe(true)});
 it('produce duración y fps exactos sin un fotograma extra',()=>{expect(videoExportPlan(20)).toEqual({count:600,fps:30,durationSeconds:20});expect(()=>videoExportPlan(91)).toThrow();expect(()=>videoExportPlan(NaN)).toThrow()});
});
