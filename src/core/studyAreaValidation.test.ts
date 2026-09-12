import {describe,it,expect} from 'vitest';
import {containsCoordinate,elementsOutsideArea} from './studyAreaValidation';
const bounds=[-4,40,-3,41] as const;
describe('elementos fuera del área',()=>{
 it('incluye el borde y rechaza coordenadas inválidas',()=>{
  expect(containsCoordinate(bounds,[-4,40])).toBe(true);
  expect(containsCoordinate(bounds,[-3,41])).toBe(true);
  expect(containsCoordinate(bounds,[-2,40])).toBe(false);
  expect(containsCoordinate(bounds,[NaN,40])).toBe(false);
 });
 it('valida puntos y todos los vértices de los elementos lineales',()=>{
  expect(elementsOutsideArea(bounds,{
   points:[{id:1,name:'Inicio',comments:'',lon:-2,lat:40,crs:'EPSG:4326',role:'inicio'}],
   barriers:[{coordinates:[[-3.5,40.5],[-2,40.5]],kind:'absolute',value:1}],
   corridors:[{id:'c',name:'Camino',coordinates:[[-2,40.5]],widthM:10,costMultiplier:1}],
   crossings:[{id:'b',name:'Paso',coordinates:[[-3.5,42]],kind:'bridge',crossingCostMultiplier:1}],
   pointsOfInterest:[{id:'p',name:'Destino',category:'',coordinate:[-2,42],influenceRadiusM:0,attraction:1,mode:'waypoint'}],
  })).toEqual(['Punto «Inicio»','Barrera «1»','Corredor «Camino»','Puente o paso «Paso»','Punto de interés «Destino»']);
 });
 it('no avisa con elementos interiores y admite áreas que cruzan el antimeridiano',()=>{
  expect(elementsOutsideArea(bounds,{points:[],barriers:[{coordinates:[[-4,40],[-3,41]],kind:'absolute',value:1}],corridors:[],crossings:[],pointsOfInterest:[]})).toEqual([]);
  expect(containsCoordinate([170,-10,-170,10],[-179,0])).toBe(true);
 });
});
