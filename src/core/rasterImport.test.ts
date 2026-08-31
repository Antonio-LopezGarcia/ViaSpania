import {describe,expect,it} from 'vitest';
import {parseElevationRasterMetadata,suggestedUtmEpsg} from './rasterImport';

const metadata={driverShortName:'GTiff',size:[100,80],coordinateSystem:{wkt:'PROJCRS["ETRS89 / UTM zone 30N"]'},geoTransform:[500000,5,0,4500000,0,-5],bands:[{type:'Float32',noDataValue:-9999}],wgs84Extent:{type:'Polygon',coordinates:[[[-3.8,40.3],[-3.7,40.3],[-3.7,40.4],[-3.8,40.4],[-3.8,40.3]]]}};

describe('importación de modelos de elevación',()=>{
  it('extrae los requisitos técnicos mostrados en el panel',()=>expect(parseElevationRasterMetadata(metadata)).toMatchObject({driver:'GTiff',width:100,height:80,bandType:'Float32',noData:-9999,resolution:[5,5],wgs84Extent:[-3.8,40.3,-3.7,40.4]}));
  it('rechaza rasters con más de una banda',()=>expect(()=>parseElevationRasterMetadata({...metadata,bands:[{type:'Float32'},{type:'Float32'}]})).toThrow('exactamente una banda'));
  it('rechaza rasters sin CRS',()=>expect(()=>parseElevationRasterMetadata({...metadata,coordinateSystem:{}})).toThrow('sistema de referencia'));
  it('elige el UTM WGS84 correspondiente',()=>expect(suggestedUtmEpsg([-3.8,40.3,-3.7,40.4])).toBe('EPSG:32630'));
});
