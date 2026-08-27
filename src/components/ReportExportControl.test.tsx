// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {ReportExportControl} from './ReportExportControl';

describe('compositor de informes',()=>{
 afterEach(cleanup);
 it('reinicia el compositor al cambiar el modo de cálculo activo',()=>{
  const onExport=vi.fn().mockResolvedValue(undefined);
  const view=render(<ReportExportControl disabled={false} loading={false} mode="simple" outboundAvailable onExport={onExport}/>);
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  expect(screen.getByRole('dialog',{name:'Compositor de informes de Ruta simple'})).toBeTruthy();
  view.rerender(<ReportExportControl disabled={false} loading={false} mode="isochrones" isochronesAvailable onExport={onExport}/>);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  expect(screen.getByRole('dialog',{name:'Compositor de informes de Isócronas'})).toBeTruthy();
 });
 it('permite elegir ida, vuelta y propiedades del mapa de Ruta simple',async()=>{
  const onExport=vi.fn().mockResolvedValue(undefined);
  render(<ReportExportControl disabled={false} loading={false} outboundAvailable returnAvailable onExport={onExport}/>);
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  expect(screen.getByRole('dialog',{name:'Compositor de informes de Ruta simple'})).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Base'),{target:{value:'historical'}});
  fireEvent.click(screen.getByRole('button',{name:'Generar PDF'}));
  await waitFor(()=>expect(onExport).toHaveBeenCalled());
  expect(onExport.mock.calls[0][1].routeSimple).toMatchObject({base:'historical',includeOutbound:true,includeReturn:true});
 });
 it('inicia la base 3D con la última orientación del visor y permite modificarla',()=>{
  const onExport=vi.fn().mockResolvedValue(undefined);
  render(<ReportExportControl disabled={false} loading={false} terrainView={{inclination:41,orientation:123}} outboundAvailable onExport={onExport}/>);
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  fireEvent.change(screen.getByLabelText('Base'),{target:{value:'terrain3d'}});
  expect((screen.getByRole('slider',{name:/Inclinación/}) as HTMLInputElement).value).toBe('41');
  expect((screen.getByRole('slider',{name:/Orientación/}) as HTMLInputElement).value).toBe('123');
  fireEvent.change(screen.getByRole('slider',{name:/Orientación/}),{target:{value:'210'}});
  expect((screen.getByRole('slider',{name:/Orientación/}) as HTMLInputElement).value).toBe('210');
 });
 it('compone una comparación con mapa conjunto y páginas por perfil',async()=>{
  const onExport=vi.fn().mockResolvedValue(undefined);
  render(<ReportExportControl disabled={false} loading={false} mode="comparison" comparisonRoutes={[{id:'tobler',name:'Tobler por caminos'},{id:'wheeled',name:'Vehículo con pendiente crítica'}]} onExport={onExport}/>);
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  expect(screen.getByRole('dialog',{name:'Compositor de informes de Ruta comparativa'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Generar PDF'}));
  await waitFor(()=>expect(onExport).toHaveBeenCalled());
  expect(onExport.mock.calls[0][1].routeComparison).toMatchObject({selectedModels:['tobler','wheeled'],includeCombinedMap:true,includeIndividualPages:true,includeProfilePages:true});
 });
 it('compone Multipunto con leyenda por origen y página técnica',async()=>{
  const onExport=vi.fn().mockResolvedValue(undefined);
  render(<ReportExportControl disabled={false} loading={false} mode="multipoint" multipointOrigins={[{id:1,name:'Origen A',connections:2},{id:2,name:'Origen B',connections:1}]} onExport={onExport}/>);
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  expect(screen.getByRole('dialog',{name:'Compositor de informes Multipunto'})).toBeTruthy();
  expect(screen.getByText(/3 ruta\(s\) · leyenda por origen/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Generar PDF'}));
  await waitFor(()=>expect(onExport).toHaveBeenCalled());
  expect(onExport.mock.calls[0][1].multipoint).toMatchObject({includeCombinedMap:true,includeMatrixPage:true,includeTechnicalPage:true});
 });
 it('compone Multirruta sin ofrecer una matriz de costes',async()=>{
  const onExport=vi.fn().mockResolvedValue(undefined);
  render(<ReportExportControl disabled={false} loading={false} mode="multiroute" multipointOrigins={[{id:1,name:'Inicio',connections:1},{id:2,name:'Etapa 2',connections:1}]} onExport={onExport}/>);
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  expect(screen.getByRole('dialog',{name:'Compositor de informes Multirruta'})).toBeTruthy();
  expect(screen.queryByText('Matriz de costes')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Generar PDF'}));
  await waitFor(()=>expect(onExport).toHaveBeenCalled());
  expect(onExport.mock.calls[0][1].multiroute).toMatchObject({includeCombinedMap:true,includeTechnicalPage:true});
 });
 it('compone el Pasillo con superficie, leyenda y opacidad',async()=>{
  const onExport=vi.fn().mockResolvedValue(undefined);
  render(<ReportExportControl disabled={false} loading={false} mode="corridor" corridorAvailable onExport={onExport}/>);
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  expect(screen.getByRole('dialog',{name:'Compositor de informes de Pasillo'})).toBeTruthy();
  expect(screen.getByText(/Pasillo · opacidad 62 %/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Generar PDF'}));
  await waitFor(()=>expect(onExport).toHaveBeenCalled());
  expect(onExport.mock.calls[0][1].corridor).toMatchObject({includeCombinedMap:true,includeTechnicalPage:true,surfaceOpacity:.62});
 });
 it('compone Isócronas con superficie y leyenda por nivel',async()=>{
  const onExport=vi.fn().mockResolvedValue(undefined);
  render(<ReportExportControl disabled={false} loading={false} mode="isochrones" isochronesAvailable onExport={onExport}/>);
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  expect(screen.getByRole('dialog',{name:'Compositor de informes de Isócronas'})).toBeTruthy();
  expect(screen.getByText(/Isócronas vectoriales · color por tiempo/)).toBeTruthy();
  expect(screen.queryByLabelText('Opacidad')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Generar PDF'}));
  await waitFor(()=>expect(onExport).toHaveBeenCalled());
  expect(onExport.mock.calls[0][1].isochrones).toMatchObject({includeCombinedMap:true,includeTechnicalPage:true,surfaceOpacity:.62});
 });
 it('compone Curvas de nivel como vectores coloreados con leyenda altimétrica',async()=>{
  const onExport=vi.fn().mockResolvedValue(undefined);
  render(<ReportExportControl disabled={true} loading={false} mode="contours" onExport={onExport}/>);
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  expect(screen.getByRole('dialog',{name:'Compositor de informes de Curvas de nivel'})).toBeTruthy();
  expect(screen.getByText(/sin borde negro/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Generar PDF'}));
  await waitFor(()=>expect(onExport).toHaveBeenCalled());
  expect(onExport.mock.calls[0][1].contours).toMatchObject({includeCombinedMap:true,includeTechnicalPage:true});
 });
 it('compone Visibilidad indicando observador y altura del cálculo',async()=>{
  const onExport=vi.fn().mockResolvedValue(undefined);
  render(<ReportExportControl disabled={false} loading={false} mode="viewshed" viewshedObservers={[{id:'1',name:'Atalaya',heightM:1.7},{id:'2',name:'Torre',heightM:10}]} onExport={onExport}/>);
  fireEvent.click(screen.getByRole('button',{name:'Componer informe'}));
  expect(screen.getByRole('dialog',{name:'Compositor de informes de Visibilidad'})).toBeTruthy();
  expect(screen.getByText('Altura usada en el cálculo: 1.7 m sobre el terreno')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Observador'),{target:{value:'2'}});
  expect(screen.getByText('Altura usada en el cálculo: 10.0 m sobre el terreno')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Generar PDF'}));
  await waitFor(()=>expect(onExport).toHaveBeenCalled());
  expect(onExport.mock.calls[0][1].viewshed).toMatchObject({observerId:'2',includeCombinedMap:true,includeTechnicalPage:true});
 });
});
