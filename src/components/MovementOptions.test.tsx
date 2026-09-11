// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {MovementOptions} from './MovementOptions';
import {MODELS} from '../core/costModels';
import type {ModelId} from '../types';
afterEach(cleanup);
const defaults={model:'tobler' as const,onModel:vi.fn(),onComparisonModels:vi.fn(),connectivity:8 as const,onConnectivity:vi.fn(),rankEnabled:false,onRankEnabled:vi.fn(),rankCount:3,onRankCount:vi.fn(),rankPenalty:0.01,onRankPenalty:vi.fn(),criticalSlope:10,onCriticalSlope:vi.fn(),ardigoSpeed:1.2,onArdigoSpeed:vi.fn()};
it('ofrece todos los perfiles y las tres conectividades en el panel',()=>{
 render(<MovementOptions {...defaults}/>);
 expect(screen.getByRole('region',{name:'Opciones de desplazamiento'})).toBeTruthy();
 expect((screen.getByLabelText('Perfil de desplazamiento') as HTMLSelectElement).options.length).toBe(Object.keys(MODELS).length);
 expect((screen.getByLabelText('Conectividad') as HTMLSelectElement).options.length).toBe(3);
 expect(screen.queryByLabelText(/Pendiente crítica/)).toBeNull();
 expect(screen.queryByLabelText(/Velocidad Ardigò/)).toBeNull();
 fireEvent.click(screen.getByLabelText('Calcular rutas subóptimas'));
 expect(defaults.onRankEnabled).toHaveBeenCalledWith(true);
});
it('ordena las alternativas antes de pendiente y velocidad y aplica la separación',()=>{
 render(<MovementOptions {...defaults} rankEnabled comparisonModels={['wheeled','ardigo']}/>);
 const names=screen.getAllByRole('spinbutton').map(element=>(element as HTMLInputElement).labels?.[0].textContent);
 expect(names).toEqual(['Número de rutas subóptimas','Pendiente crítica · vehículo%','Velocidad Ardigòm/s']);
 fireEvent.change(screen.getByLabelText('Separación'),{target:{value:'0.03'}});
 expect(defaults.onRankPenalty).toHaveBeenCalledWith(0.03);
});
it('en comparación ignora el perfil individual y muestra solo opciones de perfiles seleccionados',()=>{
 const {rerender}=render(<MovementOptions {...defaults} model="ardigo" comparisonModels={['tobler']}/>);
 expect(screen.queryByLabelText(/Velocidad Ardigò/)).toBeNull();
 rerender(<MovementOptions {...defaults} model="wheeled" comparisonModels={[]}/>);
 expect(screen.queryByLabelText(/Pendiente crítica/)).toBeNull();
 rerender(<MovementOptions {...defaults} comparisonModels={Object.keys(MODELS) as ModelId[]}/>);
 expect(screen.getByLabelText(/Velocidad Ardigò/)).toBeTruthy();
 expect(screen.getByLabelText(/Pendiente crítica/)).toBeTruthy();
});
it('aplica las tres velocidades y limita el valor configurable a 0,2–15 m/s',()=>{
 const onArdigoSpeed=vi.fn();render(<MovementOptions {...defaults} model="ardigo" onArdigoSpeed={onArdigoSpeed}/>);
 for(const name of [/Caminar/,/Correr/,/Bicicleta/])fireEvent.click(screen.getByRole('button',{name}));
 fireEvent.change(screen.getByLabelText(/Velocidad Ardigò/),{target:{value:'20'}});
 fireEvent.change(screen.getByLabelText(/Velocidad Ardigò/),{target:{value:'0.1'}});
 expect(onArdigoSpeed.mock.calls.map(call=>call[0])).toEqual([1.2,3,5.5,15,0.2]);
});

it('omite las rutas subóptimas en los modos de superficie aunque estén activadas en otro modo',()=>{
 render(<MovementOptions {...defaults} allowAlternatives={false} rankEnabled/>);
 expect(screen.queryByLabelText('Calcular rutas subóptimas')).toBeNull();
 expect(screen.queryByLabelText('Número de rutas subóptimas')).toBeNull();
 expect(screen.getByLabelText('Conectividad')).toBeTruthy();
});
