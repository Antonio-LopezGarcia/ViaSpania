// @vitest-environment jsdom
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {invoke} from '@tauri-apps/api/core';
import {CalculationButton} from './CalculationButton';
import {runCalculation,calculationSnapshot} from '../services/calculationTasks';
import {setLanguage} from '../core/i18n';
vi.mock('@tauri-apps/api/core',()=>({invoke:vi.fn(async()=>{})}));
afterEach(()=>{cleanup();setLanguage('es');vi.clearAllMocks()});
it.each(['outbound','return','comparison','multipoint','sequential','corridor','isochrones','contours','viewshed'].flatMap(mode=>['es','en'].map(language=>({mode,language}))))('cancela $mode en $language con el mismo botón y espera al motor',async({mode,language})=>{
 setLanguage(language as 'es'|'en');let finish!:()=>void;let pending:Promise<void>|undefined;
 const start=vi.fn(()=>{pending=runCalculation(mode,()=>new Promise<void>(resolve=>{finish=resolve}))});
 render(<><CalculationButton mode={mode} onClick={start} onError={()=>{}}>Iniciar</CalculationButton><CalculationButton mode="other" onClick={()=>{}} onError={()=>{}}>Otro</CalculationButton></>);
 const button=screen.getByRole('button',{name:'Iniciar'});fireEvent.click(button);
 expect(screen.getByRole('button',{name:language==='en'?'Cancel calculation':'Cancelar cálculo'})).toBe(button);
 expect((screen.getByRole('button',{name:'Otro'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.click(button);expect(invoke).toHaveBeenCalledWith('cancel_calculation',{calculationId:calculationSnapshot()!.id});
 expect(button.textContent).toBe(language==='en'?'Cancelling…':'Cancelando…');expect((button as HTMLButtonElement).disabled).toBe(true);
 await act(async()=>{finish();await pending});await waitFor(()=>expect(button.textContent).toBe('Iniciar'));expect(start).toHaveBeenCalledTimes(1);
});
