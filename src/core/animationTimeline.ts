export type AnimationMode='orbit'|'routes'|'flyover';
export interface TimelineState {mode:AnimationMode;progress:number;playing:boolean;speed:number;durationSeconds:number}
export function advanceTimeline(state:TimelineState,elapsedSeconds:number):TimelineState {if(!state.playing||state.durationSeconds<=0)return state;const progress=state.progress+elapsedSeconds*state.speed/state.durationSeconds;return progress>=1?{...state,progress:1,playing:false}:{...state,progress}}
export function resetTimeline(state:TimelineState):TimelineState{return{...state,progress:0,playing:false}}
export function timelineDescription(state:TimelineState,width:number,height:number){return`${width} × ${height} px · ${state.durationSeconds.toFixed(1)} s · ${state.speed}×`}
export function routeTimelineProgress(globalProgress:number,timelineDurationSeconds:number,routeDurationSeconds?:number){return routeDurationSeconds&&routeDurationSeconds>0?Math.min(1,globalProgress*timelineDurationSeconds/routeDurationSeconds):globalProgress}
export function routeRevealPosition(progress:number,segmentLengths:readonly number[]){
 const clamped=Math.min(1,Math.max(0,progress)),total=segmentLengths.reduce((sum,length)=>sum+Math.max(0,length),0);
 if(!segmentLengths.length)return{segmentIndex:0,fraction:0};
 if(total<=0)return{segmentIndex:segmentLengths.length-1,fraction:clamped};
 const target=clamped*total;let covered=0;
 for(let index=0;index<segmentLengths.length;index++){const length=Math.max(0,segmentLengths[index]);if(target<=covered+length||index===segmentLengths.length-1)return{segmentIndex:index,fraction:length?Math.min(1,(target-covered)/length):1};covered+=length}
 return{segmentIndex:segmentLengths.length-1,fraction:1}
}
export function exportFrameCount(durationSeconds:number,fps:number){return Math.max(2,Math.round(durationSeconds*fps)+1)}
export function exportFrameProgress(index:number,count:number){return count<=1?1:Math.min(1,Math.max(0,index/(count-1)))}
export function videoExportPlan(durationSeconds:number,fps=30){
 if(!Number.isFinite(durationSeconds)||durationSeconds<=0||durationSeconds>90)throw new Error('El vídeo debe durar entre 0 y 90 segundos. Reduzca duración o aumente velocidad.');
 const count=Math.max(2,Math.round(durationSeconds*fps));return{count,fps,durationSeconds:count/fps};
}
export type RoutePosition=readonly [number,number,number];
export function prepareRoutePath(points:readonly RoutePosition[]){
 const cumulative=[0];for(let i=1;i<points.length;i++)cumulative.push(cumulative[i-1]+Math.hypot(...points[i].map((n,j)=>n-points[i-1][j])));
 return{points,cumulative,total:cumulative.at(-1)??0};
}
export function sampleRoutePath(path:ReturnType<typeof prepareRoutePath>,progress:number):[number,number,number]{
 if(!path.points.length)return[0,0,0];if(path.points.length===1||path.total===0)return[...path.points[0]];
 const distance=Math.max(0,Math.min(1,progress))*path.total;let low=1,high=path.points.length-1;
 while(low<high){const mid=(low+high)>>1;if(path.cumulative[mid]<distance)low=mid+1;else high=mid}
 const a=path.points[low-1],b=path.points[low],length=path.cumulative[low]-path.cumulative[low-1],t=length?(distance-path.cumulative[low-1])/length:0;
 return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
}
const smoothProgress=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x)};
/** Route progress stays at the start during the flyover camera approach. */
export function animationRouteProgress(mode:AnimationMode,progress:number){return mode==='flyover'?smoothProgress((progress-.15)/.85):Math.max(0,Math.min(1,progress))}
/** Cinematic camera interpolation in scene metres; not a routing or travel-time model. */
export function flyoverCamera(path:ReturnType<typeof prepareRoutePath>,progress:number,inclination:number,distance:number){
 const zoom=smoothProgress(progress/.15),travel=animationRouteProgress('flyover',progress),target=sampleRoutePath(path,travel);
 const ahead=sampleRoutePath(path,Math.min(1,travel+.025)),behind=sampleRoutePath(path,Math.max(0,travel-.025)),start=sampleRoutePath(path,0),end=sampleRoutePath(path,1);
 const bearing=Math.atan2(end[0]-start[0],end[2]-start[2]),tangent=Math.atan2(ahead[0]-behind[0],ahead[2]-behind[2]);
 const delta=Math.atan2(Math.sin(tangent-bearing),Math.cos(tangent-bearing)),heading=bearing+delta*smoothProgress((progress-.15)/.15);
 const dx=Math.sin(heading),dz=Math.cos(heading);
 const length=Math.hypot(dx,dz)||1,angle=Math.max(15,Math.min(85,inclination))*Math.PI/180,radius=distance*(3-2*zoom),horizontal=Math.cos(angle)*radius;
 return{target,position:[target[0]-dx/length*horizontal,target[1]+Math.sin(angle)*radius,target[2]-dz/length*horizontal] as [number,number,number],progress:travel};
}
export function gifExportPlan(requestedWidth:number,requestedHeight:number,durationSeconds:number){
 const scale=Math.min(1,1280/requestedWidth),width=Math.max(1,Math.round(requestedWidth*scale)),height=Math.max(1,Math.round(requestedHeight*scale)),desired=exportFrameCount(durationSeconds,8),memorySafeCount=Math.max(2,Math.floor(72_000_000/(width*height)));
 return{width,height,count:Math.min(120,desired,memorySafeCount)}
}
