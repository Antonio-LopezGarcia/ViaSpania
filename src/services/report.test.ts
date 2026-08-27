import { describe, expect, it } from 'vitest';
import { createProjectReport, imageContainRect } from './report';

describe('informe de proyecto',()=>{
  it('ajusta mapas al área disponible sin alterar su proporción',()=>{
    const rect=imageContainRect(1600,900,10,20,200,200);
    expect(rect).toEqual({x:10,y:63.75,width:200,height:112.5});
  });
  const base={options:{navigation:false,pnoaOverview:false,individualRoutePages:false,terrain3d:false,historical:false,pointList:false,barrierList:false,pageSize:'a4' as const},points:[],barriers:[],routes:[],extent:[-4,40,-3,41] as [number,number,number,number],navigationLabel:'OSM',historicalLabel:'MTN50',resolution:25,paletteLabel:'Terreno',areaKm2:100,cells:160000,mdtSource:'IGN',connectivity:8 as const,criticalSlopePercent:10};
  it('genera un PDF válido aun cuando se desactivan todas las secciones opcionales',()=>{
    const bytes=createProjectReport({options:{navigation:false,pnoaOverview:false,individualRoutePages:false,terrain3d:false,historical:false,pointList:false,barrierList:false,pageSize:'a3'},points:[],barriers:[],routes:[],extent:[-4,40,-3,41],navigationLabel:'OSM',historicalLabel:'MTN50',resolution:25,paletteLabel:'Terreno',areaKm2:100,cells:160000,mdtSource:'IGN',connectivity:8,criticalSlopePercent:10});
    expect(new TextDecoder().decode(bytes.slice(0,5))).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(1000);
  });
  it('genera con el mismo motor una plantilla específica de isócronas',()=>{
    const bytes=createProjectReport({...base,analysis:{kind:'isochrones' as const,title:'Informe de Isócronas',result:{model:'tobler',unit:'s',interval:600,maxCost:1800,reachableCells:42,lines:[{level:600,coordinates:[[-3.5,40.2],[-3.4,40.3]]}],surfaceWidth:2,surfaceHeight:2,surfaceValues:[0,1,2,-1],surfaceReused:true,source:'MDT de prueba'}}});
    expect(new TextDecoder().decode(bytes.slice(0,5))).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(1000);
  });
  it('genera una plantilla de isovistas con metadatos del observador',()=>{
    const bytes=createProjectReport({...base,rasterCrs:'EPSG:25830',analysis:{kind:'viewshed' as const,title:'Informe de Isovistas',limitation:'Modelo topográfico sin obstáculos no incluidos.',result:{observerId:'1',observerName:'Punto 1',coordinate:[-3.5,40.5],groundElevationM:650,observerHeightM:1.7,surfaceWidth:2,surfaceHeight:2,surfaceValues:[1,0,1,-1],visibleCells:2,validCells:3}}});
    expect(new TextDecoder().decode(bytes.slice(0,5))).toBe('%PDF-');
  });
  it('añade una página individual por cada resultado de Ruta simple',()=>{
    const route={model:'wheeled' as const,direction:'inicio→final',path:[0,1],coordinates:[[-3.8,40.4],[-3.7,40.5]] as [number,number][],cost:120,unit:'coste relativo',distanceM:100,ascentM:10,descentM:2,settings:{connectivity:16 as const,criticalSlopePercent:12}};
    const reverse={...route,direction:'final→inicio',cost:125};
    const bytes=createProjectReport({...base,routes:[{result:route,color:'#00b9ff'},{result:reverse,color:'#ff5d6c'}],analysis:{kind:'route-simple' as const,title:'Ruta simple',includeTechnicalPage:true}});
    const source=new TextDecoder('latin1').decode(bytes);
    expect(source).toContain('/Count 3');
  });
  it('ordena resultado y perfil después de cada ruta comparada',()=>{
    const route={model:'tobler' as const,direction:'inicio→final',path:[0,1],coordinates:[[-3.8,40.4],[-3.7,40.5]] as [number,number][],cost:120,unit:'s',distanceM:100,ascentM:10,descentM:2,settings:{connectivity:8 as const}};
    const second={...route,model:'wheeled' as const,cost:140,unit:'coste relativo',settings:{connectivity:16 as const,criticalSlopePercent:11}};
    const bytes=createProjectReport({...base,routes:[{result:route,color:'#00b9ff'},{result:second,color:'#ff5d6c'}],analysis:{kind:'route-comparison' as const,title:'Comparación',includeIndividualPages:true,includeProfilePages:true}});
    expect(new TextDecoder('latin1').decode(bytes)).toContain('/Count 4');
  });
  it('incluye matriz y ficha técnica en Multipunto',()=>{
    const route={model:'tobler' as const,direction:'A→B',path:[0,1],coordinates:[[-3.8,40.4],[-3.7,40.5]] as [number,number][],cost:120,unit:'s',distanceM:100,ascentM:10,descentM:2,settings:{connectivity:8 as const}};
    const bytes=createProjectReport({...base,routes:[{result:route,color:'#00b9ff'}],analysis:{kind:'multipoint' as const,title:'Multipunto',matrix:[[0,120],[100,0]],unit:'s',includeMatrixPage:true,includeTechnicalPage:true}});
    expect(new TextDecoder('latin1').decode(bytes)).toContain('/Count 2');
  });
  it('incluye la ficha técnica de Multirruta',()=>{
    const route={model:'tobler' as const,direction:'A→B',path:[0,1],coordinates:[[-3.8,40.4],[-3.7,40.5]] as [number,number][],cost:120,unit:'s',distanceM:100,ascentM:10,descentM:2,settings:{connectivity:8 as const}};
    const bytes=createProjectReport({...base,routes:[{result:route,color:'#00b9ff'}],analysis:{kind:'multiroute' as const,title:'Multirruta',includeTechnicalPage:true}});
    expect(new TextDecoder('latin1').decode(bytes)).toContain('/Count 1');
  });
});
