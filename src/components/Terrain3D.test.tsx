// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import * as THREE from 'three';
import {MODELS} from '../core/costModels';
import {comparisonRouteColor} from '../core/comparisonColors';
import {cameraInclinationFromDirection,formatDisplayedAngle,syncInclinationIndicator,Terrain3D} from './Terrain3D';
const state=vi.hoisted(()=>({scene:null as import('three').Scene|null,created:0,started:vi.fn(),completeTexture:()=>{},failTexture:()=>{},frames:[] as {terrainColors:number[];contourColors:string[];labels:{text:string;position:number[];screen:number[];size:number[];visible:boolean;depthTest:boolean}[];leaders:number[][][];routes:number;markers:number[][];markerColors:string[];mapped:boolean;position:number[];width:number;height:number}[],saved:vi.fn(async()=>'/tmp/test.avi'),png:vi.fn(async()=>'/tmp/test.png'),compass:vi.fn(),profile:vi.fn()}));
vi.mock('../services/exports',()=>({saveMediaExport:state.saved,savePngExport:state.png,startVideoExport:async(format:string)=>{state.started(format);return{append:async()=>{},finish:state.saved,cancel:async()=>{}}}}));
vi.mock('../core/i18n',()=>({useLanguage:()=> 'es',translateText:(s:string)=>s}));
vi.mock('../core/exportWatermark',()=>({drawViaSpaniaWatermark:vi.fn()}));
vi.mock('../core/gifEncoder',()=>({GifEncoder:class{addFrame(){}finish(){return new Uint8Array([1])}}}));
vi.mock('../core/videoElevationProfile',async original=>{const actual=await original<typeof import('../core/videoElevationProfile')>();return{...actual,drawAnimatedElevationProfile:state.profile}});
vi.mock('../core/videoOverlays',()=>({cameraHeading:()=>45,drawVideoCompass:state.compass,drawVideoAttribution:vi.fn()}));
vi.mock('three',async original=>{
 const actual=await original<typeof import('three')>();
 return{...actual,TextureLoader:class{load(_url:string,onLoad:(texture:import('three').Texture)=>void,_progress:unknown,onError:()=>void){const texture=new actual.Texture();state.completeTexture=()=>{texture.image={width:1,height:1};onLoad(texture)};state.failTexture=onError;return texture}},WebGLRenderer:class{
  domElement=document.createElement('canvas');ratio=1;capabilities={getMaxAnisotropy:()=>8};
  constructor(){state.created++}
  setPixelRatio(n:number){this.ratio=n}getPixelRatio(){return this.ratio}
  setSize(w:number,h:number){this.domElement.width=w;this.domElement.height=h}
  render(scene:import('three').Scene,camera:import('three').Camera){state.scene=scene;camera.updateMatrixWorld();state.frames.push({terrainColors:Array.from((scene.children.find(o=>o instanceof actual.Mesh&&o.name==='terrain-surface') as import('three').Mesh).geometry.getAttribute('color').array),contourColors:scene.children.filter(o=>o instanceof actual.LineSegments||o.type==='LineSegments2').map(o=>(o as unknown as {material:{color:{getHexString:()=>string}}}).material.color.getHexString()),labels:scene.children.filter(o=>o instanceof actual.Sprite&&o.renderOrder===31).map(o=>{const sprite=o as import('three').Sprite,perspective=camera as import('three').PerspectiveCamera,depth=-sprite.position.clone().applyMatrix4(camera.matrixWorldInverse).z,pixels=this.domElement.height/(2*depth*Math.tan(actual.MathUtils.degToRad(perspective.fov/2)));return{text:o.name,position:o.position.toArray(),screen:o.position.clone().project(camera).toArray(),size:[sprite.scale.x*sprite.userData.labelWidthRatio*pixels,sprite.scale.y*pixels],visible:o.visible,depthTest:sprite.material.depthTest}}),leaders:scene.children.filter(o=>o instanceof actual.Line&&o.renderOrder===29).map(o=>{const a=(o as import('three').Line).geometry.getAttribute('position');return [[a.getX(0),a.getY(0),a.getZ(0)],[a.getX(1),a.getY(1),a.getZ(1)]]}),markers:scene.children.filter(o=>o.renderOrder===1001&&o.visible).map(o=>o.position.toArray()),markerColors:scene.children.filter(o=>o.renderOrder===1002&&o.visible).map(o=>(o as import('three').Mesh<import('three').BufferGeometry,import('three').MeshBasicMaterial>).material.color.getHexString()),mapped:scene.children.some(o=>o instanceof actual.Mesh&&o.name==='terrain-surface'&&!!o.material.map?.image),routes:scene.children.filter(o=>o.type==='Line2'&&o.visible&&o.renderOrder===30).length,position:camera.position.toArray(),width:this.domElement.width,height:this.domElement.height})}
  dispose(){}
 }};

});
vi.mock('three/examples/jsm/controls/OrbitControls.js',async()=>{const THREE=await import('three');return{OrbitControls:class{target=new THREE.Vector3();enabled=true;enableDamping=true;update(){}dispose(){}addEventListener(){}removeEventListener(){}}}});
const mesh={width:2,height:2,widthM:100,heightM:100,minElevationM:0,maxElevationM:10,elevations:[0,10,0,10],wgs84Extent:[0,0,1,1] as [number,number,number,number]};
const isochroneMesh={...mesh,wgs84Extent:[0,0,.0008983152841195215,.0008983152841195215] as [number,number,number,number]};
const routes=[{coordinates:[[.1,.1],[.9,.9]] as [number,number][],color:'#ff0000',result:{elevationsM:[100,150]}},{coordinates:[[.1,.9],[.9,.1]] as [number,number][],color:'#00ff00',result:{elevationsM:[120,180]}}];
beforeEach(()=>{Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(this:HTMLDialogElement){this.open=true}});Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(this:HTMLDialogElement){this.open=false}});state.started.mockClear();state.created=0;state.frames=[];state.saved.mockClear();state.png.mockClear();state.compass.mockClear();state.profile.mockClear();vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({drawImage:vi.fn(),getImageData:vi.fn(()=>({data:new Uint8ClampedArray(4),width:1,height:1}))} as unknown as CanvasRenderingContext2D);vi.spyOn(HTMLCanvasElement.prototype,'toBlob').mockImplementation(callback=>callback({arrayBuffer:async()=>new Uint8Array([255,216,255,217]).buffer} as Blob));vi.spyOn(HTMLCanvasElement.prototype,'toDataURL').mockReturnValue('data:image/png;base64,test')});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
function beginVideoExport(format:'avi'|'mp4'='avi'){fireEvent.click(screen.getByRole('button',{name:'Exportar vídeo'}));const dialog=within(screen.getByRole('dialog'));if(format==='mp4')fireEvent.click(dialog.getByRole('radio',{name:/MP4/}));fireEvent.click(dialog.getByRole('button',{name:'Exportar'}))}
describe('exportación del visor 3D',()=>{
 it.each([0,2.5,45,85,-2.5,-45,-85])('mantiene la lectura y la aguja sincronizadas a %s°',angle=>{
  const needle=document.createElement('i'),reading=document.createElement('span');
  syncInclinationIndicator(needle,reading,angle);
  expect(needle.style.transform).toBe(`translate(-50%, -50%) rotate(${angle}deg)`);
  expect(reading.textContent).toBe(`${formatDisplayedAngle(angle)}°`);
  expect(cameraInclinationFromDirection({x:0,y:-Math.sin(angle*Math.PI/180),z:-Math.cos(angle*Math.PI/180)})).toBeCloseTo(angle,10);
  syncInclinationIndicator(needle,reading,0);
  expect(needle.style.transform).toBe('translate(-50%, -50%) rotate(0deg)');
 });
 it('abre la selección sin renderizar y cancelar no crea archivos',()=>{
  render(<Terrain3D mesh={mesh} points={[]} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.click(screen.getByRole('button',{name:'Exportar vídeo'}));
  expect(screen.getByRole('dialog')).toBeTruthy();expect(state.started).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Cancelar'}));
  expect(screen.queryByRole('dialog')).toBeNull();expect(state.saved).not.toHaveBeenCalled();
 });
 it('MP4 usa el renderizador AVI y encadena la conversión automáticamente',async()=>{
  let complete!:()=>void;
  state.saved.mockReturnValueOnce(new Promise<string>(resolve=>{complete=()=>resolve('/tmp/video.mp4')}));
  render(<Terrain3D mesh={mesh} points={[]} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  beginVideoExport('mp4');
  await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
  expect(state.started).toHaveBeenCalledWith('mp4');
  const header=(state.saved.mock.calls[0] as unknown as [Uint8Array])[0];
  expect(new TextDecoder().decode(header.slice(0,4))).toBe('RIFF');
  expect(screen.getByText('Convirtiendo a MP4…')).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();expect(screen.queryByRole('button',{name:'Cancelar'})).toBeNull();
  complete();await waitFor(()=>expect(screen.getByText(/Guardado · .* · MP4/)).toBeTruthy());
 });

 it.each([2,7,15].flatMap(count=>['854x480','1280x720','1920x1080'].map(resolution=>({count,resolution}))))('exporta los nombres y colores de $count modelos a $resolution con la leyenda opcional',async({count,resolution})=>{
  const symbols:string[]=[],context={font:'',fillStyle:'',save:vi.fn(),restore:vi.fn(),measureText(s:string){return {width:s.length*parseFloat(this.font.replace(/^600 /,''))*.65}},fillText:vi.fn(),fillRect(){symbols.push(this.fillStyle)},drawImage:vi.fn()};
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const models=Object.values(MODELS).slice(0,count),order=models.map(model=>model.id);
  const legend=models.map(model=>({id:`comparison-${model.id}`,label:model.name,color:comparisonRouteColor(model.id,order),visible:true}));
  const calculatedRoutes=legend.map(item=>({...routes[0],label:item.label,color:item.color}));
  render(<Terrain3D mesh={mesh} points={[]} routes={calculatedRoutes} legendItems={legend} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  const checkbox=screen.getByLabelText('Leyenda de rutas en el vídeo') as HTMLInputElement;
  expect(checkbox.checked).toBe(false);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:'routes'}});
  fireEvent.change(screen.getByLabelText(/^Resolución/),{target:{value:resolution}});
  fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  fireEvent.click(screen.getByLabelText('Perfil altimétrico en el vídeo'));
  fireEvent.click(screen.getByLabelText('Brújula en el vídeo'));
  for(const [index,enabled] of [false,true,false].entries()){
   if(index)fireEvent.click(checkbox);
   context.fillText.mockClear();symbols.length=0;state.saved.mockClear();
   beginVideoExport();await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
   const labels=['Rutas',...legend.map(item=>item.label)],colors=legend.map(item=>item.color);
   expect(context.fillText.mock.calls.map(call=>call[0])).toEqual(enabled?[...labels,...labels]:[]);
   expect(symbols.filter(color=>color.startsWith('#'))).toEqual(enabled?[...colors,...colors]:[]);
  }
  const [width,height]=resolution.split('x').map(Number);
  expect(state.frames.filter(frame=>frame.width===width&&frame.height===height).every(frame=>frame.routes===count)).toBe(true);
  expect(state.compass).toHaveBeenCalled();expect(state.profile).toHaveBeenCalled();
 });
 it.each(['orbit','routes','flyover'])('exporta ida y vuelta en %s y deja fuera otros cálculos al cambiar de modo',async mode=>{
  const context={save:vi.fn(),restore:vi.fn(),measureText:(s:string)=>({width:s.length*8}),fillText:vi.fn(),fillRect:vi.fn(),drawImage:vi.fn()};
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const legend=routes.map((route,index)=>({id:`simple-${index}`,label:index?'Vuelta':'Ida',color:route.color,visible:true}));
  const props={mesh,points:[],routes,exaggeration:1,palette:'terrain',onSnapshotReady:()=>{},resetToken:0};
  const view=render(<Terrain3D {...props} legendItems={legend}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:mode}});
  fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  fireEvent.click(screen.getByLabelText('Leyenda de rutas en el vídeo'));
  beginVideoExport();await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
  expect(context.fillText.mock.calls.map(call=>call[0])).toEqual(['Rutas','Ida','Vuelta','Rutas','Ida','Vuelta']);
  for(const prefix of ['multipoint','multiroute','isochrone']){
   view.rerender(<Terrain3D {...props} legendItems={legend.map(item=>({...item,id:item.id.replace('simple',prefix)}))}/>);
   expect(screen.queryByLabelText('Leyenda de rutas en el vídeo')).toBeNull();
   context.fillText.mockClear();state.saved.mockClear();
   beginVideoExport();await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
   expect(context.fillText).not.toHaveBeenCalled();
  }
 });
 it.each(['orbit','routes','flyover'].flatMap(mode=>['Exportar vídeo','Exportar animación GIF'].map(button=>({mode,button}))))('exporta con leyenda activada y desactivada: $mode / $button',async({mode,button})=>{
  const symbols:string[]=[],context={fillStyle:'',save:vi.fn(),restore:vi.fn(),measureText:(s:string)=>({width:s.length*8}),fillText:vi.fn(),fillRect(){symbols.push(this.fillStyle)},drawImage:vi.fn(),getImageData:()=>({data:new Uint8ClampedArray(4),width:1,height:1})};
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const contourLines=[{level:100,coordinates:[[.1,.1],[.9,.1]] as [number,number][]},{level:300,color:'#7c3aed',coordinates:[[.1,.9],[.9,.9]] as [number,number][]}];
  const legend=[{id:'contour-100',label:'100 m',color:'#000000',visible:true},{id:'contour-200',label:'200 m',color:'#123456',visible:false},{id:'global-contour-300',label:'Curva · 300 m',color:'#7c3aed',visible:true},{id:'isochrone-60',label:'1 min',color:'#123456',visible:true}];
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} isochroneLines={contourLines} legendItems={legend} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  const renderedColors=state.frames.at(-1)!.contourColors;
  const checkbox=screen.getByLabelText('Leyenda de curvas de nivel en el vídeo') as HTMLInputElement;
  expect(checkbox.checked).toBe(false);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:mode}});
  fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  for(const [index,enabled] of [false,true,false].entries()){
   if(index)fireEvent.click(checkbox);
   expect(checkbox.checked).toBe(enabled);
   context.fillText.mockClear();symbols.length=0;state.saved.mockClear();
   if(button==='Exportar vídeo')beginVideoExport();else fireEvent.click(screen.getByText(button));await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());await waitFor(()=>expect(screen.getByText(/Guardado ·/)).toBeTruthy());
   expect(context.fillText.mock.calls.map(call=>call[0])).toEqual(enabled?['Curvas de nivel','100 m','Curva · 300 m','Curvas de nivel','100 m','Curva · 300 m']:[]);
   // jsdom's mocked canvas does not implement save/restore for fillStyle, so
   // only assert colour swatches on the enabled export path.
   if(enabled)expect(symbols.filter(color=>color.startsWith('#'))).toEqual([...renderedColors,...renderedColors].map(color=>`#${color}`));
   expect(state.frames.every(frame=>JSON.stringify(frame.contourColors)===JSON.stringify(renderedColors))).toBe(true);
   expect(state.created).toBe(1);
  }
  fireEvent.click(checkbox);context.fillText.mockClear();
  fireEvent.click(screen.getByText('Exportar fotograma PNG'));await waitFor(()=>expect(state.png).toHaveBeenCalledOnce());
  expect(context.fillText).not.toHaveBeenCalled();
 });
 it('no ofrece la leyenda de curvas para isócronas, rutas o curvas ocultas',()=>{
  render(<Terrain3D mesh={mesh} points={[]} legendItems={[{id:'isochrone-60',label:'1 min',color:'#abcdef',visible:true},{id:'contour-100',label:'100 m',color:'#abcdef',visible:false}]} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  expect(screen.queryByLabelText('Leyenda de curvas de nivel en el vídeo')).toBeNull();
 });
 it('mantiene tres tiempos legibles y anclados al relieve al rotar e inclinar la cámara',()=>{
  vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockReturnValue(900);
  vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockReturnValue(700);
  const fillText=vi.fn();
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue({measureText:(text:string)=>({width:text.length*18}),beginPath:vi.fn(),roundRect:vi.fn(),fill:vi.fn(),stroke:vi.fn(),fillText} as unknown as CanvasRenderingContext2D);
  const lines=[150,600,900].map((level,index)=>{const low=.1+index*.12,high=1-low,coordinate=(value:number)=>value*.0008983152841195215;return {level,isochroneLabel:['2,5 min','10 min','15 min'][index],coordinates:[[coordinate(low),coordinate(low)],[coordinate(high),coordinate(low)],[coordinate(high),coordinate(high)],[coordinate(low),coordinate(high)],[coordinate(low),coordinate(low)]] as [number,number][]}});
  const props={mesh:isochroneMesh,points:[],exaggeration:2,palette:'terrain',onSnapshotReady:()=>{},resetToken:0};
  const view=render(<Terrain3D {...props} isochroneLines={[...lines,{level:150,coordinates:[[0,0],[1,1]]}]}/>);
  expect(fillText.mock.calls.map(call=>call[0])).toEqual(['2,5 min','10 min','15 min']);
  for(const [orientation,inclination] of [[135,60],[225,25],[315,80],[45,32]]){
   fireEvent.change(screen.getByRole('slider',{name:/^Orientación/}),{target:{value:String(orientation)}});
   fireEvent.change(screen.getByRole('slider',{name:/^Inclinación/}),{target:{value:String(inclination)}});
   const frame=state.frames.at(-1)!;
   expect(frame.labels.map(label=>label.text)).toEqual(['2,5 min','10 min','15 min']);
   expect(frame.labels.some(label=>label.visible)).toBe(true);
   frame.labels.forEach((label,index)=>{
    if(!label.visible)return;
    expect(label.depthTest).toBe(false);
    const [anchor,end]=frame.leaders[index];
    expect(end).toEqual(label.position.map(value=>Math.fround(value)));
    expect(label.position[1]-anchor[1]).toBeCloseTo(20,4);
    const lon=anchor[0]/100+.5,lat=.5-anchor[2]/100,low=.1+index*.12,high=1-low;
    expect(Math.min(Math.abs(lon-low),Math.abs(lon-high),Math.abs(lat-low),Math.abs(lat-high))).toBeLessThan(.00001);
    expect(anchor[1]).toBeCloseTo(Math.max(0,Math.min(1,lon*2-.5))*20+.28*1.7,4);
    expect(label.size[1]).toBeCloseTo(11*96/30);
    for(const other of frame.labels.slice(index+1)){
     const dx=Math.abs(label.screen[0]-other.screen[0])*900/2,dy=Math.abs(label.screen[1]-other.screen[1])*700/2;
     expect(dx>=(label.size[0]+other.size[0])/2||dy>=(label.size[1]+other.size[1])/2).toBe(true);
    }
   });
  }
  view.rerender(<Terrain3D {...props} isochroneLines={[lines[1]]}/>);
  fireEvent.change(screen.getByRole('slider',{name:/^Orientación/}),{target:{value:'180'}});
  expect(state.frames.at(-1)!.labels.map(label=>label.text)).toEqual(['10 min']);
  view.rerender(<Terrain3D {...props} isochroneLines={[{level:150,coordinates:[[0,0],[1,1]]}]}/>);
  expect(state.frames.at(-1)!.labels).toEqual([]);
 });
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
  fireEvent.click(screen.getByText('Exportar fotograma PNG'));await waitFor(()=>expect(state.png).toHaveBeenCalledWith('data:image/png;base64,test',expect.stringMatching(/^Guadix_captura_\d{6}(?:_\d+)?\.png$/)));expect(screen.getByText(/Captura guardada/)).toBeTruthy();
 });
 it.each(['854x480','1280x720','1920x1080'])('mantiene escena, líneas y cámara al exportar %s',async(resolution)=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:'routes'}});
  fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});
  fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  fireEvent.change(screen.getByLabelText(/^Resolución/),{target:{value:resolution}});
  const before=state.frames.at(-1)!.position;
  beginVideoExport();
  await waitFor(()=>expect(state.saved).toHaveBeenCalledTimes(1));
  const [width,height]=resolution.split('x').map(Number),exported=state.frames.filter(f=>f.width===width&&f.height===height);expect(exported).toHaveLength(2);expect(exported.every(f=>f.routes===2&&f.markers.length===2)).toBe(true);expect(exported.every(f=>f.markerColors.join(',')==='ff0000,00ff00')).toBe(true);expect(state.created).toBe(1);expect(state.frames.at(-1)!.position).toEqual(before);
 });
 it('exporta un seguimiento que cambia de posición y conserva las rutas',async()=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:'flyover'}});fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  beginVideoExport();await waitFor(()=>expect(state.saved).toHaveBeenCalledTimes(1));const frames=state.frames.filter(f=>f.width===1920);expect(frames[0].position).not.toEqual(frames[1].position);expect(frames.every(f=>f.routes===2)).toBe(true);expect(frames.every(f=>f.markers.length===1&&f.markerColors[0]==='ff0000')).toBe(true);expect(frames[0].markers[0]).not.toEqual(frames[1].markers[0]);
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
  const before=state.frames.at(-1)!.position;beginVideoExport();fireEvent.click(screen.getByText('Cancelar'));
  await waitFor(()=>expect(screen.getByText('Exportación cancelada; recursos liberados.')).toBeTruthy());expect(state.saved).not.toHaveBeenCalled();expect(state.frames.at(-1)!.position).toEqual(before);
 });
 it('restaura los controles tras un fallo de codificación',async()=>{
  vi.mocked(HTMLCanvasElement.prototype.toBlob).mockImplementation(callback=>callback(null));
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  const before=state.frames.at(-1)!.position;beginVideoExport();await waitFor(()=>expect(screen.getByText(/No se pudo codificar el fotograma/)).toBeTruthy());expect(state.saved).not.toHaveBeenCalled();expect(state.frames.at(-1)!.position).toEqual(before);expect((screen.getByLabelText('Tipo de animación') as HTMLSelectElement).disabled).toBe(false);
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
  beginVideoExport();expect(state.saved).not.toHaveBeenCalled();expect(state.frames.filter(f=>f.width===1920)).toHaveLength(0);
  state.completeTexture();await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());expect(state.frames.filter(f=>f.width===1920).every(f=>f.mapped)).toBe(true);
 });
 it('no exporta una textura que ha fallado',async()=>{
  render(<Terrain3D mesh={mesh} points={[]} textureDataUrl="bad" exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  state.failTexture();beginVideoExport();await waitFor(()=>expect(screen.getByText(/No se pudo cargar la capa base/)).toBeTruthy());expect(state.saved).not.toHaveBeenCalled();
 });
 it.each(['orbit','routes','flyover'])('superpone la brújula en el modo %s cuando se activa',async(mode)=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:mode}});
  fireEvent.click(screen.getByLabelText('Brújula en el vídeo'));fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  beginVideoExport();await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());expect(state.compass).toHaveBeenCalledTimes(2);
 });

 it.each(['routes','flyover'])('anima el perfil altimétrico en %s',async mode=>{
  render(<Terrain3D mesh={mesh} points={[]} routes={routes} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
  fireEvent.change(screen.getByLabelText('Tipo de animación'),{target:{value:mode}});fireEvent.click(screen.getByLabelText('Perfil altimétrico en el vídeo'));
  fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
  beginVideoExport();await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());expect(state.profile).toHaveBeenCalledTimes(2);expect(state.profile.mock.calls.map(call=>call[4])).toEqual([0,1]);expect(state.profile.mock.calls[0][3]).toHaveLength(mode==='routes'?2:1);
 });

});

