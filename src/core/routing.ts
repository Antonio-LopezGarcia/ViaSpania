import { MODELS } from './costModels';
import type { ModelId, RouteResult } from '../types';

export interface Grid { width:number; height:number; cellSizeM:number; elevations:number[]; blocked?:Set<number> }
const neighbors=(i:number,g:Grid)=>{ const x=i%g.width,y=Math.floor(i/g.width),out:number[]=[]; for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<g.width&&ny<g.height){const n=ny*g.width+nx;if(dx&&dy&&((g.blocked?.has(y*g.width+nx))||(g.blocked?.has(ny*g.width+x))))continue;out.push(n)}}return out };
export function shortestPath(grid:Grid,start:number,end:number,modelId:ModelId):RouteResult|null{
  const model=MODELS[modelId], dist=Array(grid.elevations.length).fill(Infinity), prev=Array(grid.elevations.length).fill(-1), open=new Set<number>([start]); dist[start]=0;
  while(open.size){let u=-1;for(const n of open)if(u<0||dist[n]<dist[u])u=n;open.delete(u);if(u===end)break;
    for(const v of neighbors(u,grid)){const dx=(v%grid.width)-(u%grid.width),dy=Math.floor(v/grid.width)-Math.floor(u/grid.width),horizontal=grid.cellSizeM*Math.hypot(dx,dy),rise=grid.elevations[v]-grid.elevations[u],surface=Math.hypot(horizontal,rise);const c=model.transitionCost({horizontalDistanceM:horizontal,surfaceDistanceM:surface,elevationFromM:grid.elevations[u],elevationToM:grid.elevations[v],signedSlope:rise/horizontal,terrainMultiplier:1,isBarrier:!!grid.blocked?.has(v)});if(dist[u]+c<dist[v]){dist[v]=dist[u]+c;prev[v]=u;open.add(v)}}
  }
  if(!Number.isFinite(dist[end]))return null;const path=[];for(let at=end;at!==-1;at=prev[at])path.push(at);path.reverse();let distanceM=0,ascentM=0,descentM=0;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],rise=grid.elevations[b]-grid.elevations[a];distanceM+=grid.cellSizeM*Math.hypot((b%grid.width)-(a%grid.width),Math.floor(b/grid.width)-Math.floor(a/grid.width));if(rise>0)ascentM+=rise;else descentM-=rise}return{model:modelId,direction:`${start}→${end}`,path,cost:dist[end],unit:model.unit,distanceM,ascentM,descentM};
}
export function directedMatrix(grid:Grid,nodes:number[],model:ModelId){return nodes.map(a=>nodes.map(b=>a===b?0:shortestPath(grid,a,b,model)?.cost??Infinity))}
export const DEMO_GRID:Grid={width:10,height:10,cellSizeM:25,elevations:Array.from({length:100},(_,i)=>100+(i%10)*2+Math.sin(Math.floor(i/10))*8),blocked:new Set([44,45,54])};
