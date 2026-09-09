import {afterEach,expect,it,vi} from 'vitest';
import {setLanguage} from '../core/i18n';
import {MODELS} from '../core/costModels';
import {createProjectReport} from './report';
const captured=vi.hoisted(()=>({drawn:[] as string[],wrapped:[] as string[]}));
vi.mock('jspdf',async importOriginal=>{
 const actual=await importOriginal<typeof import('jspdf')>();
 return {...actual,jsPDF:class extends actual.jsPDF{
  constructor(...args:ConstructorParameters<typeof actual.jsPDF>){
   super(...args);
   const text=this.text.bind(this),split=this.splitTextToSize.bind(this);
   this.text=((value:string|string[],...rest:unknown[])=>{captured.drawn.push(...(Array.isArray(value)?value:[value]));return Reflect.apply(text,this,[value,...rest])}) as typeof this.text;
   this.splitTextToSize=((value:string,...rest:unknown[])=>{captured.wrapped.push(value);return Reflect.apply(split,this,[value,...rest])}) as typeof this.splitTextToSize;
  }
 }};
});
afterEach(()=>{setLanguage('es');captured.drawn.length=0;captured.wrapped.length=0});
it('traduce las páginas técnicas de los quince perfiles antes de medir y dividir sus textos',()=>{
 // setLanguage also supports non-DOM report generation.
 setLanguage('en');
 const routes=Object.values(MODELS).map(model=>({color:'#00b9ff',result:{model:model.id,direction:'ida',path:[0,1],coordinates:[[-3.8,40.4],[-3.7,40.5]] as [number,number][],elevationsM:[620,700],cost:120,unit:model.unit,distanceM:1000,ascentM:80,descentM:0}}));
 const bytes=createProjectReport({analysis:{kind:'route-comparison',title:'Informe de Ruta comparativa',includeIndividualPages:true,includeProfilePages:true},options:{navigation:false,pnoaOverview:false,individualRoutePages:true,terrain3d:false,historical:false,pointList:false,barrierList:false,pageSize:'a4'},points:[],barriers:[],routes,extent:[-4,40,-3,41],navigationLabel:'OSM',historicalLabel:'MTN50',resolution:25,paletteLabel:'Terreno',areaKm2:100,cells:160000,mdtSource:'IGN',connectivity:8,criticalSlopePercent:10});
 expect(bytes.length).toBeGreaterThan(1000);
 const text=captured.drawn.join('\n'),wrapped=captured.wrapped.join('\n');
 expect(text).toContain('Profile and parameters');
 expect(text).toContain('Walking speed based on signed slope.');
 expect(wrapped).not.toMatch(/Descripción|Pendiente|Velocidad|vecinos|según|para |del |terreno/);
 expect(text).not.toMatch(/Descripción|Pendiente|Velocidad|vecinos|según|para |del |terreno/);
});
