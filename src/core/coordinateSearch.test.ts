import {expect,it} from 'vitest';
import {parseSearchCoordinates} from './coordinateSearch';
it.each(['40.4168, -3.7038','  40.4168,-3.7038  '])('interpreta latitud y longitud: %s',text=>expect(parseSearchCoordinates(text)).toEqual([-3.7038,40.4168]));
it.each(['0,0','90,180','-90,-180'])('acepta límites WGS84: %s',text=>expect(parseSearchCoordinates(text)).not.toBeNull());
it.each(['91,0','0,-181','-3,7,40,4','3;40','3 40','3,','3,NaN'])('rechaza coordenadas inválidas: %s',text=>expect(()=>parseSearchCoordinates(text)).toThrow(/coordenadas|Coordenadas/));
it.each(['Madrid','A Coruña','Tres Cantos','25 de Mayo'])('conserva búsqueda de topónimos: %s',text=>expect(parseSearchCoordinates(text)).toBeNull());
it('interpreta las coordenadas de Roma con latitud primero',()=>{
 expect(parseSearchCoordinates('41.90520938746826, 12.422617225406457')).toEqual([12.422617225406457,41.90520938746826]);
});
