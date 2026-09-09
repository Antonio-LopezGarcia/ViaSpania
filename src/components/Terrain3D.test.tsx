// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {formatDisplayedAngle,Terrain3D} from './Terrain3D';
const state=vi.hoisted(()=>({created:0,completeTexture:()=>{},failTexture:()=>{},frames:[] as {routes:number;markers:number[][];markerColors:string[];mapped:boolean;position:number[];width:number;height:number}[],saved:vi.fn(async()=>'/tmp/test.avi'),png:vi.fn(async()=>'/tmp/test.png'),compass:vi.fn(),profile:vi.fn()}));
vi.mock('../services/exports',()=>({saveMediaExport:state.saved,savePngExport:state.png,startVideoExport:async()=>({append:async()=>{},finish:state.saved,cancel:async()=>{}})}));
vi.mock('../core/i18n',()=>({useLanguage:()=> 'es',translateText:(s:string)=>s}));
vi.mock('../core/exportWatermark',()=>({drawViaSpaniaWatermark:vi.fn()}));
vi.mock('../core/gifEncoder',()=>({GifEncoder:class{addFrame(){}finish(){return new Uint8Array([1])}}}));
vi.mock('../core/videoElevationProfile',async original=>{const actual=await original<typeof import('../core/videoElevationProfile')>();return{...actual,drawAnimatedElevationProfile:state.profile}});
vi.mock('../core/videoOverlays',()=>({cameraHeading:()=>45,drawVideoCompass:state.compass,drawVideoAttribution:vi.fn()}));
vi.mock('three',async original=>{
 const actual=await original<typeof import('three')>();
 return{...actual,TextureLoader:class{load(_url:string,onLoad:(texture:import('three').Texture)=>void,_progress:unknown,onError:()=>void){const texture=new actual.Texture();state.completeTexture=()=>{texture.image={width:1,height:1};onLoad(texture)};state.failTexture=onError;return texture}},WebGLRenderer:class{
  domElement=document.createElement('canvas');ratio=1;
  constructor(){state.created++}
  setPixelRatio(n:number){this.ratio=n}getPixelRatio(){return this.ratio}
  setSize(w:number,h:number){this.domElement.width=w;this.domElement.height=h}
  render(scene:import('three').Scene,camera:import('three').Camera){state.frames.push({markers:scene.children.filter(o=>o.renderOrder===1001&&o.visible).map(o=>o.position.toArray()),markerColors:scene.children.filter(o=>o.renderOrder===1002&&o.visible).map(o=>(o as import('three').Mesh<import('three').BufferGeometry,import('three').MeshBasicMaterial>).material.color.getHexString()),mapped:scene.children.some(o=>o instanceof actual.Mesh&&o.material instanceof actual.MeshStandardMaterial&&!!o.material.map?.image),routes:scene.children.filter(o=>o.type==='Line2'&&o.visible&&o.renderOrder===30).length,position:camera.position.toArray(),width:this.domElement.width,height:this.domElement.height})}
  dispose(){}
 }};

});
vi.mock('three/examples/jsm/controls/OrbitControls.js',async()=>{const THREE=await import('three');return{OrbitControls:class{target=new THREE.Vector3();enabled=true;enableDamping=true;update(){}dispose(){}addEventListener(){}removeEventListener(){}}}});
const mesh={width:2,height:2,widthM:100,heightM:100,minElevationM:0,maxElevationM:10,elevations:[0,10,0,10],wgs84Extent:[0,0,1,1] as [number,number,number,number]};
const routes=[{coordinates:[[.1,.1],[.9,.9]] as [number,number][],color:'#ff0000',result:{elevationsM:[100,150]}},{coordinates:[[.1,.9],[.9,.1]] as [number,number][],color:'#00ff00',result:{elevationsM:[120,180]}}];
beforeEach(()=>{state.created=0;state.frames=[];state.saved.mockClear();state.png.mockClear();state.compass.mockClear();state.profile.mockClear();vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:vi.fn(),getImageData:vi.fn(()=>({data:new Uint8ClampedArray(4),width:1,height:1}))} as unknown as CanvasRenderingContext2D);vi.spyOn(HTMLCanvasElement.prototype,'toBlob').mockImplementation(callback=>callback({arrayBuffer:async()=>new Uint8Array([255,216,255,217]).buffer} as Blob));vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,test')});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
describe('exportación del visor 3D',()=>{
 it('limita los ángulos mostrados a dos decimales sin alterar su valor interno',async()=>{
  expect(formatDisplayedAngle(41.1267)).toBe('41.13');
  expect(formatDisplayedAngle(123.004)).toBe('123');
  const onCameraChange=vi.fn();
  render(<Terrain3D mesh={mesh} points={[]} exaggeration={1} palette="terrain" initialInclination={41.1267} initialOrientation={123.004} onCameraChange={onCameraChange} onSnapshotReady={()=>{}} resetToken={0}/>);
  expect(screen.getByText('41.13°')).toBeTruthy();
  expect(screen.getByText('123°')).toBeTruthy();
  expect(screen.getByRole('button',{name:'Exportar vídeo'})).toBeTruthy();
  expect(screen.getByRole('button',{name:'Exportar animación GIF'})).toBeTruthy();
  await waitFor(()=>expect(onCameraChange).toHaveBeenCalledWith({inclination:41.1267,orientation:123.004}));
 });
 it('usa la resolución máxima por defecto y exporta un fotograma PNG',async()=>{
  render(<Terrain3D projectName="Guadix" mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  expect((screen.getByLabelText(/^Resolución/) as HTMLSelectElement).value).toBe('1920x1080');expect(screen.queryByText(/px · 20/)).toBeNull();
  fireEvent.click(screen.getByText('Exportar fotograma PNG'));await waitFor(()=>expect(state.png).toHaveBeenCalledWith('data:image/png;base64,test',expect.stringMatching(/^Guadix_frame_\d{6}(?:_\d+)?\.png$/)));expect(screen.getByText(/Fotograma PNG guardado/)).toBeTruthy();
 });
 it.each(['854x480','1280x720','1920x1080'])('mantiene escena, líneas y cámara al exportar %s',async(resolution)=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:'routes'}});
  fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});
  fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  fireEvent.change(screen.getByLabelText(/^Resolución/),{target:{value:resolution}});
  const before=state.frames.at(-1)!.position;
  fireEvent.click(screen.getByText('Exportar vídeo'));
  await waitFor(()=>expect(state.saved).toHaveBeenCalledTimes(1));
  const [width,height]=resolution.split('x').map(Number),exported=state.frames.filter(f=>f.width===width&&f.height===height);expect(exported).toHaveLength(2);expect(exported.every(f=>f.routes===2&&f.markers.length===2)).toBe(true);expect(exported.every(f=>f.markerColors.join(',')==='ff0000,00ff00')).toBe(true);expect(state.created).toBe(1);expect(state.frames.at(-1)!.position).toEqual(before);
 });
 it('exporta un seguimiento que cambia de posición y conserva las rutas',async()=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:'flyover'}});fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  fireEvent.click(screen.getByText('Exportar vídeo'));await waitFor(()=>expect(state.saved).toHaveBeenCalledTimes(1));const frames=state.frames.filter(f=>f.width===1920);expect(frames[0].position).not.toEqual(frames[1].position);expect(frames.every(f=>f.routes===2)).toBe(true);expect(frames.every(f=>f.markers.length===1&&f.markerColors[0]==='ff0000')).toBe(true);expect(frames[0].markers[0]).not.toEqual(frames[1].markers[0]);
 });
 it('actualiza el marcador cuando cambia el estilo de la ruta',()=>{
  const view=render(<Terrain3D mesh={mesh} points={[]} routes={routes} routeColor="#7c3aed" exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:'routes'}});
  expect(state.frames.at(-1)!.markerColors).toEqual(['7c3aed','7c3aed']);
  view.rerender(<Terrain3D mesh={mesh} points={[]} routes={routes} routeColor="#f59e0b" exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByRole('slider',{name:/^Inclinación/}),{target:{value:'50'}});
  expect(state.frames.at(-1)!.markerColors).toEqual(['f59e0b','f59e0b']);
 });
 it('conserva los colores de ruta en la exportación GIF',async()=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:'routes'}});fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  fireEvent.click(screen.getByText('Exportar animación GIF'));await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
  const frames=state.frames.filter(frame=>frame.width===1280&&frame.height===720);expect(frames).toHaveLength(2);expect(frames.every(frame=>frame.markerColors.join(',')==='ff0000,00ff00')).toBe(true);
 });
 it('oculta la exportación en las capturas para informes',()=>{render(<Terrain3D mesh={mesh} points={[]} exaggeration={1} palette="terrain" hideAnimationPanel onSnapshotReady={()=>{}} resetToken={0}/>);expect(screen.queryByText('Exportación animada')).toBeNull()});
 it('cancela sin guardar y restaura la cámara',async()=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  const before=state.frames.at(-1)!.position;fireEvent.click(screen.getByText('Exportar vídeo'));fireEvent.click(screen.getByText('Cancelar'));
  await waitFor(()=>expect(screen.getByText('Exportación cancelada; recursos liberados.')).toBeTruthy());expect(state.saved).not.toHaveBeenCalled();expect(state.frames.at(-1)!.position).toEqual(before);
 });
 it('restaura los controles tras un fallo de codificación',async()=>{
  vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(callback=>callback(null));
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  const before=state.frames.at(-1)!.position;fireEvent.click(screen.getByText('Exportar vídeo'));await waitFor(()=>expect(screen.getByText(/No se pudo codificar el fotograma/)).toBeTruthy());expect(state.saved).not.toHaveBeenCalled();expect(state.frames.at(-1)!.position).toEqual(before);expect((screen.getByLabelText('Tipo de animación') as HTMLSelectElement).disabled).toBe(false);
 });
 it('previsualiza inclinación y distancia sin reconstruir la escena',()=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:'flyover'}});
  const first=state.frames.at(-1)!.position;fireEvent.change(screen.getByRole('slider',{name:/^Inclinación/}),{target:{value:'65'}});const second=state.frames.at(-1)!.position;
  expect(second).not.toEqual(first);fireEvent.change(screen.getByLabelText(/^Distancia de cámara/),{target:{value:'30'}});expect(state.frames.at(-1)!.position).not.toEqual(second);expect(state.frames.at(-1)!.markers).toHaveLength(1);expect(state.created).toBe(1);
 });
 it('comunica la cámara seleccionada para inicializar el informe 3D',async()=>{
  const onCameraChange=vi.fn();
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" initialInclination={41} initialOrientation={123} onCameraChange={onCameraChange} onSnapshotReady={()=>{}} resetToken={0}/>);
  await waitFor(()=>expect(onCameraChange).toHaveBeenCalledWith({inclination:41,orientation:123}));
  fireEvent.change(screen.getByRole('slider',{name:/^Inclinación/}),{target:{value:'60'}});
  fireEvent.change(screen.getByRole('slider',{name:/^Orientación/}),{target:{value:'210'}});
  await waitFor(()=>expect(onCameraChange).toHaveBeenLastCalledWith({inclination:60,orientation:210}));
 });
 it.each(['orbit','routes','flyover'])('espera la textura y la conserva en %s',async(mode)=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} textureDataUrl="data:image/png;base64,test" exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:mode}});fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  fireEvent.click(screen.getByText('Exportar vídeo'));expect(state.saved).not.toHaveBeenCalled();expect(state.frames.filter(f=>f.width===1920)).toHaveLength(0);
  state.completeTexture();await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());expect(state.frames.filter(f=>f.width===1920).every(f=>f.mapped)).toBe(true);
 });
 it('no exporta una textura que ha fallado',async()=>{
  render(<Terrain3D mesh={mesh} points={[]} textureDataUrl="bad" exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  state.failTexture();fireEvent.click(screen.getByText('Exportar vídeo'));await waitFor(()=>expect(screen.getByText(/No se pudo cargar la capa base/)).toBeTruthy());expect(state.saved).not.toHaveBeenCalled();
 });
 it.each(['orbit','routes','flyover'])('superpone la brújula en el modo %s cuando se activa',async(mode)=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:mode}});
  fireEvent.click(screen.getByLabelText('Brújula en el vídeo'));fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  fireEvent.click(screen.getByText('Exportar vídeo'));await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());expect(state.compass).toHaveBeenCalledTimes(2);
 });

 it.each(['routes','flyover'])('anima el perfil altimétrico en %s',async mode=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:mode}});fireEvent.click(screen.getByLabelText('Perfil altimétrico en el vídeo'));
  fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  fireEvent.click(screen.getByText('Exportar vídeo'));await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());expect(state.profile).toHaveBeenCalledTimes(2);expect(state.profile.mock.calls.map(call=>call[4])).toEqual([0,1]);expect(state.profile.mock.calls[0][3]).toHaveLength(mode==='routes'?2:1);
 });

});
