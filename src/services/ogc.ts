export const PNOA_CAPABILITIES='https://www.ign.es/wmts/pnoa-ma?service=WMTS&request=GetCapabilities';
export const MDT_CAPABILITIES='https://servicios.idee.es/wcs-inspire/mdt?service=WCS&request=GetCapabilities&version=2.0.1';
export const MDS_CAPABILITIES='https://wcs-mds.idee.es/mds?service=WCS&request=GetCapabilities&version=2.0.1';
export const MDS_WCS='https://wcs-mds.idee.es/mds';
export const COPERNICUS_VHR_2021_WMS='https://copernicus.discomap.eea.europa.eu/arcgis/services/GioLand/VHR_2021_LAEA/ImageServer/WMSServer';
export const COPERNICUS_VHR_2021_LAYER='VHR_2021_LAEA';
export function parseCoverageIds(xml:string){const doc=new DOMParser().parseFromString(xml,'application/xml');if(doc.querySelector('parsererror'))throw new Error('Capabilities XML no válido');const namespaced=[...doc.getElementsByTagNameNS('*','CoverageId')];const fallback=[...doc.getElementsByTagName('wcs:CoverageId'),...doc.getElementsByTagName('CoverageId')];return [...new Set([...namespaced,...fallback].map(x=>x.textContent?.trim()).filter((value):value is string=>Boolean(value)))];}
