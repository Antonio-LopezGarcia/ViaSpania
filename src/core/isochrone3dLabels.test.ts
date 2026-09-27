import {describe,expect,it} from 'vitest';
import {chooseIsochroneLabel,isochroneLabelCandidates,type LabelledTerrainLine} from './isochrone3dLabels';

describe('etiquetas de isócronas 3D',()=>{
 it('conserva los textos de la leyenda y agrupa fragmentos sin etiquetar curvas de nivel',()=>{
  const lines:LabelledTerrainLine[]=[
   {level:600,isochroneLabel:'10 min',coordinates:[[0,0],[1,0]]},
   {level:150,isochroneLabel:'2,5 min',coordinates:[[0,1],[1,1]]},
   {level:600,isochroneLabel:'10 min',coordinates:[[9,0],[10,0]]},
   {level:600,coordinates:[[0,4],[1,4]]},
  ];
  const original=structuredClone(lines),groups=isochroneLabelCandidates(lines,100,100);
  expect(groups.map(group=>group.text)).toEqual(['2,5 min','10 min']);
  expect(groups[1].anchors.every(([x,y])=>(x<=1||x>=9)&&y===0)).toBe(true);
  expect(groups[1].anchors.some(([x])=>x>=9)).toBe(true);
  expect(lines).toEqual(original);
 });
 it('descarta geometrías vacías, degeneradas o no finitas',()=>{
  expect(isochroneLabelCandidates([
   {level:60,isochroneLabel:'1 min',coordinates:[]},
   {level:120,isochroneLabel:'2 min',coordinates:[[1,1],[1,1]]},
   {level:180,isochroneLabel:'3 min',coordinates:[[NaN,1],[2,1]]},
  ],1,1)).toEqual([]);
 });
 it('separa varias etiquetas, respeta obstáculos y mantiene el anclaje si sigue libre',()=>{
  const candidates=[{x:50,y:50,width:40,height:20},{x:100,y:50,width:40,height:20},{x:150,y:50,width:40,height:20}];
  expect(chooseIsochroneLabel(candidates,[],200,100,1)).toBe(1);
  expect(chooseIsochroneLabel(candidates,[candidates[0]],200,100)).toBe(1);
  expect(chooseIsochroneLabel(candidates,[candidates[0],candidates[1]],200,100)).toBe(2);
 });
 it('evita bordes y puntos fuera de cámara; en escenas densas conserva el menor solapamiento',()=>{
  const candidates=[null,{x:1,y:50,width:40,height:20},{x:50,y:50,width:40,height:20},{x:75,y:50,width:40,height:20}];
  expect(chooseIsochroneLabel(candidates,[{x:50,y:50,width:50,height:30}],100,100)).toBe(3);
  expect(chooseIsochroneLabel([null,candidates[1]],[],100,100)).toBe(-1);
 });
});
