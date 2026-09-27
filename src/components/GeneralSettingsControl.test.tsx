// @vitest-environment jsdom
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,describe,expect,it,vi } from 'vitest';
import { GeneralSettingsControl } from './GeneralSettingsControl';
import { DEFAULT_APP_SETTINGS } from '../core/appSettings';
afterEach(cleanup);

describe('configuración',()=>{
  it('sincroniza las paletas predeterminadas desde cualquiera de las dos categorías',()=>{
    const onSave=vi.fn();
    render(<GeneralSettingsControl settings={DEFAULT_APP_SETTINGS} onSave={onSave}/>);
    fireEvent.click(screen.getByRole('button',{name:'Configuración'}));
    fireEvent.change(screen.getByLabelText('Paleta predeterminada del modelo digital'),{target:{value:'viridis'}});
    fireEvent.click(screen.getByRole('button',{name:'Visor 3D'}));
    expect((screen.getByLabelText('Paleta predeterminada del modelo 3D') as HTMLSelectElement).value).toBe('viridis');
    fireEvent.change(screen.getByLabelText('Paleta predeterminada del modelo 3D'),{target:{value:'alpine'}});
    fireEvent.click(screen.getByRole('button',{name:'Visores 2D'}));
    expect((screen.getByLabelText('Paleta predeterminada del modelo digital') as HTMLSelectElement).value).toBe('alpine');
    fireEvent.click(screen.getByRole('button',{name:'Guardar preferencias'}));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({defaultPalette:'alpine',defaultTerrain3dPalette:'alpine'}));
  });
  it('organiza las preferencias en categorías',()=>{render(<GeneralSettingsControl settings={DEFAULT_APP_SETTINGS} onSave={vi.fn()}/>);fireEvent.click(screen.getByRole('button',{name:'Configuración'}));for(const name of ['Tutorial','Visores 2D','Visor 3D','Modelos digitales','Cartografía','Procesado','Sonidos'])expect(screen.getByRole('button',{name})).toBeTruthy();expect(screen.getByText('Mostrar crucetas sobre visores')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Visor 3D'}));expect(screen.getByText('Exageración vertical 3D predeterminada')).toBeTruthy();expect(screen.getByText('Mostrar escala')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Procesado'}));expect(screen.getByText('Opciones de procesado')).toBeTruthy();expect(screen.queryByText('Modelos digitales de superficie (MDS)')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Sonidos'}));expect(screen.getByText('Sonidos de aviso')).toBeTruthy()});

  it('permite habilitar MDS desde Modelos digitales',()=>{const onSave=vi.fn();render(<GeneralSettingsControl settings={DEFAULT_APP_SETTINGS} onSave={onSave}/>);fireEvent.click(screen.getByRole('button',{name:'Configuración'}));fireEvent.click(screen.getByRole('button',{name:'Modelos digitales'}));expect(screen.getByText('Modelos digitales de superficie (MDS)')).toBeTruthy();const copernicus=screen.getByLabelText(/Copernicus DEM GLO-30/) as HTMLInputElement;expect(copernicus.checked).toBe(false);fireEvent.click(copernicus);fireEvent.click(screen.getByRole('button',{name:'Guardar preferencias'}));expect(onSave).toHaveBeenCalledWith(expect.objectContaining({enabledElevationModels:expect.objectContaining({mds05:false,copernicus30:true})}))});

  it('muestra las fuentes incorporadas de forma compacta sin enlaces directos',()=>{render(<GeneralSettingsControl settings={DEFAULT_APP_SETTINGS} onSave={vi.fn()}/>);fireEvent.click(screen.getByRole('button',{name:'Configuración'}));fireEvent.click(screen.getByRole('button',{name:'Cartografía'}));expect(screen.getAllByText('OpenStreetMap')).toHaveLength(2);expect(screen.getAllByText('IGN/CNIG')).toHaveLength(8);expect(screen.getByText('Copernicus/EEA')).toBeTruthy();expect(screen.queryByText(/Enlace de origen/)).toBeNull();expect(screen.queryByRole('link')).toBeNull()});
  it('permite guardar el máximo de rutas de 8192 × 8292',()=>{const onSave=vi.fn();render(<GeneralSettingsControl settings={DEFAULT_APP_SETTINGS} onSave={onSave}/>);fireEvent.click(screen.getByRole('button',{name:'Configuración'}));fireEvent.click(screen.getByRole('button',{name:'Procesado'}));fireEvent.change(screen.getByLabelText('Límite máximo de celdas'),{target:{value:'67928064'}});fireEvent.click(screen.getByRole('button',{name:'Guardar preferencias'}));expect(onSave).toHaveBeenCalledWith(expect.objectContaining({processingCellLimit:8192*8292}))});

});
