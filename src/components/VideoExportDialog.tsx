import {useEffect,useId,useRef,useState} from 'react';
import {translateText,useLanguage} from '../core/i18n';
import type {VideoExportFormat} from '../services/exports';
import './video-export-dialog.css';

export function VideoExportDialog({onExport,onClose}:{onExport:(format:VideoExportFormat)=>void;onClose:()=>void}){
 useLanguage();
 const [format,setFormat]=useState<VideoExportFormat>('avi');
 const dialogRef=useRef<HTMLDialogElement>(null),titleId=useId(),groupId=useId();
 useEffect(()=>{
  const dialog=dialogRef.current!,previous=dialog.ownerDocument.activeElement as HTMLElement|null;
  dialog.showModal();
  return()=>{dialog.close();previous?.focus()};
 },[]);
 return <dialog ref={dialogRef} className="video-export-dialog" aria-labelledby={titleId} translate="no" onCancel={event=>{event.preventDefault();onClose()}}>
  <form onSubmit={event=>{event.preventDefault();onExport(format)}}>
   <h2 id={titleId}>{translateText('Exportar vídeo')}</h2>
   <fieldset>
    <legend>{translateText('Formato del vídeo')}</legend>
    <label><input autoFocus type="radio" name={groupId} value="avi" checked={format==='avi'} onChange={()=>setFormat('avi')}/><span><strong>AVI (MJPEG)</strong><small>{translateText('Formato original, sin conversión.')}</small></span></label>
    <label><input type="radio" name={groupId} value="mp4" checked={format==='mp4'} onChange={()=>setFormat('mp4')}/><span><strong>MP4 (H.264)</strong><small>{translateText('Archivo comprimido compatible con la mayoría de reproductores.')}</small></span></label>
   </fieldset>
   <footer><button type="button" onClick={onClose}>{translateText('Cancelar')}</button><button type="submit">{translateText('Exportar')}</button></footer>
  </form>
 </dialog>;
}
