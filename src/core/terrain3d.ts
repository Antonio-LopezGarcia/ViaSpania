import type { TerrainMesh } from '../services/native';

export interface HighestTerrainPoint { lon:number;lat:number;elevationM:number;row:number;column:number }
export const MAX_TERRAIN_3D_LINE_SEGMENTS=120_000;

export function terrainTriangleIndices(mesh:TerrainMesh){
 const indices:number[]=[];
 const valid=(i:number)=>mesh.validCells?.[i]!==false&&Number.isFinite(mesh.elevations[i]);
 for(let row=0;row<mesh.height-1;row++)for(let col=0;col<mesh.width-1;col++){
  const a=row*mesh.width+col,b=a+1,c=a+mesh.width,d=c+1;
  if(valid(a)&&valid(c)&&valid(b))indices.push(a,c,b);
  if(valid(b)&&valid(c)&&valid(d))indices.push(b,c,d);
 }
 return indices;
}

export function terrainLineSamplingStride(lines:readonly {coordinates:readonly unknown[]}[],maximum=MAX_TERRAIN_3D_LINE_SEGMENTS){const segments=lines.reduce((total,line)=>total+Math.max(0,line.coordinates.length-1),0);return Math.max(1,Math.ceil(segments/Math.max(1,maximum)))}

export function highestTerrainPoint(mesh:TerrainMesh):HighestTerrainPoint|null {
  let index=-1,elevation=-Infinity;
  for(let candidate=0;candidate<mesh.elevations.length;candidate++)if(mesh.validCells?.[candidate]!==false&&Number.isFinite(mesh.elevations[candidate])&&mesh.elevations[candidate]>elevation){index=candidate;elevation=mesh.elevations[candidate]}
  if(index<0)return null;
  const row=Math.floor(index/mesh.width),column=index%mesh.width,[west,south,east,north]=mesh.wgs84Extent;
  return{lon:west+(east-west)*(column/Math.max(mesh.width-1,1)),lat:north-(north-south)*(row/Math.max(mesh.height-1,1)),elevationM:elevation,row,column};
}
