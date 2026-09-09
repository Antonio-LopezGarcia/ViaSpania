// @vitest-environment jsdom
import {fireEvent,render,screen,cleanup} from '@testing-library/react';
import {afterEach,it,expect} from 'vitest';
import {ElevationProfileOverlay} from './ElevationProfileOverlay';
afterEach(cleanup);
it('muestra cotas reales y permite plegar y desplegar el perfil',()=>{
 render(<ElevationProfileOverlay routes={[{label:'Ida',color:'#00b9ff',result:{model:'tobler',direction:'ida',path:[],coordinates:[[-3,40],[-3.01,40.01]],elevationsM:[100,150],cost:100,unit:'s',distanceM:1000,ascentM:50,descentM:0}}]}/>);
 expect(screen.getByRole('img')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Ocultar perfil altimétrico'}));
 expect(screen.queryByRole('img')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Mostrar perfil altimétrico'}));
 expect(screen.getByRole('img')).toBeTruthy();
});
