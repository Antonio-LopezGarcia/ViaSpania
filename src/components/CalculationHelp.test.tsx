// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {CalculationHelp,ProfileHelp} from './CalculationHelp';
import {MODEL_HELP} from '../core/calculationHelp';
import {MODELS} from '../core/costModels';

afterEach(cleanup);

describe('ayuda contextual de cálculos',()=>{
  it('documenta todos los perfiles implementados',()=>expect(Object.keys(MODEL_HELP).sort()).toEqual(Object.keys(MODELS).sort()));
  it('explica el modo, las rutas subóptimas sin mezclar el perfil',()=>{render(<CalculationHelp mode="ruta" onClose={()=>{}}/>);expect(screen.getByRole('heading',{name:'Ruta simple'})).toBeTruthy();expect(screen.getByText(/rutas subóptimas espacialmente diferenciadas/)).toBeTruthy();expect(screen.getByText(/superficie original/)).toBeTruthy();expect(screen.queryByText(/Waldo R. Tobler/)).toBeNull();expect(screen.queryByRole('combobox')).toBeNull()});
  it('describe rangos completos en multirruta',()=>{render(<CalculationHelp mode="multirruta" onClose={()=>{}}/>);expect(screen.getByText(/itinerarios completos subóptimos/)).toBeTruthy();expect(screen.getByText(/no mezclan alternativas parciales/)).toBeTruthy()});
  it('explica únicamente el perfil actual y permite cerrar',()=>{const close=vi.fn();const {rerender}=render(<ProfileHelp model="tobler" onClose={close}/>);expect(screen.getByText(/Waldo R. Tobler/)).toBeTruthy();expect(screen.queryByText('Qué calcula este modo')).toBeNull();expect(screen.queryByRole('combobox')).toBeNull();rerender(<ProfileHelp model="ardigo" onClose={close}/>);expect(screen.getByText(/entre 0,2 y 15/)).toBeTruthy();expect(screen.queryByText(/Waldo R. Tobler/)).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Cerrar ayuda del perfil'}));expect(close).toHaveBeenCalledOnce()});
  it('presenta ayuda topográfica sin atribuirle un perfil de desplazamiento',()=>{render(<CalculationHelp mode="viewshed" onClose={()=>{}}/>);expect(screen.getByRole('heading',{name:'Visibilidad'})).toBeTruthy();expect(screen.queryByLabelText('Perfil explicado')).toBeNull()});
});

it.each(Object.keys(MODELS) as (keyof typeof MODELS)[])('traduce la fórmula y la ayuda del perfil %s',async model=>{
 const {setLanguage,LocalizationBoundary}=await import('../core/i18n');setLanguage('en');
 const {container}=render(<LocalizationBoundary><ProfileHelp model={model} onClose={()=>{}}/></LocalizationBoundary>);
 expect(screen.getByRole('heading',{name:'Formulation used by ViaSpania'})).toBeTruthy();
 expect(container.querySelector('code')?.textContent).not.toMatch(/distancia|terreno|energía|grados|si s|descenso|Parte de|con x/);
 expect(container.textContent).not.toMatch(/Qué |Parámetros|Formulación|Variables consideradas|Limitaciones/);
 cleanup();setLanguage('es');
});
