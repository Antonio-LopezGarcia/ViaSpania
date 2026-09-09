import { describe, expect, it } from 'vitest';
import { createProjectReport, routeTechnicalSections, imageContainRect, REPORT_LAYOUT, REPORT_TYPOGRAPHY } from './report';

describe('informe de proyecto',()=>{
  it('exporta una página altimétrica por ruta con sus cotas aunque se desactiven las páginas opcionales',()=>{
    const route={model:'tobler' as const,direction:'A-B',path:[0,1],coordinates:[[-3.8,40.4],[-3.7,40.5]] as [number,number][],elevationsM:[620,700],cost:120,unit:'s',distanceM:1000,ascentM:80,descentM:0};
    const bytes=createProjectReport({...base,routes:[{result:route,color:'#00b9ff'},{result:{...route,elevationsM:[700,620]},color:'#ff5d6c'}]});
    expect(new TextDecoder('latin1').decode(bytes)).toContain('/Count 2');
  });
  it('ajusta mapas al área disponible sin alterar su proporción',()=>{
    const rect=imageContainRect(1600,900,10,20,200,200);
    expect(rect).toEqual({x:10,y:63.75,width:200,height:112.5});
  });
  it('define una única escala tipográfica y un interlineado común',()=>{
    expect(Object.values(REPORT_TYPOGRAPHY)).toEqual([17,13,8.5,10.5,9,8,7.5,7.5]);
    expect(REPORT_TYPOGRAPHY.pageTitle).toBeGreaterThan(REPORT_TYPOGRAPHY.sectionTitle);
    expect(REPORT_TYPOGRAPHY.body).toBeGreaterThan(REPORT_TYPOGRAPHY.caption);
    expect(REPORT_LAYOUT.bodyLeading).toBeGreaterThan(REPORT_LAYOUT.captionLeading);
    expect(REPORT_LAYOUT.lineHeightFactor).toBeGreaterThan(1);
  });
  const base={options:{navigation:false,pnoaOverview:false,individualRoutePages:false,terrain3d:false,historical:false,pointList:false,barrierList:false,pageSize:'a4' as const},points:[],barriers:[],routes:[],extent:[-4,40,-3,41] as [number,number,number,number],navigationLabel:'OSM',historicalLabel:'MTN50',resolution:25,paletteLabel:'Terreno',areaKm2:100,cells:160000,mdtSource:'IGN',connectivity:8 as const,criticalSlopePercent:10};
  it('ordena la ficha y presenta una sola vez cada parámetro con los valores efectivos',()=>{
    const route={model:'tobler-off' as const,direction:'inicio→final',path:[0,1],coordinates:[[-3.8,40.4],[-3.7,40.5]] as [number,number][],cost:3078.98,unit:'s',distanceM:2664.8,ascentM:22,descentM:97,settings:{connectivity:16 as const}};
    const sections=routeTechnicalSections(route,{...base,resolution:5,mdtSource:'MDT05 · IGN/CNIG · WCS MDT de España'});
    expect(sections.map(section=>section.title)).toEqual(['Perfil de desplazamiento','Configuración del cálculo','Resultado']);
    const configuration=sections[1].rows.join('\n');
    expect(configuration.match(/16 vecinos/g)).toHaveLength(1);
    expect(configuration).toContain('Pendiente crítica: no utilizada');
    expect(configuration).toContain('Velocidad configurable: no aplicable');
    expect(configuration.match(/MDT05/g)).toHaveLength(1);
    expect(configuration).not.toMatch(/Conectividad utilizada|Resolución del MDT|Fuente del MDT/);
    expect(sections[2].rows).toContain('Distancia: 2664,8 m · Coste acumulado: 3078,98 s');
    expect(sections[0].rows.filter(row=>row.startsWith('Referencia:'))).toHaveLength(1);
  });
  it('respeta pendiente y velocidad guardadas y no inventa una velocidad ausente',()=>{
    const route={model:'wheeled' as const,direction:'A→B',path:[0,1],cost:10,unit:'s',distanceM:20,ascentM:0,descentM:0,settings:{connectivity:4 as const,criticalSlopePercent:17}};
    expect(routeTechnicalSections(route,base)[1].rows).toContain('Pendiente crítica: 17,0 %');
    expect(routeTechnicalSections({...route,model:'ardigo',settings:{connectivity:8,ardigoSpeedMs:1.25}},base)[1].rows).toContain('Velocidad configurable: 1,25 m/s');
    expect(routeTechnicalSections({...route,model:'ardigo',settings:undefined},base)[1].rows).toContain('Velocidad configurable: no registrada');
  });
  it('genera un PDF válido aun cuando se desactivan todas las secciones opcionales',()=>{
    const bytes=createProjectReport({options:{navigation:false,pnoaOverview:false,individualRoutePages:false,terrain3d:false,historical:false,pointList:false,barrierList:false,pageSize:'a3'},points:[],barriers:[],routes:[],extent:[-4,40,-3,41],navigationLabel:'OSM',historicalLabel:'MTN50',resolution:25,paletteLabel:'Terreno',areaKm2:100,cells:160000,mdtSource:'IGN',connectivity:8,criticalSlopePercent:10});
    expect(new TextDecoder().decode(bytes.slice(0,5))).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(1000);
  });
  it.each(['a4','a3','a2'] as const)('aplica el mismo sistema tipográfico al formato %s horizontal',pageSize=>{
    const bytes=createProjectReport({...base,options:{...base.options,pageSize},customTextPages:[{id:'text',title:'Informe con texto extenso',lines:[`Descripción: ${'contenido cartográfico y técnico '.repeat(35)}`]}],customOrder:['text']});
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
    expect(source).toContain('/Count 4');
  });
  it('ordena resultado y perfil después de cada ruta comparada',()=>{
    const route={model:'tobler' as const,direction:'inicio→final',path:[0,1],coordinates:[[-3.8,40.4],[-3.7,40.5]] as [number,number][],cost:120,unit:'s',distanceM:100,ascentM:10,descentM:2,settings:{connectivity:8 as const}};
    const second={...route,model:'wheeled' as const,cost:140,unit:'coste relativo',settings:{connectivity:16 as const,criticalSlopePercent:11}};
    const bytes=createProjectReport({...base,routes:[{result:route,color:'#00b9ff'},{result:second,color:'#ff5d6c'}],analysis:{kind:'route-comparison' as const,title:'Comparación',includeIndividualPages:true,includeProfilePages:true}});
    expect(new TextDecoder('latin1').decode(bytes)).toContain('/Count 6');
  });
  it('incluye matriz y ficha técnica en Multipunto',()=>{
    const route={model:'tobler' as const,direction:'A→B',path:[0,1],coordinates:[[-3.8,40.4],[-3.7,40.5]] as [number,number][],cost:120,unit:'s',distanceM:100,ascentM:10,descentM:2,settings:{connectivity:8 as const}};
    const bytes=createProjectReport({...base,routes:[{result:route,color:'#00b9ff'}],analysis:{kind:'multipoint' as const,title:'Multipunto',matrix:[[0,120],[100,0]],unit:'s',includeMatrixPage:true,includeTechnicalPage:true}});
    expect(new TextDecoder('latin1').decode(bytes)).toContain('/Count 3');
  });
  it('incluye la ficha técnica de Multirruta',()=>{
    const route={model:'tobler' as const,direction:'A→B',path:[0,1],coordinates:[[-3.8,40.4],[-3.7,40.5]] as [number,number][],cost:120,unit:'s',distanceM:100,ascentM:10,descentM:2,settings:{connectivity:8 as const}};
    const bytes=createProjectReport({...base,routes:[{result:route,color:'#00b9ff'}],analysis:{kind:'multiroute' as const,title:'Multirruta',includeTechnicalPage:true}});
    expect(new TextDecoder('latin1').decode(bytes)).toContain('/Count 2');
  });
});
