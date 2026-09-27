import {describe,expect,it,vi} from 'vitest';
import {ProcessTracker} from './processStatus';

describe('piloto global de procesos',()=>{
 it('permanece activo hasta terminar todos los trabajos concurrentes',()=>{
  const tracker=new ProcessTracker(),listener=vi.fn();tracker.subscribe(listener);
  const download=tracker.begin(),save=tracker.begin();
  expect(tracker.getSnapshot()).toBe('running');download.finish();
  expect(tracker.getSnapshot()).toBe('running');save.finish();
  expect(tracker.getSnapshot()).toBe('success');expect(listener).toHaveBeenCalledTimes(2);
 });
 it('conserva un fallo aunque otro trabajo termine correctamente y se recupera en el siguiente lote',()=>{
  const tracker=new ProcessTracker(),download=tracker.begin(),save=tracker.begin();
  download.fail();download.finish();expect(tracker.getSnapshot()).toBe('running');
  save.finish();expect(tracker.getSnapshot()).toBe('error');
  const next=tracker.begin();expect(tracker.getSnapshot()).toBe('running');next.finish();expect(tracker.getSnapshot()).toBe('success');
 });
 it('registra excepciones y errores manejados por la interfaz sin cambiar su propagación',async()=>{
  const tracker=new ProcessTracker(),error=new Error('No se pudo guardar');
  await expect(tracker.run(async()=>{throw error})).rejects.toBe(error);
  expect(tracker.getSnapshot()).toBe('error');
  await tracker.run(async process=>{try{throw error}catch{process.fail()}});
  expect(tracker.getSnapshot()).toBe('error');
 });
 it('soporta procesos anidados, cancelaciones sin error y finalizaciones duplicadas',async()=>{
  const tracker=new ProcessTracker();
  await tracker.run(async()=>{await tracker.run(async()=>null);expect(tracker.getSnapshot()).toBe('running')});
  expect(tracker.getSnapshot()).toBe('success');
  const first=tracker.begin();first.finish();const second=tracker.begin();first.finish();first.fail();
  expect(tracker.getSnapshot()).toBe('running');second.finish();expect(tracker.getSnapshot()).toBe('success');
 });
});
