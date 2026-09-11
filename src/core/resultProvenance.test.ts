// ViaSpania
// Copyright © 2026 Antonio López García, Universidad de Granada
// Este programa se distribuye bajo la licencia GPL-3.0-only.
import {expect,it} from 'vitest';
import {migrateProjectProvenance,registerRasterProvenance,resultCredit,resultProvenance,withRasterProvenance} from './resultProvenance';

it('no infiere la procedencia de resultados antiguos a partir del selector o la palabra IGN',()=>{
 const project={elevationSourceId:'mdt5',route:{source:'IGN',cost:1},comparison:[{cost:2}],multiConnections:[{result:{cost:3}}],rankedMultiroutes:[{connections:[{result:{cost:4}}]}]};
 const migrated=migrateProjectProvenance(project) as typeof project & {route:{dataProvenance:{status:string;legacySource:string}}};
 expect(migrated.route.dataProvenance.status).toBe('requires-review');expect(migrated.route.dataProvenance.legacySource).toBe('IGN');
 expect(JSON.stringify(migrated)).toContain('requires-review');expect(project.route).not.toHaveProperty('dataProvenance');
 expect(migrateProjectProvenance(migrated)).toEqual(migrated);
});
it('conserva la procedencia registrada al guardar y reabrir sin depender del raster actual',()=>{
 const raster=registerRasterProvenance({path:'/a.tif',dataAttribution:'© Fuente A'});
 const project={route:{dataProvenance:raster.dataProvenance},elevationSourceId:'copernicus30'};
 expect(migrateProjectProvenance(JSON.parse(JSON.stringify(project)))).toEqual(project);
});
it('captura la fuente antes de un cálculo asíncrono y no cambia si se registra otra',async()=>{
 registerRasterProvenance({path:'/same.tif',dataAttribution:'© Fuente A'});
 let finish!:(value:{cost:number})=>void;
 const pending=withRasterProvenance('/same.tif',()=>new Promise<{cost:number}>(resolve=>{finish=resolve}));
 registerRasterProvenance({path:'/same.tif',dataAttribution:'© Fuente B'});finish({cost:1});
 expect((await pending).dataProvenance.attribution).toBe('© Fuente A');
});
it('no acredita un raster que no ha sido registrado ni metadatos de versión desconocida',async()=>{
 expect((await withRasterProvenance('/missing.tif',async()=>({cost:1}))).dataProvenance.status).toBe('requires-review');
 expect(resultProvenance({dataProvenance:{version:2} as never}).status).toBe('requires-review');
 expect(resultCredit({source:'ruta histórica'})).toContain('Referencia histórica (sin validar)');
});
it('mantiene desconocida la licencia de un raster importado aunque tenga una ruta',()=>{
 expect(registerRasterProvenance({path:'/importado.tif'}).dataProvenance.status).toBe('requires-review');
});
it('no pierde la atribución de tramos con fuentes diferentes',async()=>{
 const {mergeResultProvenance}=await import('./resultProvenance');
 const a=registerRasterProvenance({path:'/one.tif',dataAttribution:'© A'}),b=registerRasterProvenance({path:'/two.tif',dataAttribution:'© B'});
 expect(mergeResultProvenance([a,b]).attribution).toBe('© A\n© B');
 expect(mergeResultProvenance([a,{source:'antiguo'}]).status).toBe('requires-review');
});
