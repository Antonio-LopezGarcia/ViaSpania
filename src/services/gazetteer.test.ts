import {afterEach,describe,expect,it,vi} from 'vitest';
import {invoke,isTauri} from '@tauri-apps/api/core';
import {parseGeonames,searchGeonames,projectCoordinate} from './gazetteer';
vi.mock('@tauri-apps/api/core',()=>({isTauri:vi.fn(()=>false),invoke:vi.fn()}));
const place=(id:number,lat:string,lng:string)=>({geonameId:id,name:'Córdoba',lat,lng,fcl:'P',countryName:'España',adminName1:'Andalucía'});
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();vi.mocked(isTauri).mockReturnValue(false)});
describe('GeoNames online',()=>{
 it('conserva homónimos, prioriza el viewport y limita resultados',()=>{const data={geonames:[place(2,'-31','-64'),place(1,'37.88','-4.78'),...Array.from({length:20},(_,i)=>place(i+3,'0','0'))]};const results=parseGeonames(data,'cordoba',{viewport:[-5,37,-4,39]});expect(results).toHaveLength(10);expect(results[0]).toMatchObject({sourceId:'1',displayName:'Córdoba',longitude:-4.78});expect(results.some(p=>p.sourceId==='2')).toBe(true)});
 it('rechaza coordenadas inválidas y elimina duplicados',()=>expect(parseGeonames({geonames:[place(1,'90.1','0'),place(2,'0','0'),place(2,'0','0')]},'cor',{})).toHaveLength(1));
 it('explica cuenta desactivada, cuota y respuesta inválida',()=>{expect(()=>parseGeonames({status:{value:10}},'abc',{})).toThrow('cuenta de GeoNames de ViaSpania');expect(()=>parseGeonames({status:{value:19}},'abc',{})).toThrow('límite');expect(()=>parseGeonames({},'abc',{})).toThrow('inválida')});
 it('consulta HTTPS con usuario sin enviar el viewport ni credenciales',async()=>{const fetcher=vi.fn(async()=>({ok:true,json:async()=>({geonames:[place(1,'0','0')]})}));vi.stubGlobal('fetch',fetcher);await searchGeonames('Córdoba', {viewport:[1,2,3,4]});const url=fetcher.mock.calls[0] as unknown as [URL,RequestInit];expect(url[0].origin).toBe('https://secure.geonames.org');expect(url[0].searchParams.get('username')).toBe('viaspania');expect(url[0].searchParams.get('q')).toBe('Córdoba');expect(url[0].searchParams.has('west')).toBe(false);expect(url[1].credentials).toBe('omit')});
 it('no consulta términos cortos y explica fallo de red',async()=>{const fetcher=vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));vi.stubGlobal('fetch',fetcher);expect(await searchGeonames('ma',{})).toEqual([]);expect(fetcher).not.toHaveBeenCalled();await expect(searchGeonames('malaga',{})).rejects.toThrow('Compruebe Internet')});
});
it('ignora cuentas guardadas de versiones anteriores',async()=>{
 const getItem=vi.fn(()=> 'cuenta-antigua');vi.stubGlobal('localStorage',{getItem});
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({geonames:[]})});vi.stubGlobal('fetch',fetcher);
 await searchGeonames('Madrid',{});
 expect(getItem).not.toHaveBeenCalled();
 expect((fetcher.mock.calls[0][0] as URL).searchParams.get('username')).toBe('viaspania');
});
it.each([18,19,20])('explica el límite del servicio %s',code=>{
 expect(()=>parseGeonames({status:{value:code}},'Madrid',{})).toThrow('límite de consultas');
});
it('explica HTTP 429 y JSON inválido',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce({ok:false,status:429}).mockResolvedValueOnce({ok:true,json:async()=>{throw new SyntaxError('Unexpected token')}});vi.stubGlobal('fetch',fetcher);
 await expect(searchGeonames('Madrid',{})).rejects.toThrow('límite de consultas');
 await expect(searchGeonames('Madrid',{})).rejects.toThrow('respuesta inválida');
});

it('envía la cuenta centralizada al transporte nativo',async()=>{
 vi.mocked(isTauri).mockReturnValue(true);
 vi.mocked(invoke).mockResolvedValue({geonames:[place(1,'0','0')]});
 const results=await searchGeonames(' Córdoba ',{});
 expect(invoke).toHaveBeenCalledWith('geonames_search',{query:'Córdoba',username:'viaspania'});
 expect(results[0].sourceId).toBe('1');
});

it('proyecta WGS84 al CRS del visor sin un modelo cargado',async()=>{
 const result=await projectCoordinate({longitude:0,latitude:0});
 expect(result.crs).toBe('EPSG:3857');expect(result.coordinate[0]).toBeCloseTo(0);expect(result.coordinate[1]).toBeCloseTo(0);
 expect(invoke).not.toHaveBeenCalled();
});
it.each(['EPSG:25830','EPSG:32631','EPSG:4326'])('delega al CRS real del ráster: %s',async crs=>{
 vi.mocked(invoke).mockResolvedValue({crs,coordinate:[500000,4427757.219]});
 expect((await projectCoordinate({longitude:-3,latitude:40},'/modelo.tif')).crs).toBe(crs);
 expect(invoke).toHaveBeenCalledWith('project_coordinate',{coordinate:[-3,40],rasterPath:'/modelo.tif'});
});
it('rechaza resultados de transformación no finitos',async()=>{
 vi.mocked(invoke).mockResolvedValue({crs:'EPSG:25830',coordinate:[NaN,Infinity]});
 await expect(projectCoordinate({longitude:-3,latitude:40},'/modelo.tif')).rejects.toThrow('coordenadas inválidas');
});
