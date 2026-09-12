import {expect,it} from 'vitest';
import {toLonLat} from 'ol/proj';
import LineString from 'ol/geom/LineString';
import {barrierMapStyle,constraintMapFeatures,facilitatorMapStyle} from './constraintMapFeatures';
it('proyecta WGS84 y conserva los tipos y nombres de todos los elementos',()=>{
 const features=constraintMapFeatures([{name:'Muralla',kind:'absolute',value:1,coordinates:[[12,41],[13,42]]}], [{id:'c',name:'Camino',coordinates:[[12,41],[13,42]],widthM:10,costMultiplier:.5}], [{id:'b',name:'Puente',kind:'bridge',coordinates:[[12,41],[13,42]],crossingCostMultiplier:1}], [{id:'p',name:'Fuente',coordinate:[12,41],category:'agua',influenceRadiusM:20,attraction:.5,mode:'waypoint'}]);
 expect(features.map(f=>f.get('name'))).toEqual(['Muralla','Camino','Puente','Fuente']);
 const coordinate=toLonLat((features[0].getGeometry() as LineString).getCoordinates()[0]);expect(coordinate[0]).toBeCloseTo(12);expect(coordinate[1]).toBeCloseTo(41);
 expect(features.map(f=>f.get('kind'))).toEqual(['absolute','corridor','crossing','poi']);
});
it('mantiene simbología y permite ocultar etiquetas sin alterar geometrías',()=>{
 const [barrier,crossing]=constraintMapFeatures([{kind:'penalty',value:2,coordinates:[[0,0],[1,1]]}],[],[{id:'b',name:'Puente',kind:'bridge',coordinates:[[0,0],[1,1]],crossingCostMultiplier:1}],[]);
 const styles=barrierMapStyle(barrier,true);expect(Array.isArray(styles)&&styles[1].getStroke()?.getLineDash()).toEqual([6,4]);
 expect(facilitatorMapStyle(crossing,true).getText()?.getText()).toBe('Puente');
 expect(facilitatorMapStyle(crossing,false).getText()).toBeNull();
 expect(facilitatorMapStyle(crossing,false).getStroke()?.getColor()).toBe('#36d6ff');
 expect(facilitatorMapStyle(crossing,true,15).getText()?.getFont()).toBe('600 15px sans-serif');
});
