import {describe,expect,it} from 'vitest';
import {contoursGeoJson} from './topographicAnalysis';

describe('exportación topográfica',()=>{it('exporta curvas con elevación y CRS84',()=>{const json=JSON.parse(contoursGeoJson({intervalM:20,minElevationM:10,maxElevationM:80,rasterCrs:'EPSG:25830',resolutionM:5,nodataCells:1,source:'MDT',lines:[{level:20,coordinates:[[-3,40],[-2.9,40.1]]}]}));expect(json.crs.properties.name).toContain('CRS84');expect(json.features[0].properties.elevation_m).toBe(20);expect(json.features[0].geometry.type).toBe('LineString')})})
