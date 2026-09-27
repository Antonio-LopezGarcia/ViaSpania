import { useEffect, useState } from 'react';
import { rasterColorPreview, type RasterResult } from '../services/native';

export const PALETTE_LABELS:Record<string,string>={grayscale:'Escala de grises',terrain:'Terreno',hypsometric:'Hipsométrica',viridis:'Viridis',alpine:'Alta montaña'};
type PreviewRaster=Pick<RasterResult,'path'|'previewDataUrl'>;

/** One palette for both viewers; discard previews from superseded selections or rasters. */
export function useRasterPalette(raster:PreviewRaster|null,initialPalette:()=>string,onNotice:(message:string)=>void){
  const [palette,setPalette]=useState(initialPalette);
  const [preview,setPreview]=useState<{raster:PreviewRaster;palette:string;image:string}|null>(null);
  useEffect(()=>{
    if(!raster||palette==='grayscale')return;
    let cancelled=false;
    onNotice(`Aplicando paleta ${PALETTE_LABELS[palette]??palette}…`);
    void rasterColorPreview(raster.path,palette).then(image=>{
      if(cancelled)return;
      setPreview({raster,palette,image});
      onNotice(`Paleta ${PALETTE_LABELS[palette]??palette} aplicada al MDT`);
    }).catch(error=>{
      if(cancelled)return;
      setPalette('grayscale');
      setPreview(null);
      onNotice(error instanceof Error?error.message:'No se pudo aplicar la paleta al modelo digital.');
    });
    return()=>{cancelled=true};
  },[raster,palette,onNotice]);
  const previewImage=palette!=='grayscale'&&preview?.raster===raster&&preview.palette===palette?preview.image:raster?.previewDataUrl;
  return{palette,setPalette,previewImage};
}