it('aplica el hillshade a la paleta y a la textura sin depender de la exageración vertical',()=>{
 const props={mesh,points:[],palette:'terrain',exaggeration:1,onSnapshotReady:()=>{},resetToken:0};
 const view=render(<Terrain3D {...props} hillshade={0}/>);
 const original=state.frames.at(-1)!.terrainColors;
 view.rerender(<Terrain3D {...props} hillshade={1}/>);
 const shaded=state.frames.at(-1)!.terrainColors;
 expect(shaded.every((value,index)=>value<original[index])).toBe(true);
 view.rerender(<Terrain3D {...props} hillshade={1} exaggeration={5}/>);
 expect(state.frames.at(-1)!.terrainColors).toEqual(shaded);
 view.rerender(<Terrain3D {...props} hillshade={1} textureDataUrl="textura"/>);
 const textured=state.frames.at(-1)!.terrainColors;
 expect(textured[0]).toBeGreaterThan(0);expect(textured[0]).toBeLessThan(1);
 expect(textured[0]).toBe(textured[1]);expect(textured[1]).toBe(textured[2]);
});


describe('raster de pasillo sobre el terreno',()=>{
 it('usa textura RGBA, conserva el relieve y actualiza valores, umbral, opacidad y visibilidad',()=>{
  const props={mesh,points:[],exaggeration:2,palette:'terrain',onSnapshotReady:()=>{},resetToken:0};
  const raster={width:2,height:2,values:[0,.05,.1,-1],thresholdPercent:10,extent:[-1,-1,2,2] as [number,number,number,number],opacity:.6};
  const view=render(<Terrain3D {...props} corridorRaster={raster}/>);
  const overlay=()=>state.scene!.getObjectByName('corridor-raster') as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;
  const first=overlay(),texture=first.material.map as THREE.DataTexture;
  expect(first).toBeInstanceOf(THREE.Mesh);
  expect(state.scene!.children.some(o=>o instanceof THREE.Points)).toBe(false);
  expect(Array.from(texture.image.data!)).toEqual([25,225,70,255,140,168,70,255,255,110,70,255,0,0,0,0]);
  expect(texture.flipY).toBe(false);expect(texture.colorSpace).toBe(THREE.SRGBColorSpace);expect(texture.minFilter).toBe(THREE.NearestFilter);
  expect(first.material.opacity).toBe(.6);expect(first.material.transparent).toBe(true);expect(first.material.depthWrite).toBe(false);expect(first.material.polygonOffset).toBe(true);
  const terrain=state.scene!.children.find(o=>o instanceof THREE.Mesh&&o.name==='terrain-surface') as THREE.Mesh;
  expect(Array.from(first.geometry.getAttribute('position').array)).toEqual(Array.from(terrain.geometry.getAttribute('position').array));
  expect(first.geometry.getAttribute('uv').getX(0)).toBeCloseTo(1/3);expect(first.geometry.getAttribute('uv').getY(0)).toBeCloseTo(1/3);
  const dispose=vi.spyOn(texture,'dispose');
  view.rerender(<Terrain3D {...props} corridorRaster={{...raster,values:[.05,-1,-1,0],thresholdPercent:5,opacity:.3}}/>);
  expect(dispose).toHaveBeenCalledOnce();expect(overlay().material.opacity).toBe(.3);
  expect(Array.from((overlay().material.map as THREE.DataTexture).image.data!)).toEqual([255,110,70,255,0,0,0,0,0,0,0,0,25,225,70,255]);
  const current=overlay(),created=state.created;
  for(const opacity of [0,.25,.75,1]){
   fireEvent.change(screen.getByLabelText('Opacidad del corredor 3D'),{target:{value:String(opacity)}});
   expect(overlay()).toBe(current);expect(overlay().material.opacity).toBe(opacity);
   expect(state.created).toBe(created);
  }
  view.rerender(<Terrain3D {...props} corridorRaster={raster} textureDataUrl="data:image/png;base64,map" exaggeration={3}/>);
  expect(overlay().material.opacity).toBe(1);
  expect(raster.opacity).toBe(.6);
  view.rerender(<Terrain3D {...props} corridorRaster={null}/>);
  expect(overlay()).toBeUndefined();
 });
 it('mantiene la representación existente de visibilidad',()=>{
  render(<Terrain3D mesh={mesh} points={[]} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0} corridorSurface={{width:2,height:2,values:[0,1,-1,1],kind:'viewshed'}}/>);
  expect(state.scene!.getObjectByName('corridor-raster')).toBeUndefined();
  expect(state.scene!.children.some(o=>o instanceof THREE.Points)).toBe(true);
 });
});

