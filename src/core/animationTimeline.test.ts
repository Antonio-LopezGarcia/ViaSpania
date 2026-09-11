import { describe,expect,it } from 'vitest';
import { animationRouteProgress,flyoverCamera,prepareRoutePath,videoExportPlan,advanceTimeline,exportFrameCount,exportFrameProgress,gifExportPlan,resetTimeline,routeRevealPosition,routeTimelineProgress,timelineDescription } from './animationTimeline';
describe('timeline 3D',()=>{const state={mode:'orbit' as const,progress:0,playing:true,speed:2,durationSeconds:10};it('avanza con velocidad y duración comunes',()=>expect(advanceTimeline(state,2).progress).toBe(.4));it('se detiene al completar',()=>expect(advanceTimeline(state,20)).toMatchObject({progress:1,playing:false}));it('se reinicia sin cambiar el modo',()=>expect(resetTimeline({...state,progress:.7})).toMatchObject({mode:'orbit',progress:0,playing:false}));it('describe la exportación',()=>expect(timelineDescription(state,1280,720)).toBe('1280 × 720 px · 10.0 s · 2×'));it('respeta la duración real independiente de cada ruta',()=>{expect(routeTimelineProgress(.25,100,50)).toBe(.5);expect(routeTimelineProgress(.75,100,50)).toBe(1);expect(routeTimelineProgress(.4,100)).toBe(.4)});it('revela las rutas por distancia y no por cantidad de vértices',()=>{expect(routeRevealPosition(.25,[10,30])).toEqual({segmentIndex:0,fraction:1});expect(routeRevealPosition(.5,[10,30])).toEqual({segmentIndex:1,fraction:1/3});expect(routeRevealPosition(1,[10,30])).toEqual({segmentIndex:1,fraction:1})})});
describe('plan de exportación animada',()=>{it('genera progreso estable por fotograma sin depender del reloj',()=>{expect(exportFrameCount(2,30)).toBe(61);expect(exportFrameProgress(30,61)).toBe(.5);expect(exportFrameProgress(60,61)).toBe(1)});it('permite GIF HD y limita memoria y fotogramas',()=>{expect(gifExportPlan(854,480,2)).toEqual({width:854,height:480,count:17});const hd=gifExportPlan(1920,1080,20);expect(hd).toMatchObject({width:1280,height:720});expect(hd.count).toBeLessThanOrEqual(120);expect(hd.width*hd.height*hd.count).toBeLessThanOrEqual(72_000_000)})});

describe('sincronización del perfil y el seguimiento a vista de pájaro',()=>{
 const path=prepareRoutePath([[0,0,0],[100,0,0]]);
 it('mantiene el perfil en el inicio durante todo el acercamiento',()=>{
  for(const progress of [0,.05,.1,.15])expect(animationRouteProgress('flyover',progress)).toBe(0);
  expect(animationRouteProgress('flyover',.16)).toBeGreaterThan(0);
  expect(animationRouteProgress('flyover',.575)).toBeCloseTo(.5);
  expect(animationRouteProgress('flyover',1)).toBe(1);
 });
 it.each([['vídeo',videoExportPlan(10).count],['GIF',gifExportPlan(854,480,10).count]] as const)('sincroniza cada fotograma de %s con la posición de la ruta',(_format,count)=>{
  for(let index=0;index<count;index++){
   const progress=exportFrameProgress(index,count),profileProgress=animationRouteProgress('flyover',progress),camera=flyoverCamera(path,progress,45,10);
   expect(profileProgress).toBe(camera.progress);
   expect(camera.target[0]).toBeCloseTo(profileProgress*100);
  }
 });
 it('conserva el avance lineal del modo recorrido de rutas',()=>{
  for(const progress of [0,.1,.15,.5,1])expect(animationRouteProgress('routes',progress)).toBe(progress);
 });
});
