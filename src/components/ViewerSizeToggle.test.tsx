// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {ViewerSizeToggle} from './ViewerSizeToggle';

afterEach(cleanup);

describe('control de tamaño de los visores',()=>{
 it('mantiene la flecha de ampliación en el estado normal',()=>{
  render(<ViewerSizeToggle viewer="Navegación" expanded={false} onToggle={()=>{}}/>);
  const button=screen.getByRole('button',{name:'Ampliar visor de Navegación'});
  expect(button.textContent).toBe('↗');
  expect(button.getAttribute('aria-expanded')).toBe('false');
 });
 it('muestra la flecha de restauración y ejecuta la misma acción común',()=>{
  const onToggle=vi.fn();
  render(<ViewerSizeToggle viewer="Cartografía" expanded onToggle={onToggle}/>);
  const button=screen.getByRole('button',{name:'Restaurar visor de Cartografía'});
  expect(button.textContent).toBe('↙');
  expect(button.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(button);
  expect(onToggle).toHaveBeenCalledOnce();
 });
});
