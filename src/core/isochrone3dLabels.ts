import type { IsochroneLine } from '../types';

/** Explicit metadata keeps elevation contours (which share the renderer) unlabelled. */
export interface LabelledTerrainLine extends IsochroneLine {color?:string;isochroneLabel?:string}
export interface LabelRect {x:number;y:number;width:number;height:number}

/** Sample along actual segments, never across gaps between disconnected contours.
 * Horizontal scale is in metres per degree, as in the terrain's extent transform.
 * One label per level/colour avoids thousands of labels on fragmented contours.
 */
export function isochroneLabelCandidates(lines:readonly LabelledTerrainLine[],scaleX:number,scaleY:number,count=32){
 const groups=new Map<string,{level:number;text:string;color?:string;segments:{from:readonly number[];to:readonly number[];length:number}[];length:number}>();
 for(const line of lines){
  if(!line.isochroneLabel?.trim())continue;
  const key=JSON.stringify([line.level,line.color,line.isochroneLabel]);
  const group=groups.get(key)??{level:line.level,text:line.isochroneLabel,color:line.color,segments:[],length:0};
  groups.set(key,group);
  for(let i=1;i<line.coordinates.length;i++){
   const from=line.coordinates[i-1],to=line.coordinates[i],length=Math.hypot((to[0]-from[0])*scaleX,(to[1]-from[1])*scaleY);
   if(!Number.isFinite(length)||length<=0)continue;
   group.segments.push({from,to,length});group.length+=length;
  }
 }
 return [...groups.values()].filter(group=>group.length>0).sort((a,b)=>a.level-b.level).map(group=>{
  const anchors:[number,number][]=[];let segmentIndex=0,start=0;
  for(let i=0;i<count;i++){
   const distance=group.length*(i+.5)/count;
   while(segmentIndex<group.segments.length-1&&start+group.segments[segmentIndex].length<distance)start+=group.segments[segmentIndex++].length;
   const segment=group.segments[segmentIndex],t=(distance-start)/segment.length;
   anchors.push([segment.from[0]+(segment.to[0]-segment.from[0])*t,segment.from[1]+(segment.to[1]-segment.from[1])*t]);
  }
  return {level:group.level,text:group.text,color:group.color,anchors};
 });
}

/** Prefer the previous anchor when equally good; minimise overlap without hiding
 * a level merely because the viewport is crowded. Coordinates and padding: pixels.
 */
export function chooseIsochroneLabel(candidates:readonly (LabelRect|null)[],occupied:readonly LabelRect[],width:number,height:number,preferred=0,padding=4):number{
 let best=-1,bestOverlap=Infinity;
 for(let offset=0;offset<candidates.length;offset++){
  const index=(preferred+offset)%candidates.length,rect=candidates[index];
  if(!rect||![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite))continue;
  if(rect.x-rect.width/2<padding||rect.y-rect.height/2<padding||rect.x+rect.width/2>width-padding||rect.y+rect.height/2>height-padding)continue;
  const overlap=occupied.reduce((sum,other)=>sum+Math.max(0,Math.min(rect.x+rect.width/2,other.x+other.width/2)+padding-Math.max(rect.x-rect.width/2,other.x-other.width/2))*Math.max(0,Math.min(rect.y+rect.height/2,other.y+other.height/2)+padding-Math.max(rect.y-rect.height/2,other.y-other.height/2)),0);
  if(overlap<bestOverlap){best=index;bestOverlap=overlap;if(overlap===0)break}
 }
 return best;
}
