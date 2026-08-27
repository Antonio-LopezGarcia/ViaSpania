// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {DEFAULT_APP_SETTINGS} from '../core/appSettings';
import {GeneralSettingsControl} from './GeneralSettingsControl';

afterEach(cleanup);

describe('fuentes cartográficas externas',()=>{
  it('añade, renombra y persiste una capa para el visor elegido',()=>{const onSave=vi.fn();render(<GeneralSettingsControl settings={DEFAULT_APP_SETTINGS} onSave={onSave}/>);fireEvent.click(screen.getByRole('button',{name:'Configuración'}));fireEvent.click(screen.getByRole('button',{name:'Cartografía'}));fireEvent.change(screen.getByLabelText('Nombre de la capa'),{target:{value:'Teselas locales'}});fireEvent.change(screen.getByLabelText('URL XYZ'),{target:{value:'https://tiles.example/{z}/{x}/{y}.png'}});fireEvent.change(screen.getByLabelText('Visor'),{target:{value:'selection'}});fireEvent.click(screen.getByRole('button',{name:'Añadir capa'}));const name=screen.getByDisplayValue('Teselas locales');fireEvent.change(name,{target:{value:'Teselas editadas'}});fireEvent.click(screen.getByRole('button',{name:'Guardar preferencias'}));expect(onSave).toHaveBeenCalledWith(expect.objectContaining({externalMapLayers:[expect.objectContaining({name:'Teselas editadas',viewer:'selection'})]}))});
  it('permite eliminar una capa añadida',()=>{const layer={id:'x',name:'Capa',url:'https://tiles.example/{z}/{x}/{y}.png',viewer:'navigation' as const,protocol:'xyz' as const},onSave=vi.fn();render(<GeneralSettingsControl settings={{...DEFAULT_APP_SETTINGS,externalMapLayers:[layer]}} onSave={onSave}/>);fireEvent.click(screen.getByRole('button',{name:'Configuración'}));fireEvent.click(screen.getByRole('button',{name:'Cartografía'}));fireEvent.click(screen.getByRole('button',{name:'Eliminar'}));fireEvent.click(screen.getByRole('button',{name:'Guardar preferencias'}));expect(onSave).toHaveBeenCalledWith(expect.objectContaining({externalMapLayers:[]}))});
});
