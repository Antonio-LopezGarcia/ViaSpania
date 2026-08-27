import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { drawViaSpaniaWatermark } from '../core/exportWatermark';

interface ExportOptions { defaultName:string; label:string; extensions:string[] }
export interface GeoPackageLayerExport {name:string;geoJson:string}
export interface ResultBundleFile {fileName:string;text?:string;dataUrl?:string;geoPackageLayers?:GeoPackageLayerExport[];rasterPath?:string}

export async function saveResultBundle(files:readonly ResultBundleFile[]){const directory=await open({multiple:false,directory:true});if(!directory)return null;const folder=Array.isArray(directory)?directory[0]:directory;if(!folder)return null;const separator=folder.includes('\\')?'\\':'/';for(const file of files){const path=`${folder}${separator}${file.fileName}`;if(file.rasterPath){await invoke<string>('export_raster_geotiff',{sourcePath:file.rasterPath,path});continue}if(file.geoPackageLayers?.length){await invoke<string>('export_geopackage',{path,layers:file.geoPackageLayers});continue}const base64=file.dataUrl?.split(',')[1]??null;if(file.text==null&&!base64)throw new Error(`No se pudo preparar ${file.fileName}`);await invoke<string>('save_export_file',{path,text:file.text??null,base64})}return folder}

export async function saveTextExport(text:string,options:ExportOptions) {
  const path=await save({defaultPath:options.defaultName,filters:[{name:options.label,extensions:options.extensions}]});
  if(!path)return null;
  return invoke<string>('save_export_file',{path,text,base64:null});
}

export async function overwriteTextExport(path:string,text:string) {
  return invoke<string>('save_export_file',{path,text,base64:null});
}

export async function savePdfExport(bytes:Uint8Array,defaultName:string) {
  const path=await save({defaultPath:defaultName,filters:[{name:'Informe PDF',extensions:['pdf']}]});
  if(!path)return null;
  let binary='';
  const chunk=0x8000;
  for(let index=0;index<bytes.length;index+=chunk)binary+=String.fromCharCode(...bytes.subarray(index,index+chunk));
  return invoke<string>('save_export_file',{path,text:null,base64:btoa(binary)});
}

export async function savePngExport(dataUrl:string,defaultName:string) {
  const path=await save({defaultPath:defaultName,filters:[{name:'Imagen PNG',extensions:['png']}]});
  if(!path)return null;
  const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const value=new Image();value.onload=()=>resolve(value);value.onerror=()=>reject(new Error('No se pudo preparar la imagen exportada'));value.src=dataUrl}),canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  if(!context||!image.naturalWidth)throw new Error('El visor no produjo una imagen PNG válida');
  canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;context.drawImage(image,0,0);drawViaSpaniaWatermark(context,canvas.width,canvas.height);
  const base64=canvas.toDataURL('image/png').split(',')[1];
  if(!base64)throw new Error('No se pudo codificar la imagen PNG');
  return invoke<string>('save_export_file',{path,text:null,base64});
}

export async function saveMediaExport(bytes:Uint8Array,defaultName:string,label:string,extension:string) {
  const path=await save({defaultPath:defaultName,filters:[{name:label,extensions:[extension]}]});
  if(!path)return null;
  let binary='';const chunk=0x8000;
  for(let index=0;index<bytes.length;index+=chunk)binary+=String.fromCharCode(...bytes.subarray(index,index+chunk));
  return invoke<string>('save_export_file',{path,text:null,base64:btoa(binary)});
}

export async function openProjectFile(){const path=await open({multiple:false,directory:false,filters:[{name:'Proyecto ViaSpania',extensions:['json']}]});if(!path)return null;return{path,text:await invoke<string>('read_project_file',{path})}}
