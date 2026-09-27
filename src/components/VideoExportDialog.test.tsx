// @vitest-environment jsdom
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {setLanguage,translateText} from '../core/i18n';
import {VideoExportDialog} from './VideoExportDialog';

beforeEach(()=>{
 Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(this:HTMLDialogElement){this.open=true}});
 Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(this:HTMLDialogElement){this.open=false}});
});
afterEach(()=>{cleanup();setLanguage('es')});

it.each(['es','en'] as const)('selecciona AVI por defecto y traduce toda la ventana a %s',language=>{
 setLanguage(language);
 const onExport=vi.fn(),onClose=vi.fn();
 render(<VideoExportDialog onExport={onExport} onClose={onClose}/>);
 const en=language==='en';
 expect(screen.getByRole('dialog',{name:en?'Export video':'Exportar vídeo'})).toBeTruthy();
 expect(screen.getByRole('group',{name:en?'Video format':'Formato del vídeo'})).toBeTruthy();
 expect(screen.getByText(en?'Original format, without conversion.':'Formato original, sin conversión.')).toBeTruthy();
 expect(screen.getByText(en?'Compressed file compatible with most players.':'Archivo comprimido compatible con la mayoría de reproductores.')).toBeTruthy();
 expect((screen.getByRole('radio',{name:/AVI/}) as HTMLInputElement).checked).toBe(true);
 expect(screen.getByRole('button',{name:en?'Cancel':'Cancelar'})).toBeTruthy();
 expect(onExport).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:en?'Export':'Exportar'}));
 expect(onExport).toHaveBeenCalledWith('avi');
});

it('permite elegir MP4 y adapta todos los textos al cambiar de idioma',()=>{
 const onExport=vi.fn();
 render(<VideoExportDialog onExport={onExport} onClose={()=>{}}/>);
 fireEvent.click(screen.getByRole('radio',{name:/MP4/}));
 act(()=>setLanguage('en'));
 expect(screen.getByRole('dialog',{name:'Export video'})).toBeTruthy();
 expect((screen.getByRole('radio',{name:/MP4/}) as HTMLInputElement).checked).toBe(true);
 expect(screen.queryByText('Formato del vídeo')).toBeNull();
 expect(translateText('Creando MP4 · 50 %')).toBe('Creating MP4 · 50 %');
 expect(translateText('Convirtiendo a MP4…')).toBe('Converting to MP4…');
 expect(translateText('Guardado · 1920 × 1080 px · 20.0 s · 1× · MP4')).toBe('Saved · 1920 × 1080 px · 20.0 s · 1× · MP4');
 fireEvent.click(screen.getByRole('button',{name:'Export'}));
 expect(onExport).toHaveBeenCalledWith('mp4');
});

it('Cancelar y Escape cierran sin iniciar el renderizado',()=>{
 const onExport=vi.fn(),onClose=vi.fn();
 render(<VideoExportDialog onExport={onExport} onClose={onClose}/>);
 fireEvent.click(screen.getByRole('button',{name:'Cancelar'}));
 fireEvent(screen.getByRole('dialog'),new Event('cancel',{bubbles:true,cancelable:true}));
 expect(onClose).toHaveBeenCalledTimes(2);
 expect(onExport).not.toHaveBeenCalled();
});
