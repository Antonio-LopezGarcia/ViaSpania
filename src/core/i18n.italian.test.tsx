// @vitest-environment jsdom
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {LocalizationBoundary,getLanguage,locale,setLanguage,tr,translateText} from './i18n';
import {DEFAULT_APP_SETTINGS,loadAppSettings,saveAppSettings} from './appSettings';
import {WelcomeDialog} from '../components/WelcomeDialog';
import {ActiveProjectName} from '../components/ActiveProjectName';
beforeEach(()=>{localStorage.clear();HTMLDialogElement.prototype.showModal=vi.fn(function(this:HTMLDialogElement){this.setAttribute('open','')});HTMLDialogElement.prototype.close=vi.fn(function(this:HTMLDialogElement){this.removeAttribute('open')})});
afterEach(()=>{cleanup();setLanguage('es');vi.useRealTimers()});
it('traduce italiano y permite pasar por los tres idiomas con atributos y SVG',()=>{
 setLanguage('es');render(<LocalizationBoundary><button aria-label="Configuración">Nuevo proyecto</button><svg><text>Cota (m)</text></svg><span translate="no">Nuevo proyecto</span><ActiveProjectName name={null}/></LocalizationBoundary>);
 act(()=>setLanguage('it'));expect(screen.getByRole('button',{name:'Impostazioni'}).textContent).toBe('Nuovo progetto');expect(screen.getByText('Quota (m)')).toBeTruthy();expect(screen.getByText('Nuevo proyecto',{selector:'span'})).toBeTruthy();expect(screen.getByLabelText('Progetto vuoto')).toBeTruthy();expect(document.documentElement.lang).toBe('it');expect(locale()).toBe('it-IT');expect(tr('Ayuda','Help')).toBe('Aiuto');
 act(()=>setLanguage('en'));expect(screen.getByRole('button',{name:'Settings'}).textContent).toBe('New project');
 act(()=>setLanguage('es'));expect(screen.getByRole('button',{name:'Configuración'}).textContent).toBe('Nuevo proyecto');expect(screen.getByText('Cota (m)')).toBeTruthy();
});
it('persiste italiano y traduce avisos fuera del DOM sin modificar rutas',()=>{
 saveAppSettings({...DEFAULT_APP_SETTINGS,language:'it'});setLanguage(loadAppSettings().language!);expect(getLanguage()).toBe('it');expect(translateText('Punto 3 seleccionado')).toBe('Punto 3 selezionato');expect(translateText('Proyecto guardado en /tmp/Ruta de España $&.json')).toBe('Progetto salvato in /tmp/Ruta de España $&.json');
});
it('previsualiza italiano en la bienvenida antes de guardar la preferencia',()=>{
 vi.useFakeTimers();const save=vi.fn();setLanguage('es');render(<WelcomeDialog settings={DEFAULT_APP_SETTINGS} onSave={save} onStartTutorial={vi.fn()}/>);
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'it'}});expect(screen.getByRole('heading',{name:'Benvenuto in ViaSpania'})).toBeTruthy();expect(getLanguage()).toBe('es');fireEvent.click(screen.getByRole('button',{name:'Continua'}));expect(save).toHaveBeenCalledWith(expect.objectContaining({language:'it',firstRunCompleted:true}));
});
