import {describe,expect,it} from 'vitest';
import {MODELS} from './costModels';

const transition=(signedSlope:number)=>({horizontalDistanceM:1,surfaceDistanceM:1,elevationFromM:0,elevationToM:signedSlope, signedSlope,terrainMultiplier:1,isBarrier:false});
describe('perfiles MoveCost añadidos',()=>{
 it('Uriarte González reproduce los costes temporales base y es simétrico',()=>{
  for(const [s,cost] of [[0,.6115],[.1,.8885],[-.1,.8885],[.3,1.4425],[-.3,1.4425]]) expect(MODELS['uriarte-gonzalez'].transitionCost(transition(s))).toBeCloseTo(cost,8);
 });
 it('Marín Arroyo distingue descenso y ascenso usando el signo',()=>{
  for(const [s,cost] of [[0,.6],[-.1,.8608695652],[.1,1.1454545455],[-.3,1.3826086957],[.3,2.2363636364]]) expect(MODELS['marin-arroyo'].transitionCost(transition(s))).toBeCloseTo(cost,8);
  expect(MODELS['marin-arroyo'].transitionCost(transition(-.1))).toBeLessThan(MODELS['marin-arroyo'].transitionCost(transition(.1)));
 });
 it('Llobera–Sluckin usa energía y es simétrico',()=>{
  expect(MODELS['llobera-sluckin'].unit).toBe('kJ');
  for(const [s,cost] of [[0,2.635],[.1,4.775763],[.3,11.201623]]) {
   expect(MODELS['llobera-sluckin'].transitionCost(transition(s))).toBeCloseTo(cost,5);
   expect(MODELS['llobera-sluckin'].transitionCost(transition(-s))).toBeCloseTo(cost,5);
  }
 });
 it('Irmischer–Clarke mantiene simetría y las cuatro variantes alteran la velocidad',()=>{
  const variants=[['male','paths'],['male','off-path'],['female','paths'],['female','off-path']] as const;
  const speeds=variants.map(([icSex,icContext])=>{
   const cost=MODELS['irmischer-clarke'].transitionCost({...transition(0),icSex,icContext});
   expect(MODELS['irmischer-clarke'].transitionCost({...transition(-.1),icSex,icContext})).toBeCloseTo(MODELS['irmischer-clarke'].transitionCost({...transition(.1),icSex,icContext}),10);
   return [3.6/cost,3.6/MODELS['irmischer-clarke'].transitionCost({...transition(.1),icSex,icContext})];
  });
  const expected=[[3.9463456203,3.5729888493],[2.8026459511,2.6225566275],[3.7490283393,3.3943394068],[2.6625136536,2.4914287961]];
  speeds.forEach((pair,index)=>pair.forEach((speed,position)=>expect(speed).toBeCloseTo(expected[index][position],8)));
 });
 it('aplica el multiplicador de terreno una sola vez a cada fórmula base',()=>{
  for(const id of ['irmischer-clarke','uriarte-gonzalez','marin-arroyo','llobera-sluckin'] as const){
   const base=MODELS[id].transitionCost(transition(.1)),withTerrain=MODELS[id].transitionCost({...transition(.1),terrainMultiplier:2.5});
   expect(withTerrain/base).toBeCloseTo(2.5,10);
  }
 });
});
