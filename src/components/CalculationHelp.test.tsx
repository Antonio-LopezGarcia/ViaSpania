// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {CalculationHelp} from './CalculationHelp';
import {MODEL_HELP} from '../core/calculationHelp';
import {MODELS} from '../core/costModels';

afterEach(cleanup);

describe('ayuda contextual de cálculos',()=>{
  it('documenta todos los perfiles implementados',()=>expect(Object.keys(MODEL_HELP).sort()).toEqual(Object.keys(MODELS).sort()));
  it('explica el modo y el perfil activos',()=>{render(<CalculationHelp mode="ruta" model="tobler" onClose={()=>{}}/>);expect(screen.getByRole('heading',{name:'Ruta simple'})).toBeTruthy();expect(screen.getByRole('heading',{name:'Tobler por caminos'})).toBeTruthy();expect(screen.getByText(/Waldo R. Tobler/)).toBeTruthy();expect(screen.getByText(/v = 6/)).toBeTruthy()});
  it('permite cambiar el perfil explicado en una comparación y cerrar',()=>{const close=vi.fn();render(<CalculationHelp mode="comparar" model="tobler" availableModels={['tobler','ardigo']} onClose={close}/>);fireEvent.change(screen.getByLabelText('Perfil explicado'),{target:{value:'ardigo'}});expect(screen.getByRole('heading',{name:'Ardigò'})).toBeTruthy();expect(screen.getByText(/entre 0,2 y 15/)).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Cerrar ayuda de cálculos'}));expect(close).toHaveBeenCalledOnce()});
  it('presenta ayuda topográfica sin atribuirle un perfil de desplazamiento',()=>{render(<CalculationHelp mode="viewshed" model="tobler" onClose={()=>{}}/>);expect(screen.getByRole('heading',{name:'Visibilidad'})).toBeTruthy();expect(screen.queryByLabelText('Perfil explicado')).toBeNull()});
});
