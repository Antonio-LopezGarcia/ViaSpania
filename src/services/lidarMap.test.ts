// @vitest-environment jsdom
import capabilitiesXml from '../../public/fixtures/ign-lidar-wms.xml?raw';
import {expect,it} from 'vitest';
import WMSCapabilities from 'ol/format/WMSCapabilities';
import {createLidarMapSource,LIDAR_WMS_LAYER,LIDAR_WMS_URL} from './lidarMap';
import {DEFAULT_APP_SETTINGS,loadAppSettings} from '../core/appSettings';
import {reportMapSources} from '../core/reportMapSources';

it('solicita la capa, estilo, formato y proyección publicados por el IGN',()=>{
 const capabilities=new WMSCapabilities().read(capabilitiesXml);
 const layer=capabilities.Capability.Layer.Layer.find((item:{Name:string})=>item.Name===LIDAR_WMS_LAYER);
 expect(layer.CRS).toContain('EPSG:3857');
 expect(layer.Style.map((style:{Name:string})=>style.Name)).toContain('default');
 expect(capabilities.Capability.Request.GetMap.Format).toContain('image/png');
 const source=createLidarMapSource();
 expect(source.getUrls()).toEqual([LIDAR_WMS_URL]);
 const url=new URL(source.getTileUrlFunction()([14,8024,6250],1,source.getProjection()!)!);
 expect(url.searchParams.get('LAYERS')).toBe(layer.Name);
 expect(url.searchParams.get('CRS')).toBe('EPSG:3857');
 expect(url.searchParams.get('STYLES')).toBe('default');
 expect(source.getAttributions()).toBeTruthy();
});
it('habilita LiDAR al migrar preferencias y conserva los créditos en informes',()=>{
 localStorage.setItem('viaspania.settings.v1',JSON.stringify({enabledMapSources:{pnoa:true}}));
 try{expect(loadAppSettings().enabledMapSources['ign-lidar']).toBe(true)}finally{localStorage.removeItem('viaspania.settings.v1')}
 const sources=reportMapSources(DEFAULT_APP_SETTINGS);
 expect(sources.find(source=>source.id==='builtin:ign-lidar')).toMatchObject({group:'Cartografía',attribution:expect.stringContaining('CC BY 4.0')});
 expect(reportMapSources({...DEFAULT_APP_SETTINGS,enabledMapSources:{...DEFAULT_APP_SETTINGS.enabledMapSources,'ign-lidar':false}}).some(source=>source.id==='builtin:ign-lidar')).toBe(false);
});
