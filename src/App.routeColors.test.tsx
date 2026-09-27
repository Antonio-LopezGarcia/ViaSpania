// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import App from './App';
import {openProjectFile} from './services/exports';
import {slopeColor} from './core/routeSlope';

vi.mock('./services/exports',async(importOriginal)=>({...await importOriginal<typeof import('./services/exports')>(),openProjectFile:vi.fn()}));
vi.mock('./components/MapPanel',()=>({MapPanel:({kind,routeCoordinates=[],routeSlopesPercent=[]}:{kind:string;routeCoordinates?:number[][];routeSlopesPercent?:number[]})=><output data-testid={`route-${kind}`}>{JSON.stringify(routeCoordinates.slice(1).map((to,index)=>({coordinates:[routeCoordinates[index],to],color:slopeColor(routeSlopesPercent[index+1]??0)})))}</output>}));
vi.mock('./components/MdtMapPanel',()=>({MdtMapPanel:()=>null}));
vi.mock('./components/WelcomeDialog',()=>({WelcomeDialog:()=>null}));
vi.mock('./components/AppTutorial',()=>({AppTutorial:()=>null}));

afterEach(cleanup);
it('mantiene los colores por pendiente en selección y cartografía al cambiar de ida a vuelta',async()=>{
 render(<App/>);
 fireEvent.click(screen.getByRole('button',{name:'Ruta simple'}));
 for(const reverse of [false,true]){
  const coordinates=reverse?[[-3.68,40.42],[-3.69,40.41],[-3.7,40.4]]:[[-3.7,40.4],[-3.69,40.41],[-3.68,40.42]];
  const slopesPercent=reverse?[0,-25,10]:[0,-10,25];
  const route={model:'tobler',direction:reverse?'final→inicio':'inicio→final',path:[0,1,2],coordinates,slopesPercent,cost:100,unit:'s',distanceM:1000,ascentM:20,descentM:5};
  vi.mocked(openProjectFile).mockResolvedValue({path:'/tmp/route-colors.json',text:JSON.stringify({points:[],route})});
  fireEvent.click(screen.getByRole('button',{name:'Abrir proyecto'}));
  const expected=JSON.stringify(coordinates.slice(1).map((to,index)=>({coordinates:[coordinates[index],to],color:slopeColor(slopesPercent[index+1])})));
  await waitFor(()=>{
   for(const panel of ['pnoa','historical'])expect(screen.getByTestId(`route-${panel}`).textContent).toBe(expected);
  });
 }
});
