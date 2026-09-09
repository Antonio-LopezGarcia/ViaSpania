// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {FacilitatorEditor} from './FacilitatorEditor';
import type {EnabledCrossing} from '../types';
afterEach(cleanup);
it('activa y desactiva cada puente independientemente',()=>{
 const crossings:EnabledCrossing[]=['Primero','Segundo'].map((name,index)=>({id:String(index),name,coordinates:[[0,0],[1,0]],kind:'bridge',crossingCostMultiplier:1}));
 const onCrossings=vi.fn(),noop=()=>{};
 const props={barriers:[],corridors:[],points:[],crossings,onCrossings,onBarriers:noop,onCorridors:noop,onPoints:noop};
 const {rerender}=render(<FacilitatorEditor {...props}/>);
 fireEvent.click(screen.getByRole('button',{name:/Barreras y facilitadores/}));
 fireEvent.click(screen.getByRole('checkbox',{name:'Paso obligatorio: Primero'}));
 expect(onCrossings).toHaveBeenLastCalledWith([{...crossings[0],required:true},crossings[1]]);
 rerender(<FacilitatorEditor {...props} crossings={[{...crossings[0],required:true},crossings[1]]}/>);
 fireEvent.click(screen.getByRole('checkbox',{name:'Paso obligatorio: Primero'}));
 expect(onCrossings).toHaveBeenLastCalledWith([{...crossings[0],required:false},crossings[1]]);
});

it('elimina los valores previos y conserva todos los atributos editables',()=>{
 const noop=()=>{},onBarriers=vi.fn(),onCorridors=vi.fn(),onCrossings=vi.fn(),onPoints=vi.fn();
 render(<FacilitatorEditor
  barriers={[{kind:'penalty',value:3,coordinates:[[0,0],[1,1]]}]}
  corridors={[{id:'c',name:'Camino',coordinates:[[0,0],[1,1]],widthM:20,costMultiplier:.5}]}
  crossings={[{id:'x',name:'Puente',coordinates:[[0,0],[1,1]],kind:'bridge',crossingCostMultiplier:1}]}
  points={[{id:'p',name:'Fuente',category:'otro',coordinate:[0,0],influenceRadiusM:100,attraction:.4,mode:'influence'}]}
  onBarriers={onBarriers} onCorridors={onCorridors} onCrossings={onCrossings} onPoints={onPoints}/>
 );
 fireEvent.click(screen.getByRole('button',{name:/Barreras y facilitadores/}));
 expect(screen.queryByText('Valores para nuevos elementos')).toBeNull();
 expect(screen.queryByDisplayValue('otro')).toBeNull();
 expect((screen.getByLabelText('Categoría') as HTMLInputElement).value).toBe('');
 expect(screen.getByLabelText('Tipo de la barrera 1')).toBeTruthy();
 expect((screen.getByLabelText('Nombre de la barrera 1') as HTMLInputElement).value).toBe('Barrera 1');
 expect(screen.getByLabelText('Nombre del corredor')).toBeTruthy();
 expect(screen.getByLabelText('Nombre del paso')).toBeTruthy();
 expect(screen.getByLabelText('Nombre del punto de interés')).toBeTruthy();
 expect(screen.getAllByRole('group')).toHaveLength(4);
 for(const name of ['Nombre de la barrera 1','Nombre del corredor','Nombre del paso','Nombre del punto de interés'])expect(screen.getByLabelText(name).classList.contains('constraint-name')).toBe(true);
 fireEvent.change(screen.getByLabelText('Nombre de la barrera 1'),{target:{value:'Cortado del río'}});
 expect(onBarriers).toHaveBeenCalledWith([expect.objectContaining({name:'Cortado del río'})]);
 fireEvent.change(screen.getByLabelText('Categoría'),{target:{value:'agua'}});
 expect(onPoints).toHaveBeenCalledWith([expect.objectContaining({category:'agua'})]);
 expect(onCorridors).not.toHaveBeenCalled();expect(onCrossings).not.toHaveBeenCalled();expect(noop).toBeTruthy();
});

it('abre una ayuda específica sin desplegar el editor y permite cerrarla',()=>{
 const noop=()=>{};
 render(<FacilitatorEditor barriers={[]} corridors={[]} crossings={[]} points={[]} onBarriers={noop} onCorridors={noop} onCrossings={noop} onPoints={noop}/>);
 const panel=screen.getByRole('button',{name:/Barreras y facilitadores/});
 expect(panel.getAttribute('aria-expanded')).toBe('false');
 fireEvent.click(screen.getByRole('button',{name:'Ayuda sobre barreras y facilitadores'}));
 expect(panel.getAttribute('aria-expanded')).toBe('false');
 const dialog=screen.getByRole('dialog',{name:'Barreras y facilitadores'});
 expect(dialog.textContent).toContain('Infranqueable o absoluta');
 expect(dialog.textContent).toContain('Dijkstra');
 expect(dialog.textContent).toContain('Paso: puente, vado o túnel');
 expect(dialog.textContent).toContain('multiplicador = 1 − atracción');
 fireEvent.keyDown(window,{key:'Escape'});
 expect(screen.queryByRole('dialog')).toBeNull();
});

it('comparte los colores de símbolos cartográficos y traduce los campos al inglés',async()=>{
 const {LocalizationBoundary,setLanguage}=await import('../core/i18n');
 const {constraintMapFeatures,barrierMapStyle,facilitatorMapStyle}=await import('./constraintMapFeatures');
 const barriers=[{kind:'absolute' as const,value:1,coordinates:[[0,0],[1,1]] as [number,number][]}],corridors=[{id:'c',name:'Camino',coordinates:[[0,0],[1,1]] as [number,number][],widthM:20,costMultiplier:.5}],crossings=[{id:'x',name:'Puente',coordinates:[[0,0],[1,1]] as [number,number][],kind:'bridge' as const,crossingCostMultiplier:1}],points=[{id:'p',name:'Fuente',category:'',coordinate:[0,0] as [number,number],influenceRadiusM:100,attraction:.4,mode:'influence' as const}];
 const noop=()=>{};setLanguage('en');
 const {container}=render(<LocalizationBoundary><FacilitatorEditor barriers={barriers} corridors={corridors} crossings={crossings} points={points} onBarriers={noop} onCorridors={noop} onCrossings={noop} onPoints={noop}/></LocalizationBoundary>);
 fireEvent.click(screen.getByRole('button',{name:/^Barriers and facilitators/}));
 await screen.findByLabelText('Corridor name');expect(screen.getByLabelText('Crossing name')).toBeTruthy();expect(screen.getByLabelText('Point of interest name')).toBeTruthy();expect(screen.getByLabelText('Barrier name: 1')).toBeTruthy();
 const features=constraintMapFeatures(barriers,corridors,crossings,points),barrierStyles=barrierMapStyle(features[0]);
 if(!Array.isArray(barrierStyles))throw new Error('Expected line styles');
 const colours=[barrierStyles[1].getStroke()!.getColor(),facilitatorMapStyle(features[1]).getStroke()!.getColor(),facilitatorMapStyle(features[2]).getStroke()!.getColor(),(facilitatorMapStyle(features[3]).getImage() as import('ol/style/Circle').default).getFill()!.getColor()];
 const swatches=container.querySelectorAll<HTMLElement>('.constraint-card legend i');
 colours.forEach((colour,index)=>{const probe=document.createElement('i');probe.style.backgroundColor=String(colour);expect(swatches[index].style.backgroundColor).toBe(probe.style.backgroundColor)});
 expect(swatches[0].style.border).toBe('1px solid rgb(255, 255, 255)');
 cleanup();setLanguage('es');
});
