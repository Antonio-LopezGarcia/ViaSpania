import {expect,it} from 'vitest';
import {BUILT_IN_MAP_SOURCES} from './mapSources';
import {calculationBackgroundOptions,calculationBackgrounds,calculationMapProps} from './calculationBackgrounds';
import type {ExternalMapLayer} from './externalMapLayers';
const external:ExternalMapLayer={id:'custom',name:'Mapa importado',url:'https://example.com/{z}/{x}/{y}',protocol:'xyz',viewer:'historical',attribution:'Autor'};
it('incluye toda la cartografía incorporada y las capas externas de cualquier visor',()=>{
 expect(calculationBackgrounds.map(item=>item.source).sort()).toEqual(BUILT_IN_MAP_SOURCES.map(item=>item.id).sort());
 expect(calculationBackgroundOptions([external]).at(-1)).toEqual({id:'external:custom',name:'Mapa importado'});
 expect(calculationBackgroundOptions([],true)).toContainEqual({id:'mdt',name:'Modelo Digital del Terreno'});
});
it.each(calculationBackgrounds)('resuelve el fondo $id al servicio $source',({id,source})=>{
 const props=calculationMapProps(id,[]);
 expect(props.navigationLayer??props.orthophotoLayer??props.historicalLayer).toBe(source);
});
it('conserva la configuración completa y la atribución de la capa externa',()=>{
 expect(calculationMapProps('external:custom',[external])).toEqual({kind:'osm',externalLayer:external});
 expect(calculationMapProps('external:removed',[])).toEqual({kind:'pnoa',orthophotoLayer:'pnoa'});
});
