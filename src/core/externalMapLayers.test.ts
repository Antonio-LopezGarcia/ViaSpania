import {describe,expect,it} from 'vitest';
import {normalizeExternalMapLayer} from './externalMapLayers';

describe('capas cartográficas externas',()=>{
  it('normaliza una plantilla XYZ',()=>expect(normalizeExternalMapLayer({id:'a',name:'  Mi capa  ',url:' https://tiles.example/{z}/{x}/{y}.png ',viewer:'selection'})).toMatchObject({name:'Mi capa',url:'https://tiles.example/{z}/{x}/{y}.png'}));
  it('rechaza URL sin plantilla de teselas',()=>expect(()=>normalizeExternalMapLayer({id:'a',name:'Capa',url:'https://example.test/mapa',viewer:'navigation'})).toThrow(/\{z\}/));
  it('acepta una capa WMS sin exigir plantilla XYZ',()=>expect(normalizeExternalMapLayer({id:'w',name:'Histórica',url:'https://example.test/wms',viewer:'historical',protocol:'wms',layerName:'old',version:'1.3.0',format:'image/png',transparent:true})).toMatchObject({protocol:'wms',layerName:'old'}));
});
