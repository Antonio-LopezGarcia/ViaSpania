// @vitest-environment jsdom
import { StrictMode, useEffect, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadAppSettings, saveAppSettings, type AppSettings } from '../core/appSettings';
import { BUILD_INFO } from '../core/buildInfo';
import { getLanguage, setLanguage } from '../core/i18n';
import { TUTORIAL_COMPLETED_KEY } from '../core/tutorial';
import { AppTutorial } from './AppTutorial';
import { GeneralSettingsControl } from './GeneralSettingsControl';
import { WelcomeDialog } from './WelcomeDialog';

function Startup(){
  const [settings,setSettings]=useState(loadAppSettings),[startToken,setStartToken]=useState(0);
  const save=(next:AppSettings)=>{saveAppSettings(next);setSettings(next)};
  const start=()=>setStartToken(value=>value+1);
  useEffect(()=>setLanguage(settings.language??'es'),[settings.language]);
  return <><WelcomeDialog settings={settings} onSave={save} onStartTutorial={start}/><AppTutorial settings={settings} startToken={startToken} autoStart={false}/><GeneralSettingsControl settings={settings} onSave={save} onStartTutorial={start}/></>;
}

beforeEach(()=>{
  vi.useFakeTimers();localStorage.clear();setLanguage('es');
  // jsdom has no native modal implementation; the browser supplies focus trapping and inertness.
  Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(this:HTMLDialogElement){this.open=true}});
  Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(this:HTMLDialogElement){this.open=false}});
});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();setLanguage('es')});

it('muestra la identidad y la versión real y conserva el idioma al reiniciar',()=>{
  const view=render(<StrictMode><Startup/></StrictMode>);
  expect(screen.getByRole('dialog',{name:'Bienvenido a ViaSpania'})).toBeTruthy();
  expect(screen.getByRole('img',{name:'ViaSpania'})).toBeTruthy();
  expect(screen.getByText(`Versión ${BUILD_INFO.version}`)).toBeTruthy();
  expect(screen.getByText('Copyright © 2026 Antonio López García, Universidad de Granada')).toBeTruthy();
  expect(screen.queryByText('Crear proyecto')).toBeNull();
  fireEvent.click(screen.getByRole('checkbox',{name:'Iniciar el tutorial'}));
  fireEvent.change(screen.getByRole('combobox'),{target:{value:'en'}});
  fireEvent.click(screen.getByRole('button',{name:'Continue'}));
  expect(loadAppSettings()).toMatchObject({language:'en',firstRunCompleted:true,tutorialEnabled:false});
  expect(getLanguage()).toBe('en');
  view.unmount();render(<Startup/>);
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.queryByRole('combobox',{name:'Idioma / Language'})).toBeNull();
  act(()=>vi.advanceTimersByTime(5000));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(getLanguage()).toBe('en');
});

it('inicia el tutorial elegido y no lo reabre al reiniciar aunque quede incompleto',()=>{
  const view=render(<Startup/>);
  fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
  expect(screen.queryByRole('dialog',{name:'Bienvenido a ViaSpania'})).toBeNull();
  expect(screen.getByRole('dialog',{name:'Crear proyecto'})).toBeTruthy();
  expect(localStorage.getItem(TUTORIAL_COMPLETED_KEY)).toBeNull();
  view.unmount();render(<Startup/>);
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.queryByRole('combobox',{name:'Idioma / Language'})).toBeNull();
  act(()=>vi.advanceTimersByTime(5000));
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Configuración'}));
  fireEvent.click(screen.getByRole('button',{name:'Tutorial'}));
  expect(screen.queryByLabelText('Mostrar el tutorial automáticamente la primera vez')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Iniciar tutorial ahora'}));
  expect(screen.getByRole('dialog',{name:'Crear proyecto'})).toBeTruthy();
});

