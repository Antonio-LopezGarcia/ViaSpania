import {describe,expect,it} from 'vitest';
import {DEFAULT_APP_SETTINGS} from './appSettings';
import {reportMapSources,resolveReportMapSource} from './reportMapSources';

describe('catálogo común de bases para informes',()=>{
 it('incluye todas las fuentes habilitadas, ortofotografías y capas importadas',()=>{
  const external={id:'usuario-wms',name:'Orto propia',viewer:'selection' as const,protocol:'wms' as const,url:'https://example.test/wms',layerName:'foto',version:'1.3.0' as const,format:'image/png',transparent:false,attribution:'Instituto local'};
  const sources=reportMapSources({...DEFAULT_APP_SETTINGS,externalMapLayers:[external]});
  expect(sources.filter(source=>source.builtIn)).toHaveLength(Object.values(DEFAULT_APP_SETTINGS.enabledMapSources).filter(Boolean).length);
  expect(sources.filter(source=>source.group==='Ortofotografías').map(source=>source.id)).toEqual(expect.arrayContaining(['builtin:pnoa','builtin:copernicus-vhr-2021','builtin:AMS_1956-1957','builtin:Interministerial_1973-1986']));
  expect(sources.find(source=>source.id==='external:usuario-wms')).toMatchObject({name:'Orto propia',attribution:'Instituto local'});
 });
 it('excluye fuentes desactivadas y resuelve la selección por id estable',()=>{const sources=reportMapSources({...DEFAULT_APP_SETTINGS,enabledMapSources:{...DEFAULT_APP_SETTINGS.enabledMapSources,osm:false}});expect(sources.some(source=>source.id==='builtin:osm')).toBe(false);expect(resolveReportMapSource(sources,'builtin:pnoa')?.name).toContain('PNOA')});
});
