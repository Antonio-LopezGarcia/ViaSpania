// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {PointListEditor} from './PointListEditor';
import {observeLocalizedDocument,setLanguage} from '../core/i18n';
import type {GeoPoint} from '../types';
afterEach(()=>{cleanup();setLanguage('es')});
const points:GeoPoint[]=[{id:1,name:'Punto 1',lat:40.12345,lon:-3.54321,role:'inicio',comments:'',crs:'EPSG:4326'},{id:2,name:'Mi destino',lat:41,lon:-4,role:'final',comments:'',crs:'EPSG:4326'}];
it('muestra coordenadas y permite renombrar y eliminar por identificador',()=>{
 const onRename=vi.fn(),onDelete=vi.fn(),onSelect=vi.fn();
 render(<PointListEditor points={points} selectedPointId={null} onRename={onRename} onDelete={onDelete} onSelect={onSelect}/>);
 expect(screen.getByRole('region',{name:'Puntos de paso'})).toBeTruthy();
 expect(screen.getByText('(40.12345, -3.54321)')).toBeTruthy();
 fireEvent.focus(screen.getByLabelText('Nombre del punto 1'));
 expect(onSelect).toHaveBeenCalledWith(1);
 fireEvent.change(screen.getByLabelText('Nombre del punto 1'),{target:{value:'Mi origen'}});
 expect(onRename).toHaveBeenCalledWith(1,'Mi origen');
 fireEvent.click(screen.getByLabelText('Eliminar punto 2'));
 expect(onDelete).toHaveBeenCalledWith(2);
 expect(onSelect).toHaveBeenCalledTimes(1);
});
it('traduce el panel y las acciones sin cambiar los nombres del usuario',()=>{
 setLanguage('en');
 render(<PointListEditor points={points} selectedPointId={null} onRename={vi.fn()} onDelete={vi.fn()} onSelect={vi.fn()}/>);
 const stop=observeLocalizedDocument(document);
 try{
 expect(screen.getByRole('region',{name:'Waypoints'})).toBeTruthy();
 expect(screen.getByText('WGS84 coordinates (latitude, longitude)')).toBeTruthy();
 expect(screen.getByLabelText('Delete point 2')).toBeTruthy();
 expect(screen.getAllByTitle('Click the name to rename the point')).toHaveLength(2);
 expect((screen.getByLabelText('Point name 2') as HTMLInputElement).value).toBe('Mi destino');
 }finally{stop()}
});
it('conserva el título cuando no hay puntos',()=>{
 render(<PointListEditor points={[]} selectedPointId={null} onRename={vi.fn()} onDelete={vi.fn()} onSelect={vi.fn()}/>);
 expect(screen.getByRole('region',{name:'Puntos de paso'})).toBeTruthy();
 expect(screen.getByText('No hay puntos seleccionados. Añádalos en el panel de selección.')).toBeTruthy();
});
