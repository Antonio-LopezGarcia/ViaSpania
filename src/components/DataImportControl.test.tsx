// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {DataImportControl} from './DataImportControl';
import {importElements} from '../services/elementImports';
vi.mock('../services/elementImports',()=>({importElements:vi.fn()}));
afterEach(()=>{cleanup();vi.resetAllMocks()});
it('aplica los elementos leídos desde el selector',async()=>{const data={points:[],barriers:[],corridors:[],crossings:[],pointsOfInterest:[]},onImport=vi.fn();vi.mocked(importElements).mockResolvedValue(data);render(<DataImportControl onImport={onImport}/>);fireEvent.click(screen.getByRole('button',{name:'Importar datos'}));fireEvent.click(screen.getByRole('button',{name:'Seleccionar GeoPackage y sustituir'}));await waitFor(()=>expect(onImport).toHaveBeenCalledWith(data));expect(screen.queryByRole('dialog')).toBeNull()});
it('conserva el proyecto al cancelar o fallar',async()=>{const onImport=vi.fn();vi.mocked(importElements).mockResolvedValueOnce(null).mockRejectedValueOnce(Error('Geometría no válida.'));render(<DataImportControl onImport={onImport}/>);fireEvent.click(screen.getByRole('button',{name:'Importar datos'}));fireEvent.click(screen.getByRole('button',{name:'Seleccionar GeoPackage y sustituir'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Seleccionar GeoPackage y sustituir'}).hasAttribute('disabled')).toBe(false));fireEvent.click(screen.getByRole('button',{name:'Seleccionar GeoPackage y sustituir'}));await waitFor(()=>expect(screen.getByRole('alert').textContent).toBe('Geometría no válida.'));expect(onImport).not.toHaveBeenCalled()});
