import {useEffect,useState} from 'react';
import {generateTerrainMesh,type RasterResult,type TerrainMesh} from '../services/native';
import {hillshadeBrightness,hillshadeFootprint,sampleHillshade,terrainHillshade} from '../core/hillshade';

export async function shadePreview(imageUrl:string,mesh:TerrainMesh,intensity:number,metadata:Record<string,unknown>={}):Promise<string>{
 const image=new Image();image.src=imageUrl;await image.decode();
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const context=canvas.getContext('2d');if(!context)throw new Error('No se pudo preparar el sombreado del modelo digital.');
 context.drawImage(image,0,0);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height),shade=terrainHillshade(mesh),footprint=hillshadeFootprint(mesh,metadata);
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
  const brightness=hillshadeBrightness(sampleHillshade(shade,mesh.width,mesh.height,x/Math.max(1,canvas.width-1),y/Math.max(1,canvas.height-1),footprint),intensity),i=(y*canvas.width+x)*4;
  for(let channel=0;channel<3;channel++)pixels.data[i+channel]*=brightness;
 }
 context.putImageData(pixels,0,0);return canvas.toDataURL('image/png');
}

export function useHillshadePreview(raster:RasterResult|null,image:string|undefined,intensity:number,onError:(message:string)=>void){
 const [terrain,setTerrain]=useState<{raster:RasterResult;mesh:TerrainMesh}|null>(null);
 const [preview,setPreview]=useState<{raster:RasterResult;image:string;intensity:number;url:string}|null>(null);
 const enabled=intensity>0;
 useEffect(()=>{
  if(!raster||!enabled||terrain?.raster===raster)return;
  let cancelled=false;
  void generateTerrainMesh(raster.path,450).then(mesh=>{if(!cancelled)setTerrain({raster,mesh})}).catch(()=>{if(!cancelled)onError('No se pudo calcular el relieve sombreado del MDT.');});
  return()=>{cancelled=true};
 },[raster,enabled,terrain,onError]);
 useEffect(()=>{
  if(!raster||!image||!enabled||terrain?.raster!==raster)return;
  let cancelled=false;
  void shadePreview(image,terrain.mesh,intensity,raster.metadata).then(url=>{if(!cancelled)setPreview({raster,image,intensity,url})}).catch(()=>{if(!cancelled)onError('No se pudo aplicar el relieve sombreado al MDT.');});
  return()=>{cancelled=true};
 },[raster,image,intensity,enabled,terrain,onError]);
 return enabled&&preview?.raster===raster&&preview.image===image&&preview.intensity===intensity?preview.url:image;
}
