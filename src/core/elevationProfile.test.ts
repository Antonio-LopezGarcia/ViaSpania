import {describe,expect,it} from 'vitest';
import {elevationProfileSamples,profileExtent,sequenceElevationProfiles} from './elevationProfile';

describe('perfil altimétrico',()=>{
 it('no dibuja cotas no finitas',()=>expect(elevationProfileSamples({coordinates:[[0,0],[1,1]],elevationsM:[2,NaN]})).toEqual([]));
 it('escala muchos perfiles sin desbordar la pila',()=>expect(profileExtent([Array.from({length:200000},(_,i)=>({distanceM:i,elevationM:100}))])).toMatchObject({maxDistanceM:199999,minElevationM:99,maxElevationM:101}));
 it('acumula distancia y conserva las cotas de la ruta',()=>{const samples=elevationProfileSamples({coordinates:[[-3,40],[-3,40.001],[-3,40.002]],elevationsM:[100,112,108]});expect(samples).toHaveLength(3);expect(samples[0]).toEqual({distanceM:0,elevationM:100});expect(samples[2].distanceM).toBeGreaterThan(220);expect(samples[2].elevationM).toBe(108)});
 it('rechaza series que no correspondan con la geometría',()=>expect(elevationProfileSamples({coordinates:[[0,0],[1,1]],elevationsM:[2]})).toEqual([]));
 it('calcula una escala vertical legible incluso en terreno llano',()=>expect(profileExtent([[{distanceM:0,elevationM:50},{distanceM:100,elevationM:50}]])).toMatchObject({minElevationM:49,maxElevationM:51,maxDistanceM:100}));
 it('encadena los tramos sin superponer sus distancias',()=>{const sequenced=sequenceElevationProfiles([[{distanceM:0,elevationM:10},{distanceM:100,elevationM:20}],[{distanceM:0,elevationM:20},{distanceM:75,elevationM:15}]]);expect(sequenced[0].at(-1)?.distanceM).toBe(100);expect(sequenced[1][0].distanceM).toBe(100);expect(sequenced[1].at(-1)?.distanceM).toBe(175)});
});
