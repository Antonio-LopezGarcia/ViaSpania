import {describe,expect,it} from 'vitest';
import {createCatalogTranslator,type TranslationCatalog} from './italianCatalog';
import catalog from './i18n.it.json';

const make=(messages:Record<string,string>,patterns:TranslationCatalog['patterns']=[])=>createCatalogTranslator({messages,patterns});
describe('catálogo editable',()=>{
 it('conserva el español pendiente y los espacios de los nodos',()=>{
  const t=make({'Ayuda':'Aiuto','Pendiente':''});expect(t(' Ayuda ')).toBe(' Aiuto ');expect(t('Pendiente')).toBe('Pendiente');expect(t('Desconocido')).toBe('Desconocido');
 });
 it('permite reordenar parámetros y conserva rutas, cifras y signos dólar',()=>{
  const t=make({'Exportados {0} resultados en {1}':'In {1}: {0} risultati esportati'});
  expect(t('Exportados 12 resultados en /tmp/Ruta $& · final: 1.gpkg')).toBe('In /tmp/Ruta $& · final: 1.gpkg: 12 risultati esportati');
 });
 it('no aplica traducciones que pierden parámetros',()=>{
  const t=make({'Punto {0} seleccionado':'Punto selezionato'});expect(t('Punto 5 seleccionado')).toBe('Punto 5 seleccionado');
  const pattern=make({},[{source:'^Punto (\\d+)$',flags:'g',reference:'Point $1',translation:'Punto'}]);expect(pattern('Punto 5')).toBe('Punto 5');
 });
 it('prioriza mensajes completos sobre patrones y traduce etiquetas compuestas',()=>{
  const t=make({'Punto 1':'Origine','Coste':'Costo'},[{source:'^Punto (\\d+)$',flags:'g',reference:'Point $1',translation:'Punto $1'}]);
  expect(t('Punto 1')).toBe('Origine');expect(t('Punto 8')).toBe('Punto 8');expect(t('Coste: 12 J · Punto 1')).toBe('Costo: 12 J · Origine');
 });
 it('el catálogo se puede compilar y sus traducciones conservan los parámetros',()=>{
  expect(()=>createCatalogTranslator(catalog)).not.toThrow();
  for(const [source,target] of Object.entries(catalog.messages))if(target){const tokens=(value:string)=>[...value.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort();expect(tokens(target),source).toEqual(tokens(source))}
  for(const item of catalog.patterns){expect(()=>new RegExp(item.source,item.flags)).not.toThrow();if(item.translation){const tokens=(value:string)=>[...value.matchAll(/\$\d+/g)].map(m=>m[0]).sort();expect(tokens(item.translation),item.source).toEqual(tokens(item.reference))}}
 });
});
