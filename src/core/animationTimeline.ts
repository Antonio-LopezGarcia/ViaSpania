export type AnimationMode='orbit'|'routes';
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
export function gifExportPlan(requestedWidth:number,requestedHeight:number,durationSeconds:number){
 const scale=Math.min(1,1280/requestedWidth),width=Math.max(1,Math.round(requestedWidth*scale)),height=Math.max(1,Math.round(requestedHeight*scale)),desired=exportFrameCount(durationSeconds,8),memorySafeCount=Math.max(2,Math.floor(72_000_000/(width*height)));
 return{width,height,count:Math.min(120,desired,memorySafeCount)}
}
