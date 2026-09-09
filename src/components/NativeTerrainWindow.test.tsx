// @vitest-environment jsdom
import {Terrain3DToolbar} from './Terrain3DToolbar';
import {emitTo} from '@tauri-apps/api/event';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({listeners:new Map<string,(event:{payload:unknown})=>void>(),windows:[] as {label:string;emit:ReturnType<typeof vi.fn>;destroy:ReturnType<typeof vi.fn>;once:ReturnType<typeof vi.fn>}[]}));
vi.mock('@tauri-apps/api/event',()=>({listen:vi.fn(async(name,fn)=>{mock.listeners.set(name,fn);return()=>mock.listeners.delete(name)}),emitTo:vi.fn(async()=>{})}));
vi.mock('@tauri-apps/api/webviewWindow',()=>({WebviewWindow:class{label:string;emit=vi.fn(async()=>{});destroy=vi.fn(async()=>{});once=vi.fn(async()=>()=>{});constructor(label:string){this.label=label;mock.windows.push(this)}},getCurrentWebviewWindow:()=>({label:'test',onCloseRequested:async()=>()=>{}})}));
vi.mock('./Terrain3D',()=>({Terrain3D:()=> <div>Terreno integrado</div>}));
import {NativeTerrainWindow,TerrainWindowApp,terrainWindowState} from './NativeTerrainWindow';
const props={mesh:{width:2,height:2,widthM:10,heightM:10,minElevationM:0,maxElevationM:1,elevations:[0,1,0,1],wgs84Extent:[0,0,1,1] as [number,number,number,number]},exaggeration:2,palette:'terrain',points:[],resetToken:0,onSnapshotReady:vi.fn()};
afterEach(()=>{cleanup();mock.listeners.clear();mock.windows.length=0});
it('transmite datos sin funciones, conservando terreno y atribución',()=>{const state=terrainWindowState({...props,textureAttribution:'IGN',onCameraChange:vi.fn()});expect(JSON.parse(JSON.stringify(state))).toMatchObject({mesh:props.mesh,textureAttribution:'IGN'});expect(state).not.toHaveProperty('onSnapshotReady');expect(state).not.toHaveProperty('onCameraChange')});
it('espera al visor, sincroniza cambios y destruye solo la ventana auxiliar al reintegrar',async()=>{
 const onReturn=vi.fn(),onError=vi.fn();const view=render(<NativeTerrainWindow {...props} detached onReturn={onReturn} onError={onError}/>);
 await waitFor(()=>expect(mock.windows).toHaveLength(1));const child=mock.windows[0];
 expect(screen.getByText('Terreno integrado')).toBeTruthy();
 act(()=>mock.listeners.get('terrain-ready')?.({payload:child.label}));
 await waitFor(()=>expect(child.emit).toHaveBeenCalledWith('terrain-state',expect.objectContaining({props:expect.objectContaining({exaggeration:2})})));
 expect(view.container.childElementCount).toBe(0);
 view.rerender(<NativeTerrainWindow {...props} exaggeration={4} detached onReturn={onReturn} onError={onError}/>);
 await waitFor(()=>expect(child.emit).toHaveBeenLastCalledWith('terrain-state',expect.objectContaining({props:expect.objectContaining({exaggeration:4})})));
 act(()=>mock.listeners.get('terrain-return')?.({payload:null}));expect(onReturn).toHaveBeenCalledOnce();
 view.rerender(<NativeTerrainWindow {...props} detached={false} onReturn={onReturn} onError={onError}/>);
 expect(child.destroy).toHaveBeenCalledOnce();expect(screen.getByText('Terreno integrado')).toBeTruthy();expect(onError).not.toHaveBeenCalled();
});
it('recupera el visor integrado si falla la creación nativa',async()=>{
 const onError=vi.fn();render(<NativeTerrainWindow {...props} detached onReturn={()=>{}} onError={onError}/>);
 await waitFor(()=>expect(mock.windows[0]?.once).toHaveBeenCalled());
 act(()=>mock.windows[0].once.mock.calls.find(([event])=>event==='tauri://error')?.[1]());
 expect(onError).toHaveBeenCalledOnce();expect(screen.getByText('Terreno integrado')).toBeTruthy();
});
it('cerrar la ventana externa devuelve el visor sin cerrar el proyecto',async()=>{
 const onReturn=vi.fn();render(<NativeTerrainWindow {...props} detached onReturn={onReturn} onError={()=>{}}/>);
 await waitFor(()=>expect(mock.windows[0]?.once.mock.calls.some(([event])=>event==='tauri://destroyed')).toBe(true));
 act(()=>mock.windows[0].once.mock.calls.find(([event])=>event==='tauri://destroyed')?.[1]());
 expect(onReturn).toHaveBeenCalledOnce();expect(screen.getByText('Terreno integrado')).toBeTruthy();
});

