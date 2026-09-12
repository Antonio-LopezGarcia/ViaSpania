// @vitest-environment jsdom
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {SurfaceAnalysisViewer} from './SurfaceAnalysisViewer';
import {DEFAULT_APP_SETTINGS,saveAppSettings} from '../core/appSettings';
import {calculationBackgroundOptions} from '../core/calculationBackgrounds';
vi.mock('./MapPanel',()=>({MapPanel:(props:unknown)=><output data-testid="map">{JSON.stringify(props)}</output>}));
vi.mock('./MdtMapPanel',()=>({MdtMapPanel:()=> <output data-testid="terrain"/>}));
vi.mock('./ElevationProfileOverlay',()=>({ElevationProfileOverlay:()=>null}));
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('ofrece el catálogo comparativo y cambia realmente de cartografía',()=>{
 const storage=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value)});
 render(<SurfaceAnalysisViewer title="Visor" points={[]} selectedPointId={null} barriers={[]} corridors={[]} crossings={[]} route={null} initialView={{center:[0,0],resolution:10,rotation:0}} studyExtent={[-4,39,-3,40]} mdtImageUrl="terrain" onClose={()=>{}}/>);
 expect(screen.getAllByRole('option').map(option=>(option as HTMLOptionElement).value)).toEqual(calculationBackgroundOptions([],true).map(option=>option.id));
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'american'}});
 expect(JSON.parse(screen.getByTestId('map').textContent!)).toMatchObject({kind:'historical',historicalLayer:'AMS_1956-1957'});
 const external={id:'survey',name:'Mapa propio',protocol:'xyz' as const,url:'https://example.com/{z}/{x}/{y}',attribution:'Autor',viewer:'navigation' as const};
 act(()=>{saveAppSettings({...DEFAULT_APP_SETTINGS,externalMapLayers:[external]});window.dispatchEvent(new Event('viaspania-settings'))});
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'external:survey'}});
 expect(JSON.parse(screen.getByTestId('map').textContent!)).toMatchObject({externalLayer:external});
 act(()=>{saveAppSettings(DEFAULT_APP_SETTINGS);window.dispatchEvent(new Event('viaspania-settings'))});
 expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('pnoa');
 expect(JSON.parse(screen.getByTestId('map').textContent!)).toMatchObject({kind:'pnoa',orthophotoLayer:'pnoa'});
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'mdt'}});expect(screen.getByTestId('terrain')).toBeTruthy();
});
