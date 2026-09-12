import {Terrain3DLegend} from './Terrain3DLegend';
import {Terrain3DToolbar,type TerrainToolbarState,type TerrainToolbarAction} from './Terrain3DToolbar';
import {useEffect,useRef,useState,type ComponentProps} from 'react';
import {WebviewWindow,getCurrentWebviewWindow} from '@tauri-apps/api/webviewWindow';
import {emitTo,listen} from '@tauri-apps/api/event';
import {Terrain3D} from './Terrain3D';
import {ElevationProfileOverlay} from './ElevationProfileOverlay';
import {loadAppSettings} from '../core/appSettings';
import {setLanguage} from '../core/i18n';
import '../terrain-3d.css';

type Props=ComponentProps<typeof Terrain3D>&{toolbar?:TerrainToolbarState;onToolbarAction?:(action:TerrainToolbarAction)=>void;profileRoutes?:ComponentProps<typeof ElevationProfileOverlay>['routes']};
export function terrainWindowState(props:Props){
 const {onSnapshotReady,onVideoExported,onCameraChange,onToggleLegendItem,onToolbarAction,...state}=props;
 return state;
}
type State=ReturnType<typeof terrainWindowState>;
export function NativeTerrainWindow({detached,onReturn,onError,...props}:Props&{detached:boolean;onReturn:()=>void;onError:()=>void}){
 const latest=useRef({props,onReturn,onError});latest.current={props,onReturn,onError};
 const target=useRef<WebviewWindow|null>(null),[active,setActive]=useState(false);
 const publish=()=>target.current?.emit('terrain-state',{props:terrainWindowState(latest.current.props),settings:loadAppSettings()});
 useEffect(()=>{
  if(!detached)return;
  let disposed=false;let timeout:ReturnType<typeof setTimeout>|undefined;const stops:(()=>void)[]=[];
  const register=async(p:Promise<()=>void>)=>{const stop=await p;if(disposed)stop();else stops.push(stop)};
  const fail=()=>{if(!disposed){setActive(false);latest.current.onError()}};
  void (async()=>{
   // Register the handshake before creating the webview: its load can be very fast.
   await register(listen<string>('terrain-ready',e=>{if(!disposed&&e.payload===target.current?.label){clearTimeout(timeout);setActive(true);void publish()?.catch(fail)}}));
   await register(listen<TerrainToolbarAction>('terrain-toolbar',e=>latest.current.props.onToolbarAction?.(e.payload)));
   await register(listen('terrain-return',()=>latest.current.onReturn()));
   await register(listen<{inclination:number;orientation:number}>('terrain-camera',e=>latest.current.props.onCameraChange?.(e.payload)));
   await register(listen<string>('terrain-legend',e=>latest.current.props.onToggleLegendItem?.(e.payload)));
   if(disposed)return;
   const label=`terrain-${crypto.randomUUID()}`;
   const child=new WebviewWindow(label,{url:'index.html?terrainWindow=1',title:'ViaSpania · Visor 3D',width:1280,height:820,minWidth:640,minHeight:480,resizable:true,maximizable:true,decorations:true});target.current=child;timeout=setTimeout(fail,15000);
   await register(getCurrentWebviewWindow().onCloseRequested(()=>{void child.destroy().catch(()=>{})}));
   await register(child.once('tauri://error',fail));
   await register(child.once('tauri://destroyed',()=>{if(!disposed){target.current=null;setActive(false);latest.current.onReturn()}}));
  })().catch(fail);
  return()=>{disposed=true;clearTimeout(timeout);stops.forEach(stop=>stop());const child=target.current;target.current=null;if(child)void child.destroy().catch(()=>{});setActive(false)};
 },[detached]);
 useEffect(()=>{if(active)void publish()?.catch(()=>latest.current.onError())},[props,active]);
 return active?null:<Terrain3D {...props}/>;
}
export function TerrainWindowApp(){
 const [state,setState]=useState<State|null>(null),[error,setError]=useState('');
 useEffect(()=>{let disposed=false,stop:(()=>void)|undefined;
  void listen<{props:State;settings:ReturnType<typeof loadAppSettings>}>('terrain-state',e=>{setLanguage(e.payload.settings.language??'es');setState(e.payload.props)}).then(async unlisten=>{if(disposed){unlisten();return}stop=unlisten;await emitTo('main','terrain-ready',getCurrentWebviewWindow().label)}).catch(()=>setError('No se pudo conectar con el proyecto abierto.'));
  return()=>{disposed=true;stop?.()};
 },[]);
 return <section className="terrain-3d-overlay" style={{inset:0}}><button className="terrain-3d-close" aria-label="Cerrar visor 3D" onClick={()=>void getCurrentWebviewWindow().close()}>×</button>{state?.toolbar?<Terrain3DToolbar state={state.toolbar} onAction={action=>void emitTo('main','terrain-toolbar',action).catch(()=>setError('No se pudo actualizar el visor 3D.'))} onReturn={()=>void emitTo('main','terrain-return')}/>:<div className="terrain-3d-toolbar"><strong>Visor 3D</strong></div>}{error&&<p role="alert">{error}</p>}<div className="terrain-3d-stage">{state?<Terrain3D {...state} onSnapshotReady={()=>{}} onCameraChange={view=>void emitTo('main','terrain-camera',view)} onToggleLegendItem={id=>void emitTo('main','terrain-legend',id)}/>:<p>{error||'Esperando el proyecto…'}</p>}{state&&<Terrain3DLegend title={state.legendTitle} items={state.legendItems??[]} onToggle={id=>void emitTo('main','terrain-legend',id)}/>}{state&&<ElevationProfileOverlay routes={state.profileRoutes??[]}/>}</div></section>;
}