const toolbar={exaggeration:2,routeWidth:4,palette:'terrain',textureId:'none',textureOptions:[{id:'external:map',name:'Mapa propio · externa'}],textureDisabled:false,textureLoading:false,contoursAvailable:false,layers:{points:true,pointLabels:true,barriers:true,crossings:true,corridors:true,pointsOfInterest:true,contours:false,highestPoint:false,scale:true}};
it('muestra los mismos controles en la ventana externa y envía los cambios al proyecto',async()=>{
 render(<TerrainWindowApp/>);
 await waitFor(()=>expect(mock.listeners.has('terrain-state')).toBe(true));
 act(()=>mock.listeners.get('terrain-state')?.({payload:{props:{...terrainWindowState(props),toolbar},settings:{language:'es'}}}));
 expect(screen.getByLabelText(/Exageración vertical/)).toBeTruthy();expect(screen.getByLabelText(/Grosor de rutas/)).toBeTruthy();
 expect((screen.getByLabelText('Curvas de nivel') as HTMLInputElement).disabled).toBe(true);
 fireEvent.change(screen.getByLabelText('Paleta'),{target:{value:'viridis'}});
 expect(emitTo).toHaveBeenCalledWith('main','terrain-toolbar',{type:'palette',value:'viridis'});
 fireEvent.click(screen.getByLabelText('Barreras'));
 expect(emitTo).toHaveBeenCalledWith('main','terrain-toolbar',{type:'layer',key:'barriers',value:false});
 fireEvent.change(screen.getByLabelText('Capa base sobre el modelo'),{target:{value:'external:map'}});
 expect(emitTo).toHaveBeenCalledWith('main','terrain-toolbar',{type:'texture',value:'external:map'});
 act(()=>mock.listeners.get('terrain-state')?.({payload:{props:{...terrainWindowState(props),toolbar:{...toolbar,palette:'viridis',textureDisabled:true,textureLoading:true}},settings:{language:'es'}}}));
 expect((screen.getByLabelText('Paleta') as HTMLSelectElement).value).toBe('viridis');
 expect((screen.getByLabelText('Capa base sobre el modelo') as HTMLSelectElement).disabled).toBe(true);
 expect(screen.getByText('Preparando mapa…')).toBeTruthy();
});
it('aplica las acciones externas mediante el callback vigente y no lo serializa',async()=>{
 const onToolbarAction=vi.fn();render(<NativeTerrainWindow {...props} toolbar={toolbar} onToolbarAction={onToolbarAction} detached onReturn={()=>{}} onError={()=>{}}/>);
 await waitFor(()=>expect(mock.listeners.has('terrain-toolbar')).toBe(true));
 act(()=>mock.listeners.get('terrain-toolbar')?.({payload:{type:'exaggeration',value:4}}));
 expect(onToolbarAction).toHaveBeenCalledWith({type:'exaggeration',value:4});
 expect(terrainWindowState({...props,toolbar,onToolbarAction})).not.toHaveProperty('onToolbarAction');
});

it('abre el visor externo desde el botón situado junto al cierre',()=>{
 const onDetach=vi.fn();const view=render(<Terrain3DToolbar state={toolbar} onAction={()=>{}} onDetach={onDetach}/>);
 const button=screen.getByRole('button',{name:'Abrir el visor 3D en una ventana independiente'});
 expect(button.closest('.terrain-3d-layers')).toBeNull();expect(button.closest('.terrain-3d-toolbar')).toBeTruthy();fireEvent.click(button);expect(onDetach).toHaveBeenCalledOnce();
 view.rerender(<Terrain3DToolbar state={toolbar} onAction={()=>{}} onReturn={()=>{}}/>);
 expect(screen.queryByRole('button',{name:'Abrir el visor 3D en una ventana independiente'})).toBeNull();
});
