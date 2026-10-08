import {programProcesses,type ProcessHandle,type ProcessStatus} from '../core/processStatus';
import {Terrain3DToolbar,type TerrainToolbarState,type TerrainToolbarAction} from './Terrain3DToolbar';
import {useEffect,useRef,useState,type ComponentProps} from 'react';
import {WebviewWindow,getCurrentWebviewWindow} from '@tauri-apps/api/webviewWindow';
import {emitTo,listen} from '@tauri-apps/api/event';
import {Terrain3D} from './Terrain3D';
import {ElevationProfileOverlay} from './ElevationProfileOverlay';
import {loadAppSettings} from '../core/appSettings';
import {setLanguage,translateText} from '../core/i18n';
import '../terrain-3d.css';

type Props=ComponentProps<typeof Terrain3D>&{toolbar?:TerrainToolbarState;onToolbarAction?:(action:TerrainToolbarAction)=>void;profileRoutes?:ComponentProps<typeof ElevationProfileOverlay>['routes']};
export function terrainWindowState(props:Props){
 const {onSnapshotReady,onVideoExported,onCameraChange,onFlightModeChange,onToggleLegendItem,onViewshedVisibilityChange,onToolbarAction,onTextureResolutionChange,...state}=props;
 return state;
}
type State=ReturnType<typeof terrainWindowState>;
/** Native messages clone arrays. Retain unchanged scene inputs so status/camera
 * updates cannot dispose the renderer in the middle of an export. */
