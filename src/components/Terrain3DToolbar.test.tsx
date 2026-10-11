// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {Terrain3DToolbar,type TerrainToolbarState} from './Terrain3DToolbar';

const state:TerrainToolbarState={
 exaggeration:1,routeWidth:4,palette:'terrain',textureId:'none',textureOptions:[],textureDisabled:false,textureLoading:false,contoursAvailable:false,viewshedAvailable:true,
 layers:{points:true,pointLabels:true,barriers:true,marineMasks:true,crossings:true,corridors:true,pointsOfInterest:true,contours:false,highestPoint:false,scale:false,viewshed:false}
};

describe('herramienta de visibilidad del visor 3D',()=>{
 afterEach(cleanup);
 it('se puede activar con el MDT aunque aún no haya resultados de visibilidad',()=>{
  const onAction=vi.fn();
  render(<Terrain3DToolbar state={state} onAction={onAction}/>);
  const visibility=screen.getByRole('checkbox',{name:'Visibilidad'}) as HTMLInputElement;
  expect(visibility.disabled).toBe(false);
  fireEvent.click(visibility);
  expect(onAction).toHaveBeenCalledWith({type:'layer',key:'viewshed',value:true});
 });

 it('permanece desactivada cuando no hay un MDT cargado',()=>{
  render(<Terrain3DToolbar state={{...state,viewshedAvailable:false}} onAction={()=>{}}/>);
  expect((screen.getByRole('checkbox',{name:'Visibilidad'}) as HTMLInputElement).disabled).toBe(true);
 });
});