it('conserva esferas y líneas de etiqueta visibles y separadas al cambiar de cámara',()=>{
 const context={measureText:(text:string)=>({width:text.length*12}),beginPath:vi.fn(),roundRect:vi.fn(),fill:vi.fn(),stroke:vi.fn(),fillText:vi.fn()};
 vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(context as unknown as CanvasRenderingContext2D);
 const points=[{id:1,name:'Punto 1',role:'multipunto' as const,lon:.2,lat:.3,comments:'',crs:'EPSG:4326' as const},{id:2,name:'Point 2',role:'multipunto' as const,lon:.8,lat:.7,comments:'',crs:'EPSG:4326' as const}];
 render(<Terrain3D mesh={mesh} points={points} showPointLabels exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>);
 for(const inclination of ['15','85']){
  fireEvent.change(screen.getByRole('slider',{name:/^Inclinación/}),{target:{value:inclination}});
  const markers=state.scene!.children.filter(object=>object.name==='point-marker') as THREE.Mesh<THREE.SphereGeometry,THREE.MeshStandardMaterial>[];
  const labels=state.scene!.children.filter(object=>object instanceof THREE.Sprite) as THREE.Sprite[];
  const leaders=state.scene!.children.filter(object=>object instanceof THREE.Line&&object.renderOrder===29) as THREE.Line[];
  expect(markers).toHaveLength(2);expect(labels).toHaveLength(2);expect(leaders).toHaveLength(2);
  expect(new Set(markers.map(marker=>marker.material.color.getHexString())).size).toBe(2);
  markers.forEach((marker,index)=>{
   expect(marker.visible).toBe(true);expect(marker.material.depthTest).toBe(false);expect(marker.material.depthWrite).toBe(false);
   expect(marker.geometry.type).toBe('SphereGeometry');
   expect(marker.position.distanceTo(labels[index].position)).toBeGreaterThan(labels[index].scale.y/2+marker.geometry.parameters.radius);
   const position=leaders[index].geometry.getAttribute('position');
   expect(position.getX(0)).toBeCloseTo(marker.position.x);expect(position.getY(0)).toBeCloseTo(marker.position.y);
   expect(position.getY(1)).toBeCloseTo(labels[index].position.y);
   expect((leaders[index].material as THREE.LineBasicMaterial).depthWrite).toBe(false);
  });
 }
 expect(context.fillText.mock.calls.map(call=>call[0])).toEqual(['Punto 1','Point 2']);
});