export function reconcileTerrainWindowState(previous:State|null,next:State):State{
 if(!previous)return next;
 const entries=Object.entries(next).map(([key,value])=>{
  const old=previous[key as keyof State];
  return [key,Object.is(old,value)||(old!=null&&value!=null&&typeof old==='object'&&typeof value==='object'&&JSON.stringify(old)===JSON.stringify(value))?old:value];
 });
 const result=Object.fromEntries(entries) as State;
 return Object.keys(previous).length===entries.length&&entries.every(([key,value])=>Object.is(previous[key as keyof State],value))?previous:result;
}
export function NativeTerrainWindow({detached,onReturn,onError,...props}:Props&{detached:boolean;onReturn:()=>void;onError:()=>void}){
 const stableState=useRef<State|null>(null);stableState.current=reconcileTerrainWindowState(stableState.current,terrainWindowState(props));
 const latest=useRef({props,onReturn,onError});latest.current={props,onReturn,onError};
 const target=useRef<WebviewWindow|null>(null),[active,setActive]=useState(false);
 const publish=()=>target.current?.emit('terrain-state',{props:terrainWindowState(latest.current.props),settings:loadAppSettings()});
 useEffect(()=>{
  if(!detached)return;
  let remoteProcess:ProcessHandle|undefined;
  const finishRemote=(failed=false)=>{if(failed)remoteProcess?.fail();remoteProcess?.finish();remoteProcess=undefined};
  let disposed=false;let timeout:ReturnType<typeof setTimeout>|undefined;const stops:(()=>void)[]=[];
  const register=async(p:Promise<()=>void>)=>{const stop=await p;if(disposed)stop();else stops.push(stop)};
  const fail=()=>{if(!disposed){finishRemote(true);setActive(false);latest.current.onError()}};
  void (async()=>{
   // Register the handshake before creating the webview: its load can be very fast.
   await register(listen<string>('terrain-ready',e=>{if(!disposed&&e.payload===target.current?.label){clearTimeout(timeout);setActive(true);void publish()?.catch(fail)}}));
   await register(listen<TerrainToolbarAction>('terrain-toolbar',e=>latest.current.props.onToolbarAction?.(e.payload)));
   await register(listen<number>('terrain-texture-resolution',e=>latest.current.props.onTextureResolutionChange?.(e.payload)));
   await register(listen<{label:string;status:ProcessStatus}>('terrain-process-status',e=>{if(disposed||e.payload.label!==target.current?.label)return;if(e.payload.status==='running'){remoteProcess??=programProcesses.begin()}else finishRemote(e.payload.status==='error')}));
   await register(listen('terrain-return',()=>latest.current.onReturn()));
   await register(listen<boolean>('terrain-flight-mode',e=>latest.current.props.onFlightModeChange?.(e.payload)));
   await register(listen<{inclination:number;orientation:number}>('terrain-camera',e=>latest.current.props.onCameraChange?.(e.payload)));
   await register(listen<string>('terrain-legend',e=>latest.current.props.onToggleLegendItem?.(e.payload)));
   await register(listen<{id:string;visible:boolean}>('terrain-viewshed-visibility',e=>latest.current.props.onViewshedVisibilityChange?.(e.payload.id,e.payload.visible)));
   if(disposed)return;
   const label=`terrain-${crypto.randomUUID()}`;
   const child=new WebviewWindow(label,{url:'index.html?terrainWindow=1',title:'ViaSpania · Visor 3D',width:1280,height:820,minWidth:640,minHeight:480,resizable:true,maximizable:true,decorations:true});target.current=child;timeout=setTimeout(fail,15000);
   await register(getCurrentWebviewWindow().onCloseRequested(()=>{void child.destroy().catch(()=>{})}));
   await register(child.once('tauri://error',fail));
   await register(child.once('tauri://destroyed',()=>{if(!disposed){finishRemote(true);target.current=null;setActive(false);latest.current.onReturn()}}));
  })().catch(fail);
  return()=>{disposed=true;finishRemote(true);clearTimeout(timeout);stops.forEach(stop=>stop());const child=target.current;target.current=null;if(child)void child.destroy().catch(()=>{});setActive(false)};
 },[detached]);
 useEffect(()=>{if(active)void publish()?.catch(()=>latest.current.onError())},[props,active]);
 return active?null:<Terrain3D {...props} {...stableState.current}/>;
}
export function TerrainWindowApp(){
 useEffect(()=>programProcesses.subscribe(()=>{void emitTo('main','terrain-process-status',{label:getCurrentWebviewWindow().label,status:programProcesses.getSnapshot()}).catch(()=>{})}),[]);
 const [state,setState]=useState<State|null>(null),[error,setError]=useState(''),[flightMode,setFlightMode]=useState(false);
 useEffect(()=>{let disposed=false,stop:(()=>void)|undefined;
  void listen<{props:State;settings:ReturnType<typeof loadAppSettings>}>('terrain-state',e=>{setLanguage(e.payload.settings.language??'es');setState(previous=>reconcileTerrainWindowState(previous,e.payload.props))}).then(async unlisten=>{if(disposed){unlisten();return}stop=unlisten;await emitTo('main','terrain-ready',getCurrentWebviewWindow().label)}).catch(()=>setError('No se pudo conectar con el proyecto abierto.'));
  return()=>{disposed=true;stop?.()};
 },[]);
 return <section className={`terrain-3d-overlay${flightMode?' flight-mode':''}`} style={{inset:0}}><button className="terrain-3d-close" aria-label={translateText('Cerrar visor 3D')} title={translateText('Cerrar visor 3D')} onClick={()=>void getCurrentWebviewWindow().close()}>×</button>{state?.toolbar?<Terrain3DToolbar state={state.toolbar} onAction={action=>void emitTo('main','terrain-toolbar',action).catch(()=>setError('No se pudo actualizar el visor 3D.'))} flightMode={flightMode} onFlightModeToggle={()=>window.dispatchEvent(new Event('terrain-flight-toggle'))} onReturn={()=>void emitTo('main','terrain-return')}/>:<div className="terrain-3d-toolbar"><strong>Visor 3D</strong></div>}{error&&<p role="alert">{error}</p>}<div className="terrain-3d-stage">{state?<Terrain3D {...state} onSnapshotReady={()=>{}} onFlightModeChange={active=>{setFlightMode(active);void emitTo('main','terrain-flight-mode',active)}} onTextureResolutionChange={value=>void emitTo('main','terrain-texture-resolution',value)} onCameraChange={view=>void emitTo('main','terrain-camera',view)} onToggleLegendItem={id=>void emitTo('main','terrain-legend',id)} onViewshedVisibilityChange={(id,visible)=>void emitTo('main','terrain-viewshed-visibility',{id,visible})}/>:<p>{error||'Esperando el proyecto…'}</p>}{state&&<ElevationProfileOverlay movable routes={state.profileRoutes??[]}/>}</div></section>;
}
