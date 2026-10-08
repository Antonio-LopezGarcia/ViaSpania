// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import type {GeoPoint,ViewshedResult} from '../types';
import {calculateViewshed} from '../services/native';
import {TopographicTools} from './TopographicTools';

vi.mock('../services/native',()=>({calculateViewshed:vi.fn(),calculateContours:vi.fn(),generateTerrainMesh:vi.fn()}));
vi.mock('../core/topographicAnalysis',()=>({viewshedDataUrl:(observer:{observerId:string})=>`surface-${observer.observerId}`}));
vi.mock('./SurfaceAnalysisViewer',()=>({SurfaceAnalysisViewer:({title,surfaceImageUrl,selectedPointId}:{title:string;surfaceImageUrl:string;selectedPointId:number})=><div data-testid="visibility-viewer" data-surface={surfaceImageUrl} data-point={selectedPointId}>{title}</div>}));
vi.mock('./Terrain3D',()=>({Terrain3D:()=>null}));
afterEach(()=>{cleanup();vi.clearAllMocks()});

it.each([false,true])('conserva el observador visible al calcular con puntos nuevos=%s',async(newPoints)=>{
 const points:GeoPoint[]=[{id:1,name:'Inicio',role:'inicio',lon:-3,lat:40,comments:'',crs:'EPSG:4326'},{id:2,name:'Final',role:'final',lon:-3.01,lat:40.01,comments:'',crs:'EPSG:4326'},{id:3,name:'Mirador',role:'multipunto',lon:-3.02,lat:40.02,comments:'',crs:'EPSG:4326'}];
 if(newPoints)points.forEach(point=>{point.role='multipunto'});
 const result:ViewshedResult={observers:points.map((point,index)=>({observerId:String(point.id),observerName:point.name,coordinate:[point.lon,point.lat],groundElevationM:100,observerHeightM:1.7,surfaceWidth:1,surfaceHeight:1,surfaceValues:[index%2],visibleCells:index%2,validCells:1})),rasterCrs:'EPSG:25830',resolutionM:5,source:'MDT de prueba',limitation:'Prueba'};
 vi.mocked(calculateViewshed).mockResolvedValue(result);
 const onViewshedResult=vi.fn();
 render(<TopographicTools tool="viewshed" raster={{path:'/test.tif',bytes:1,metadata:{},previewDataUrl:'preview'}} points={points} studyExtent={[-4,39,-2,41]} previewImage="preview" initialView={{center:[0,0],resolution:10,rotation:0}} onNotice={()=>{}} onViewshedResult={onViewshedResult} viewshedObservers={result.observers} visibleViewshedIds={['2']}/>);
  fireEvent.click(screen.getByRole('button',{name:'Calcular visibilidad'}));
 await waitFor(()=>expect(onViewshedResult).toHaveBeenLastCalledWith(result,1));
  fireEvent.click(screen.getByRole('button',{name:'Abrir visor de visibilidad'}));
 const viewer=screen.getByTestId('visibility-viewer');
 expect(viewer.textContent).toBe('Visibilidad · Final');
 expect(viewer.getAttribute('data-surface')).toBe('surface-2');
 expect(viewer.getAttribute('data-point')).toBe('2');
});
