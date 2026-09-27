import type { TerrainMesh } from '../services/native';

/** Lambert illumination: unit normal · unit light direction, dimensionless [0,1].
 * Elevations and horizontal spacing are in metres; rows run north to south.
 * NW light: azimuth 315°, altitude 45°. Central differences (one-sided at edges).
 * Reference: https://doc.esri.com/en/arcgis-pro/latest/tool-reference/3d-analyst/how-hillshade-works.html
 * Invalid neighbours are excluded, never interpreted as zero elevation.
 */
export function terrainHillshade(mesh:TerrainMesh):Float32Array {
 const {width,height,widthM,heightM,elevations,validCells}=mesh;
 const result=new Float32Array(width*height).fill(1);
 if(width<2||height<2||!Number.isFinite(widthM)||!Number.isFinite(heightM)||widthM<=0||heightM<=0)return result;
 const dx=widthM/(width-1),dy=heightM/(height-1);
 const valid=(i:number)=>validCells?.[i]!==false&&Number.isFinite(elevations[i]);
 for(let row=0;row<height;row++)for(let col=0;col<width;col++){
  const i=row*width+col;if(!valid(i))continue;
  const left=col>0&&valid(i-1)?i-1:i,right=col<width-1&&valid(i+1)?i+1:i;
  const north=row>0&&valid(i-width)?i-width:i,south=row<height-1&&valid(i+width)?i+width:i;
  const eastSlope=right===left?0:(elevations[right]-elevations[left])/((right-left)*dx);
  const southSlope=south===north?0:(elevations[south]-elevations[north])/((south-north)/width*dy);
  result[i]=Math.max(0,(.5*eastSlope+.5*southSlope+Math.SQRT1_2)/Math.hypot(eastSlope,southSlope,1));
 }
 return result;
}

/** Display blend only, dimensionless. Retain 25% ambient light in shaded slopes. */
export function hillshadeBrightness(illumination:number,intensity:number):number {
 const amount=Number.isFinite(intensity)?Math.max(0,Math.min(1,intensity)):0;
 return 1-amount*(1-(.25+.75*illumination));
}

/** Fraction of the original raster covered by the centred, cropped terrain mesh. */
export function hillshadeFootprint(mesh:TerrainMesh,metadata:Record<string,unknown>):[number,number]{
 const size=metadata.size,transform=metadata.geoTransform;
 if(!Array.isArray(size)||!Array.isArray(transform))return[1,1];
 const ratio=(span:number,pixel:unknown,count:unknown)=>{
  const full=Math.abs(Number(pixel))*Number(count);
  return Number.isFinite(full)&&full>0?Math.min(1,span/full):1;
 };
 return[ratio(mesh.widthM,transform[1],size[0]),ratio(mesh.heightM,transform[5],size[1])];
}

/** Bilinear display sampling. Outside the cropped footprint remains unshaded. */
export function sampleHillshade(shade:Float32Array,width:number,height:number,u:number,v:number,footprint:readonly [number,number]=[1,1]):number{
 const x=(u-(1-footprint[0])/2)/footprint[0],y=(v-(1-footprint[1])/2)/footprint[1];
 if(x<0||x>1||y<0||y>1)return 1;
 const col=x*(width-1),row=y*(height-1),left=Math.floor(col),top=Math.floor(row),right=Math.min(left+1,width-1),bottom=Math.min(top+1,height-1),tx=col-left,ty=row-top;
 return (shade[top*width+left]*(1-tx)+shade[top*width+right]*tx)*(1-ty)+(shade[bottom*width+left]*(1-tx)+shade[bottom*width+right]*tx)*ty;
}
