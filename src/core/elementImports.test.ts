import {describe,it,expect} from 'vitest';
import {parseElementLayers} from './elementImports';
import {projectElementsGeoPackageLayers} from './resultExports';
describe('importación de elementos',()=>{
 it('recupera las cinco capas y sus atributos de cálculo',()=>{
 const layers=projectElementsGeoPackageLayers([{id:7,name:'Inicio',comments:'Nota',role:'inicio',lon:-3,lat:40,crs:'EPSG:4326'}],[{name:'Río',kind:'penalty',value:3,coordinates:[[-3,40],[-2,41]]}],[{id:'c1',name:'Camino',coordinates:[[-3,40],[-2,41]],widthM:20,costMultiplier:.4}],[{id:'p1',name:'Paso',kind:'ford',coordinates:[[-3,40],[-2,41]],crossingCostMultiplier:2,required:true}],[{id:'i1',name:'Lugar',category:'Lugar',coordinate:[-3,40],influenceRadiusM:50,attraction:.3,mode:'waypoint'}]);
 const result=parseElementLayers(layers);expect(result.points[0]).toMatchObject({id:7,comments:'Nota',role:'inicio',lon:-3});expect(result.barriers[0].value).toBe(3);expect(result.corridors[0].costMultiplier).toBe(.4);expect(result.crossings[0]).toMatchObject({required:true,kind:'ford',crossingCostMultiplier:2});expect(result.pointsOfInterest[0].mode).toBe('waypoint');
 });
 it('rechaza archivos vacíos, coordenadas y atributos inválidos sin resultados parciales',()=>{
 expect(()=>parseElementLayers([])).toThrow('no contiene');
 for(const properties of [{nombre:'X',tipo:'penalty',valor:-1},{nombre:'X',tipo:'inventado',valor:1}])expect(()=>parseElementLayers([{name:'barreras',geoJson:JSON.stringify({type:'FeatureCollection',features:[{type:'Feature',properties,geometry:{type:'LineString',coordinates:[[0,0],[1,1]]}}]})}])).toThrow('capa barreras');
 expect(()=>parseElementLayers(projectElementsGeoPackageLayers([{id:1,name:'X',comments:'',role:'inicio',lon:300,lat:40,crs:'EPSG:4326'}],[],[],[],[]))).toThrow('fuera de rango');
 });
 it('admite capas parciales y booleanos de SQLite',()=>{const layers=projectElementsGeoPackageLayers([],[],[],[{id:'1',name:'Paso',coordinates:[[0,0],[1,1]],kind:'bridge',crossingCostMultiplier:1,required:true}],[]);layers[0].geoJson=layers[0].geoJson.replace('"paso_obligatorio":true','"paso_obligatorio":1');expect(parseElementLayers(layers).crossings[0].required).toBe(true);expect(parseElementLayers(layers).points).toEqual([])});
});
