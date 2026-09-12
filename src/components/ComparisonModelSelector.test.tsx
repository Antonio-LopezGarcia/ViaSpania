// @vitest-environment jsdom
import {fireEvent,render,screen,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {MODELS} from '../core/costModels';
import type {ModelId} from '../types';
import {ComparisonModelSelector} from './ComparisonModelSelector';
afterEach(cleanup);
describe('selección comparativa plegada',()=>{
 it('inicia plegada y conserva todos los modelos seleccionados',()=>{
  const {container}=render(<ComparisonModelSelector selected={Object.keys(MODELS) as ModelId[]} onChange={()=>{}}/>);
  expect(container.querySelector('details')?.open).toBe(false);
  expect((screen.getByLabelText('Seleccionar todos') as HTMLInputElement).checked).toBe(true);
 });
 it('permite desactivar uno o todos sin modificar los demás',()=>{
  const models=Object.keys(MODELS) as ModelId[],onChange=vi.fn();
  render(<ComparisonModelSelector selected={models} onChange={onChange}/>);
  fireEvent.click(screen.getByText(/Perfiles de desplazamiento/));
  fireEvent.click(screen.getByLabelText(MODELS.tobler.name));
  expect(onChange).toHaveBeenCalledWith(models.filter(id=>id!=='tobler'));
  fireEvent.click(screen.getByLabelText('Seleccionar todos'));
  expect(onChange).toHaveBeenLastCalledWith([]);
 });
});
