import {useEffect,useState} from 'react';
import {open} from '@tauri-apps/plugin-dialog';
import {getCurrentWebviewWindow} from '@tauri-apps/api/webviewWindow';
import {hasNativeBackend,inspectGeospatialFile,type RasterResult} from '../services/native';
import {parseElevationRasterMetadata,type ImportedElevationKind,type RasterImportDetails} from '../core/rasterImport';
import {locale,translateText,useLanguage} from '../core/i18n';
import '../raster-import.css';

const shortCrs=(wkt:string)=>wkt.match(/(?:PROJCRS|GEOGCRS)\["([^"]+)/)?.[1]??'CRS reconocido por GDAL';

export function ElevationRasterImport({onClose,onLoad}:{onClose:()=>void;onLoad:(path:string,kind:ImportedElevationKind,details:RasterImportDetails)=>Promise<RasterResult>}){
  const language=useLanguage(),en=language==='en';
  const[kind,setKind]=useState<ImportedElevationKind>('terrain');
  const[path,setPath]=useState('');
  const[details,setDetails]=useState<RasterImportDetails|null>(null);
  const[error,setError]=useState('');
  const[working,setWorking]=useState(false);
  const[dragging,setDragging]=useState(false);
  const inspect=async(candidate:string)=>{if(!/\.tiff?$/i.test(candidate)){setError('Seleccione un archivo con extensión .tif o .tiff.');setDetails(null);return}setWorking(true);setError('');try{const parsed=parseElevationRasterMetadata(await inspectGeospatialFile(candidate));setPath(candidate);setDetails(parsed)}catch(reason){setDetails(null);setError(reason instanceof Error?reason.message:String(reason))}finally{setWorking(false)}};
  useEffect(()=>{if(!hasNativeBackend())return;let unlisten:(()=>void)|undefined;void getCurrentWebviewWindow().onDragDropEvent(event=>{if(event.payload.type==='over'){setDragging(true);return}setDragging(false);if(event.payload.type==='drop'){const candidate=event.payload.paths.find(value=>/\.tiff?$/i.test(value));if(candidate)void inspect(candidate);else setError('Arrastre un único GeoTIFF o COG con extensión .tif o .tiff.')}}).then(stop=>{unlisten=stop});return()=>unlisten?.()},[]);
  const choose=async()=>{if(!hasNativeBackend()){setError('La importación está disponible en la aplicación de escritorio.');return}const selected=await open({multiple:false,directory:false,filters:[{name:'GeoTIFF / COG',extensions:['tif','tiff']}]});if(typeof selected==='string')await inspect(selected)};
  const load=async()=>{if(!details)return;setWorking(true);setError('');try{await onLoad(path,kind,details);onClose()}catch(reason){setError(reason instanceof Error?reason.message:String(reason))}finally{setWorking(false)}};
  return <section className="raster-import-backdrop"><div className="raster-import-dialog" role="dialog" aria-modal="true" aria-label="Importar modelo de elevación">
    <header><div><b>Importar modelo de elevación</b><span>Cargue un GeoTIFF local y conviértalo al formato interno de ViaSpania.</span></div><button aria-label="Cerrar importación" onClick={onClose}>×</button></header>
    <div className="raster-import-body">
      <div className="raster-kind-tabs" role="tablist" aria-label="Tipo de modelo"><button role="tab" aria-selected={kind==='terrain'} className={kind==='terrain'?'active':''} onClick={()=>setKind('terrain')}><b>MDT</b><span>Terreno desnudo</span></button><button role="tab" aria-selected={kind==='surface'} className={kind==='surface'?'active':''} onClick={()=>setKind('surface')}><b>MDS</b><span>Edificios y vegetación</span></button></div>
      {kind==='surface'&&<p className="raster-surface-warning"><b>Modelo digital de superficie.</b> Puede contener edificios y copas. Es apropiado para visibilidad y superficie, pero no representa necesariamente pendientes transitables.</p>}
      <button className={`raster-drop-zone ${dragging?'dragging':''}`} onClick={()=>void choose()} disabled={working}><strong>{working?'Inspeccionando con GDAL…':path?'Cambiar GeoTIFF o COG':'Elegir o arrastrar GeoTIFF / COG'}</strong><span>{path?path.split(/[\\/]/).at(-1):'Formatos .tif y .tiff · el archivo no se modifica'}</span></button>
      <section className="raster-requirements"><h3>Requisitos de compatibilidad</h3><ul><li>Una sola banda numérica con elevaciones en metros.</li><li>CRS horizontal incorporado y reconocido por GDAL.</li><li>Georreferenciación válida y celdas regulares.</li><li>Valor NoData definido cuando existan huecos.</li><li>GeoTIFF clásico o COG; se reproyectará al UTM local y se guardará como COG interno.</li></ul></section>
      {error&&<p className="raster-import-error" role="alert">{en?translateText(error):error}</p>}
      {details&&<section className="raster-file-details"><h3>Archivo compatible</h3><dl><div><dt>Tamaño</dt><dd>{details.width.toLocaleString(locale())} × {details.height.toLocaleString(locale())} celdas</dd></div><div><dt>Banda</dt><dd>{details.bandType} · {details.noData==null?'NoData no declarado':`NoData ${details.noData}`}</dd></div><div><dt>Resolución original</dt><dd>{details.resolution?`${details.resolution[0].toLocaleString(locale())} × ${details.resolution[1].toLocaleString(locale())}`:'No disponible'}</dd></div><div><dt>Referencia</dt><dd>{shortCrs(details.crs)}</dd></div></dl></section>}
    </div>
    <footer><button onClick={onClose}>Cancelar</button><button className="primary" disabled={!details||working} onClick={()=>void load()}>{working?'Procesando…':`Importar como ${kind==='terrain'?'MDT':'MDS'}`}</button></footer>
  </div></section>;
}
