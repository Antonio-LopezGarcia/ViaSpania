/** The same relative-cost ramp for the 2D image and the 3D texture. */
export function corridorRasterPixels(width:number,height:number,values:readonly number[],thresholdPercent:number):Uint8Array {
 const pixels=new Uint8Array(width*height*4),maximum=Math.max(thresholdPercent/100,.0001);
 for(let index=0;index<width*height;index++){
  const value=values[index];
  // -1 is the backend's exact NoData sentinel. Other negative values can be
  // tiny floating-point undershoots on optimal cells in older saved results.
  if(value===-1||!Number.isFinite(value))continue;
  const ratio=Math.min(1,Math.max(0,value/maximum));
  pixels.set([Math.round(25+230*ratio),Math.round(225-115*ratio),70,255],index*4);
 }
 return pixels;
}

export type RasterExtent=readonly [number,number,number,number];
export interface CorridorRaster {width:number;height:number;values:number[];thresholdPercent:number;extent:RasterExtent;opacity:number}

/** DataTexture's first row is sampled at v=0; surface arrays run north to south. */
export function corridorRasterUvs(width:number,height:number,terrainExtent:RasterExtent,rasterExtent:RasterExtent):Float32Array {
 const [west,south,east,north]=terrainExtent,[rw,rs,re,rn]=rasterExtent,uvs=new Float32Array(width*height*2);
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){
  const lon=west+(east-west)*col/Math.max(1,width-1),lat=north-(north-south)*row/Math.max(1,height-1);
  uvs.set([(lon-rw)/(re-rw),(rn-lat)/(rn-rs)],(row*width+col)*2);
 }
 return uvs;
}
