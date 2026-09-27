import {translateText} from '../core/i18n';
import {invoke} from './processInvoke';
import { open, save } from '@tauri-apps/plugin-dialog';
import { drawViaSpaniaWatermark } from '../core/exportWatermark';
import { normalizeProjectName, projectNameFromPath } from '../core/projectFiles';

interface ExportOptions { defaultName:string; label:string; extensions:string[] }
export type VideoExportFormat='avi'|'mp4';
async function selectVideoPath(defaultName:string,format:VideoExportFormat){
 const path=await save({defaultPath:defaultName.replace(/\.(avi|mp4)$/i,`.${format}`),filters:[{name:translateText(format==='avi'?'Vídeo AVI (MJPEG)':'Vídeo MP4 (H.264)'),extensions:[format]}]});
 if(path&&!path.toLowerCase().endsWith(`.${format}`))throw new Error(translateText(format==='avi'?'Seleccione un archivo AVI.':'Seleccione un archivo MP4.'));
 return path;
}
export async function startVideoExport(format:VideoExportFormat='avi',defaultName='video.avi'){
 // Choose the destination before rendering so the user can cancel without
 // spending time generating a video that will not be saved.
 const videoPath=await selectVideoPath(defaultName,format);
 if(!videoPath)return null;
 const id=await invoke<string>('video_export_start');
 return {
  async append(bytes:Uint8Array){let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));await invoke('video_export_append',{id,base64:btoa(binary)})},
  async finish(header:Uint8Array,index:Uint8Array,_defaultName:string){return invoke<string>('video_export_finish',{id,path:videoPath,header:Array.from(header),index:Array.from(index)})},
  async cancel(){await invoke('video_export_cancel',{id})}
 };
}
export interface GeoPackageLayerExport {name:string;geoJson:string}
export interface ResultBundleFile {fileName:string;attributions?:readonly string[];text?:string;dataUrl?:string;geoPackageLayers?:GeoPackageLayerExport[];rasterPath?:string}

export async function saveResultBundle(files:readonly ResultBundleFile[],attributions:readonly string[]=[]){const directory=await open({multiple:false,directory:true});if(!directory)return null;const folder=Array.isArray(directory)?directory[0]:directory;if(!folder)return null;const separator=folder.includes('\\')?'\\':'/';for(const file of files){const path=`${folder}${separator}${file.fileName}`;if(file.rasterPath){await invoke<string>('export_raster_geotiff',{sourcePath:file.rasterPath,path});continue}if(file.geoPackageLayers?.length){await invoke<string>('export_geopackage',{path,layers:file.geoPackageLayers});continue}const base64=file.dataUrl?.split(',')[1]??null;if(file.text==null&&!base64)throw new Error(`No se pudo preparar ${file.fileName}`);await invoke<string>('save_export_file',{path,text:file.text??null,base64})}for(const file of files){const credits=[...new Set([...(file.attributions??[]),...attributions])];if(!credits.length)continue;await invoke<string>('save_export_file',{path:`${folder}${separator}${file.fileName}.attribution.txt`,text:[`Fuentes y atribuciones del proyecto — ${file.fileName}`,'La licencia GPL-3.0-only del programa no sustituye las licencias de los datos. Conserve este archivo al redistribuir el resultado.',...credits].join('\n\n'),base64:null})}return folder}

export async function saveTextExport(text:string,options:ExportOptions) {
  const path=await save({defaultPath:options.defaultName,filters:[{name:translateText(options.label),extensions:options.extensions}]});
  if(!path)return null;
  return invoke<string>('save_export_file',{path,text,base64:null});
}

export async function overwriteTextExport(path:string,text:string) {
  return invoke<string>('save_export_file',{path,text,base64:null});
}

export async function saveProjectFile(currentPath:string|null,currentName:string,serialize:(name:string)=>string) {
  const path=currentPath??await save({defaultPath:`${normalizeProjectName(currentName)||'Proyecto'}.json`,filters:[{name:translateText('Proyecto ViaSpania'),extensions:['json']}]});
  if(!path)return null;
  const name=currentPath?currentName:projectNameFromPath(path),text=serialize(name);
  await overwriteTextExport(path,text);
  return {path,name,text};
}
export async function autoSaveProject(path:string,text:string,previousText:string|null,projectName:string){
  if(previousText){const backup=`${path.replace(/\.json$/i,'')}_backup.json`;await overwriteTextExport(backup,previousText)}
  await overwriteTextExport(path,text);return projectName;
}

export async function savePdfExport(bytes:Uint8Array,defaultName:string) {
  const path=await save({defaultPath:defaultName,filters:[{name:translateText('Informe PDF'),extensions:['pdf']}]});
  if(!path)return null;
  let binary='';
  const chunk=0x8000;
  for(let index=0;index<bytes.length;index+=chunk)binary+=String.fromCharCode(...bytes.subarray(index,index+chunk));
  return invoke<string>('save_export_file',{path,text:null,base64:btoa(binary)});
}

export async function savePngExport(dataUrl:string,defaultName:string) {
  const path=await save({defaultPath:defaultName,filters:[{name:translateText('Imagen PNG'),extensions:['png']}]});
  if(!path)return null;
  const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const value=new Image();value.onload=()=>resolve(value);value.onerror=()=>reject(new Error('No se pudo preparar la imagen exportada'));value.src=dataUrl}),canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  if(!context||!image.naturalWidth)throw new Error('El visor no produjo una imagen PNG válida');
  canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;context.drawImage(image,0,0);drawViaSpaniaWatermark(context,canvas.width,canvas.height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('No se pudo codificar la imagen PNG');
  const base64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]??'');reader.onerror=()=>reject(new Error('No se pudo codificar la imagen PNG'));reader.readAsDataURL(blob)});
  if(!base64)throw new Error('No se pudo codificar la imagen PNG');
  return invoke<string>('save_export_file',{path,text:null,base64});
}

export async function saveMediaExport(bytes:Uint8Array,defaultName:string,label:string,extension:string) {
  const path=await save({defaultPath:defaultName,filters:[{name:translateText(label),extensions:[extension]}]});
  if(!path)return null;
  let binary='';const chunk=0x8000;
  for(let index=0;index<bytes.length;index+=chunk)binary+=String.fromCharCode(...bytes.subarray(index,index+chunk));
  return invoke<string>('save_export_file',{path,text:null,base64:btoa(binary)});
}

export async function openProjectFile(){const path=await open({multiple:false,directory:false,filters:[{name:translateText('Proyecto ViaSpania'),extensions:['json']}]});if(!path)return null;return{path,text:await invoke<string>('read_project_file',{path})}}
