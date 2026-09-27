import {expect,it} from 'vitest';
import {addSearchedPlace,removeSearchedPlace} from './searchedPlaces';
it('acumula posiciones distintas sin duplicarlas ni modificar la lista original',()=>{
 const first={longitude:-3,latitude:40},second={longitude:-4,latitude:41};
 const original=Object.freeze([first]);
 const places=addSearchedPlace(original,second);
 expect(places).toEqual([first,second]);
 expect(original).toEqual([first]);
 expect(addSearchedPlace(places,{...first})).toEqual(places);
 expect(removeSearchedPlace(places,first)).toEqual([second]);
 expect(places).toHaveLength(2);
});