it.each(['avi','mp4','gif'] as const)('termina %s aunque el estado de proceso actualice el padre y sus arrays',async format=>{
 const {NativeTerrainWindow}=await import('./NativeTerrainWindow');
 const {useSyncExternalStore}=await import('react');
 const {programProcesses}=await import('../core/processStatus');
 function Parent(){useSyncExternalStore(programProcesses.subscribe,programProcesses.getSnapshot);return <NativeTerrainWindow detached={false} onReturn={()=>{}} onError={()=>{}} mesh={mesh} points={[]} routes={routes} isochroneLines={[]} barriers={[]} corridors={[]} crossings={[]} pointsOfInterest={[]} exaggeration={1} palette="terrain" onSnapshotReady={()=>{}} resetToken={0}/>}
 render(<Parent/>);
 fireEvent.change(screen.getByLabelText(/^Duración/),{target:{value:'2'}});fireEvent.change(screen.getByLabelText(/^Velocidad/),{target:{value:'50'}});
 if(format==='gif')fireEvent.click(screen.getByRole('button',{name:'Exportar animación GIF'}));else beginVideoExport(format);
 await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
 expect(screen.getByText(/Guardado ·/)).toBeTruthy();expect(state.created).toBe(1);
 expect(screen.queryByText(/Exportación cancelada/)).toBeNull();
});

