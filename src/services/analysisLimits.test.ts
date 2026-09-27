import {afterEach,expect,it,vi} from 'vitest';
import {invoke} from '@tauri-apps/api/core';
import {calculateContours,calculateViewshed,calculateRasterIsochrones,calculateRasterLcpCorridor} from './native';
import {MAX_ELEVATION_CELLS} from '../core/elevationLimits';
const state=vi.hoisted(()=>({limit:67_928_064}));
vi.mock('@tauri-apps/api/core',()=>({invoke:vi.fn(async()=>({})),isTauri:()=>true}));
vi.mock('../core/appSettings',()=>({loadAppSettings:()=>({processingCellLimit:state.limit})}));
afterEach(()=>vi.clearAllMocks());
it.each([MAX_ELEVATION_CELLS,3_000_000])('transmite el mismo límite %i a los cuatro análisis',async(limit)=>{
 state.limit=limit;
 const base={rasterPath:'/modelo-importado.tif',model:'tobler' as const,barriers:[],connectivity:8 as const,criticalSlopePercent:10,ardigoSpeedMs:1.2};
 await calculateContours(base.rasterPath,10);
 await calculateViewshed(base.rasterPath,[{id:'p',name:'p',coordinate:[-3,40]}],2);
 await calculateRasterIsochrones({...base,origins:[[-3,40]],interval:300,maxLevels:3});
 await calculateRasterLcpCorridor({...base,start:[-3,40],end:[-3.1,40.1],thresholdPercent:10});
 for(const command of ['calculate_contours','calculate_viewshed','calculate_raster_isochrones','calculate_raster_lcp_corridor'])expect(invoke).toHaveBeenCalledWith(command,{request:expect.objectContaining({rasterPath:base.rasterPath,maxCells:limit})});
});
