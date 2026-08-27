// @vitest-environment jsdom
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,describe,expect,it } from 'vitest';
import { DEFAULT_APP_SETTINGS } from '../core/appSettings';
import { AppTutorial } from './AppTutorial';

afterEach(cleanup);
describe('tutorial guiado',()=>{
  it('se puede iniciar manualmente, avanzar y saltar a otro paso',()=>{
    document.body.innerHTML='<article class="nav-panel"></article><article class="ortho-panel"></article><article class="dem-panel"></article><article class="historical-panel"></article><div class="calculation-access"></div><header><nav></nav></header>';
    const settings={...DEFAULT_APP_SETTINGS,tutorialEnabled:false},view=render(<AppTutorial settings={settings} startToken={0}/>);
    expect(screen.queryByText('Visor de navegación')).toBeNull();
    view.rerender(<AppTutorial settings={settings} startToken={1}/>);
    expect(screen.getByText('Visor de navegación')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Siguiente elemento'}));
    expect(screen.getByText('Visor de selección')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:/Ir al paso 21/}));
    expect(screen.getByText('Créditos')).toBeTruthy();
  });
});
