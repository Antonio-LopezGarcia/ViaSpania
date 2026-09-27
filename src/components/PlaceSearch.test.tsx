// @vitest-environment jsdom
import {act,render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {projectCoordinate} from '../services/gazetteer';
import {setLanguage} from '../core/i18n';
import {PlaceSearch} from './PlaceSearch';
const result={source:'geonames',sourceId:'2514256',displayName:'Málaga',longitude:-4.42,latitude:36.72,featureType:'población',country:'España',admin1:'Andalucía',admin2:''};
const search=vi.fn(async()=>[result]);
vi.mock('../services/gazetteer',()=>({projectCoordinate:vi.fn(async()=>({crs:'EPSG:3857',coordinate:[0,0]})),gazetteer:{search:(...args:unknown[])=>search(...args as [] )}}));
afterEach(()=>{cleanup();search.mockClear();setLanguage('es')});
describe('Buscar lugar',()=>{it('espera tres caracteres y busca sin configuración individual',async()=>{const onSelect=vi.fn();render(<PlaceSearch context={{}} onSelect={onSelect}/>);fireEvent.click(screen.getByRole('button',{name:'Buscar lugar'}));const input=screen.getByRole('combobox');expect(input.getAttribute('placeholder')).toBe('Nombre o latitud, longitud');fireEvent.change(input,{target:{value:'ma'}});expect(screen.getAllByRole('button',{name:'Buscar lugar'})[1].hasAttribute('disabled')).toBe(true);expect(search).not.toHaveBeenCalled();fireEvent.change(input,{target:{value:'malaga'}});fireEvent.click(screen.getAllByRole('button',{name:'Buscar lugar'})[1]);await screen.findByRole('option');fireEvent.keyDown(input,{key:'ArrowDown'});fireEvent.keyDown(input,{key:'Enter'});await waitFor(()=>expect(onSelect).toHaveBeenCalledWith(result));expect(screen.queryByRole('button',{name:'Centrar mapa'})).toBeNull();expect(screen.queryByRole('button',{name:'Usar como origen'})).toBeNull();expect(screen.queryByRole('button',{name:'Usar como destino'})).toBeNull();expect(screen.queryByRole('button',{name:'Crear punto'})).toBeNull();expect(screen.queryByRole('button',{name:'Copiar coordenadas'})).toBeNull();expect(screen.queryByRole('button',{name:'Configurar GeoNames'})).toBeNull();expect(screen.queryByText(/Escriba al menos 3 caracteres/)).toBeNull();expect(screen.queryByText('GeoNames · CC BY 4.0')).toBeNull()});});
it('centra coordenadas pegadas sin consultar GeoNames',async()=>{
 const onSelect=vi.fn();render(<PlaceSearch context={{}} onSelect={onSelect}/>);
 fireEvent.click(screen.getByRole('button',{name:'Buscar lugar'}));
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'40.4168, -3.7038'}});
 fireEvent.keyDown(screen.getByRole('combobox'),{key:'Enter'});
 await waitFor(()=>expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({source:'coordinates',longitude:-3.7038,latitude:40.4168})));
 expect(search).not.toHaveBeenCalled();
});
it('muestra errores de coordenadas sin consultar ni mover el mapa',async()=>{
 const onSelect=vi.fn();render(<PlaceSearch context={{}} onSelect={onSelect}/>);
 fireEvent.click(screen.getByRole('button',{name:'Buscar lugar'}));
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'181, 40'}});
 fireEvent.keyDown(screen.getByRole('combobox'),{key:'Enter'});
 await screen.findByText(/Coordenadas fuera de rango/);expect(search).not.toHaveBeenCalled();expect(onSelect).not.toHaveBeenCalled();
});

it('explica fallos de transformación sin mover la vista',async()=>{
 vi.mocked(projectCoordinate).mockRejectedValueOnce(new Error('CRS no disponible'));
 const onSelect=vi.fn();render(<PlaceSearch context={{}} rasterPath="/modelo.tif" onSelect={onSelect}/>);
 fireEvent.click(screen.getByRole('button',{name:'Buscar lugar'}));
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'40,-3'}});
 fireEvent.keyDown(screen.getByRole('combobox'),{key:'Enter'});
 await screen.findByText(/No se pudo transformar la posición/);
 expect(onSelect).not.toHaveBeenCalled();expect(search).not.toHaveBeenCalled();
});
it('envía al mapa la posición de Roma sin invertir latitud y longitud',async()=>{
 const onSelect=vi.fn();render(<PlaceSearch context={{}} onSelect={onSelect}/>);
 fireEvent.click(screen.getByRole('button',{name:'Buscar lugar'}));
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'41.90520938746826, 12.422617225406457'}});
 fireEvent.keyDown(screen.getByRole('combobox'),{key:'Enter'});
 await waitFor(()=>expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({latitude:41.90520938746826,longitude:12.422617225406457})));
 expect(search).not.toHaveBeenCalled();
});

