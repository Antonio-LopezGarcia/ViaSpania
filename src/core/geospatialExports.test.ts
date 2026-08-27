import { describe,expect,it } from 'vitest';
import { exportPointsCsv,exportPointsGeoJson,exportRoutesGeoJson,MOVECOST_CODES,routeExportName } from './geospatialExports';
import { parseCsv,parseGeoJson } from './importers';
import type { PointWithElevation } from './geospatialExports';
import type { RouteResult } from '../types';

const points:PointWithElevation[]=[{id:1,name:'Inicio, norte',comments:'a "prueba"',role:'inicio',lon:-3.7,lat:40.4,elevationM:658.25,crs:'EPSG:4326'},{id:2,name:'Final',comments:'',role:'final',lon:-3.6,lat:40.5,elevationM:702,crs:'EPSG:4326'}];
describe('intercambio de puntos',()=>{
  it('produce CSV reversible con nombre, rol, coordenadas y altura',()=>{const csv=exportPointsCsv(points),imported=parseCsv(csv);expect(csv).toContain('elevacion_m');expect(csv).toContain('658.25');expect(imported.map(point=>point.role)).toEqual(['inicio','final']);expect(imported[0].name).toBe('Inicio, norte')});
  it('produce GeoJSON reversible con alturas',()=>{const text=exportPointsGeoJson(points),data=JSON.parse(text);expect(data.features[0].properties.elevation_m).toBe(658.25);expect(parseGeoJson(text)[1]).toMatchObject({name:'Final',role:'final',lon:-3.6,lat:40.5})});
});
describe('intercambio de rutas',()=>{
  it('usa las siglas oficiales de movecost en nombre y metadatos',()=>{expect(MOVECOST_CODES.alberti).toBe('alb');expect(MOVECOST_CODES.ardigo).toBe('a');expect(routeExportName('Ruta Peña','pandolf-corrected')).toBe('Ruta-Pena_pcf.geojson')});
  it('exporta conexiones como polilíneas WGS84',()=>{const result:RouteResult={model:'tobler',direction:'inicio→final',path:[0,1],coordinates:[[-3.7,40.4],[-3.6,40.5]],cost:1.2,unit:'h',distanceM:1000,ascentM:50,descentM:5,settings:{connectivity:8}},data=JSON.parse(exportRoutesGeoJson([{result,from:points[0],to:points[1]}]));expect(data.features[0].geometry.type).toBe('LineString');expect(data.features[0].properties).toMatchObject({movecost_code:'t',from_name:'Inicio, norte',to_name:'Final',connectivity:8})});
});
