import {expect,it} from 'vitest';
import {requiredRouteWaypoints,exportFacilitatorsGeoJson,parseFacilitatorsGeoJson} from './facilitators';
import {projectElementsGeoPackageLayers} from './resultExports';
import type {EnabledCrossing,PointOfInterest} from '../types';
const bridge:EnabledCrossing={id:'bridge',name:'Puente romano',kind:'bridge',coordinates:[[1,0],[2,0],[3,0]],crossingCostMultiplier:1,required:true};
const poi:PointOfInterest={id:'poi',name:'Fuente',coordinate:[.5,0],category:'agua',influenceRadiusM:100,attraction:0,mode:'waypoint'};
it('combina POI y varios puentes manteniendo cada cruce consecutivo',()=>{
 const second={...bridge,id:'second',name:'Otro puente',coordinates:[[4,0],[5,0]] as [number,number][]};
 expect(requiredRouteWaypoints([0,0],[poi],[second,bridge]).map(p=>p.coordinate)).toEqual([[.5,0],[1,0],[2,0],[3,0],[4,0],[5,0]]);
 expect(requiredRouteWaypoints([6,0],[poi],[bridge,second]).map(p=>p.coordinate)).toEqual([[5,0],[4,0],[3,0],[2,0],[1,0],[.5,0]]);
 expect(bridge.coordinates).toEqual([[1,0],[2,0],[3,0]]);
});
it('no impone puentes desactivados ni de proyectos antiguos',()=>{
 expect(requiredRouteWaypoints([0,0],[],[{...bridge,required:false},{...bridge,required:undefined}])).toEqual([]);
});
it('conserva la opción en JSON de proyecto, GeoJSON y GeoPackage',()=>{
 expect(JSON.parse(JSON.stringify({crossings:[bridge]})).crossings[0].required).toBe(true);
 expect(parseFacilitatorsGeoJson(exportFacilitatorsGeoJson([],[bridge])).crossings[0].required).toBe(true);
 const layers=projectElementsGeoPackageLayers([],[],[],[bridge],[]);
 expect(JSON.parse(layers[0].geoJson).features[0].properties.paso_obligatorio).toBe(true);
});
it('rechaza geometría obligatoria inválida antes del cálculo',()=>{
 expect(()=>requiredRouteWaypoints([0,0],[],[{...bridge,coordinates:[]}])).toThrow('geometría');
});