it('borra el lugar seleccionado y permite buscar de nuevo',async()=>{
 const onSelect=vi.fn(),onClear=vi.fn();render(<PlaceSearch context={{}} onSelect={onSelect} onClear={onClear}/>);
 fireEvent.click(screen.getByRole('button',{name:'Buscar lugar'}));
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'40,-3'}});
 fireEvent.keyDown(screen.getByRole('combobox'),{key:'Enter'});
 await screen.findByRole('button',{name:'Borrar lugar'});
 fireEvent.click(screen.getByRole('button',{name:'Cerrar búsqueda de lugar'}));
 fireEvent.click(screen.getByRole('button',{name:'Buscar lugar'}));
 fireEvent.click(screen.getByRole('button',{name:'Borrar lugar'}));
 expect(onClear).toHaveBeenCalledTimes(1);
 expect(screen.queryByText(/EPSG:4326/)).toBeNull();
 expect(screen.getByRole('status').textContent).toBe('');
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'41,-4'}});
 fireEvent.keyDown(screen.getByRole('combobox'),{key:'Enter'});
 await waitFor(()=>expect(onSelect).toHaveBeenCalledTimes(2));
});

it('conserva varios lugares al reabrir, evita duplicados y borra solo el elegido',async()=>{
 const onClear=vi.fn();render(<PlaceSearch context={{}} onSelect={()=>{}} onClear={onClear}/>);
 fireEvent.click(screen.getByRole('button',{name:'Buscar lugar'}));
 for(const [query,count] of [['40,-3',1],['41,-4',2],['40,-3',2]] as const){
  fireEvent.change(screen.getByRole('combobox'),{target:{value:query}});
  fireEvent.keyDown(screen.getByRole('combobox'),{key:'Enter'});
  await waitFor(()=>expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe(''));
  expect(screen.getAllByRole('button',{name:'Borrar lugar'})).toHaveLength(count);
 }
 fireEvent.click(screen.getByRole('button',{name:'Cerrar búsqueda de lugar'}));
 fireEvent.click(screen.getByRole('button',{name:'Buscar lugar'}));
 expect(screen.getAllByRole('button',{name:'Borrar lugar'})).toHaveLength(2);
 fireEvent.click(screen.getAllByRole('button',{name:'Borrar lugar'})[0]);
 expect(onClear).toHaveBeenCalledWith(expect.objectContaining({latitude:40,longitude:-3}));
 expect(screen.getByText('41, -4')).toBeTruthy();
 expect(screen.queryByText('40, -3')).toBeNull();
});


it('traduce borrar y mostrar u ocultar el marcador al inglés',async()=>{
 const onVisibilityChange=vi.fn();
 const props={context:{},onSelect:()=>{},onVisibilityChange};
 const {rerender}=render(<PlaceSearch {...props}/>);
 fireEvent.click(screen.getByRole('button',{name:'Buscar lugar'}));
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'40,-3'}});
 fireEvent.keyDown(screen.getByRole('combobox'),{key:'Enter'});
 await screen.findByRole('button',{name:'Borrar lugar'});
 act(()=>setLanguage('en'));
 expect(screen.getByRole('button',{name:'Delete place'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Hide on map'}));
 expect(onVisibilityChange).toHaveBeenCalledWith(expect.objectContaining({longitude:-3,latitude:40}),false);
 const place=onVisibilityChange.mock.calls[0][0];
 rerender(<PlaceSearch {...props} hiddenPlaces={[place]}/>);
 fireEvent.click(screen.getByRole('button',{name:'Show on map'}));
 expect(onVisibilityChange).toHaveBeenLastCalledWith(place,true);
 act(()=>setLanguage('es'));
 expect(screen.getByRole('button',{name:'Borrar lugar'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Mostrar en el mapa'})).toBeTruthy();
});
