import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import type {ExternalMapLayer} from '../core/externalMapLayers';

export function createExternalMapSource(layer:ExternalMapLayer){
  const attribution=layer.attribution||`Fuente externa: ${layer.name}`;
  if(!layer.protocol||layer.protocol==='xyz')return new XYZ({url:layer.url,crossOrigin:'anonymous',attributions:attribution});
  if(layer.protocol==='wms')return new TileWMS({url:layer.url,params:{LAYERS:layer.layerName,VERSION:layer.version,FORMAT:layer.format,TRANSPARENT:layer.transparent,TILED:true},projection:layer.projection,crossOrigin:'anonymous',attributions:attribution});
  return new WMTS({url:layer.url,layer:layer.layerName,matrixSet:layer.matrixSet,style:layer.style,format:layer.format,projection:layer.projection,tileGrid:new WMTSTileGrid({origin:layer.origin,resolutions:layer.resolutions,matrixIds:layer.matrixIds}),crossOrigin:'anonymous',attributions:attribution});
}
