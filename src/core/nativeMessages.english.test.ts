import {afterEach,expect,it} from 'vitest';
import nativeSource from '../../src-tauri/src/lib.rs?raw';
import videoSource from '../../src-tauri/src/video_export.rs?raw';
import gazetteerSource from '../../src-tauri/src/gazetteer.rs?raw';
import {setLanguage,translateText} from './i18n';
afterEach(()=>setLanguage('es'));
it('cubre los mensajes españoles emitidos por el backend nativo',()=>{
 setLanguage('en');
 const messages=[nativeSource,videoSource,gazetteerSource].flatMap(source=>[...source.split('#[cfg(test)]')[0].matchAll(/"([^"\n]*(?:[áéíóúñ]| no |No |El |La | fuera |Calculando|Preparando|Iniciando|Completado)[^"\n]*)"/g)].map(match=>match[1]));
 const untranslated=[...new Set(messages)].flatMap(source=>{
  const sample=source.replace(/\{(?:cells|configured_limit|index)?\}/g,'2').replace(/\{[^}]+\}/g,'DETAIL');
  const translated=translateText(sample);
  return translated===sample||/[áéíóúñ]|\b(?:el|del|para|hay|debe|fuera|cerca|permite|tamaño)\b/.test(translated)?[{source,translated}]:[];
 });
 expect(untranslated).toEqual([]);
});
