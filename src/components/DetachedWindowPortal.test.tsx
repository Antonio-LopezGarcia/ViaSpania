// @vitest-environment jsdom
import {cleanup,render,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {DetachedWindowPortal} from './DetachedWindowPortal';

afterEach(()=>{cleanup();vi.restoreAllMocks()});

it('mueve el visor a una ventana redimensionable y lo devuelve al cerrarse',async()=>{
  const external=document.implementation.createHTMLDocument(''),listeners=new Map<string,EventListener>(),popup={document:external,closed:false,focus:vi.fn(),close:vi.fn(),addEventListener:(name:string,listener:EventListener)=>listeners.set(name,listener),removeEventListener:vi.fn()};
  vi.spyOn(window,'open').mockReturnValue(popup as unknown as Window);
  const viewer=document.createElement('section');viewer.className='terrain-3d-overlay';document.body.appendChild(viewer);
  const onClose=vi.fn();render(<DetachedWindowPortal detached title="ViaSpania · Visor 3D" onClose={onClose}/>);
  await waitFor(()=>expect(external.querySelector('.terrain-3d-overlay')).toBe(viewer));
  expect(window.open).toHaveBeenCalledWith('','viaspania-3d',expect.stringContaining('resizable=yes'));
  listeners.get('beforeunload')?.(new Event('beforeunload'));expect(onClose).toHaveBeenCalledOnce();
});

it('traduce también los controles añadidos a la ventana independiente',async()=>{
  const {setLanguage}=await import('../core/i18n');
  const external=document.implementation.createHTMLDocument('');
  vi.spyOn(window,'open').mockReturnValue({document:external,closed:false,focus:vi.fn(),close:vi.fn(),addEventListener:vi.fn(),removeEventListener:vi.fn()} as unknown as Window);
  const viewer=document.createElement('section');viewer.className='terrain-3d-overlay';document.body.appendChild(viewer);
  setLanguage('en');render(<DetachedWindowPortal detached title="Visor 3D" onClose={()=>{}}/>);
  const button=external.createElement('button');button.textContent='Exportar vídeo';viewer.appendChild(button);
  await waitFor(()=>expect(button.textContent).toBe('Export video'));
  setLanguage('es');expect(button.textContent).toBe('Exportar vídeo');cleanup();viewer.remove();
});