it('filtra el viewshed y cambia su opacidad sin reconstruir el terreno ni modificar los valores',()=>{
 const surface={width:2,height:2,values:[1,0,-1,1],kind:'viewshed' as const};
 const props={mesh,points:[],exaggeration:1,palette:'terrain',corridorSurface:surface,showViewshed:true,viewshedRasterPath:'/test.tif',onSnapshotReady:()=>{},resetToken:0};
 const {rerender}=render(<Terrain3D {...props}/>);
 expect(screen.getByRole('button',{name:'Plegar panel de visibilidad'})).toBeTruthy();
 const created=state.created;
 const visible=state.scene!.getObjectByName('viewshed-visible') as THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>;
 const hidden=state.scene!.getObjectByName('viewshed-hidden') as THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>;
 expect(visible.geometry.getAttribute('position').count).toBe(2);
 expect(hidden.geometry.getAttribute('position').count).toBe(1);
 const positions=Array.from(visible.geometry.getAttribute('position').array);
 const colors=Array.from(visible.geometry.getAttribute('color').array);
 expect(colors.slice(0,3)).toEqual(Array.from(new Float32Array(new THREE.Color(0x23e169).toArray())));
 expect(Array.from(hidden.geometry.getAttribute('color').array)).toEqual(Array.from(new Float32Array(new THREE.Color(0xeb4646).toArray())));
 for(const [mode,showVisible,showHidden] of [['visible',true,false],['hidden',false,true],['both',true,true]] as const){
  fireEvent.change(screen.getByLabelText('Áreas del viewshed 3D'),{target:{value:mode}});
  for(const opacity of [0,.25,.78,1]){
   fireEvent.change(screen.getByLabelText('Opacidad del viewshed 3D'),{target:{value:String(opacity)}});
   expect(visible.visible).toBe(showVisible);expect(hidden.visible).toBe(showHidden);
   expect(visible.material.opacity).toBe(opacity);expect(hidden.material.opacity).toBe(opacity);
   expect(Array.from(visible.geometry.getAttribute('position').array)).toEqual(positions);
   expect(Array.from(visible.geometry.getAttribute('color').array)).toEqual(colors);
  }
 }
 expect(state.created).toBe(created);
 fireEvent.change(screen.getByLabelText('Áreas del viewshed 3D'),{target:{value:'hidden'}});
 fireEvent.change(screen.getByLabelText('Opacidad del viewshed 3D'),{target:{value:'.25'}});
 rerender(<Terrain3D {...props} textureDataUrl="data:image/png;base64,map" exaggeration={2}/>);
 const rebuilt=state.scene!.getObjectByName('viewshed-visible') as typeof visible;
 expect(rebuilt.visible).toBe(false);expect(rebuilt.material.opacity).toBe(.25);
 expect(surface.values).toEqual([1,0,-1,1]);
});

