// @vitest-environment jsdom
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { afterEach,describe,expect,it,vi } from 'vitest';
import { DEFAULT_APP_SETTINGS } from '../core/appSettings';
import {GeneralSettingsControl} from './GeneralSettingsControl';
import {ReportExportControl} from './ReportExportControl';
import {ResultExportControl} from './ResultExportControl';
import { AppTutorial,WORKFLOW_STEPS } from './AppTutorial';

afterEach(cleanup);
describe('tutorial guiado',()=>{
  it('ordena las fases antes de los análisis y las salidas',()=>{
    expect(WORKFLOW_STEPS.map(step=>step.title)).toEqual(['Crear proyecto','Abrir proyecto','1. Delimitar el área de estudio','2. Cargar el modelo digital','Comprobar el modelo digital','3. Situar los puntos','4. Añadir barreras y facilitadores','5. Configurar el análisis','Calcular Ruta simple','Comparar perfiles','Analizar varios puntos','Construir una Multirruta','Explorar un Pasillo','Analizar superficie y visibilidad','6. Interpretar con cartografía','Interpretar en 3D','7. Exportar resultados','Componer informe','Guardar el proyecto','Configuración y ayuda']);
    expect(WORKFLOW_STEPS.every(step=>step.titleEn&&step.textEn)).toBe(true);
  });
  it('se puede iniciar manualmente, avanzar y saltar a otro paso',()=>{
    document.body.innerHTML='<article class="nav-panel"></article><article class="ortho-panel"></article><article class="dem-panel"></article><article class="historical-panel"></article><div class="calculation-access"></div><header><nav></nav></header>';
    const settings={...DEFAULT_APP_SETTINGS,tutorialEnabled:false},view=render(<AppTutorial settings={settings} startToken={0}/>);
    expect(screen.queryByText('Crear proyecto')).toBeNull();
    view.rerender(<AppTutorial settings={settings} startToken={1}/>);
    expect(screen.getByText('Crear proyecto')).toBeTruthy();
    expect(document.querySelector('.tutorial-shade')).toBeNull();
    expect(document.querySelector('.tutorial-shades')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Siguiente elemento'}));
    expect(screen.getByText('Abrir proyecto')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:/Ir al paso 20/}));
    expect(screen.getByText('Configuración y ayuda')).toBeTruthy();
  });
});

it('señala los botones reales tras reordenarlos, sin depender de su posición',()=>{
 const settings={...DEFAULT_APP_SETTINGS,tutorialEnabled:false};
 const controls=[<ReportExportControl key="report" disabled={false} loading={false} onExport={async()=>{}}/>,<ResultExportControl key="export" items={[]} loading={false} onExport={async()=>{}}/>,<GeneralSettingsControl key="settings" settings={settings} onSave={()=>{}}/>];
 const view=render(<><header><nav>{controls}</nav></header><AppTutorial settings={settings} startToken={0}/></>);
 view.rerender(<><header><nav>{controls}</nav></header><AppTutorial settings={settings} startToken={1}/></>);
 const check=()=>{
  for(const [title,label] of [['7. Exportar resultados','Exportar resultados'],['Componer informe','Componer informe'],['Configuración y ayuda','Configuración']]){
   const stepIndex=WORKFLOW_STEPS.findIndex(step=>step.title===title),button=screen.getByRole('button',{name:label});
   expect(document.querySelector(WORKFLOW_STEPS[stepIndex].selector)).toBe(button);
   const measure=vi.spyOn(button,'getBoundingClientRect').mockReturnValue(new DOMRect(100,20,80,30));
   fireEvent.click(screen.getByRole('button',{name:`Ir al paso ${stepIndex+1}: ${title}`}));
   expect(measure).toHaveBeenCalled();expect((document.querySelector('.tutorial-highlight') as HTMLElement).style.left).toBe('95px');measure.mockRestore();
  }
 };
 check();
 view.rerender(<><header><nav>{[...controls].reverse()}</nav></header><AppTutorial settings={settings} startToken={1}/></>);
 check();
});
