import {invoke} from '@tauri-apps/api/core';
import {open} from '@tauri-apps/plugin-dialog';
import {parseElementLayers} from '../core/elementImports';
import type {GeoPackageLayer} from '../core/resultExports';
import {hasNativeBackend} from './native';
export async function importElements(){
 if(!hasNativeBackend())throw Error('La importación GeoPackage requiere la aplicación de escritorio.');
 const path=await open({multiple:false,directory:false,filters:[{name:'GeoPackage',extensions:['gpkg']}]});
 if(!path)return null;
 const layers=await invoke<GeoPackageLayer[]>('import_geopackage',{path});
 return parseElementLayers(layers);
}