it('conserva preferencias anteriores y permite cambiar el idioma desde Configuración tras reiniciar',()=>{
  saveAppSettings({...loadAppSettings(),language:'en',showScales:false,tutorialEnabled:false});
  const view=render(<Startup/>);
  expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('en');
  fireEvent.click(screen.getByRole('button',{name:'Continue'}));
  view.unmount();const next=render(<Startup/>);
  act(()=>vi.advanceTimersByTime(5000));
  fireEvent.click(screen.getByRole('button',{name:'Configuración'}));
  fireEvent.click(screen.getByRole('button',{name:'Idioma / Language'}));
  fireEvent.change(screen.getByLabelText('Idioma de la aplicación'),{target:{value:'es'}});
  fireEvent.click(screen.getByRole('button',{name:'Guardar preferencias'}));
  expect(loadAppSettings()).toMatchObject({language:'es',showScales:false,firstRunCompleted:true});
  next.unmount();render(<Startup/>);
  act(()=>vi.advanceTimersByTime(5000));
  expect(getLanguage()).toBe('es');
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('no marca el inicio como completado al cerrar la aplicación antes de continuar',()=>{
  const view=render(<Startup/>);
  const dialog=screen.getByRole('dialog');
  expect(fireEvent(dialog,new Event('cancel',{cancelable:true}))).toBe(false);
  view.unmount();render(<Startup/>);
  expect(screen.getByRole('dialog',{name:'Bienvenido a ViaSpania'})).toBeTruthy();
  expect(loadAppSettings().firstRunCompleted).not.toBe(true);
});

it('muestra un error recuperable si no se pueden guardar las preferencias',()=>{
  render(<Startup/>);
  const storage=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('storage unavailable')});
  fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
  expect(screen.getByRole('alert').textContent).toContain('No se pudieron guardar las preferencias');
  expect(loadAppSettings().firstRunCompleted).not.toBe(true);
  expect(screen.queryByText('Crear proyecto')).toBeNull();
  storage.mockRestore();
  fireEvent.click(screen.getByRole('button',{name:'Continuar'}));
  expect(loadAppSettings().firstRunCompleted).toBe(true);
  expect(screen.getByRole('dialog',{name:'Crear proyecto'})).toBeTruthy();
});


it('cierra a los cinco segundos con la selección más reciente sin reiniciar el temporizador',()=>{
  render(<StrictMode><Startup/></StrictMode>);
  act(()=>vi.advanceTimersByTime(4000));
  fireEvent.change(screen.getByRole('combobox'),{target:{value:'en'}});
  fireEvent.click(screen.getByRole('checkbox',{name:'Start the tutorial'}));
  act(()=>vi.advanceTimersByTime(999));
  expect(screen.getByRole('dialog',{name:'Welcome to ViaSpania'})).toBeTruthy();
  act(()=>vi.advanceTimersByTime(1));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(loadAppSettings()).toMatchObject({language:'en',firstRunCompleted:true,tutorialEnabled:false});
});

it('muestra la bienvenida cinco segundos en cada apertura sin modificar preferencias ni iniciar el tutorial',()=>{
  const settings={...loadAppSettings(),language:'en' as const,firstRunCompleted:true,tutorialEnabled:true};
  const onSave=vi.fn(),onStartTutorial=vi.fn();
  for(let run=0;run<2;run++){
    const view=render(<StrictMode><WelcomeDialog settings={settings} onSave={onSave} onStartTutorial={onStartTutorial}/></StrictMode>);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    act(()=>vi.advanceTimersByTime(4999));
    expect(screen.getByRole('dialog',{name:'Welcome to ViaSpania'})).toBeTruthy();
    act(()=>vi.advanceTimersByTime(1));
    expect(screen.queryByRole('dialog')).toBeNull();
    view.unmount();
  }
  expect(onSave).not.toHaveBeenCalled();
  expect(onStartTutorial).not.toHaveBeenCalled();
});

it('cancela el temporizador al desmontar la bienvenida',()=>{
  const onSave=vi.fn(),onStartTutorial=vi.fn();
  const view=render(<WelcomeDialog settings={loadAppSettings()} onSave={onSave} onStartTutorial={onStartTutorial}/>);
  view.unmount();
  act(()=>vi.advanceTimersByTime(5000));
  expect(onSave).not.toHaveBeenCalled();
  expect(onStartTutorial).not.toHaveBeenCalled();
});
