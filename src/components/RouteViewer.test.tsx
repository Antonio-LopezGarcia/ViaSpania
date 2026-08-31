// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import type {RouteResult} from '../types';
import {RouteViewer} from './RouteViewer';

vi.mock('./SurfaceAnalysisViewer',()=>({SurfaceAnalysisViewer:({routes,legend}:{routes:unknown[];legend:React.ReactNode})=><div><output data-testid="visible-count">{routes.length}</output>{legend}</div>}));
const result=(offset:number):RouteResult=>({model:'tobler',direction:'inicio→final',path:[0,1],coordinates:[[offset,40],[offset+.1,40.1]],cost:100,unit:'s',distanceM:1000,ascentM:20,descentM:5});

describe('visor de rutas subóptimas',()=>{
 afterEach(cleanup);
 it('permite activar y desactivar cada alternativa por separado',()=>{render(<RouteViewer title="Visor" fileBase="ruta" points={[]} selectedPointId={null} barriers={[]} corridors={[]} crossings={[]} routes={[{result:result(-3.7),color:'#00b9ff',label:'Rango 1'},{result:result(-3.6),color:'#ff5d6c',label:'Rango 2'}]} initialView={{center:[0,0],resolution:1,rotation:0}} studyExtent={[-4,39,-3,41]} mdtImageUrl="data:image/png;base64," onClose={()=>{}}/>);expect(screen.getByTestId('visible-count').textContent).toBe('2');fireEvent.click(screen.getByRole('checkbox',{name:'Rango 2'}));expect(screen.getByTestId('visible-count').textContent).toBe('1');expect((screen.getByRole('checkbox',{name:'Rango 1'}) as HTMLInputElement).checked).toBe(true)});
});
