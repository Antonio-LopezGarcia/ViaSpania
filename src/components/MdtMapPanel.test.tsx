// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type ImageStatic from 'ol/source/ImageStatic';
import {MdtMapPanel} from './MdtMapPanel';
import {transformExtent} from 'ol/proj';
const maps=vi.hoisted(()=>[] as {layers:VectorLayer<VectorSource>[];view:unknown}[]);
vi.mock('ol/Map',()=>({default:class{options;viewport=document.createElement('div');constructor(options:{layers:VectorLayer<VectorSource>[];view:unknown}){this.options=options;maps.push(options)}on(){}getView(){return this.options.view}getViewport(){return this.viewport}setTarget(){}}}));
afterEach(()=>{cleanup();maps.length=0});
it('ubica la imagen en la extensión real del MDT y conserva aparte el área seleccionada',()=>{
 const props={imageUrl:'terrain.png',studyExtent:[-4,39,-2,41] as [number,number,number,number],imageExtent:[-3.8,39.2,-2.2,40.8] as [number,number,number,number],viewState:{center:[0,0] as [number,number],resolution:10,rotation:0},onViewChange:()=>{},onHover:()=>{},points:[],selectedPointId:null,routes:[]};
 render(<MdtMapPanel {...props}/>);
 const image=maps[0].layers.find(layer=>layer.getZIndex()===1)!,coverage=maps[0].layers.find(layer=>layer.getZIndex()===2)!;
 expect((image.getSource() as unknown as ImageStatic).getImageExtent()).toEqual(transformExtent(props.imageExtent,'EPSG:4326','EPSG:3857'));
 expect(coverage.getSource()?.getFeatures()[0].getGeometry()?.getExtent()).toEqual(transformExtent(props.studyExtent,'EPSG:4326','EPSG:3857'));
});
it('sincroniza ediciones y borrados y controla capa y etiquetas sin reconstruir el mapa',()=>{
 const props={imageUrl:'data:image/png;base64,',studyExtent:[-4,39,-2,41] as [number,number,number,number],viewState:{center:[0,0] as [number,number],resolution:10,rotation:0},onViewChange:()=>{},onHover:()=>{},points:[{id:1,name:'Inicio',role:'inicio' as const,lon:-3,lat:40,comments:'',crs:'EPSG:4326' as const}],selectedPointId:null,routes:[],expanded:true,crossings:[{id:'b',name:'Puente',kind:'bridge' as const,coordinates:[[0,0],[1,1]] as [number,number][],crossingCostMultiplier:1}]};
 const {rerender}=render(<MdtMapPanel {...props}/>);
 const layer=maps[0].layers.find(layer=>layer.getZIndex()===2.5)!;
 expect(layer.getSource()?.getFeatures()).toHaveLength(1);
 fireEvent.click(screen.getByLabelText('Mostrar barreras y facilitadores'));expect(layer.getVisible()).toBe(false);
 const pointsLayer=maps[0].layers.find(candidate=>candidate.getZIndex()===3)!;
 expect(pointsLayer.getSource()?.getFeatures()).toHaveLength(1);
 expect(pointsLayer.getStyleFunction()?.(pointsLayer.getSource()!.getFeatures()[0],10)).toBeTruthy();
 fireEvent.click(screen.getByLabelText('Mostrar etiquetas'));expect(layer.getVisible()).toBe(false);
 const pointStyle=pointsLayer.getStyleFunction()?.(pointsLayer.getSource()!.getFeatures()[0],10);
 expect((Array.isArray(pointStyle)?pointStyle[0]:pointStyle)?.getText()?.getText()).toBe('Inicio');
 rerender(<MdtMapPanel {...props} crossings={[{...props.crossings[0],name:'Editado'}]}/>);
 expect(layer.getSource()?.getFeatures()[0].get('name')).toBe('Editado');expect(maps).toHaveLength(1);
 rerender(<MdtMapPanel {...props} imageUrl='otro-modelo.png' studyExtent={[11,40,14,43]}/>);
 expect(maps).toHaveLength(2);expect(maps[1].layers).toContain(layer);expect(layer.getVisible()).toBe(false);expect(layer.getSource()?.getFeatures()).toHaveLength(1);
 fireEvent.click(screen.getByLabelText('Mostrar barreras y facilitadores'));expect(layer.getVisible()).toBe(true);
 rerender(<MdtMapPanel {...props} crossings={[]} expanded={false}/>);
 expect(layer.getSource()?.getFeatures()).toHaveLength(0);expect(screen.queryByLabelText('Mostrar etiquetas')).toBeNull();
});

it('mantiene el triángulo del lugar independiente del cursor y permite borrarlo',()=>{
 const props={imageUrl:'modelo.png',studyExtent:[-4,39,-2,41] as [number,number,number,number],viewState:{center:[0,0] as [number,number],resolution:10,rotation:0},onViewChange:()=>{},onHover:()=>{},points:[],selectedPointId:null,routes:[]};
 const place={lon:-3,lat:40};
 const {rerender}=render(<MdtMapPanel {...props} placeMarkerCoordinates={[place,{lon:3,lat:43}]} selectionMarkerCoordinate={{lon:-2,lat:41}}/>);
 const placeSource=maps[0].layers.find(layer=>layer.getZIndex()===7)!.getSource()!;
 const cursorSource=maps[0].layers.find(layer=>layer.getZIndex()===8)!.getSource()!;
 expect(placeSource.getFeatures()).toHaveLength(2);
 const fixed=placeSource.getFeatures()[0].getGeometry()!.getExtent();
 const cursor=cursorSource.getFeatures()[0].getGeometry()!.getExtent();
 rerender(<MdtMapPanel {...props} placeMarkerCoordinates={[place,{lon:3,lat:43}]} selectionMarkerCoordinate={{lon:1,lat:42}}/>);
 expect(placeSource.getFeatures()[0].getGeometry()!.getExtent()).toEqual(fixed);
 expect(cursorSource.getFeatures()[0].getGeometry()!.getExtent()).not.toEqual(cursor);
 rerender(<MdtMapPanel {...props} placeMarkerCoordinates={[]} selectionMarkerCoordinate={{lon:1,lat:42}}/>);
 expect(placeSource.getFeatures()).toHaveLength(0);
 expect(cursorSource.getFeatures()).toHaveLength(1);
});
