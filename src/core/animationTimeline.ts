export type AnimationMode='orbit'|'routes';
export interface TimelineState {mode:AnimationMode;progress:number;playing:boolean;speed:number;durationSeconds:number}
export function advanceTimeline(state:TimelineState,elapsedSeconds:number):TimelineState {if(!state.playing||state.durationSeconds<=0)return state;const progress=state.progress+elapsedSeconds*state.speed/state.durationSeconds;return progress>=1?{...state,progress:1,playing:false}:{...state,progress}}
export function resetTimeline(state:TimelineState):TimelineState{return{...state,progress:0,playing:false}}
export function timelineDescription(state:TimelineState,width:number,height:number){return`${width} × ${height} px · ${state.durationSeconds.toFixed(1)} s · ${state.speed}×`}
export function routeTimelineProgress(globalProgress:number,timelineDurationSeconds:number,routeDurationSeconds?:number){return routeDurationSeconds&&routeDurationSeconds>0?Math.min(1,globalProgress*timelineDurationSeconds/routeDurationSeconds):globalProgress}
