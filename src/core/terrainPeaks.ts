import type {TerrainMesh} from '../services/native';

export interface TerrainPeak {lon:number;lat:number;elevationM:number;rank:number}

/** Finds the highest separated local maxima in the available terrain mesh. */
export function terrainPeaks(mesh:TerrainMesh,limit=8,separationM=1500,extent?:[number,number,number,number]):TerrainPeak[]{
  const candidates:{row:number;column:number;elevationM:number;lon:number;lat:number}[]=[];
  const [west,south,east,north]=mesh.wgs84Extent;
  const rowStart=extent?Math.max(1,Math.floor((north-extent[3])/(north-south)*mesh.height)):1,rowEnd=extent?Math.min(mesh.height-1,Math.ceil((north-extent[1])/(north-south)*mesh.height)):mesh.height-1,columnStart=extent?Math.max(1,Math.floor((extent[0]-west)/(east-west)*mesh.width)):1,columnEnd=extent?Math.min(mesh.width-1,Math.ceil((extent[2]-west)/(east-west)*mesh.width)):mesh.width-1;
  for(let row=rowStart;row<rowEnd;row++)for(let column=columnStart;column<columnEnd;column++){
    const index=row*mesh.width+column,elevationM=mesh.elevations[index];
    if(mesh.validCells?.[index]===false||!Number.isFinite(elevationM))continue;
    let maximum=true;
    for(let dy=-1;dy<=1&&maximum;dy++)for(let dx=-1;dx<=1;dx++){
      if(dx===0&&dy===0)continue;
      const neighborIndex=(row+dy)*mesh.width+column+dx,neighbor=mesh.elevations[neighborIndex];
      if(mesh.validCells?.[neighborIndex]!==false&&Number.isFinite(neighbor)&&(neighbor>elevationM||(neighbor===elevationM&&neighborIndex<index))){maximum=false;break}
    }
    if(maximum){const lon=west+(east-west)*(column+.5)/mesh.width,lat=north-(north-south)*(row+.5)/mesh.height;if(extent&&(lon<extent[0]||lon>extent[2]||lat<extent[1]||lat>extent[3]))continue;candidates.push({row,column,elevationM,lon,lat})}
  }
  candidates.sort((a,b)=>b.elevationM-a.elevationM);
  const cellWidth=mesh.widthM/mesh.width,cellHeight=mesh.heightM/mesh.height,selected:{row:number;column:number;peak:TerrainPeak}[]=[];
  for(const candidate of candidates){
    if(selected.length>=limit)break;
    if(selected.some(item=>Math.hypot((item.column-candidate.column)*cellWidth,(item.row-candidate.row)*cellHeight)<separationM))continue;
    const peak={lon:candidate.lon,lat:candidate.lat,elevationM:candidate.elevationM,rank:selected.length+1};
    selected.push({...candidate,peak});
  }
  return selected.map(item=>item.peak);
}
