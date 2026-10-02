// @vitest-environment jsdom
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,describe,expect,it,vi } from 'vitest';
import { DEFAULT_APP_SETTINGS } from '../core/appSettings';
import { AppTutorial,WORKFLOW_STEPS } from './AppTutorial';

afterEach(cleanup);
describe('tutorial guiado',()=>{
  it('ordena las fases antes de los análisis y las salidas',()=>{
    expect(WORKFLOW_STEPS.map(step=>step.title)).toEqual(['1. Crear o abrir un proyecto','2. Elegir el área','3. Cargar el terreno','4. Añadir los puntos','5. Calcular una ruta','6. Guardar o exportar']);
    expect(WORKFLOW_STEPS.every(step=>step.titleEn&&step.textEn)).toBe(true);
  });
  it('se puede iniciar manualmente, avanzar y saltar a otro paso',()=>{
    document.body.innerHTML='<article class="nav-panel"></article><article class="ortho-panel"></article><article class="dem-panel"></article><article class="historical-panel"></article><div class="calculation-access"></div><header><nav></nav></header>';
    const settings={...DEFAULT_APP_SETTINGS,tutorialEnabled:false},view=render(<AppTutorial settings={settings} startToken={0}/>);
    expect(screen.queryByText('1. Crear o abrir un proyecto')).toBeNull();
    view.rerender(<AppTutorial settings={settings} startToken={1}/>);
    expect(screen.getByText('1. Crear o abrir un proyecto')).toBeTruthy();
    expect(document.querySelector('.tutorial-shade')).toBeNull();
    expect(document.querySelector('.tutorial-shades')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Siguiente'}));
    expect(screen.getByText('2. Elegir el área')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:/Ir al paso 6:/}));
    expect(screen.getByText('6. Guardar o exportar')).toBeTruthy();
  });
});

it('mantiene asociado cada paso a su control aunque cambie el orden visual',()=>{
 const settings={...DEFAULT_APP_SETTINGS,tutorialEnabled:false};
 const controls=WORKFLOW_STEPS.map(step=><button key={step.selector} data-tutorial={step.selector.match(/data-tutorial="([^"]+)/)?.[1]} className={step.selector.startsWith('.')?step.selector.slice(1):undefined}/>);
 const view=render(<><header><nav>{controls}<button className="model-load-toggle"/></nav></header><AppTutorial settings={settings} startToken={0}/></>);
 view.rerender(<><header><nav>{controls.reverse()}<button className="model-load-toggle"/></nav></header><AppTutorial settings={settings} startToken={1}/></>);
 WORKFLOW_STEPS.forEach(step=>expect(document.querySelector(step.selector)).toBeTruthy());
});

 it('mantiene el resaltado al desplazar el control y lo oculta si deja de ser visible',()=>{
  const button=document.createElement('button');button.dataset.tutorial='new-project';document.body.append(button);
  const measure=vi.spyOn(button,'getBoundingClientRect').mockReturnValue(new DOMRect(100,80,80,30));
  const settings={...DEFAULT_APP_SETTINGS,tutorialEnabled:false};
  const view=render(<AppTutorial settings={settings} startToken={0}/>);
  view.rerender(<AppTutorial settings={settings} startToken={1}/>);
  expect((document.querySelector('.tutorial-highlight') as HTMLElement).style.top).toBe('75px');
  measure.mockReturnValue(new DOMRect(100,40,80,30));fireEvent.scroll(window);
  expect((document.querySelector('.tutorial-highlight') as HTMLElement).style.top).toBe('35px');
  measure.mockReturnValue(new DOMRect());fireEvent.resize(window);
  expect(document.querySelector('.tutorial-highlight')).toBeNull();
  button.remove();
 });
