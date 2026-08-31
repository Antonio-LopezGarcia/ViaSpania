export type ImportedElevationKind='terrain'|'surface';

export interface RasterImportDetails {
  driver:string;
  width:number;
  height:number;
  bandType:string;
  crs:string;
  noData:number|null;
  wgs84Extent:[number,number,number,number];
  resolution:[number,number]|null;
}

type JsonRecord=Record<string,unknown>;
const record=(value:unknown):JsonRecord|null=>value&&typeof value==='object'&&!Array.isArray(value)?value as JsonRecord:null;
const finite=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:null;

function geographicExtent(metadata:JsonRecord):[number,number,number,number]|null{
  const geometry=record(metadata.wgs84Extent),coordinates=geometry?.coordinates;
  if(!Array.isArray(coordinates))return null;
  const points:number[][]=[];
  const visit=(value:unknown)=>{
    if(Array.isArray(value)&&value.length>=2&&finite(value[0])!=null&&finite(value[1])!=null)points.push([value[0] as number,value[1] as number]);
    else if(Array.isArray(value))value.forEach(visit);
  };
  visit(coordinates);
  if(!points.length)return null;
  const xs=points.map(point=>point[0]),ys=points.map(point=>point[1]);
  return[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
}

export function parseElevationRasterMetadata(metadata:JsonRecord):RasterImportDetails{
  const size=metadata.size,bands=metadata.bands,coordinateSystem=record(metadata.coordinateSystem),geoTransform=metadata.geoTransform;
  if(!Array.isArray(size)||size.length!==2||!Number.isInteger(size[0])||!Number.isInteger(size[1])||(size[0] as number)<=0||(size[1] as number)<=0)throw new Error('El GeoTIFF no contiene dimensiones de raster válidas.');
  if(!Array.isArray(bands)||bands.length!==1)throw new Error('El modelo debe contener exactamente una banda de elevación.');
  const band=record(bands[0]);if(!band)throw new Error('GDAL no pudo leer la banda de elevación.');
  const crs=typeof coordinateSystem?.wkt==='string'?coordinateSystem.wkt:'';
  if(!crs)throw new Error('El GeoTIFF no tiene un sistema de referencia espacial reconocible.');
  const extent=geographicExtent(metadata);
  if(!extent)throw new Error('GDAL no pudo determinar la extensión WGS84 del GeoTIFF.');
  const driver=record(metadata.driverShortName)?.name;
  const shortName=typeof metadata.driverShortName==='string'?metadata.driverShortName:typeof driver==='string'?driver:'';
  if(shortName&&shortName!=='GTiff')throw new Error('El archivo debe ser un GeoTIFF o COG compatible con GDAL.');
  const resolution=Array.isArray(geoTransform)&&geoTransform.length===6&&finite(geoTransform[1])!=null&&finite(geoTransform[5])!=null?[Math.abs(geoTransform[1] as number),Math.abs(geoTransform[5] as number)] as [number,number]:null;
  return{driver:shortName||'GTiff',width:size[0] as number,height:size[1] as number,bandType:typeof band.type==='string'?band.type:'desconocido',crs,noData:finite(band.noDataValue),wgs84Extent:extent,resolution};
}

export function suggestedUtmEpsg(extent:[number,number,number,number]){
  const lon=(extent[0]+extent[2])/2,lat=(extent[1]+extent[3])/2,zone=Math.min(60,Math.max(1,Math.floor((lon+180)/6)+1));
  return `EPSG:${lat>=0?32600+zone:32700+zone}`;
}
