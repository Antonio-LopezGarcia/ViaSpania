import TileWMS from 'ol/source/TileWMS';
import {builtInMapAttribution} from '../core/mapSources';

// Verified against public/fixtures/ign-lidar-wms.xml (2026-09-20).
export const LIDAR_WMS_URL='https://wms-mapa-lidar.idee.es/lidar';
export const LIDAR_WMS_LAYER='EL.GridCoverage';
export function createLidarMapSource(){
 return new TileWMS({url:LIDAR_WMS_URL,params:{LAYERS:LIDAR_WMS_LAYER,STYLES:'default',VERSION:'1.3.0',FORMAT:'image/png',TRANSPARENT:false},projection:'EPSG:3857',crossOrigin:'anonymous',attributions:builtInMapAttribution('ign-lidar')});
}
