import {describe,expect,it} from 'vitest';
import {ELEVATION_SOURCES,SURFACE_WARNING,copernicusGlo30TileUrls,enabledElevationSources} from './elevationSources';

describe('fuentes de elevación',()=>{
  it('oculta las superficies mientras no se habiliten',()=>{expect(enabledElevationSources({mdt5:true,mdt25:true,mdt200:true,mds05:false,copernicus30:false}).map(source=>source.id)).toEqual(['mdt5','mdt25','mdt200'])});
  it('expone solo los modelos habilitados',()=>{expect(enabledElevationSources({mdt5:false,mdt25:true,mdt200:true,mds05:true,copernicus30:true}).map(source=>source.id)).toEqual(['mdt25','mdt200','mds05','copernicus30'])});
  it('usa el WCS oficial',()=>{expect(ELEVATION_SOURCES.mds05.access).toBe('mds-wcs');expect(SURFACE_WARNING).toMatch(/pueden diferir en gran medida/)})
  it('resuelve las teselas globales por grado',()=>{expect(copernicusGlo30TileUrls([-3.8,40.2,-2.9,41.1])).toEqual([
    'https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N40_00_W004_00_DEM/Copernicus_DSM_COG_10_N40_00_W004_00_DEM.tif',
    'https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N40_00_W003_00_DEM/Copernicus_DSM_COG_10_N40_00_W003_00_DEM.tif',
    'https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N41_00_W004_00_DEM/Copernicus_DSM_COG_10_N41_00_W004_00_DEM.tif',
    'https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N41_00_W003_00_DEM/Copernicus_DSM_COG_10_N41_00_W003_00_DEM.tif'])})
});