it('conserva los colores sRGB del visor 2D sin iluminación adicional',async()=>{
 const THREE=await import('three');
 const {terrainPaletteRgb}=await import('../core/terrainPalette');
 const {terrainHillshade,hillshadeBrightness}=await import('../core/hillshade');
 const props={mesh,points:[],palette:'terrain',exaggeration:1,onSnapshotReady:()=>{},resetToken:0};
 const view=render(<Terrain3D {...props} hillshade={0}/>);
 for(const amount of [0,0.5,1]){
  view.rerender(<Terrain3D {...props} hillshade={amount}/>);
  const terrain=state.scene!.getObjectByName('terrain-surface') as THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;
  expect(terrain.material).toBeInstanceOf(THREE.MeshBasicMaterial);
  expect(terrain.material.toneMapped).toBe(false);
  const colors=terrain.geometry.getAttribute('color'),shade=terrainHillshade(mesh);
  mesh.elevations.forEach((e,i)=>{
   const actual=new THREE.Color().fromBufferAttribute(colors,i).convertLinearToSRGB();
   const expected=terrainPaletteRgb(e,mesh.minElevationM,mesh.maxElevationM,'terrain').map(c=>c*hillshadeBrightness(shade[i],amount));
   [actual.r,actual.g,actual.b].forEach((c,channel)=>expect(c).toBeCloseTo(expected[channel],4));
  });
 }
});
